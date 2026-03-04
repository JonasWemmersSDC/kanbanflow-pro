import { useUserTeam, useTeamMembers, useRegenerateTeamCode } from '@/hooks/useTeam';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, RefreshCw, User } from 'lucide-react';
import { toast } from 'sonner';
import AppLayout from '@/components/layout/AppLayout';

export default function TeamSettingsPage() {
  const { data: team } = useUserTeam();
  const { data: members } = useTeamMembers(team?.id);
  const regenerate = useRegenerateTeamCode();

  const copyCode = () => {
    if (team?.code) {
      navigator.clipboard.writeText(team.code);
      toast.success('Code copied!');
    }
  };

  const handleRegenerate = async () => {
    if (!team) return;
    try {
      await regenerate.mutateAsync(team.id);
      toast.success('New code generated');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (!team) return null;

  return (
    <AppLayout>
      <div className="h-full overflow-y-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Team Settings</h1>

        <div className="grid gap-6 max-w-2xl">
          {/* Team Info */}
          <Card>
            <CardHeader>
              <CardTitle>{team.name}</CardTitle>
              <CardDescription>Team invite code</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <code className="text-2xl font-mono font-bold tracking-[0.3em] text-primary bg-accent px-4 py-2 rounded-lg">
                  {team.code}
                </code>
                <Button variant="outline" size="icon" onClick={copyCode}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleRegenerate} disabled={regenerate.isPending}>
                  <RefreshCw className={`h-4 w-4 ${regenerate.isPending ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Share this code with teammates so they can join.</p>
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle>Members ({members?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members?.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{m.profile?.display_name || 'Unknown'}</p>
                      </div>
                    </div>
                    <Badge variant={m.role === 'owner' ? 'default' : 'secondary'}>
                      {m.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
