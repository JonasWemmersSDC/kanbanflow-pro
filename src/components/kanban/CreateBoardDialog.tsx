import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateBoard } from '@/hooks/useBoard';
import { useUserTeam } from '@/hooks/useTeam';
import { toast } from 'sonner';

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (boardId: string) => void;
}

export default function CreateBoardDialog({ open, onOpenChange, onCreated }: CreateBoardDialogProps) {
  const [name, setName] = useState('');
  const createBoard = useCreateBoard();
  const { data: team } = useUserTeam();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const board = await createBoard.mutateAsync({ name, team_id: team?.id });
      toast.success('Board created!');
      setName('');
      onOpenChange(false);
      onCreated(board.id);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New board</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="board-name">Board name</Label>
            <Input id="board-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sprint 14" required autoFocus />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createBoard.isPending}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
