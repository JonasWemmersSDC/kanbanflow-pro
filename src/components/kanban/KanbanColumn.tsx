import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Column, Task, useUpdateColumn, useDeleteColumn } from '@/hooks/useBoard';
import TaskCard from './TaskCard';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onAddTask: (columnId: string) => void;
  onTaskClick: (task: Task) => void;
  memberProfiles?: Map<string, string>;
}

export default function KanbanColumn({ column, tasks, onAddTask, onTaskClick, memberProfiles }: KanbanColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const updateColumn = useUpdateColumn();
  const deleteColumn = useDeleteColumn();

  const handleRename = async () => {
    if (editName.trim() && editName !== column.name) {
      try {
        await updateColumn.mutateAsync({ id: column.id, board_id: column.board_id, name: editName.trim() });
      } catch (e: any) {
        toast.error(e.message);
      }
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (tasks.length > 0) {
      toast.error('Move or delete all tasks before removing this column.');
      return;
    }
    try {
      await deleteColumn.mutateAsync({ id: column.id, board_id: column.board_id });
      toast.success('Column deleted');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="flex w-72 flex-shrink-0 flex-col rounded-xl bg-muted/50 border border-border/50">
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              className="h-7 text-sm font-semibold"
              autoFocus
            />
          ) : (
            <>
              <h3 className="text-sm font-semibold text-foreground truncate">{column.name}</h3>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-[11px] font-medium text-muted-foreground">
                {tasks.length}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddTask(column.id)}>
            <Plus className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setEditName(column.name); setIsEditing(true); }}>
                <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto px-2 pb-2 kanban-scrollbar min-h-[100px] rounded-b-xl transition-colors ${
              snapshot.isDraggingOver ? 'bg-accent/40' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={() => onTaskClick(task)}
                assigneeName={task.assignee_id ? memberProfiles?.get(task.assignee_id) : null}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
