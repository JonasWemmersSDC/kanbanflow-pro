import { Draggable } from '@hello-pangea/dnd';
import { Task } from '@/hooks/useBoard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GripVertical, AlertCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const priorityConfig = {
  urgent: { icon: AlertCircle, className: 'bg-priority-urgent/15 text-priority-urgent border-priority-urgent/30' },
  high: { icon: ArrowUp, className: 'bg-priority-high/15 text-priority-high border-priority-high/30' },
  medium: { icon: Minus, className: 'bg-priority-medium/15 text-priority-medium border-priority-medium/30' },
  low: { icon: ArrowDown, className: 'bg-priority-low/15 text-priority-low border-priority-low/30' },
};

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

export default function TaskCard({ task, index, onClick }: TaskCardProps) {
  const priority = priorityConfig[task.priority];
  const PriorityIcon = priority.icon;

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
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priority.className}`}>
                    <PriorityIcon className="mr-1 h-3 w-3" />
                    {task.priority}
                  </Badge>
                  {task.labels?.map((label) => (
                    <Badge key={label} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Draggable>
  );
}
