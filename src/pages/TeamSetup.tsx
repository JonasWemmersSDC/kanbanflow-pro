import { useState } from 'react';
import { useCreateTeam, useJoinTeam } from '@/hooks/useTeam';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Layers, Copy } from 'lucide-react';

export default function TeamSetup() {
  const [teamName, setTeamName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const createTeam = useCreateTeam();
  const joinTeam = useJoinTeam();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const team = await createTeam.mutateAsync(teamName);
      setCreatedCode(team.code);
      toast.success('Team created!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await joinTeam.mutateAsync(joinCode);
      toast.success('Joined team!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const copyCode = () => {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode);
      toast.success('Code copied!');
    }
  };

  if (createdCode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md animate-slide-in text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
              <Layers className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">KanbanFlow</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Team created! 🎉</CardTitle>
              <CardDescription>Share this code with your team members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <code className="text-3xl font-mono font-bold tracking-[0.3em] text-primary bg-accent px-6 py-3 rounded-lg">
                  {createdCode}
                </code>
                <Button variant="outline" size="icon" onClick={copyCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button className="w-full" onClick={() => window.location.reload()}>
                Go to workspace
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-slide-in">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
            <Layers className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">KanbanFlow</h1>
        </div>

        <Tabs defaultValue="create">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Team</TabsTrigger>
            <TabsTrigger value="join">Join Team</TabsTrigger>
          </TabsList>
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create a new team</CardTitle>
                <CardDescription>A unique invite code will be generated automatically</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="team-name">Team name</Label>
                    <Input id="team-name" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. Engineering" required autoFocus />
                  </div>
                  <Button type="submit" className="w-full" disabled={createTeam.isPending}>
                    {createTeam.isPending ? 'Creating...' : 'Create team'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="join">
            <Card>
              <CardHeader>
                <CardTitle>Join an existing team</CardTitle>
                <CardDescription>Enter the 6-character invite code</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="join-code">Team code</Label>
                    <Input
                      id="join-code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="ABC123"
                      maxLength={6}
                      className="text-center font-mono text-lg tracking-[0.3em]"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={joinTeam.isPending}>
                    {joinTeam.isPending ? 'Joining...' : 'Join team'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
