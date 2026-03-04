
-- ═══ TEAMS ═══
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.team_members WHERE user_id = _user_id AND team_id = _team_id);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE POLICY "Anyone authenticated can view teams" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create teams" ON public.teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update teams" ON public.teams FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete teams" ON public.teams FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Team members can view members" ON public.team_members FOR SELECT TO authenticated USING (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Users can join teams" ON public.team_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave teams" ON public.team_members FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.join_team_by_code(_code TEXT)
RETURNS UUID AS $$
DECLARE _team_id UUID;
BEGIN
  SELECT id INTO _team_id FROM public.teams WHERE code = upper(_code);
  IF _team_id IS NULL THEN RAISE EXCEPTION 'Invalid team code'; END IF;
  INSERT INTO public.team_members (team_id, user_id, role) VALUES (_team_id, auth.uid(), 'member') ON CONFLICT (team_id, user_id) DO NOTHING;
  RETURN _team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.regenerate_team_code(_team_id UUID)
RETURNS TEXT AS $$
DECLARE _new_code TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.team_members WHERE team_id = _team_id AND user_id = auth.uid() AND role = 'owner') THEN
    RAISE EXCEPTION 'Only team owners can regenerate codes';
  END IF;
  _new_code := upper(substr(md5(random()::text), 1, 6));
  UPDATE public.teams SET code = _new_code WHERE id = _team_id;
  RETURN _new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ═══ BOARDS: add team_id, fix policies ═══
ALTER TABLE public.boards ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Board members can view boards" ON public.boards;
CREATE POLICY "Board access" ON public.boards FOR SELECT TO authenticated
  USING (public.is_board_member(auth.uid(), id) OR (team_id IS NOT NULL AND public.is_team_member(auth.uid(), team_id)));

DROP POLICY IF EXISTS "Board owners can manage members" ON public.board_members;
CREATE POLICY "Board member management" ON public.board_members FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND owner_id = auth.uid())
    OR public.is_board_member(auth.uid(), board_id)
    OR EXISTS (SELECT 1 FROM public.boards b WHERE b.id = board_id AND b.team_id IS NOT NULL AND public.is_team_member(auth.uid(), b.team_id))
  );

CREATE OR REPLACE FUNCTION public.create_board_with_members(
  _name TEXT, _owner_id UUID, _team_id UUID DEFAULT NULL, _description TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE _board_id UUID; _member RECORD;
BEGIN
  INSERT INTO public.boards (name, description, owner_id, team_id) VALUES (_name, _description, _owner_id, _team_id) RETURNING id INTO _board_id;
  INSERT INTO public.board_members (board_id, user_id, role) VALUES (_board_id, _owner_id, 'owner');
  IF _team_id IS NOT NULL THEN
    FOR _member IN SELECT user_id FROM public.team_members WHERE team_id = _team_id AND user_id != _owner_id LOOP
      INSERT INTO public.board_members (board_id, user_id, role) VALUES (_board_id, _member.user_id, 'member');
    END LOOP;
  END IF;
  INSERT INTO public.columns (board_id, name, position, color) VALUES
    (_board_id, 'To Do', 0, 'slate'), (_board_id, 'In Progress', 1, 'blue'),
    (_board_id, 'Review', 2, 'amber'), (_board_id, 'Done', 3, 'green');
  RETURN _board_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ═══ EPICS ═══
CREATE TABLE public.epics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.epics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team epics access" ON public.epics FOR SELECT TO authenticated USING (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team epics create" ON public.epics FOR INSERT TO authenticated WITH CHECK (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team epics update" ON public.epics FOR UPDATE TO authenticated USING (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team epics delete" ON public.epics FOR DELETE TO authenticated USING (public.is_team_member(auth.uid(), team_id));

-- ═══ SPRINTS ═══
CREATE TABLE public.sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team sprints access" ON public.sprints FOR SELECT TO authenticated USING (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team sprints create" ON public.sprints FOR INSERT TO authenticated WITH CHECK (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team sprints update" ON public.sprints FOR UPDATE TO authenticated USING (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team sprints delete" ON public.sprints FOR DELETE TO authenticated USING (public.is_team_member(auth.uid(), team_id));

-- ═══ TASKS: add agile columns ═══
ALTER TABLE public.tasks ADD COLUMN story_points INTEGER DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN epic_id UUID REFERENCES public.epics(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL;

-- ═══ TASK COMMENTS ═══
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comment read" ON public.task_comments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND public.is_board_member(auth.uid(), t.board_id)));
CREATE POLICY "Comment create" ON public.task_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Comment delete" ON public.task_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ═══ BURNDOWN SNAPSHOTS ═══
CREATE TABLE public.burndown_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  remaining_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sprint_id, snapshot_date)
);
ALTER TABLE public.burndown_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Burndown read" ON public.burndown_snapshots FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sprints s WHERE s.id = sprint_id AND public.is_team_member(auth.uid(), s.team_id)));
CREATE POLICY "Burndown insert" ON public.burndown_snapshots FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.sprints s WHERE s.id = sprint_id AND public.is_team_member(auth.uid(), s.team_id)));

-- Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.sprints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.epics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
