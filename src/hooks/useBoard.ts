import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export interface Board {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
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
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee_id: string | null;
  position: number;
  labels: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useBoards() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['boards'],
    queryFn: async () => {
      const { data, error } = await supabase.from('boards').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Board[];
    },
    enabled: !!user,
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      // Create board
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .insert({ name, description: description || null, owner_id: user!.id })
        .select()
        .single();
      if (boardError) throw boardError;

      // Add creator as owner member
      const { error: memberError } = await supabase
        .from('board_members')
        .insert({ board_id: board.id, user_id: user!.id, role: 'owner' });
      if (memberError) throw memberError;

      // Create default columns
      const defaultColumns = [
        { board_id: board.id, name: 'To Do', position: 0, color: 'slate' },
        { board_id: board.id, name: 'In Progress', position: 1, color: 'blue' },
        { board_id: board.id, name: 'Review', position: 2, color: 'amber' },
        { board_id: board.id, name: 'Done', position: 3, color: 'green' },
      ];
      const { error: colError } = await supabase.from('columns').insert(defaultColumns);
      if (colError) throw colError;

      return board;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] }),
  });
}

export function useBoardData(boardId: string | undefined) {
  const queryClient = useQueryClient();

  const columnsQuery = useQuery({
    queryKey: ['columns', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('columns')
        .select('*')
        .eq('board_id', boardId!)
        .order('position');
      if (error) throw error;
      return data as Column[];
    },
    enabled: !!boardId,
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('board_id', boardId!)
        .order('position');
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!boardId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!boardId) return;

    const channel = supabase
      .channel(`board-${boardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `board_id=eq.${boardId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'columns', filter: `board_id=eq.${boardId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['columns', boardId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [boardId, queryClient]);

  return { columns: columnsQuery.data ?? [], tasks: tasksQuery.data ?? [], isLoading: columnsQuery.isLoading || tasksQuery.isLoading };
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (task: { title: string; description?: string; priority?: string; column_id: string; board_id: string; position: number }) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...task, created_by: user!.id, priority: task.priority || 'medium' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => queryClient.invalidateQueries({ queryKey: ['tasks', data.board_id] }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; column_id?: string; position?: number; title?: string; description?: string; priority?: string }) => {
      const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => queryClient.invalidateQueries({ queryKey: ['tasks', data.board_id] }),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, board_id }: { id: string; board_id: string }) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      return board_id;
    },
    onSuccess: (board_id) => queryClient.invalidateQueries({ queryKey: ['tasks', board_id] }),
  });
}
