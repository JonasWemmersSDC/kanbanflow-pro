import { useAuth } from '@/hooks/useAuth';
import { useUserTeam } from '@/hooks/useTeam';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const { data: team, isLoading: teamLoading } = useUserTeam();

  if (loading || teamLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!team) return <Navigate to="/team-setup" replace />;
  return <Navigate to="/boards" replace />;
};

export default Index;
