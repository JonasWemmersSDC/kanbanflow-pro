import { Droppable } from '@hello-pangea/dnd';
import { Column, Task } from '@/hooks/useBoard';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onAddTask: (columnId: string) => void;
  onTaskClick: (task: Task) => void;
}

export default function KanbanColumn({ column, tasks, onAddTask, onTaskClick }: KanbanColumnProps) {
  return (
    <div className="flex w-72 flex-shrink-0 flex-col rounded-xl bg-muted/50 border border-border/50">
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{column.name}</h3>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-[11px] font-medium text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddTask(column.id)}>
          <Plus className="h-4 w-4" />
        </Button>
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
              <TaskCard key={task.id} task={task} index={index} onClick={() => onTaskClick(task)} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
