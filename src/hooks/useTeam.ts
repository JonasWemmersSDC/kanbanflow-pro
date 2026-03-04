import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Team {
  id: string;
  name: string;
  code: string;
  owner_id: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: { display_name: string | null; avatar_url: string | null } | null;
}

export function useUserTeam() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-team', user?.id],
    queryFn: async () => {
      const { data: memberships, error } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user!.id)
        .limit(1);
      if (error) throw error;
      if (!memberships?.length) return null;

      const { data: team, error: tErr } = await supabase
        .from('teams')
        .select('*')
        .eq('id', memberships[0].team_id)
        .single();
      if (tErr) throw tErr;
      return team as Team;
    },
    enabled: !!user,
  });
}

export function useTeamMembers(teamId: string | undefined) {
  return useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      const { data: members, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId!)
        .order('created_at');
      if (error) throw error;

      const userIds = members.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      return members.map((m) => ({
        ...m,
        profile: profiles?.find((p) => p.user_id === m.user_id) || null,
      })) as TeamMember[];
    },
    enabled: !!teamId,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (name: string) => {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data, error } = await supabase
        .from('teams')
        .insert({ name, code, owner_id: user!.id })
        .select()
        .single();
      if (error) throw error;

      // Add creator as owner
      await supabase
        .from('team_members')
        .insert({ team_id: data.id, user_id: user!.id, role: 'owner' });

      return data as Team;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-team'] }),
  });
}

export function useJoinTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('join_team_by_code', { _code: code });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-team'] }),
  });
}

export function useRegenerateTeamCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (teamId: string) => {
      const { data, error } = await supabase.rpc('regenerate_team_code', { _team_id: teamId });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-team'] }),
  });
}
