import { useState, useMemo } from 'react';
import { useUserTeam } from '@/hooks/useTeam';
import { useAllTeamTasks, useSprints } from '@/hooks/useAgile';
import { useUpdateTask, Task } from '@/hooks/useBoard';
import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Inbox, Search, GripVertical, AlertCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { toast } from 'sonner';

const priorityConfig: Record<string, { icon: any; className: string }> = {
  critical: { icon: AlertCircle, className: 'bg-priority-urgent/15 text-priority-urgent border-priority-urgent/30' },
  urgent: { icon: AlertCircle, className: 'bg-priority-urgent/15 text-priority-urgent border-priority-urgent/30' },
  high: { icon: ArrowUp, className: 'bg-priority-high/15 text-priority-high border-priority-high/30' },
  medium: { icon: Minus, className: 'bg-priority-medium/15 text-priority-medium border-priority-medium/30' },
  low: { icon: ArrowDown, className: 'bg-priority-low/15 text-priority-low border-priority-low/30' },
};

export default function BacklogView() {
  const { data: team } = useUserTeam();
  const { data: allTasks = [] } = useAllTeamTasks(team?.id);
  const { data: sprints = [] } = useSprints(team?.id);
  const updateTask = useUpdateTask();
  const [search, setSearch] = useState('');

  const backlogTasks = useMemo(() => {
    let tasks = allTasks.filter((t) => !t.sprint_id);
    if (search) {
      const q = search.toLowerCase();
      tasks = tasks.filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }
    return tasks;
  }, [allTasks, search]);

  const activeSprints = sprints.filter((s) => s.status !== 'completed');

  const handleAssignSprint = async (taskId: string, sprintId: string) => {
    try {
      await updateTask.mutateAsync({ id: taskId, sprint_id: sprintId === 'none' ? null : sprintId });
      toast.success('Task assigned to sprint');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <AppLayout>
      <div className="h-full overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Backlog</h1>
          <span className="text-sm text-muted-foreground">{backlogTasks.length} tasks</span>
        </div>

        <div className="max-w-3xl">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search backlog..."
              className="pl-9"
            />
          </div>

          <div className="space-y-2">
            {backlogTasks.map((task) => {
              const priority = priorityConfig[task.priority] || priorityConfig.medium;
              const PIcon = priority.icon;
              return (
                <Card key={task.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${priority.className}`}>
                          <PIcon className="mr-1 h-3 w-3" />
                          {task.priority}
                        </Badge>
                        {task.story_points ? (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                            {task.story_points} pts
                          </Badge>
                        ) : null}
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
                      )}
                    </div>
                    <Select
                      value="none"
                      onValueChange={(v) => handleAssignSprint(task.id, v)}
                    >
                      <SelectTrigger className="h-7 w-[130px] text-xs flex-shrink-0">
                        <SelectValue placeholder="Add to sprint" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" disabled>Add to sprint</SelectItem>
                        {activeSprints.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              );
            })}
            {backlogTasks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Inbox className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{search ? 'No matching tasks' : 'Backlog is empty. Tasks not assigned to a sprint appear here.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
