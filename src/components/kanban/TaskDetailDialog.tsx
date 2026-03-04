import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task, useUpdateTask, useDeleteTask } from '@/hooks/useBoard';
import { toast } from 'sonner';
import { Trash2, Calendar, Tag, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members?: { user_id: string; profile: { display_name: string | null } | null }[];
}

export default function TaskDetailDialog({ task, open, onOpenChange, members }: TaskDetailDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [assigneeId, setAssigneeId] = useState<string>('unassigned');
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  useEffect(() => {
    if (open && task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setDueDate(task.due_date ? new Date(task.due_date + 'T00:00:00') : undefined);
      setAssigneeId(task.assignee_id || 'unassigned');
      setLabels(task.labels || []);
    }
  }, [open, task]);

  if (!task) return null;

  const handleSave = async () => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        title,
        description,
        priority,
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
        assignee_id: assigneeId === 'unassigned' ? null : assigneeId,
        labels,
      });
      toast.success('Task updated');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask.mutateAsync({ id: task.id, board_id: task.board_id });
      toast.success('Task deleted');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const addLabel = () => {
    const l = newLabel.trim();
    if (l && !labels.includes(l)) {
      setLabels([...labels, l]);
    }
    setNewLabel('');
  };

  const removeLabel = (label: string) => setLabels(labels.filter((l) => l !== label));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>

          {/* Priority + Assignee row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members?.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.profile?.display_name || m.user_id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due date */}
          <div className="space-y-2">
            <Label>Due date</Label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2">
                    <Calendar className="h-4 w-4" />
                    {dueDate ? format(dueDate, 'MMM d, yyyy') : 'Set due date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={dueDate} onSelect={setDueDate} />
                </PopoverContent>
              </Popover>
              {dueDate && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDueDate(undefined)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <Label>Labels</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {labels.map((label) => (
                <Badge key={label} variant="secondary" className="gap-1 pr-1">
                  {label}
                  <button onClick={() => removeLabel(label)} className="rounded-full hover:bg-foreground/10 p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())}
                placeholder="Add label"
                className="h-8 text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={addLabel}>
                <Tag className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={updateTask.isPending}>Save</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
