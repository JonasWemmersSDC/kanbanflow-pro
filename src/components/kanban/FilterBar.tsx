import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

interface FilterBarProps {
  priorityFilter: string;
  onPriorityChange: (v: string) => void;
  assigneeFilter: string;
  onAssigneeChange: (v: string) => void;
  members?: { user_id: string; profile: { display_name: string | null } | null }[];
}

export default function FilterBar({
  priorityFilter,
  onPriorityChange,
  assigneeFilter,
  onAssigneeChange,
  members,
}: FilterBarProps) {
  const hasFilters = priorityFilter !== 'all' || assigneeFilter !== 'all';

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b bg-card/50">
      <span className="text-xs font-medium text-muted-foreground mr-1">Filter:</span>

      <Select value={priorityFilter} onValueChange={onPriorityChange}>
        <SelectTrigger className="h-7 w-[120px] text-xs">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      <Select value={assigneeFilter} onValueChange={onAssigneeChange}>
        <SelectTrigger className="h-7 w-[140px] text-xs">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All assignees</SelectItem>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {members?.map((m) => (
            <SelectItem key={m.user_id} value={m.user_id}>
              {m.profile?.display_name || m.user_id.slice(0, 8)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-muted-foreground"
          onClick={() => { onPriorityChange('all'); onAssigneeChange('all'); }}
        >
          <X className="h-3 w-3" /> Clear
        </Button>
      )}
    </div>
  );
}
