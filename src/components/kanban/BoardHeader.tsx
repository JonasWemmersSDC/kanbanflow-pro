import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layers, LogOut, Plus, Settings, Menu, Search, X, User } from 'lucide-react';
import { Board } from '@/hooks/useBoard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface BoardHeaderProps {
  boards: Board[];
  currentBoardId: string | null;
  onSelectBoard: (id: string) => void;
  onNewBoard: () => void;
  onBoardSettings: () => void;
  onProfile: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function BoardHeader({
  boards,
  currentBoardId,
  onSelectBoard,
  onNewBoard,
  onBoardSettings,
  onProfile,
  searchQuery,
  onSearchChange,
}: BoardHeaderProps) {
  const { user, signOut } = useAuth();
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4 gap-2">
      {/* Left: Logo + board tabs */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Layers className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-card-foreground hidden sm:inline">KanbanFlow</span>
        </div>

        {/* Desktop board tabs */}
        <div className="hidden md:flex items-center gap-1">
          {boards.map((board) => (
            <button
              key={board.id}
              onClick={() => onSelectBoard(board.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
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

        {/* Mobile board picker */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader>
              <SheetTitle>Boards</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-1">
              {boards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => onSelectBoard(board.id)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                    board.id === currentBoardId
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {board.name}
                </button>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-2" onClick={onNewBoard}>
                <Plus className="h-3.5 w-3.5 mr-1" /> New board
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-2">
        {showSearch ? (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks..."
              className="h-8 pl-8 pr-8 text-sm"
              autoFocus
            />
            <button
              onClick={() => { setShowSearch(false); onSearchChange(''); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground" onClick={() => setShowSearch(true)}>
            <Search className="h-3.5 w-3.5" /> Search
          </Button>
        )}
      </div>

      {/* Right: settings + user */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBoardSettings}>
          <Settings className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-3.5 w-3.5" />
              </div>
              <span className="hidden sm:inline text-sm text-muted-foreground max-w-[120px] truncate">
                {user?.email}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onProfile}>
              <User className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
