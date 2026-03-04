import { useState } from 'react';
import { useSprints, useCreateSprint, useUpdateSprint, useDeleteSprint } from '@/hooks/useAgile';
import { useUserTeam } from '@/hooks/useTeam';
import { useAllTeamTasks } from '@/hooks/useAgile';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Play, CheckCircle2, Trash2, BarChart3, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const statusColors: Record<string, string> = {
  planning: 'bg-secondary text-secondary-foreground',
  active: 'bg-primary text-primary-foreground',
  completed: 'bg-success text-success-foreground',
};

export default function SprintsView() {
  const { data: team } = useUserTeam();
  const { data: sprints = [] } = useSprints(team?.id);
  const { data: allTasks = [] } = useAllTeamTasks(team?.id);
  const createSprint = useCreateSprint();
  const updateSprint = useUpdateSprint();
  const deleteSprint = useDeleteSprint();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    try {
      await createSprint.mutateAsync({
        team_id: team.id,
        name,
        goal: goal || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      toast.success('Sprint created');
      setShowCreate(false);
      setName(''); setGoal(''); setStartDate(''); setEndDate('');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleStart = async (sprintId: string) => {
    const activeSprint = sprints.find((s) => s.status === 'active');
    if (activeSprint) {
      toast.error('Complete the active sprint first');
      return;
    }
    try {
      await updateSprint.mutateAsync({ id: sprintId, status: 'active' });
      toast.success('Sprint started');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleComplete = async (sprintId: string) => {
    try {
      // Move unfinished tasks back to backlog (set sprint_id to null)
      const sprintTasks = allTasks.filter((t) => t.sprint_id === sprintId);
      // Get all columns to determine "Done" column (last position)
      for (const task of sprintTasks) {
        const { data: cols } = await supabase
          .from('columns')
          .select('id, position')
          .eq('board_id', task.board_id)
          .order('position', { ascending: false })
          .limit(1);
        const doneColId = cols?.[0]?.id;
        if (task.column_id !== doneColId) {
          await supabase.from('tasks').update({ sprint_id: null }).eq('id', task.id);
        }
      }

      await updateSprint.mutateAsync({ id: sprintId, status: 'completed' });
      toast.success('Sprint completed! Unfinished tasks moved to backlog.');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getSprintTaskCount = (sprintId: string) => allTasks.filter((t) => t.sprint_id === sprintId).length;
  const getSprintPoints = (sprintId: string) =>
    allTasks.filter((t) => t.sprint_id === sprintId).reduce((sum, t) => sum + (t.story_points || 0), 0);

  return (
    <AppLayout>
      <div className="h-full overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Sprints</h1>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> New Sprint
          </Button>
        </div>

        <div className="grid gap-4 max-w-3xl">
          {sprints.map((sprint) => (
            <Card key={sprint.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{sprint.name}</CardTitle>
                    <Badge className={statusColors[sprint.status]}>{sprint.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {sprint.status === 'planning' && (
                      <Button size="sm" variant="outline" onClick={() => handleStart(sprint.id)} className="gap-1">
                        <Play className="h-3.5 w-3.5" /> Start
                      </Button>
                    )}
                    {sprint.status === 'active' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/sprints/${sprint.id}`)} className="gap-1">
                          <BarChart3 className="h-3.5 w-3.5" /> Burndown
                        </Button>
                        <Button size="sm" onClick={() => handleComplete(sprint.id)} className="gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                        </Button>
                      </>
                    )}
                    {sprint.status !== 'active' && (
                      <Button size="sm" variant="ghost" onClick={() => deleteSprint.mutateAsync({ id: sprint.id, team_id: team!.id })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sprint.goal && <p className="text-sm text-muted-foreground mb-2">{sprint.goal}</p>}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {sprint.start_date && <span>Start: {format(new Date(sprint.start_date + 'T00:00:00'), 'MMM d')}</span>}
                  {sprint.end_date && <span>End: {format(new Date(sprint.end_date + 'T00:00:00'), 'MMM d')}</span>}
                  <span>{getSprintTaskCount(sprint.id)} tasks</span>
                  <span>{getSprintPoints(sprint.id)} points</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {sprints.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No sprints yet. Create your first sprint to get started.</p>
            </div>
          )}
        </div>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>New Sprint</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sprint 1" required autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Goal</Label>
                <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What should we achieve?" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" disabled={createSprint.isPending}>Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
