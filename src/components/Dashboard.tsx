import { useState, useEffect } from "react";
import { Clock, CheckCircle, AlertTriangle, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStats, exportSessionData, type ProductivityStats } from "@/lib/storage";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  testId: string;
}

function StatCard({ icon, label, value, color, testId }: StatCardProps) {
  return (
    <div className="bg-card border rounded-xl p-4 flex flex-col gap-2" data-testid={testId}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <span style={{ color }}>{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <span className="text-2xl font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3);
}

export function Dashboard() {
  const [stats, setStats] = useState<ProductivityStats>({
    totalFocusMinutes: 0,
    completedSessions: 0,
    completedTasks: 0,
    totalViolations: 0,
    dailySessions: [],
  });

  useEffect(() => {
    setStats(getStats());
    const interval = setInterval(() => setStats(getStats()), 5000);
    return () => clearInterval(interval);
  }, []);

  const maxSessions = Math.max(...stats.dailySessions.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Focus Time"
          value={formatMinutes(stats.totalFocusMinutes)}
          color="hsl(258 80% 70%)"
          testId="stat-focus-time"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Sessions"
          value={stats.completedSessions}
          color="hsl(180 65% 55%)"
          testId="stat-sessions"
        />
        <StatCard
          icon={<CheckCircle className="w-4 h-4" />}
          label="Tasks Done"
          value={stats.completedTasks}
          color="hsl(120 55% 55%)"
          testId="stat-tasks"
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Violations"
          value={stats.totalViolations}
          color="hsl(0 72% 55%)"
          testId="stat-violations"
        />
      </div>

      {stats.dailySessions.some((d) => d.count > 0) && (
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Last 7 Days
          </p>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={stats.dailySessions} barSize={18} barCategoryGap="30%">
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={[0, maxSessions]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    return (
                      <div className="bg-popover border rounded-lg px-2 py-1 text-xs shadow-md">
                        <span className="font-medium">{payload[0].value} sessions</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {stats.dailySessions.map((_, i) => (
                  <Cell
                    key={i}
                    fill={`hsl(258 80% ${50 + (i / 6) * 20}%)`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <Button
        onClick={exportSessionData}
        variant="outline"
        className="w-full gap-2"
        data-testid="button-export-data"
      >
        <Download className="w-4 h-4" />
        Export Session Data
      </Button>
    </div>
  );
}
