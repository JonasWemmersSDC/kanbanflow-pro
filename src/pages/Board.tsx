import { useState, useCallback, useMemo } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useBoards, useBoardData, useReorderTasks, useBoardMembers, Task } from '@/hooks/useBoard';
import BoardHeader from '@/components/kanban/BoardHeader';
import KanbanColumn from '@/components/kanban/KanbanColumn';
import CreateTaskDialog from '@/components/kanban/CreateTaskDialog';
import TaskDetailDialog from '@/components/kanban/TaskDetailDialog';
import CreateBoardDialog from '@/components/kanban/CreateBoardDialog';
import BoardSettingsDialog from '@/components/kanban/BoardSettingsDialog';
import ProfileDialog from '@/components/kanban/ProfileDialog';
import FilterBar from '@/components/kanban/FilterBar';
import AddColumnDialog from '@/components/kanban/AddColumnDialog';
import { Loader2, Layers, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Board() {
  const { data: boards = [], isLoading: boardsLoading } = useBoards();
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [createTaskColumn, setCreateTaskColumn] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showBoardSettings, setShowBoardSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  const activeBoardId = currentBoardId || boards[0]?.id || null;
  const currentBoard = boards.find((b) => b.id === activeBoardId) || null;
  const { columns, tasks, isLoading } = useBoardData(activeBoardId ?? undefined);
  const { data: membersRaw } = useBoardMembers(activeBoardId ?? undefined);
  const reorderTasks = useReorderTasks();

  const members = useMemo(
    () => membersRaw?.map((m) => ({ user_id: m.user_id, profile: m.profile })) ?? [],
    [membersRaw]
  );

  // Profile name map for display
  const memberProfiles = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m) => {
      map.set(m.user_id, m.profile?.display_name || m.user_id.slice(0, 8));
    });
    return map;
  }, [members]);

  const hasActiveFilters = searchQuery || priorityFilter !== 'all' || assigneeFilter !== 'all';

  const getColumnTasks = useCallback(
    (columnId: string) => {
      let filtered = tasks.filter((t) => t.column_id === columnId);

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.description?.toLowerCase().includes(q) ||
            t.labels?.some((l) => l.toLowerCase().includes(q))
        );
      }
      if (priorityFilter !== 'all') {
        filtered = filtered.filter((t) => t.priority === priorityFilter);
      }
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned') {
          filtered = filtered.filter((t) => !t.assignee_id);
        } else {
          filtered = filtered.filter((t) => t.assignee_id === assigneeFilter);
        }
      }

      return filtered.sort((a, b) => a.position - b.position);
    },
    [tasks, searchQuery, priorityFilter, assigneeFilter]
  );

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination || !activeBoardId) return;

      const { draggableId, source, destination } = result;

      // Build a mutable copy of tasks grouped by column
      const sourceColumnTasks = tasks
        .filter((t) => t.column_id === source.droppableId)
        .sort((a, b) => a.position - b.position);

      const isSameColumn = source.droppableId === destination.droppableId;

      if (isSameColumn) {
        const reordered = [...sourceColumnTasks];
        const [moved] = reordered.splice(source.index, 1);
        reordered.splice(destination.index, 0, moved);
        const updates = reordered.map((t, i) => ({
          id: t.id,
          column_id: source.droppableId,
          position: i,
          board_id: activeBoardId,
        }));
        await reorderTasks.mutateAsync(updates);
      } else {
        const destColumnTasks = tasks
          .filter((t) => t.column_id === destination.droppableId)
          .sort((a, b) => a.position - b.position);

        const [moved] = sourceColumnTasks.splice(source.index, 1);
        destColumnTasks.splice(destination.index, 0, { ...moved, column_id: destination.droppableId });

        const updates = [
          ...sourceColumnTasks.map((t, i) => ({ id: t.id, column_id: source.droppableId, position: i, board_id: activeBoardId })),
          ...destColumnTasks.map((t, i) => ({ id: t.id, column_id: destination.droppableId, position: i, board_id: activeBoardId })),
        ];
        await reorderTasks.mutateAsync(updates);
      }
    },
    [tasks, activeBoardId, reorderTasks]
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
        <CreateBoardDialog open={showCreateBoard} onOpenChange={setShowCreateBoard} onCreated={(id) => setCurrentBoardId(id)} />
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
        onBoardSettings={() => setShowBoardSettings(true)}
        onProfile={() => setShowProfile(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <FilterBar
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        assigneeFilter={assigneeFilter}
        onAssigneeChange={setAssigneeFilter}
        members={members}
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
                  memberProfiles={memberProfiles}
                />
              );
            })}

            {/* Add column button */}
            <button
              onClick={() => setShowAddColumn(true)}
              className="flex w-72 flex-shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border/50 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors min-h-[100px]"
            >
              <Plus className="h-5 w-5 mr-1.5" />
              <span className="text-sm font-medium">Add column</span>
            </button>
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
          members={members}
        />
      )}

      <TaskDetailDialog
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        members={members}
      />

      <CreateBoardDialog open={showCreateBoard} onOpenChange={setShowCreateBoard} onCreated={(id) => setCurrentBoardId(id)} />

      <BoardSettingsDialog
        board={currentBoard}
        open={showBoardSettings}
        onOpenChange={setShowBoardSettings}
        onDeleted={() => setCurrentBoardId(null)}
      />

      <ProfileDialog open={showProfile} onOpenChange={setShowProfile} />

      {activeBoardId && (
        <AddColumnDialog
          open={showAddColumn}
          onOpenChange={setShowAddColumn}
          boardId={activeBoardId}
          columnCount={columns.length}
        />
      )}
    </div>
  );
}
