import { useState, useCallback } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useBoards, useBoardData, useUpdateTask, Task } from '@/hooks/useBoard';
import BoardHeader from '@/components/kanban/BoardHeader';
import KanbanColumn from '@/components/kanban/KanbanColumn';
import CreateTaskDialog from '@/components/kanban/CreateTaskDialog';
import TaskDetailDialog from '@/components/kanban/TaskDetailDialog';
import CreateBoardDialog from '@/components/kanban/CreateBoardDialog';
import { Loader2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Board() {
  const { data: boards = [], isLoading: boardsLoading } = useBoards();
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [createTaskColumn, setCreateTaskColumn] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateBoard, setShowCreateBoard] = useState(false);

  // Auto-select first board
  const activeBoardId = currentBoardId || boards[0]?.id || null;
  const { columns, tasks, isLoading } = useBoardData(activeBoardId ?? undefined);
  const updateTask = useUpdateTask();

  const getColumnTasks = useCallback(
    (columnId: string) => tasks.filter((t) => t.column_id === columnId).sort((a, b) => a.position - b.position),
    [tasks]
  );

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination) return;

      const { draggableId, destination } = result;
      const destColumnId = destination.droppableId;
      const destIndex = destination.index;

      await updateTask.mutateAsync({
        id: draggableId,
        column_id: destColumnId,
        position: destIndex,
      });
    },
    [updateTask]
  );

  if (boardsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Layers className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Create your first board</h2>
        <p className="text-muted-foreground text-sm">Get started by creating a Kanban board for your team.</p>
        <Button onClick={() => setShowCreateBoard(true)}>Create board</Button>
        <CreateBoardDialog
          open={showCreateBoard}
          onOpenChange={setShowCreateBoard}
          onCreated={(id) => setCurrentBoardId(id)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <BoardHeader
        boards={boards}
        currentBoardId={activeBoardId}
        onSelectBoard={setCurrentBoardId}
        onNewBoard={() => setShowCreateBoard(true)}
      />

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex flex-1 gap-4 overflow-x-auto p-4 kanban-scrollbar">
            {columns.map((column) => {
              const columnTasks = getColumnTasks(column.id);
              return (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={columnTasks}
                  onAddTask={(colId) => setCreateTaskColumn(colId)}
                  onTaskClick={(task) => setSelectedTask(task)}
                />
              );
            })}
          </div>
        </DragDropContext>
      )}

      {createTaskColumn && activeBoardId && (
        <CreateTaskDialog
          open={!!createTaskColumn}
          onOpenChange={(open) => !open && setCreateTaskColumn(null)}
          columnId={createTaskColumn}
          boardId={activeBoardId}
          taskCount={getColumnTasks(createTaskColumn).length}
        />
      )}

      <TaskDetailDialog
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />

      <CreateBoardDialog
        open={showCreateBoard}
        onOpenChange={setShowCreateBoard}
        onCreated={(id) => setCurrentBoardId(id)}
      />
    </div>
  );
}
