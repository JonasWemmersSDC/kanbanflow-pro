
-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Boards table
CREATE TABLE public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- Board members table
CREATE TABLE public.board_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(board_id, user_id)
);
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;

-- Board access helper function
CREATE OR REPLACE FUNCTION public.is_board_member(_user_id UUID, _board_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.board_members WHERE user_id = _user_id AND board_id = _board_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Board policies
CREATE POLICY "Board members can view boards" ON public.boards FOR SELECT TO authenticated
  USING (public.is_board_member(auth.uid(), id));
CREATE POLICY "Authenticated users can create boards" ON public.boards FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Board owners can update boards" ON public.boards FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id);
CREATE POLICY "Board owners can delete boards" ON public.boards FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- Board member policies
CREATE POLICY "Board members can view members" ON public.board_members FOR SELECT TO authenticated
  USING (public.is_board_member(auth.uid(), board_id));
CREATE POLICY "Board owners can manage members" ON public.board_members FOR INSERT TO authenticated
  WITH CHECK (public.is_board_member(auth.uid(), board_id));
CREATE POLICY "Board owners can remove members" ON public.board_members FOR DELETE TO authenticated
  USING (public.is_board_member(auth.uid(), board_id));

CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON public.boards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Columns table
CREATE TABLE public.columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Board members can view columns" ON public.columns FOR SELECT TO authenticated
  USING (public.is_board_member(auth.uid(), board_id));
CREATE POLICY "Board members can create columns" ON public.columns FOR INSERT TO authenticated
  WITH CHECK (public.is_board_member(auth.uid(), board_id));
CREATE POLICY "Board members can update columns" ON public.columns FOR UPDATE TO authenticated
  USING (public.is_board_member(auth.uid(), board_id));
CREATE POLICY "Board members can delete columns" ON public.columns FOR DELETE TO authenticated
  USING (public.is_board_member(auth.uid(), board_id));

-- Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES public.columns(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  labels TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Board members can view tasks" ON public.tasks FOR SELECT TO authenticated
  USING (public.is_board_member(auth.uid(), board_id));
CREATE POLICY "Board members can create tasks" ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.is_board_member(auth.uid(), board_id));
CREATE POLICY "Board members can update tasks" ON public.tasks FOR UPDATE TO authenticated
  USING (public.is_board_member(auth.uid(), board_id));
CREATE POLICY "Board members can delete tasks" ON public.tasks FOR DELETE TO authenticated
  USING (public.is_board_member(auth.uid(), board_id));

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.columns;
