import { useMemo } from "react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from "recharts"
import { Database, Rows, Columns, Activity } from "lucide-react"
import { useVisualizationStore } from "../store/useVisualizationStore"

const COLORS = ["#00d4ff", "#7c5cfc", "#ff6b9d", "#fbbf24", "#34d399", "#38bdf8"]

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] border border-[var(--border-accent)] bg-[var(--accent-dim)]">
          <Icon className="h-4 w-4 text-[var(--accent-bright)]" />
        </div>
        <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">{label}</p>
      </div>
      <p className="font-mono text-2xl font-bold text-[var(--text-primary)]">{typeof value === "number" ? value.toLocaleString() : value}</p>
      {sub ? <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{sub}</p> : null}
    </div>
  )
}

export default function AnalyticsDashboard() {
  const { tables, relationships } = useVisualizationStore()

  const stats = useMemo(() => {
    const totalRows = tables.reduce((s, t) => s + Number(t.rows || 0), 0)
    const totalCols = tables.reduce((s, t) => s + (t.columns || []).length, 0)
    const avgQuality = tables.length
      ? Math.round(tables.reduce((s, t) => s + Number(t.qualityScore || 0), 0) / tables.length)
      : 0
    return { totalRows, totalCols, avgQuality }
  }, [tables])

  const rowsByTable = useMemo(
    () => tables
      .map((t) => ({ name: t.name.replace(/^olist_/, "").replace(/_/g, " "), rows: Number(t.rows || 0) }))
      .sort((a, b) => b.rows - a.rows)
      .slice(0, 10),
    [tables]
  )

  const qualityDist = useMemo(() => {
    const excellent = tables.filter((t) => Number(t.qualityScore || 0) >= 85).length
    const warning = tables.filter((t) => Number(t.qualityScore || 0) >= 60 && Number(t.qualityScore || 0) < 85).length
    const critical = tables.filter((t) => Number(t.qualityScore || 0) < 60).length
    return [
      { name: "Excellent", value: excellent, color: "#22c55e" },
      { name: "Warning", value: warning, color: "#f59e0b" },
      { name: "Critical", value: critical, color: "#ef4444" },
    ]
  }, [tables])

  return (
    <div className="absolute inset-0 z-10 overflow-auto p-4 pt-20 md:p-6 md:pt-24 lg:p-8 lg:pt-24">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Database} label="Tables" value={tables.length} />
          <StatCard icon={Rows} label="Total Rows" value={stats.totalRows} />
          <StatCard icon={Columns} label="Total Columns" value={stats.totalCols} />
          <StatCard icon={Activity} label="Avg Quality" value={`${stats.avgQuality}%`} sub={`${relationships.length} relationships`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-[360px] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
            <p className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Rows per Table (Top 10)</p>
            <ResponsiveContainer width="100%" height="92%">
              <BarChart data={rowsByTable} layout="vertical" margin={{ left: 12, right: 12 }}>
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10 }} />
                <Bar dataKey="rows" radius={[0, 6, 6, 0]}>
                  {rowsByTable.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[360px] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
            <p className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Quality Distribution</p>
            <ResponsiveContainer width="100%" height="92%">
              <PieChart>
                <Pie data={qualityDist} dataKey="value" nameKey="name" innerRadius={65} outerRadius={115} paddingAngle={2}>
                  {qualityDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
