import { useEffect, useMemo, useState } from "react"
import { getSchemaWithCache, getTableAnalysis } from "../api/api"
import { SkeletonCard } from "../components/Skeletons"
import { ChevronDown, ChevronUp, Sigma, BarChart3, CalendarDays, Network, Wrench, ShieldAlert } from "lucide-react"
import { ResponsiveContainer, LineChart, Line } from "recharts"

function toArray(value) {
  if (Array.isArray(value)) return value
  if (value && typeof value === "object") {
    return Object.entries(value).map(([column, stats]) => ({ column, ...(stats || {}) }))
  }
  return []
}

function toPairs(value) {
  if (Array.isArray(value)) return value
  return []
}

function metric(v, d = "-") {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return d
  if (typeof v === "number") return Number(v).toFixed(2)
  return String(v)
}

function Sparkline({ stat }) {
  const min = Number(stat?.min ?? 0)
  const rawPoints = [
    { key: "min", raw: Number(stat?.min ?? 0) },
    { key: "q1", raw: Number(stat?.q1 ?? stat?.Q1 ?? stat?.percentile_25 ?? stat?.min ?? 0) },
    { key: "median", raw: Number(stat?.median ?? stat?.p50 ?? stat?.q2 ?? 0) },
    { key: "mean", raw: Number(stat?.mean ?? stat?.avg ?? stat?.median ?? 0) },
    { key: "q3", raw: Number(stat?.q3 ?? stat?.Q3 ?? stat?.percentile_75 ?? stat?.max ?? 0) },
    { key: "max", raw: Number(stat?.max ?? 0) },
  ]

  // Log scaling prevents huge max tails from flattening all lines to the same shape.
  const points = rawPoints.map((p) => ({
    key: p.key,
    value: Math.log10(Math.max(0, p.raw - min) + 1),
  }))

  return (
    <div className="h-10 w-28 rounded bg-background/60 border border-border/50 px-1 py-0.5">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <Line type="linear" dataKey="value" stroke="#22d3ee" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function Section({ title, icon: Icon, open, onToggle, children }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between bg-[var(--bg-elevated)] px-4 py-3 transition-colors hover:bg-[var(--bg-overlay)]"
      >
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <Icon className="h-4 w-4 text-[var(--accent-bright)]" />
          {title}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
      </button>
      {open ? <div className="p-4">{children}</div> : null}
    </div>
  )
}

export default function AnalysisScreen() {
  const [tables, setTables] = useState([])
  const [activeTable, setActiveTable] = useState(null)
  const [loadingTables, setLoadingTables] = useState(false)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [error, setError] = useState("")
  const [analysis, setAnalysis] = useState(null)

  const [open, setOpen] = useState({
    distribution: false,
    outliers: false,
    entropy: false,
    temporal: false,
    correlation: false,
    readiness: false,
    cto: false,
  })

  const toggle = (key) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }))

  useEffect(() => {
    async function loadTables() {
      try {
        setLoadingTables(true)
        setError("")
        const res = await getSchemaWithCache({ force: true })
        const nextTables = Array.isArray(res?.data?.tables) ? res.data.tables : []
        setTables(nextTables)
        if (nextTables.length > 0) setActiveTable(nextTables[0])
      } catch (e) {
        console.error(e)
        setError("Failed to load schema tables for analysis.")
      } finally {
        setLoadingTables(false)
      }
    }

    loadTables()
  }, [])

  useEffect(() => {
    if (!activeTable?.name) return

    async function loadAnalysis() {
      try {
        setLoadingAnalysis(true)
        setError("")
        const res = await getTableAnalysis(activeTable.name)
        setAnalysis(res?.data || null)
      } catch (e) {
        console.error(e)
        setError("Failed to load analysis for selected table.")
        setAnalysis(null)
      } finally {
        setLoadingAnalysis(false)
      }
    }

    loadAnalysis()
  }, [activeTable?.name])

  const numericStats = useMemo(() => toArray(analysis?.numeric_stats ?? analysis?.numeric ?? analysis?.stats?.numeric), [analysis])
  const categoricalStats = useMemo(() => toArray(analysis?.categorical_stats ?? analysis?.categorical ?? analysis?.stats?.categorical), [analysis])
  const dateStats = useMemo(() => toArray(analysis?.date_stats ?? analysis?.date ?? analysis?.stats?.date), [analysis])
  const correlationPairs = useMemo(() => toPairs(analysis?.correlation_pairs ?? analysis?.correlations ?? analysis?.stats?.correlations), [analysis])
  const diagnostics = analysis?.diagnostics || {}

  const outlierRows = useMemo(
    () => numericStats.filter((s) => Number(s?.outlier_count ?? s?.iqr_outlier_count ?? 0) > 0 || Number(s?.zscore_outlier_count ?? 0) > 0),
    [numericStats]
  )

  return (
    <div className="h-screen overflow-y-auto bg-[var(--bg-base)] px-6 pb-10 pt-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="mb-2 flex items-end justify-between border-b border-[var(--border-default)] pb-4">
          <div>
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <span>SchemaSense AI</span>
              <span>/</span>
              <span className="text-[var(--text-primary)]">Analysis</span>
            </div>
            <h1 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Mathematical Analysis</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">CTO-level statistical interpretation with distribution, outliers, entropy, temporal patterns, and modeling readiness.</p>
          </div>
          <div className="hidden gap-2 md:flex">
            <span className="badge badge-muted">{tables.length} tables</span>
            <span className="badge badge-accent">Advanced Metrics</span>
          </div>
        </header>

        <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Selected Table</p>
              <p className="font-semibold text-[var(--text-primary)]">{activeTable?.display_name || activeTable?.name || "-"}</p>
            </div>
            <div className="w-full md:w-[420px]">
              <select
                value={activeTable?.name || ""}
                onChange={(e) => {
                  const found = tables.find((t) => t.name === e.target.value)
                  if (found) setActiveTable(found)
                }}
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-input)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
              >
                {tables.map((t) => (
                  <option key={t.id || t.name} value={t.name}>
                    {t.display_name || t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {!loadingAnalysis && analysis ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            Generated: {diagnostics.generated_at || "-"} | Formula: {diagnostics.formula_version || "-"} | Latency: {diagnostics.latency_ms ?? "-"} ms
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[var(--radius-md)] border border-[rgba(245,158,11,0.35)] bg-[var(--warning-dim)] px-4 py-3 text-sm text-[var(--warning)]">{error}</div>
        ) : null}

        {(loadingTables || loadingAnalysis) && (
          <div className="grid gap-4">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loadingAnalysis && analysis && (
          <div className="grid gap-4">
            <Section title="Distribution Analysis" icon={Sigma} open={open.distribution} onToggle={() => toggle("distribution")}>
              {numericStats.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No numeric stats returned.</p>
              ) : (
                <div className="space-y-3">
                  {numericStats.map((s, i) => (
                    <div key={`${s.column || i}`} className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-input)] p-3">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{s.column || `numeric_${i + 1}`}</p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            mean {metric(s.mean)} | median {metric(s.median)} | std {metric(s.std)} | var {metric(s.variance)}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            min {metric(s.min)} | max {metric(s.max)} | IQR {metric(s.iqr ?? (Number(s.q3 ?? 0) - Number(s.q1 ?? 0)))} | skew {metric(s.skewness)} | kurt {metric(s.kurtosis)}
                          </p>
                        </div>
                        <Sparkline stat={s} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Outlier Report" icon={ShieldAlert} open={open.outliers} onToggle={() => toggle("outliers")}>
              {outlierRows.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No outliers reported by backend metrics.</p>
              ) : (
                <div className="space-y-2">
                  {outlierRows.map((s, i) => (
                    <div key={`${s.column || i}`} className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-input)] p-3 text-sm">
                      <p className="font-medium text-[var(--text-primary)]">{s.column || `numeric_${i + 1}`}</p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        IQR outliers: {metric(s.iqr_outlier_count ?? s.outlier_count ?? 0, "0")} | Z-score outliers: {metric(s.zscore_outlier_count ?? 0, "0")} (|z| {'>'} 3)
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Categorical Entropy" icon={BarChart3} open={open.entropy} onToggle={() => toggle("entropy")}>
              {categoricalStats.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No categorical stats returned.</p>
              ) : (
                <div className="space-y-3">
                  {categoricalStats.map((s, i) => (
                    <div key={`${s.column || i}`} className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-input)] p-3 text-sm">
                      <p className="font-medium text-[var(--text-primary)]">{s.column || `categorical_${i + 1}`}</p>
                      <p className="text-xs text-[var(--text-secondary)]">Cardinality: {metric(s.cardinality)}</p>
                      <p className="text-xs text-[var(--text-secondary)]">Entropy: {metric(s.entropy)}</p>
                      {Array.isArray(s.top_values || s.top_5_values || s.top5_values) && (s.top_values || s.top_5_values || s.top5_values).length > 0 ? (
                        <div className="mt-2 text-xs text-[var(--text-secondary)]">
                          Top values: {(s.top_values || s.top_5_values || s.top5_values).slice(0, 5).map((v) => `${v.value} (${v.count})`).join(", ")}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Temporal Patterns" icon={CalendarDays} open={open.temporal} onToggle={() => toggle("temporal")}>
              {dateStats.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No date stats returned.</p>
              ) : (
                <div className="space-y-3">
                  {dateStats.map((s, i) => (
                    <div key={`${s.column || i}`} className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-input)] p-3 text-sm">
                      <p className="font-medium text-[var(--text-primary)]">{s.column || `date_${i + 1}`}</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        min {metric(s.min_date)} | max {metric(s.max_date)} | range days {metric(s.date_range_days)}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">Most active period: {metric(s.most_active_period)}</p>
                      <p className="text-xs text-[var(--text-secondary)]">Gaps: {metric(s.gap_detection ?? s.gaps, "none")}</p>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Correlation Insights" icon={Network} open={open.correlation} onToggle={() => toggle("correlation")}>
              {correlationPairs.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No correlation pairs returned.</p>
              ) : (
                <div className="space-y-2">
                  {correlationPairs.slice(0, 20).map((p, i) => (
                    <div key={`${p.col_a || p.column_a || i}`} className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-input)] p-3 text-sm">
                      <p className="font-medium text-[var(--text-primary)]">{p.col_a || p.column_a || p.x || "col_a"} ↔ {p.col_b || p.column_b || p.y || "col_b"}</p>
                      <p className="text-xs text-[var(--text-secondary)]">Pearson r: {metric(p.r ?? p.correlation)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="CTO Narrative" icon={Sigma} open={open.cto} onToggle={() => toggle("cto")}>
              {analysis?.analysis_text || analysis?.llm_analysis || analysis?.report ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">{String(analysis.analysis_text || analysis.llm_analysis || analysis.report)}</p>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No CTO narrative returned by backend yet.</p>
              )}
            </Section>

            <Section title="Modeling Readiness" icon={Wrench} open={open.readiness} onToggle={() => toggle("readiness")}>
              <div className="space-y-3">
                {analysis?.modeling_readiness ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">{String(analysis.modeling_readiness)}</p>
                ) : analysis?.analysis_text || analysis?.llm_analysis || analysis?.report ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">{String(analysis.analysis_text || analysis.llm_analysis || analysis.report)}</p>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">No modeling-readiness narrative returned by backend yet.</p>
                )}
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  )
}
