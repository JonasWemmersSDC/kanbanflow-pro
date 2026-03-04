
ALTER TABLE public.tasks ADD COLUMN due_date DATE;
CREATE INDEX idx_tasks_due_date ON public.tasks (due_date);
CREATE INDEX idx_tasks_column_position ON public.tasks (column_id, position);
CREATE INDEX idx_tasks_board_id ON public.tasks (board_id);
CREATE INDEX idx_board_members_user_id ON public.board_members (user_id);
