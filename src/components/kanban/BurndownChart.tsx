import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { BurndownSnapshot } from '@/hooks/useAgile';

interface BurndownChartProps {
  data: BurndownSnapshot[];
  startDate: string | null;
  endDate: string | null;
  totalPoints: number;
}

export default function BurndownChart({ data, startDate, endDate, totalPoints }: BurndownChartProps) {
  if (!data.length && !startDate) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No burndown data yet. Snapshots are recorded daily for active sprints.
      </div>
    );
  }

  // Build ideal burndown line
  const start = startDate ? parseISO(startDate) : data.length ? parseISO(data[0].snapshot_date) : new Date();
  const end = endDate ? parseISO(endDate) : addDays(start, 14);
  const totalDays = differenceInDays(end, start) || 1;

  const chartData: { date: string; actual?: number; ideal: number }[] = [];

  for (let i = 0; i <= totalDays; i++) {
    const day = addDays(start, i);
    const dateStr = format(day, 'yyyy-MM-dd');
    const displayDate = format(day, 'MMM d');
    const ideal = Math.max(0, totalPoints - (totalPoints / totalDays) * i);
    const snapshot = data.find((d) => d.snapshot_date === dateStr);

    chartData.push({
      date: displayDate,
      ideal: Math.round(ideal * 10) / 10,
      actual: snapshot?.remaining_points,
    });
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
          <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" label={{ value: 'Story Points', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: 12,
            }}
          />
          <Line type="monotone" dataKey="ideal" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" dot={false} name="Ideal" />
          <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} connectNulls name="Actual" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
