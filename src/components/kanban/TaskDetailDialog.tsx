import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task, useUpdateTask, useDeleteTask } from '@/hooks/useBoard';
import { useTaskComments, useCreateComment, Epic, Sprint } from '@/hooks/useAgile';
import { toast } from 'sonner';
import { Trash2, Calendar, Tag, X, Send, User } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members?: { user_id: string; profile: { display_name: string | null } | null }[];
  epics?: Epic[];
  sprints?: Sprint[];
}

export default function TaskDetailDialog({ task, open, onOpenChange, members, epics, sprints }: TaskDetailDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [assigneeId, setAssigneeId] = useState<string>('unassigned');
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [storyPoints, setStoryPoints] = useState(0);
  const [epicId, setEpicId] = useState<string>('none');
  const [sprintId, setSprintId] = useState<string>('none');
  const [comment, setComment] = useState('');
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { data: comments = [] } = useTaskComments(task?.id);
  const createComment = useCreateComment();

  useEffect(() => {
    if (open && task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setDueDate(task.due_date ? new Date(task.due_date + 'T00:00:00') : undefined);
      setAssigneeId(task.assignee_id || 'unassigned');
      setLabels(task.labels || []);
      setStoryPoints(task.story_points || 0);
      setEpicId(task.epic_id || 'none');
      setSprintId(task.sprint_id || 'none');
    }
  }, [open, task]);

  if (!task) return null;

  const handleSave = async () => {
    try {
      await updateTask.mutateAsync({
        id: task.id, title, description, priority,
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
        assignee_id: assigneeId === 'unassigned' ? null : assigneeId,
        labels, story_points: storyPoints,
        epic_id: epicId === 'none' ? null : epicId,
        sprint_id: sprintId === 'none' ? null : sprintId,
      });
      toast.success('Task updated');
      onOpenChange(false);
    } catch (error: any) { toast.error(error.message); }
  };

  const handleDelete = async () => {
    try {
      await deleteTask.mutateAsync({ id: task.id, board_id: task.board_id });
      toast.success('Task deleted');
      onOpenChange(false);
    } catch (error: any) { toast.error(error.message); }
  };

  const addLabel = () => { const l = newLabel.trim(); if (l && !labels.includes(l)) setLabels([...labels, l]); setNewLabel(''); };
  const removeLabel = (label: string) => setLabels(labels.filter((l) => l !== label));

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      await createComment.mutateAsync({ task_id: task.id, content: comment.trim() });
      setComment('');
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit task</DialogTitle><DialogDescription>View and edit task details.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
          {/* Main content */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            {/* Labels */}
            <div className="space-y-2">
              <Label>Labels</Label>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {labels.map((l) => (
                  <Badge key={l} variant="secondary" className="gap-1 pr-1">{l}
                    <button onClick={() => removeLabel(l)} className="rounded-full hover:bg-foreground/10 p-0.5"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())} placeholder="Add label" className="h-8 text-sm" />
                <Button type="button" variant="outline" size="sm" onClick={addLabel}><Tag className="h-3.5 w-3.5" /></Button>
              </div>
            </div>

            {/* Comments */}
            <Separator />
            <div className="space-y-3">
              <Label>Comments ({comments.length})</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2 text-sm">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 flex-shrink-0 mt-0.5">
                      <User className="h-3 w-3 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs">{c.profile?.display_name || 'User'}</span>
                        <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleComment()} placeholder="Add a comment..." className="h-8 text-sm" />
                <Button size="sm" variant="outline" onClick={handleComment} disabled={createComment.isPending}><Send className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </div>

          {/* Sidebar fields */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Story Points</Label>
              <Input type="number" min={0} value={storyPoints} onChange={(e) => setStoryPoints(parseInt(e.target.value) || 0)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members?.map((m) => (<SelectItem key={m.user_id} value={m.user_id}>{m.profile?.display_name || m.user_id.slice(0, 8)}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-full justify-start text-xs gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {dueDate ? format(dueDate, 'MMM d') : 'None'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={dueDate} onSelect={setDueDate} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            {epics && epics.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">Epic</Label>
                <Select value={epicId} onValueChange={setEpicId}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {epics.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {sprints && sprints.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">Sprint</Label>
                <Select value={sprintId} onValueChange={setSprintId}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Backlog</SelectItem>
                    {sprints.filter((s) => s.status !== 'completed').map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t mt-2">
          <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="mr-1 h-4 w-4" /> Delete</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateTask.isPending}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
