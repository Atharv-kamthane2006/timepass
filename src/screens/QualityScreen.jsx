import { useEffect, useState } from "react"
import { getQuality, getTableQuality } from "../api/api"
import { SkeletonCard } from "../components/Skeletons"
import GlobalQualityReport from "../components/GlobalQualityReport"
import { CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp } from "lucide-react"

export default function QualityScreen() {
  const mockData = [
    { 
      table: "orders", 
      score: 78,
      completeness: 95,
      freshness: 42,
      freshness_latest_date: "2018-09-03",
      freshness_days_ago: 2763,
      consistency: 88,
      orphan_issues: [
        { col: "customer_id", parent: "customers", orphans: 12 }
      ],
      columns: [
        { name: "customer_id", type: "VARCHAR", null_percent: 0.0, uniqueness_percent: 99.5, is_fk: true },
        { name: "order_date", type: "TIMESTAMP", null_percent: 0.0, uniqueness_percent: 80.0, is_pk: false }
      ]
    },
    { 
      table: "customers", 
      score: 85,
      completeness: 100,
      freshness: null,
      freshness_latest_date: null,
      freshness_days_ago: null,
      consistency: 100,
      orphan_issues: [],
      columns: [
        { name: "customer_id", type: "VARCHAR", null_percent: 0.0, uniqueness_percent: 100, is_pk: true }
      ]
    }
  ]

  const [data, setData] = useState(mockData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expandedTables, setExpandedTables] = useState({})
  const [detailLoading, setDetailLoading] = useState({})

  const withTimeout = (promise, ms = 20000) =>
    Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Request Timed Out")), ms)),
    ])

  const normalizeItem = (it = {}) => ({
    table: it?.table,
    score: it?.health_score ?? it?.score ?? 0,
    completeness: it?.completeness ?? 0,
    freshness: it?.freshness ?? null,
    freshness_latest_date: it?.freshness_latest_date ?? null,
    freshness_days_ago: it?.freshness_days_ago ?? null,
    consistency: it?.consistency ?? 0,
    orphan_issues: it?.orphan_issues ?? [],
    columns: Array.isArray(it?.columns) ? it.columns : [],
  })

  const loadTableDetails = async (table) => {
    if (!table) return
    setDetailLoading((prev) => ({ ...prev, [table]: true }))
    try {
      const detailRes = await withTimeout(getTableQuality(table), 12000)
      const raw = detailRes?.data
      if (!raw) return
      const merged = normalizeItem({ table, ...raw })
      setData((prev) =>
        prev.map((row) => (row.table === table ? { ...row, ...merged } : row))
      )
    } catch (e) {
      console.error("Table detail fetch failed:", table, e)
    } finally {
      setDetailLoading((prev) => ({ ...prev, [table]: false }))
    }
  }

  const toggleDetails = (table) => {
    setExpandedTables((prev) => {
      const nextOpen = !prev[table]
      if (nextOpen) {
        const row = data.find((d) => d.table === table)
        if (row && (!Array.isArray(row.columns) || row.columns.length === 0)) {
          loadTableDetails(table)
        }
      }
      return { ...prev, [table]: nextOpen }
    })
  }

  async function fetchQuality() {
    try {
      setLoading(true)
      setError("")

      // Load summary fast first; table detail loads lazily on expand.
      const res = await withTimeout(getQuality(), 20000)
      console.log("API response payload from /quality:", res?.data)
      const resData = res?.data

      const items = Array.isArray(resData?.items) ? resData.items : []
      const normalizedItems = items.map((it) => normalizeItem(it))

      if (normalizedItems.length > 0) {
        setData(normalizedItems)
      } else {
        setError("No quality items returned from backend. Showing cached demo data.")
        setData(mockData)
      }
    } catch (err) {
      console.error(err)
      setError("Failed to load quality data from backend. Showing cached demo data.")
      setData(mockData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuality()
  }, [])

  const getScoreColor = (score) => {
    if (score >= 85) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const getScoreBg = (score) => {
    if (score >= 85) return "bg-green-500/20"
    if (score >= 60) return "bg-yellow-500/20"
    return "bg-red-500/20"
  }

  const getScoreIcon = (score) => {
    if (score >= 85) return <CheckCircle className="w-5 h-5" />
    if (score >= 60) return <AlertTriangle className="w-5 h-5" />
    return <XCircle className="w-5 h-5" />
  }

  const getSubMetricColor = (score) => {
    if (score >= 80) return "bg-gradient-to-r from-green-500 to-green-400"
    if (score >= 65) return "bg-gradient-to-r from-yellow-500 to-yellow-400"
    return "bg-gradient-to-r from-red-500 to-red-400"
  }

  const getFreshnessLabel = (days) => {
    if (days == null) return null
    if (days < 30) return "Updated recently"
    if (days < 365) return `${days} days ago`
    const years = Math.floor(days / 365)
    const remainingDays = days % 365
    return `${years} ${years > 1 ? "years" : "year"} ${remainingDays} days ago`
  }

  return (
    <div className="h-screen overflow-y-auto bg-[var(--bg-base)] px-6 pb-10 pt-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-end justify-between border-b border-[var(--border-default)] pb-4">
          <div>
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <span>SchemaSense AI</span>
              <span>/</span>
              <span className="text-[var(--text-primary)]">Quality</span>
            </div>
            <h1 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Data Quality Overview</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Completeness, freshness, consistency, and integrity checks across all discovered tables.</p>
          </div>

          <div className="hidden gap-2 md:flex">
            <span className="badge badge-muted">{data.length} tables</span>
            <span className="badge badge-accent">Live Quality Monitor</span>
          </div>
        </header>

        {!loading && !error && <GlobalQualityReport />}

        {error && (
          <div className="mb-6 rounded-[var(--radius-md)] border border-[rgba(245,158,11,0.35)] bg-[var(--warning-dim)] px-4 py-3 text-sm text-[var(--warning)]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-6">
            {data.map((item, idx) => (
              <article
                key={idx}
                className="card animate-fade-up rounded-[var(--radius-lg)] border border-[var(--border-default)] p-5"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className={`mb-3 flex flex-col items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border-default)] p-4 md:flex-row md:items-center ${getScoreBg(item.score)}`}>
                  <div className="flex items-center gap-3">
                    <span className={getScoreColor(item.score)}>{getScoreIcon(item.score)}</span>
                    <div>
                      <h2 className="text-lg font-semibold capitalize text-[var(--text-primary)]">{item.table?.replace(/_/g, " ")}</h2>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Table health score: <span className={`font-semibold ${getScoreColor(item.score)}`}>{item.score}/100</span>
                      </p>
                    </div>
                  </div>

                  <div className="w-full md:w-[280px]">
                    <div className="mb-1 flex justify-between text-xs text-[var(--text-muted)]">
                      <span>Health</span>
                      <span>{item.score}%</span>
                    </div>
                    <div className="h-[6px] w-full overflow-hidden rounded-full bg-[var(--border-default)]">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          item.score >= 85
                            ? "bg-[var(--success)]"
                            : item.score >= 60
                              ? "bg-[var(--warning)]"
                              : "bg-[var(--danger)]"
                        }`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleDetails(item.table)}
                  className="mb-4 flex w-full items-center justify-center gap-1 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-input)] py-2 text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                >
                  {expandedTables[item.table] ? (
                    <>
                      Hide Details
                      <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Details
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>

                {expandedTables[item.table] && (
                  <div className="animate-fade-in">
                    {detailLoading[item.table] && (
                      <div className="mb-3 text-xs text-[var(--text-muted)]">Loading detailed metrics...</div>
                    )}

                    <div className="mb-5 grid gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                      <div>
                        <div className="mb-1 flex justify-between text-sm text-[var(--text-secondary)]">
                          <span>Completeness</span>
                          <span>{item.completeness}%</span>
                        </div>
                        <div className="h-[5px] w-full overflow-hidden rounded-full bg-[var(--border-default)]">
                          <div className={`h-full rounded-full ${getSubMetricColor(item.completeness)}`} style={{ width: `${item.completeness}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 flex justify-between text-sm text-[var(--text-secondary)]">
                          <span>Freshness {item.freshness !== null ? `(${item.freshness}%)` : ""}</span>
                          <span className="text-xs text-[var(--text-muted)]">{getFreshnessLabel(item.freshness_days_ago) || "No date columns"}</span>
                        </div>
                        {item.freshness !== null ? (
                          <div className="h-[5px] w-full overflow-hidden rounded-full bg-[var(--border-default)]">
                            <div className={`h-full rounded-full ${getSubMetricColor(item.freshness)}`} style={{ width: `${item.freshness}%` }} />
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <div className="mb-1 flex justify-between text-sm text-[var(--text-secondary)]">
                          <span>Consistency</span>
                          <span>{item.consistency}%</span>
                        </div>
                        <div className="h-[5px] w-full overflow-hidden rounded-full bg-[var(--border-default)]">
                          <div className={`h-full rounded-full ${getSubMetricColor(item.consistency)}`} style={{ width: `${item.consistency}%` }} />
                        </div>
                        <div className="mt-2">
                          {item.orphan_issues && item.orphan_issues.length > 0 && item.orphan_issues.some((o) => o.orphans > 0) ? (
                            item.orphan_issues
                              .filter((o) => o.orphans > 0)
                              .map((issue, orphanIdx) => (
                                <div key={orphanIdx} className="mt-1 inline-flex items-center gap-1 rounded-full border border-[rgba(239,68,68,0.35)] bg-[var(--danger-dim)] px-2 py-1 text-xs text-[var(--danger)]">
                                  <AlertTriangle className="h-3 w-3" />
                                  {issue.col} -&gt; {issue.parent}: {issue.orphans} orphaned
                                </div>
                              ))
                          ) : (
                            <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-[rgba(16,185,129,0.35)] bg-[var(--success-dim)] px-2 py-1 text-xs text-[var(--success)]">
                              <CheckCircle className="h-3 w-3" />
                              No referential integrity violations
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {item.columns && item.columns.length > 0 ? (
                      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-input)]">
                        <table className="w-full text-left text-sm">
                          <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">
                            <tr>
                              <th className="whitespace-nowrap px-4 py-3 font-semibold">Column Name</th>
                              <th className="whitespace-nowrap px-4 py-3 font-semibold">Type</th>
                              <th className="whitespace-nowrap px-4 py-3 font-semibold">Null %</th>
                              <th className="whitespace-nowrap px-4 py-3 font-semibold">Uniqueness</th>
                              <th className="whitespace-nowrap px-4 py-3 font-semibold">Flags</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.columns.map((col, colIdx) => {
                              const rawNull = parseFloat((col.null_percent ?? col.null_percentage ?? 0).toString().replace("%", "") || 0)
                              const isPk = Boolean(col.is_pk || col.is_primary_key)
                              const isFk = Boolean(col.is_fk || col.is_foreign_key)
                              return (
                                <tr key={colIdx} className="border-b border-[var(--border-subtle)] transition hover:bg-[rgba(255,255,255,0.02)]">
                                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{col.name}</td>
                                  <td className="px-4 py-3 text-[var(--text-secondary)]">{col.type || "VARCHAR"}</td>
                                  <td
                                    className="px-4 py-3 font-mono"
                                    style={{
                                      color: rawNull > 20 ? "#ef4444" : rawNull > 5 ? "#f59e0b" : "#22c55e",
                                    }}
                                  >
                                    {rawNull}%
                                  </td>
                                  <td className="px-4 py-3 text-[var(--text-secondary)]">{col.uniqueness_percent ?? col.uniqueness ?? "100"}%</td>
                                  <td className="space-x-2 px-4 py-3">
                                    {isPk ? (
                                      <span className="badge" style={{ background: "rgba(234,179,8,0.1)", color: "#eab308", border: "1px solid rgba(234,179,8,0.3)" }}>
                                        PK
                                      </span>
                                    ) : null}
                                    {isFk ? (
                                      <span className="badge" style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}>
                                        FK
                                      </span>
                                    ) : null}
                                    {!isPk && !isFk ? <span className="text-[var(--text-muted)]">-</span> : null}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] p-4 text-center text-sm italic text-[var(--text-muted)]">
                        No column metrics available for this table.
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {!loading && (
          <section className="mt-8 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Overall Summary</h3>
            <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
              <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] py-4">
                <p className="text-3xl font-bold text-[var(--success)]">{data.filter((d) => d.score >= 85).length}</p>
                <p className="text-xs text-[var(--text-muted)]">Excellent</p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] py-4">
                <p className="text-3xl font-bold text-[var(--warning)]">{data.filter((d) => d.score >= 60 && d.score < 85).length}</p>
                <p className="text-xs text-[var(--text-muted)]">Warning</p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] py-4">
                <p className="text-3xl font-bold text-[var(--danger)]">{data.filter((d) => d.score < 60).length}</p>
                <p className="text-xs text-[var(--text-muted)]">Critical</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}