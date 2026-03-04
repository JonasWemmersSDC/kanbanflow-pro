import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// ── Sprints ─────────────────────────────────────────

export interface Sprint {
  id: string;
  team_id: string;
  name: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'planning' | 'active' | 'completed';
  created_at: string;
}

export function useSprints(teamId: string | undefined) {
  return useQuery({
    queryKey: ['sprints', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('team_id', teamId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Sprint[];
    },
    enabled: !!teamId,
  });
}

export function useCreateSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sprint: { team_id: string; name: string; goal?: string; start_date?: string; end_date?: string }) => {
      const { data, error } = await supabase.from('sprints').insert(sprint).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ['sprints', d.team_id] }),
  });
}

export function useUpdateSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; goal?: string; start_date?: string; end_date?: string; status?: string }) => {
      const { data, error } = await supabase.from('sprints').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ['sprints', d.team_id] }),
  });
}

export function useDeleteSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, team_id }: { id: string; team_id: string }) => {
      const { error } = await supabase.from('sprints').delete().eq('id', id);
      if (error) throw error;
      return team_id;
    },
    onSuccess: (tid) => qc.invalidateQueries({ queryKey: ['sprints', tid] }),
  });
}

// ── Epics ───────────────────────────────────────────

export interface Epic {
  id: string;
  team_id: string;
  name: string;
  description: string | null;
  color: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export function useEpics(teamId: string | undefined) {
  return useQuery({
    queryKey: ['epics', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('epics')
        .select('*')
        .eq('team_id', teamId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Epic[];
    },
    enabled: !!teamId,
  });
}

export function useCreateEpic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (epic: { team_id: string; name: string; description?: string; color?: string; start_date?: string; end_date?: string }) => {
      const { data, error } = await supabase.from('epics').insert(epic).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ['epics', d.team_id] }),
  });
}

export function useUpdateEpic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; color?: string; start_date?: string; end_date?: string }) => {
      const { data, error } = await supabase.from('epics').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ['epics', d.team_id] }),
  });
}

export function useDeleteEpic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, team_id }: { id: string; team_id: string }) => {
      const { error } = await supabase.from('epics').delete().eq('id', id);
      if (error) throw error;
      return team_id;
    },
    onSuccess: (tid) => qc.invalidateQueries({ queryKey: ['epics', tid] }),
  });
}

// ── Comments ────────────────────────────────────────

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { display_name: string | null } | null;
}

export function useTaskComments(taskId: string | undefined) {
  return useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId!)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      return data.map((c) => ({
        ...c,
        profile: profiles?.find((p) => p.user_id === c.user_id) || null,
      })) as TaskComment[];
    },
    enabled: !!taskId,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ task_id, content }: { task_id: string; content: string }) => {
      const { data, error } = await supabase
        .from('task_comments')
        .insert({ task_id, user_id: user!.id, content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ['comments', d.task_id] }),
  });
}

// ── Burndown ────────────────────────────────────────

export interface BurndownSnapshot {
  id: string;
  sprint_id: string;
  snapshot_date: string;
  remaining_points: number;
}

export function useBurndownData(sprintId: string | undefined) {
  return useQuery({
    queryKey: ['burndown', sprintId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('burndown_snapshots')
        .select('*')
        .eq('sprint_id', sprintId!)
        .order('snapshot_date');
      if (error) throw error;
      return data as BurndownSnapshot[];
    },
    enabled: !!sprintId,
  });
}

export function useRecordBurndown() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sprint_id, remaining_points }: { sprint_id: string; remaining_points: number }) => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('burndown_snapshots')
        .upsert({ sprint_id, snapshot_date: today, remaining_points }, { onConflict: 'sprint_id,snapshot_date' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ['burndown', d.sprint_id] }),
  });
}

// ── All tasks for team (across boards) ──────────────

export function useAllTeamTasks(teamId: string | undefined) {
  return useQuery({
    queryKey: ['all-tasks', teamId],
    queryFn: async () => {
      // Get all boards for this team
      const { data: boards, error: bErr } = await supabase
        .from('boards')
        .select('id')
        .eq('team_id', teamId!);
      if (bErr) throw bErr;
      if (!boards?.length) return [];

      const boardIds = boards.map((b) => b.id);
      const { data: tasks, error: tErr } = await supabase
        .from('tasks')
        .select('*')
        .in('board_id', boardIds)
        .order('position');
      if (tErr) throw tErr;
      return tasks;
    },
    enabled: !!teamId,
  });
}
