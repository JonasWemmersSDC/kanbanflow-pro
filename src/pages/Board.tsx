import { useState, useCallback, useMemo, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useBoards, useBoardData, useReorderTasks, useBoardMembers, Task } from '@/hooks/useBoard';
import { useUserTeam } from '@/hooks/useTeam';
import { useEpics, useSprints } from '@/hooks/useAgile';
import KanbanColumn from '@/components/kanban/KanbanColumn';
import CreateTaskDialog from '@/components/kanban/CreateTaskDialog';
import TaskDetailDialog from '@/components/kanban/TaskDetailDialog';
import CreateBoardDialog from '@/components/kanban/CreateBoardDialog';
import BoardSettingsDialog from '@/components/kanban/BoardSettingsDialog';
import FilterBar from '@/components/kanban/FilterBar';
import AddColumnDialog from '@/components/kanban/AddColumnDialog';
import AppLayout from '@/components/layout/AppLayout';
import { Loader2, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Board() {
  const { data: team } = useUserTeam();
  const { data: boards = [], isLoading: boardsLoading } = useBoards(team?.id);
  const { data: epics = [] } = useEpics(team?.id);
  const { data: sprints = [] } = useSprints(team?.id);
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [createTaskColumn, setCreateTaskColumn] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showBoardSettings, setShowBoardSettings] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  // Auto-select first board when boards load
  const activeBoardId = currentBoardId || boards[0]?.id || null;
  const currentBoard = boards.find((b) => b.id === activeBoardId) || null;
  const { columns, tasks, isLoading } = useBoardData(activeBoardId ?? undefined);
  const { data: membersRaw } = useBoardMembers(activeBoardId ?? undefined);
  const reorderTasks = useReorderTasks();

  // Sync currentBoardId when boards change (e.g. after creation or deletion)
  useEffect(() => {
    if (boards.length > 0 && currentBoardId && !boards.find((b) => b.id === currentBoardId)) {
      setCurrentBoardId(boards[0]?.id || null);
    }
  }, [boards, currentBoardId]);

  const members = useMemo(() => membersRaw?.map((m) => ({ user_id: m.user_id, profile: m.profile })) ?? [], [membersRaw]);
  const memberProfiles = useMemo(() => { const map = new Map<string, string>(); members.forEach((m) => map.set(m.user_id, m.profile?.display_name || m.user_id.slice(0, 8))); return map; }, [members]);

  const getColumnTasks = useCallback((columnId: string) => {
    let filtered = tasks.filter((t) => t.column_id === columnId);
    if (searchQuery) { const q = searchQuery.toLowerCase(); filtered = filtered.filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)); }
    if (priorityFilter !== 'all') filtered = filtered.filter((t) => t.priority === priorityFilter);
    if (assigneeFilter !== 'all') { filtered = assigneeFilter === 'unassigned' ? filtered.filter((t) => !t.assignee_id) : filtered.filter((t) => t.assignee_id === assigneeFilter); }
    return filtered.sort((a, b) => a.position - b.position);
  }, [tasks, searchQuery, priorityFilter, assigneeFilter]);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination || !activeBoardId) return;
    const { source, destination } = result;
    const srcTasks = tasks.filter((t) => t.column_id === source.droppableId).sort((a, b) => a.position - b.position);
    if (source.droppableId === destination.droppableId) {
      const reordered = [...srcTasks]; const [moved] = reordered.splice(source.index, 1); reordered.splice(destination.index, 0, moved);
      await reorderTasks.mutateAsync(reordered.map((t, i) => ({ id: t.id, column_id: source.droppableId, position: i, board_id: activeBoardId })));
    } else {
      const destTasks = tasks.filter((t) => t.column_id === destination.droppableId).sort((a, b) => a.position - b.position);
      const [moved] = srcTasks.splice(source.index, 1); destTasks.splice(destination.index, 0, { ...moved, column_id: destination.droppableId });
      await reorderTasks.mutateAsync([
        ...srcTasks.map((t, i) => ({ id: t.id, column_id: source.droppableId, position: i, board_id: activeBoardId })),
        ...destTasks.map((t, i) => ({ id: t.id, column_id: destination.droppableId, position: i, board_id: activeBoardId })),
      ]);
    }
  }, [tasks, activeBoardId, reorderTasks]);

  if (boardsLoading) return <AppLayout><div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="flex h-full flex-col">
        {/* Board header */}
        <div className="flex items-center gap-3 border-b px-4 py-2">
          {boards.length > 0 ? (
            <Select value={activeBoardId || undefined} onValueChange={(v) => setCurrentBoardId(v)}>
              <SelectTrigger className="h-8 w-48"><SelectValue placeholder="Select board" /></SelectTrigger>
              <SelectContent>
                {boards.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-sm text-muted-foreground">No boards yet</span>
          )}
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => setShowCreateBoard(true)}><Plus className="h-3.5 w-3.5" /> Board</Button>
          {currentBoard && <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto" onClick={() => setShowBoardSettings(true)}><Settings className="h-4 w-4" /></Button>}
        </div>

        <FilterBar priorityFilter={priorityFilter} onPriorityChange={setPriorityFilter} assigneeFilter={assigneeFilter} onAssigneeChange={setAssigneeFilter} members={members} />

        {!activeBoardId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground text-sm">
            <p>Create a board to get started</p>
            <Button onClick={() => setShowCreateBoard(true)} className="gap-1.5"><Plus className="h-4 w-4" /> Create Board</Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex flex-1 gap-4 overflow-x-auto p-4 kanban-scrollbar">
              {columns.map((column) => (
                <KanbanColumn key={column.id} column={column} tasks={getColumnTasks(column.id)} onAddTask={(colId) => setCreateTaskColumn(colId)} onTaskClick={(task) => setSelectedTask(task)} memberProfiles={memberProfiles} />
              ))}
              <button onClick={() => setShowAddColumn(true)} className="flex w-72 flex-shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border/50 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors min-h-[100px]">
                <Plus className="h-5 w-5 mr-1.5" /><span className="text-sm font-medium">Add column</span>
              </button>
            </div>
          </DragDropContext>
        )}
      </div>

      {createTaskColumn && activeBoardId && (
        <CreateTaskDialog open={!!createTaskColumn} onOpenChange={(o) => !o && setCreateTaskColumn(null)} columnId={createTaskColumn} boardId={activeBoardId} taskCount={getColumnTasks(createTaskColumn).length} members={members} />
      )}
      <TaskDetailDialog task={selectedTask} open={!!selectedTask} onOpenChange={(o) => !o && setSelectedTask(null)} members={members} epics={epics} sprints={sprints} />
      <CreateBoardDialog open={showCreateBoard} onOpenChange={setShowCreateBoard} onCreated={(id) => setCurrentBoardId(id)} />
      <BoardSettingsDialog board={currentBoard} open={showBoardSettings} onOpenChange={setShowBoardSettings} onDeleted={() => setCurrentBoardId(null)} />
      {activeBoardId && <AddColumnDialog open={showAddColumn} onOpenChange={setShowAddColumn} boardId={activeBoardId} columnCount={columns.length} />}
    </AppLayout>
  );
}
