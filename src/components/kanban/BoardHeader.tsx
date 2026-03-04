import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Layers, LogOut, Plus } from 'lucide-react';
import { Board } from '@/hooks/useBoard';

interface BoardHeaderProps {
  boards: Board[];
  currentBoardId: string | null;
  onSelectBoard: (id: string) => void;
  onNewBoard: () => void;
}

export default function BoardHeader({ boards, currentBoardId, onSelectBoard, onNewBoard }: BoardHeaderProps) {
  const { user, signOut } = useAuth();
  const currentBoard = boards.find((b) => b.id === currentBoardId);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Layers className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-card-foreground">KanbanFlow</span>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          {boards.map((board) => (
            <button
              key={board.id}
              onClick={() => onSelectBoard(board.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                board.id === currentBoardId
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {board.name}
            </button>
          ))}
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground" onClick={onNewBoard}>
            <Plus className="h-3.5 w-3.5" /> Board
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{user?.email}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={signOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
