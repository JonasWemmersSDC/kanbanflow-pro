import { Draggable } from '@hello-pangea/dnd';
import { Task } from '@/hooks/useBoard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GripVertical, AlertCircle, ArrowUp, ArrowDown, Minus, Calendar, User } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

const priorityConfig = {
  urgent: { icon: AlertCircle, className: 'bg-priority-urgent/15 text-priority-urgent border-priority-urgent/30', label: 'Urgent' },
  high: { icon: ArrowUp, className: 'bg-priority-high/15 text-priority-high border-priority-high/30', label: 'High' },
  medium: { icon: Minus, className: 'bg-priority-medium/15 text-priority-medium border-priority-medium/30', label: 'Medium' },
  low: { icon: ArrowDown, className: 'bg-priority-low/15 text-priority-low border-priority-low/30', label: 'Low' },
};

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
  assigneeName?: string | null;
}

export default function TaskCard({ task, index, onClick, assigneeName }: TaskCardProps) {
  const priority = priorityConfig[task.priority];
  const PriorityIcon = priority.icon;
  const dueDate = task.due_date ? new Date(task.due_date + 'T00:00:00') : null;
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate);
  const isDueToday = dueDate && isToday(dueDate);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="mb-2"
        >
          <Card
            onClick={onClick}
            className={`cursor-pointer border bg-card p-3 transition-all hover:shadow-md ${
              snapshot.isDragging ? 'rotate-2 shadow-lg ring-2 ring-primary/30' : ''
            }`}
          >
            <div className="flex items-start gap-2">
              <div {...provided.dragHandleProps} className="mt-0.5 cursor-grab text-muted-foreground/50 hover:text-muted-foreground">
                <GripVertical className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug text-card-foreground">{task.title}</p>
                {task.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priority.className}`}>
                    <PriorityIcon className="mr-1 h-3 w-3" />
                    {priority.label}
                  </Badge>
                  {task.labels?.map((label) => (
                    <Badge key={label} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {label}
                    </Badge>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-3">
                  {dueDate && (
                    <span className={`flex items-center gap-1 text-[11px] ${
                      isOverdue ? 'text-destructive font-medium' : isDueToday ? 'text-warning font-medium' : 'text-muted-foreground'
                    }`}>
                      <Calendar className="h-3 w-3" />
                      {format(dueDate, 'MMM d')}
                    </span>
                  )}
                  {assigneeName && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <User className="h-3 w-3" />
                      {assigneeName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Draggable>
  );
}
