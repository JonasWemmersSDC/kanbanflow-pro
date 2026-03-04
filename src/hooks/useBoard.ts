import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export interface Board {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  team_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  board_id: string;
  name: string;
  position: number;
  color: string | null;
}

export interface Task {
  id: string;
  column_id: string;
  board_id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  assignee_id: string | null;
  position: number;
  labels: string[] | null;
  due_date: string | null;
  story_points: number | null;
  epic_id: string | null;
  sprint_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface BoardMember {
  id: string;
  board_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export function useBoardMembers(boardId: string | undefined) {
  return useQuery({
    queryKey: ['board-members', boardId],
    queryFn: async () => {
      const { data: members, error } = await supabase.from('board_members').select('*').eq('board_id', boardId!);
      if (error) throw error;
      const userIds = members.map((m) => m.user_id);
      const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', userIds);
      return members.map((m) => ({
        ...m,
        profile: profiles?.find((p) => p.user_id === m.user_id) || null,
      }));
    },
    enabled: !!boardId,
  });
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user!.id).single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (updates: { display_name?: string; avatar_url?: string }) => {
      const { data, error } = await supabase.from('profiles').update(updates).eq('user_id', user!.id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useBoards(teamId?: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['boards', teamId],
    queryFn: async () => {
      let query = supabase.from('boards').select('*').order('created_at', { ascending: false });
      if (teamId) query = query.eq('team_id', teamId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Board[];
    },
    enabled: !!user,
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ name, description, team_id }: { name: string; description?: string; team_id?: string }) => {
      const { data, error } = await supabase.rpc('create_board_with_members', {
        _name: name,
        _owner_id: user!.id,
        _team_id: team_id || null,
        _description: description || null,
      });
      if (error) throw error;
      // Fetch the created board
      const { data: board, error: bErr } = await supabase.from('boards').select('*').eq('id', data).single();
      if (bErr) throw bErr;
      return board as Board;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boards'] }),
  });
}

export function useUpdateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string }) => {
      const { data, error } = await supabase.from('boards').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boards'] }),
  });
}

export function useDeleteBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('boards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boards'] }),
  });
}

export function useBoardData(boardId: string | undefined) {
  const qc = useQueryClient();
  const columnsQuery = useQuery({
    queryKey: ['columns', boardId],
    queryFn: async () => {
      const { data, error } = await supabase.from('columns').select('*').eq('board_id', boardId!).order('position');
      if (error) throw error;
      return data as Column[];
    },
    enabled: !!boardId,
  });
  const tasksQuery = useQuery({
    queryKey: ['tasks', boardId],
    queryFn: async () => {
      const { data, error } = await supabase.from('tasks').select('*').eq('board_id', boardId!).order('position');
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!boardId,
  });

  useEffect(() => {
    if (!boardId) return;
    const channel = supabase
      .channel(`board-${boardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `board_id=eq.${boardId}` }, () => {
        qc.invalidateQueries({ queryKey: ['tasks', boardId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'columns', filter: `board_id=eq.${boardId}` }, () => {
        qc.invalidateQueries({ queryKey: ['columns', boardId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [boardId, qc]);

  return { columns: columnsQuery.data ?? [], tasks: tasksQuery.data ?? [], isLoading: columnsQuery.isLoading || tasksQuery.isLoading };
}

export function useCreateColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (col: { board_id: string; name: string; position: number; color?: string }) => {
      const { data, error } = await supabase.from('columns').insert(col).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ['columns', d.board_id] }),
  });
}

export function useUpdateColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, board_id, ...updates }: { id: string; board_id: string; name?: string; position?: number }) => {
      const { error } = await supabase.from('columns').update(updates).eq('id', id);
      if (error) throw error;
      return board_id;
    },
    onSuccess: (bid) => qc.invalidateQueries({ queryKey: ['columns', bid] }),
  });
}

export function useDeleteColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, board_id }: { id: string; board_id: string }) => {
      const { error } = await supabase.from('columns').delete().eq('id', id);
      if (error) throw error;
      return board_id;
    },
    onSuccess: (bid) => qc.invalidateQueries({ queryKey: ['columns', bid] }),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (task: {
      title: string; description?: string; priority?: string; column_id: string; board_id: string;
      position: number; due_date?: string; labels?: string[]; assignee_id?: string;
      story_points?: number; epic_id?: string; sprint_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...task, created_by: user!.id, priority: task.priority || 'medium' })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['tasks', d.board_id] });
      qc.invalidateQueries({ queryKey: ['all-tasks'] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string; column_id?: string; position?: number; title?: string; description?: string;
      priority?: string; due_date?: string | null; labels?: string[]; assignee_id?: string | null;
      story_points?: number; epic_id?: string | null; sprint_id?: string | null;
    }) => {
      const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['tasks', d.board_id] });
      qc.invalidateQueries({ queryKey: ['all-tasks'] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, board_id }: { id: string; board_id: string }) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      return board_id;
    },
    onSuccess: (bid) => {
      qc.invalidateQueries({ queryKey: ['tasks', bid] });
      qc.invalidateQueries({ queryKey: ['all-tasks'] });
    },
  });
}

export function useReorderTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; column_id: string; position: number; board_id: string }[]) => {
      await Promise.all(updates.map((u) =>
        supabase.from('tasks').update({ column_id: u.column_id, position: u.position }).eq('id', u.id)
      ));
      return updates[0]?.board_id;
    },
    onSuccess: (bid) => { if (bid) qc.invalidateQueries({ queryKey: ['tasks', bid] }); },
  });
}
