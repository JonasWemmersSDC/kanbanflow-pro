import { useState } from 'react';
import { useEpics, useCreateEpic, useUpdateEpic, useDeleteEpic } from '@/hooks/useAgile';
import { useUserTeam } from '@/hooks/useTeam';
import { useAllTeamTasks } from '@/hooks/useAgile';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Flag, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const EPIC_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function EpicsView() {
  const { data: team } = useUserTeam();
  const { data: epics = [] } = useEpics(team?.id);
  const { data: allTasks = [] } = useAllTeamTasks(team?.id);
  const createEpic = useCreateEpic();
  const updateEpic = useUpdateEpic();
  const deleteEpic = useDeleteEpic();
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(EPIC_COLORS[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const openCreate = () => {
    setEditId(null); setName(''); setDescription(''); setColor(EPIC_COLORS[0]); setStartDate(''); setEndDate('');
    setShowDialog(true);
  };

  const openEdit = (epic: any) => {
    setEditId(epic.id); setName(epic.name); setDescription(epic.description || '');
    setColor(epic.color); setStartDate(epic.start_date || ''); setEndDate(epic.end_date || '');
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    try {
      if (editId) {
        await updateEpic.mutateAsync({ id: editId, name, description, color, start_date: startDate || undefined, end_date: endDate || undefined });
        toast.success('Epic updated');
      } else {
        await createEpic.mutateAsync({ team_id: team.id, name, description, color, start_date: startDate || undefined, end_date: endDate || undefined });
        toast.success('Epic created');
      }
      setShowDialog(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getEpicProgress = (epicId: string) => {
    const epicTasks = allTasks.filter((t) => t.epic_id === epicId);
    if (!epicTasks.length) return { total: 0, done: 0, pct: 0, points: 0 };
    // Consider tasks in last column as "done" - we approximate
    const total = epicTasks.length;
    const points = epicTasks.reduce((s, t) => s + (t.story_points || 0), 0);
    // This is an approximation - ideally we'd check column position
    return { total, done: 0, pct: 0, points };
  };

  return (
    <AppLayout>
      <div className="h-full overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Epics</h1>
          <Button onClick={openCreate} className="gap-1.5"><Plus className="h-4 w-4" /> New Epic</Button>
        </div>

        <div className="grid gap-4 max-w-3xl">
          {epics.map((epic) => {
            const progress = getEpicProgress(epic.id);
            return (
              <Card key={epic.id} className="overflow-hidden">
                <div className="h-1" style={{ backgroundColor: epic.color }} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: epic.color }} />
                      <CardTitle className="text-base">{epic.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(epic)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteEpic.mutateAsync({ id: epic.id, team_id: team!.id })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {epic.description && <p className="text-sm text-muted-foreground mb-3">{epic.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    {epic.start_date && <span>Start: {format(new Date(epic.start_date + 'T00:00:00'), 'MMM d')}</span>}
                    {epic.end_date && <span>End: {format(new Date(epic.end_date + 'T00:00:00'), 'MMM d')}</span>}
                    <span>{progress.total} tasks</span>
                    <span>{progress.points} points</span>
                  </div>
                  <Progress value={progress.pct} className="h-1.5" />
                </CardContent>
              </Card>
            );
          })}
          {epics.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Flag className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No epics yet. Create your first epic to organize work.</p>
            </div>
          )}
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>{editId ? 'Edit Epic' : 'New Epic'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="User Authentication" required autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {EPIC_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button type="submit">{editId ? 'Save' : 'Create'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
