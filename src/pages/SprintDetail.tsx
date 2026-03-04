import { useParams, useNavigate } from 'react-router-dom';
import { useSprints, useBurndownData, useRecordBurndown, useAllTeamTasks } from '@/hooks/useAgile';
import { useUserTeam } from '@/hooks/useTeam';
import AppLayout from '@/components/layout/AppLayout';
import BurndownChart from '@/components/kanban/BurndownChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function SprintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: team } = useUserTeam();
  const { data: sprints = [] } = useSprints(team?.id);
  const { data: allTasks = [] } = useAllTeamTasks(team?.id);
  const { data: burndownData = [] } = useBurndownData(id);
  const recordBurndown = useRecordBurndown();

  const sprint = sprints.find((s) => s.id === id);
  const sprintTasks = allTasks.filter((t) => t.sprint_id === id);
  const totalPoints = sprintTasks.reduce((s, t) => s + (t.story_points || 0), 0);
  const remainingPoints = totalPoints; // Approximation - ideally check done column

  // Auto-record today's burndown snapshot
  useEffect(() => {
    if (id && sprint?.status === 'active') {
      recordBurndown.mutate({ sprint_id: id, remaining_points: remainingPoints });
    }
  }, [id, remainingPoints, sprint?.status]);

  if (!sprint) return null;

  return (
    <AppLayout>
      <div className="h-full overflow-y-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/sprints')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{sprint.name}</h1>
          <Badge>{sprint.status}</Badge>
        </div>

        <div className="grid gap-6 max-w-4xl">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold">{sprintTasks.length}</p>
                <p className="text-xs text-muted-foreground">Tasks</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold">{totalPoints}</p>
                <p className="text-xs text-muted-foreground">Story Points</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold">{remainingPoints}</p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </CardContent>
            </Card>
          </div>

          {/* Burndown Chart */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Burndown Chart</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  recordBurndown.mutate({ sprint_id: id!, remaining_points: remainingPoints });
                  toast.success('Snapshot recorded');
                }}
                className="gap-1"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Update
              </Button>
            </CardHeader>
            <CardContent>
              <BurndownChart data={burndownData} startDate={sprint.start_date} endDate={sprint.end_date} totalPoints={totalPoints} />
            </CardContent>
          </Card>

          {/* Task list */}
          <Card>
            <CardHeader>
              <CardTitle>Sprint Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sprintTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                    <span className="font-medium">{task.title}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{task.priority}</Badge>
                      {task.story_points ? <Badge variant="secondary" className="text-[10px]">{task.story_points} pts</Badge> : null}
                    </div>
                  </div>
                ))}
                {sprintTasks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No tasks in this sprint. Assign tasks from the Backlog.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
