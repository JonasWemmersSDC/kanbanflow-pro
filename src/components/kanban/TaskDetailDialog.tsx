import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task, useUpdateTask, useDeleteTask } from '@/hooks/useBoard';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TaskDetailDialog({ task, open, onOpenChange }: TaskDetailDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Sync state when task changes
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
    }
    onOpenChange(isOpen);
  };

  if (!task) return null;

  const handleSave = async () => {
    try {
      await updateTask.mutateAsync({ id: task.id, title, description, priority });
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
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
          <div className="flex items-center justify-between">
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
