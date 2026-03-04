import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Board, useUpdateBoard, useDeleteBoard } from '@/hooks/useBoard';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

interface BoardSettingsDialogProps {
  board: Board | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export default function BoardSettingsDialog({ board, open, onOpenChange, onDeleted }: BoardSettingsDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const updateBoard = useUpdateBoard();
  const deleteBoard = useDeleteBoard();

  useEffect(() => {
    if (open && board) {
      setName(board.name);
      setDescription(board.description || '');
      setConfirmDelete(false);
    }
  }, [open, board]);

  const handleSave = async () => {
    if (!board) return;
    try {
      await updateBoard.mutateAsync({ id: board.id, name, description });
      toast.success('Board updated');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    if (!board) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await deleteBoard.mutateAsync(board.id);
      toast.success('Board deleted');
      onOpenChange(false);
      onDeleted();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open && !!board} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Board settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional description..." />
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              {confirmDelete ? 'Confirm delete' : 'Delete board'}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={updateBoard.isPending}>Save</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
