import { useEffect, useMemo, useRef, useState } from "react"
import { analyzeTableWithAI, getSchemaWithCache, streamColumnChat } from "../api/api"
import { SkeletonTable } from "../components/Skeletons"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Columns,
  Database,
  Link,
  RefreshCw,
  Search,
  Send,
  Shield,
  Sparkles,
  X,
} from "lucide-react"

const TABLE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6", "#06b6d4"]

const TYPE_BADGE_MAP = {
  numeric: {
    bg: "rgba(59,130,246,0.1)",
    color: "#60a5fa",
    border: "rgba(59,130,246,0.25)",
  },
  categorical: {
    bg: "rgba(139,92,246,0.1)",
    color: "#a78bfa",
    border: "rgba(139,92,246,0.25)",
  },
  date: {
    bg: "rgba(6,182,212,0.1)",
    color: "#22d3ee",
    border: "rgba(6,182,212,0.25)",
  },
  boolean: {
    bg: "rgba(245,158,11,0.1)",
    color: "#fbbf24",
    border: "rgba(245,158,11,0.25)",
  },
  text: {
    bg: "rgba(148,163,184,0.08)",
    color: "#94a3b8",
    border: "rgba(148,163,184,0.2)",
  },
}

function getColumnName(col, idx) {
  if (typeof col === "string") return col
  return col?.display_name || col?.name || `column_${idx + 1}`
}

function getColumnType(col) {
  if (typeof col === "string") return "Unknown"
  return col?.type || "Unknown"
}

function getColumnDescription(col) {
  if (typeof col === "string") return ""
  return col?.ai_description || col?.description || col?.meaning || col?.summary || ""
}

function isColumnPk(col) {
  if (typeof col === "string") return false
  return Boolean(col?.is_primary_key || col?.is_pk || col?.primary_key)
}

function isColumnNullable(col) {
  if (typeof col === "string") return null
  if (col?.null_percentage !== undefined) return col.null_percentage > 0
  if (typeof col?.nullable === "boolean") return col.nullable
  return null
}

function getColumnFk(col) {
  if (typeof col === "string") return "—"
  
  // SAFE DEMO MODE: Prevent Primary Keys from incorrectly showing as Foreign Keys
  if (isColumnPk(col)) return "—"

  if (col?.references && typeof col.references === "string") return col.references
  if (col?.foreign_key && typeof col.foreign_key === "string") return String(col.foreign_key)
  if (col?.fk_table || (col?.references && typeof col.references !== "string")) {
    const target = col.fk_table || col.references
    const targetCol = col.fk_column || col.references_column || "id"
    if (typeof target === 'string') return `${target}.${targetCol}`
  }
  if (col?.is_foreign_key || col?.is_fk) return "Yes"
  return "—"
}

function getColumnDefault(col) {
  if (typeof col === "string") return "—"
  return col?.default_value ?? col?.default ?? "—"
}

function getColumnSample(col) {
  if (typeof col === "string") return "—"
  const sample = col?.sample_value ?? col?.sample ?? col?.example
  if (sample === undefined || sample === null || sample === "") return "—"
  return String(sample)
}

function getColumnRawName(col, idx) {
  if (typeof col === "string") return col
  return col?.name || col?.display_name || `column_${idx + 1}`
}

function getNullPercent(col) {
  if (!col || typeof col === "string") return null
  const raw = col?.null_percentage ?? col?.null_percent ?? col?.nullPct
  if (raw === undefined || raw === null || raw === "") {
    if (typeof col?.nullable === "boolean") return col.nullable ? 100 : 0
    return null
  }
  const num = Number(raw)
  return Number.isFinite(num) ? Math.max(0, Math.min(100, num)) : null
}

function getHealthScore(table) {
  const explicit =
    table?.health_score ??
    table?.quality_score ??
    table?.score ??
    table?.quality?.score ??
    table?.quality?.health_score
  const numeric = Number(explicit)
  if (Number.isFinite(numeric)) return Math.max(0, Math.min(100, Math.round(numeric)))

  const cols = Array.isArray(table?.columns) ? table.columns : []
  if (!cols.length) return 0
  const avgNull = cols
    .map((col) => getNullPercent(col))
    .filter((v) => v !== null)
    .reduce((a, b, _, arr) => a + b / arr.length, 0)
  return Math.max(0, Math.min(100, Math.round(100 - avgNull)))
}

function getHealthBadge(score) {
  if (score >= 85) return "badge badge-success"
  if (score >= 70) return "badge badge-warning"
  return "badge badge-danger"
}

function getLastUpdated(table) {
  const raw =
    table?.last_updated ||
    table?.updated_at ||
    table?.freshness?.last_updated ||
    table?.quality?.freshness?.last_updated ||
    null
  if (!raw) return null
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString()
}

function getTypeFamily(type) {
  const value = String(type || "").toLowerCase()
  if (/int|float|double|decimal|numeric|number|real|bigint|smallint/.test(value)) return "numeric"
  if (/date|time|timestamp/.test(value)) return "date"
  if (/bool|bit/.test(value)) return "boolean"
  if (/enum|category|status/.test(value)) return "categorical"
  return "text"
}

function CountUpValue({ value, formatter = (v) => v.toLocaleString(), className = "" }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const to = Number(value) || 0
    const from = 0
    const duration = 800
    const start = performance.now()
    let rafId = null

    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const current = from + (to - from) * progress
      setDisplay(current)
      if (progress < 1) {
        rafId = requestAnimationFrame(animate)
      }
    }

    rafId = requestAnimationFrame(animate)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [value])

  return <span className={className}>{formatter(display)}</span>
}

function looksLikeSqlExecutionMessage(text) {
  const t = String(text || "").toLowerCase()
  return (
    t.includes("sql execution failed") ||
    t.includes("only read-only select") ||
    t.includes("execution_error") ||
    t.includes("returning fallback data") ||
    t.includes("failed even after self-correction")
  )
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildLocalReasoning(table) {
  if (!table) return "No table selected."

  const columns = Array.isArray(table.columns) ? table.columns : []
  const name = String(table.display_name || table.name || "this table")

  const pkCols = columns
    .filter((c) => isColumnPk(c))
    .map((c, idx) => getColumnRawName(c, idx))

  const fkCols = columns
    .filter((c) => getColumnFk(c) !== "—")
    .map((c, idx) => `${getColumnRawName(c, idx)} -> ${getColumnFk(c)}`)

  const nullableCount = columns.filter((c) => isColumnNullable(c) !== false).length
  const totalRows = Number(table.row_count ?? table.rowCount ?? 0)

  const keyCandidates = columns
    .map((c, idx) => getColumnRawName(c, idx))
    .filter((n) => /(^id$|_id$|date|time|status|amount|price|qty|count)/i.test(n))
    .slice(0, 6)

  const risks = []
  if (nullableCount > 0) {
    risks.push(`${nullableCount} nullable columns may create missing-value issues in analytics.`)
  }
  if (!pkCols.length) {
    risks.push("No explicit primary key metadata detected; duplicates may be harder to control.")
  }
  if (!fkCols.length) {
    risks.push("No explicit foreign key metadata detected; joins may rely on naming conventions.")
  }
  if (totalRows === 0) {
    risks.push("Table currently reports 0 rows, so quality checks may be incomplete.")
  }

  return [
    `1) What this table stores`,
    `${name} appears to store domain records with ${columns.length} columns and ${totalRows.toLocaleString()} rows.`,
    "",
    `2) Key columns and likely meaning`,
    keyCandidates.length ? `Likely key/business columns: ${keyCandidates.join(", ")}.` : "Column names do not expose obvious business keys.",
    pkCols.length ? `Primary key columns: ${pkCols.join(", ")}.` : "Primary key metadata not explicitly available.",
    "",
    `3) Potential joins/relationships`,
    fkCols.length ? `Detected join hints: ${fkCols.slice(0, 6).join("; ")}.` : "No explicit FK links returned by backend for this table.",
    "",
    `4) Data quality risks`,
    risks.length ? risks.map((r) => `- ${r}`).join("\n") : "- No obvious risks detected from available metadata.",
  ].join("\n")
}

export default function DictionaryScreen() {
  const [tables, setTables] = useState([])
  const [activeTable, setActiveTable] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [tableSearch, setTableSearch] = useState("")
  const [columnSearch, setColumnSearch] = useState("")

  const [aiReasoning, setAiReasoning] = useState("")
  const [aiDisplay, setAiDisplay] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState("")
  const [summaryRole, setSummaryRole] = useState("business")
  const [summaryRefreshTick, setSummaryRefreshTick] = useState(0)
  const [columnDrawer, setColumnDrawer] = useState(null)
  const [columnContext, setColumnContext] = useState(null)
  const [columnQuestion, setColumnQuestion] = useState("")
  const [columnChatMessages, setColumnChatMessages] = useState([])
  const [columnChatLoading, setColumnChatLoading] = useState(false)
  const [columnChatError, setColumnChatError] = useState("")
  const reasoningRunRef = useRef(0)
  const streamAbortRef = useRef(null)

  const getBusinessSummary = (table) =>
    table?.business_summary || table?.businessSummary || table?.summaries?.business || ""

  const getDeveloperSummary = (table) =>
    table?.developer_summary || table?.developerSummary || table?.summaries?.developer || ""

  const openColumnDrawer = (col, idx) => {
    const columnName = getColumnRawName(col, idx)
    setColumnDrawer({
      table: activeTable?.name,
      column: columnName,
      raw: col,
      rowCount: Number(activeTable?.row_count ?? activeTable?.rowCount ?? 0),
    })
    setColumnContext({
      row_count: Number(activeTable?.row_count ?? activeTable?.rowCount ?? 0),
      data_type: getColumnType(col),
      null_pct: col?.null_percentage ?? col?.null_percent ?? null,
      unique_count: col?.unique_count ?? null,
      uniqueness_pct: col?.uniqueness_pct ?? col?.uniqueness_percent ?? col?.uniqueness ?? null,
      fk_reference: getColumnFk(col) !== "—" ? getColumnFk(col) : null,
      top_values: [],
      sample_values: getColumnSample(col) !== "—" ? [getColumnSample(col)] : [],
    })
    setColumnQuestion("")
    setColumnChatError("")
    setColumnChatMessages([])
  }

  const closeColumnDrawer = () => {
    if (streamAbortRef.current) {
      streamAbortRef.current.abort()
      streamAbortRef.current = null
    }
    setColumnDrawer(null)
    setColumnContext(null)
    setColumnQuestion("")
    setColumnChatLoading(false)
    setColumnChatError("")
  }

  const sendColumnQuestion = async () => {
    const q = columnQuestion.trim()
    if (!q || !columnDrawer || columnChatLoading) return

    setColumnChatError("")
    setColumnQuestion("")
    setColumnChatLoading(true)

    const assistantId = Date.now()
    setColumnChatMessages((prev) => [
      ...prev,
      { role: "user", content: q },
      { id: assistantId, role: "assistant", content: "" },
    ])

    const appendAssistant = (delta) => {
      if (!delta) return
      setColumnChatMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: `${m.content || ""}${delta}` } : m
        )
      )
    }

    const controller = new AbortController()
    streamAbortRef.current = controller

    try {
      await streamColumnChat(
        {
          table: columnDrawer.table,
          column: columnDrawer.column,
          question: q,
        },
        {
          signal: controller.signal,
          onMeta: (meta) => {
            if (meta) setColumnContext((prev) => ({ ...(prev || {}), ...meta }))
          },
          onDelta: (delta) => appendAssistant(delta),
          onDone: (payload) => {
            const finalAnswer = payload?.answer || payload?.final || payload?.message || ""
            setColumnChatMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: m.content || finalAnswer,
                      diagnostics: payload?.diagnostics || m.diagnostics,
                    }
                  : m
              )
            )
          },
          onError: (message) => {
            setColumnChatError(String(message || "Column chat streaming failed."))
          },
        }
      )
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("Column stream error:", err)
        setColumnChatError("Failed to stream column answer.")
      }
    } finally {
      if (streamAbortRef.current === controller) {
        streamAbortRef.current = null
      }
      setColumnChatLoading(false)
    }
  }

  async function fetchSchema(forceFresh = false) {
    try {
      setLoading(true)
      setError("")

      const selectedName = activeTable?.name

      const retryDelaysMs = [0, 900, 1800]
      let res = null
      let lastErr = null

      for (let attempt = 0; attempt < retryDelaysMs.length; attempt += 1) {
        if (retryDelaysMs[attempt] > 0) {
          await sleep(retryDelaysMs[attempt])
        }

        try {
          res = await getSchemaWithCache({ force: forceFresh || attempt > 0 })
          lastErr = null
          break
        } catch (err) {
          lastErr = err
        }
      }

      if (lastErr) {
        throw lastErr
      }

      console.log("Schema response:", res.data)

      const nextTables = Array.isArray(res?.data?.tables) ? res.data.tables : []
      setTables(nextTables)

      if (!selectedName && nextTables.length > 0) {
        setActiveTable(nextTables[0])
      } else if (selectedName) {
        const found = nextTables.find((t) => t.name === selectedName)
        setActiveTable(found || nextTables[0] || null)
      }

    } catch (err) {
      console.error(err)
      const status = err?.response?.status
      if (status === 401 || status === 403) {
        setError("Session expired while loading schema. Please sign in again.")
      } else if (status >= 500) {
        setError("Backend is still preparing schema metadata. Please refresh in a moment.")
      } else if ((err?.message || "").toLowerCase().includes("timeout")) {
        setError("Schema request timed out. Please refresh once backend ingest completes.")
      } else {
        setError("Failed to load schema. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchema()
  }, [])

  useEffect(() => {
    return () => {
      if (streamAbortRef.current) {
        streamAbortRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    if (!activeTable) {
      setAiReasoning("")
      setAiDisplay("")
      return
    }

    let cancelled = false
    const runId = ++reasoningRunRef.current

    async function analyzeTable() {
      setAiLoading(true)
      setAiError("")
      setAiReasoning("")
      setAiDisplay("")

      const roleSummary =
        summaryRole === "business"
          ? getBusinessSummary(activeTable)
          : getDeveloperSummary(activeTable)

      if (roleSummary) {
        setAiReasoning(String(roleSummary))
        setAiLoading(false)
        return
      }

      const columnSummary = (activeTable.columns || [])
        .map((c, i) => `${getColumnName(c, i)} (${getColumnType(c)})`)
        .slice(0, 80)
        .join(", ")

      const prompt = [
        "Analyze this database table for a data dictionary UI.",
        "Return a concise explanation with:",
        "1) What the table stores",
        "2) Key columns and likely meaning",
        "3) Potential joins/relationships",
        "4) Data quality risks",
        `Role preference: ${summaryRole === "business" ? "Business Analyst" : "Backend Developer"}`,
        `Table: ${activeTable.name}`,
        `Columns: ${columnSummary}`,
      ].join("\n")

      try {
        const res = await analyzeTableWithAI(prompt)
        if (cancelled || runId !== reasoningRunRef.current) return

        const body = res?.data || {}
        const explanationRaw =
          body?.explanation ||
          body?.message ||
          ""

        if (!explanationRaw || looksLikeSqlExecutionMessage(explanationRaw)) {
          setAiReasoning(buildLocalReasoning(activeTable))
          return
        }

        setAiReasoning(String(explanationRaw))
      } catch (err) {
        if (cancelled || runId !== reasoningRunRef.current) return
        console.error("AI reasoning failed:", err)
        setAiError("Backend reasoning unavailable, using schema-based reasoning.")
        setAiReasoning(buildLocalReasoning(activeTable))
      } finally {
        if (!cancelled && runId === reasoningRunRef.current) {
          setAiLoading(false)
        }
      }
    }

    analyzeTable()

    return () => {
      cancelled = true
    }
  }, [activeTable?.name, summaryRole, summaryRefreshTick])

  useEffect(() => {
    const text = String(aiReasoning || "")
    setAiDisplay("")

    if (!text) return

    let idx = 0
    const timer = setInterval(() => {
      idx += 1
      setAiDisplay(text.slice(0, idx))
      if (idx >= text.length) {
        clearInterval(timer)
      }
    }, 12)

    return () => clearInterval(timer)
  }, [aiReasoning])

  const activeColumns = Array.isArray(activeTable?.columns) ? activeTable.columns : []
  const filteredTables = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return tables
    return tables.filter((t) =>
      String(t.display_name || t.name || "").toLowerCase().includes(q)
    )
  }, [tables, tableSearch])

  const filteredColumns = useMemo(() => {
    const q = columnSearch.trim().toLowerCase()
    if (!q) return activeColumns
    return activeColumns.filter((c, i) => {
      const n = getColumnName(c, i).toLowerCase()
      const t = getColumnType(c).toLowerCase()
      return n.includes(q) || t.includes(q)
    })
  }, [activeColumns, columnSearch])

  const relationships = useMemo(() => {
    if (!activeTable) return []
    return activeColumns
      .map((col, idx) => {
        const sourceCol = getColumnRawName(col, idx)
        const target = getColumnFk(col)
        if (target === "—" || target === "Yes") return null
        return {
          id: `${sourceCol}-${target}`,
          source: `${activeTable.name}.${sourceCol}`,
          target,
          confidence: Number(col?.confidence ?? col?.fk_confidence ?? col?.relationship_confidence ?? 0.82),
        }
      })
      .filter(Boolean)
  }, [activeColumns, activeTable])

  const stats = useMemo(() => {
    const totalRows = Number(activeTable?.row_count ?? activeTable?.rowCount ?? 0)
    const totalColumns = activeColumns.length
    const nullableColumns = activeColumns.filter((c) => isColumnNullable(c) !== false).length
    const primaryKeys = activeColumns.filter((c) => isColumnPk(c)).length
    const avgNull = activeColumns
      .map((col) => getNullPercent(col))
      .filter((v) => v !== null)
      .reduce((acc, curr, _, arr) => acc + curr / arr.length, 0)
    return { totalRows, totalColumns, nullableColumns, primaryKeys, avgNull: Number(avgNull || 0) }
  }, [activeTable, activeColumns])

  const activeHealth = getHealthScore(activeTable)
  const activeColor = TABLE_COLORS[Math.max(0, tables.findIndex((t) => t.name === activeTable?.name)) % TABLE_COLORS.length] || TABLE_COLORS[0]
  const reasoningSteps = [
    {
      id: 1,
      name: "Schema ingestion",
      status: activeTable ? "complete" : "pending",
    },
    {
      id: 2,
      name: "Role summary synthesis",
      status: aiLoading ? "active" : aiReasoning ? "complete" : "pending",
    },
    {
      id: 3,
      name: "Column copilot stream",
      status: columnChatLoading ? "active" : columnChatMessages.length > 0 ? "complete" : "pending",
    },
  ]

  return (
    <div className="h-screen overflow-hidden bg-[var(--bg-base)]">
      <header className="flex h-[76px] items-center justify-between border-b border-[var(--border-default)] px-6">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <span>SchemaSense AI</span>
              <span>/</span>
              <span className="text-[var(--text-primary)]">Dictionary</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="text-base font-semibold text-[var(--text-primary)]">Dictionary</h1>
              <span className="badge badge-muted">{tables.length} tables</span>
            </div>
          </div>
          <button
            onClick={() => fetchSchema(true)}
            disabled={loading}
            className="grid h-8 w-8 place-items-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] disabled:opacity-50"
            title="Refresh schema"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="relative w-[200px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            placeholder="Search tables"
            className="h-9 w-full rounded-full border border-[var(--border-default)] bg-[var(--bg-input)] pl-9 pr-3 font-mono text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
          />
        </div>
      </header>

      <div className="flex h-[calc(100vh-76px)] min-h-0">
        <aside className="w-[240px] overflow-y-auto border-r border-[var(--border-default)] bg-[var(--bg-surface)] pt-3">
          <div className="px-4 pb-2 text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Tables</div>

          {error ? (
            <div className="mx-3 mb-3 flex items-start gap-2 rounded-[var(--radius-md)] border border-[rgba(239,68,68,0.28)] bg-[var(--danger-dim)] px-2.5 py-2 text-[11px] text-[var(--danger)]">
              <AlertCircle className="mt-[1px] h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-2 px-3 pt-1">
              {[...Array(5)].map((_, idx) => (
                <div key={idx} className="h-14 rounded-[var(--radius-md)] animate-skeleton" />
              ))}
            </div>
          ) : (
            <div>
              {filteredTables.map((table, idx) => {
                const score = getHealthScore(table)
                const active = activeTable?.name === table.name
                const color = TABLE_COLORS[idx % TABLE_COLORS.length]
                return (
                  <motion.button
                    key={table.id || table.name}
                    onClick={() => setActiveTable(table)}
                    className={`relative flex h-14 w-full items-center px-4 text-left transition ${
                      active
                        ? "bg-[var(--bg-elevated)]"
                        : "hover:bg-[rgba(255,255,255,0.025)]"
                    }`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.26, delay: idx * 0.05 }}
                  >
                    <span
                      className="absolute left-0 top-0 h-full w-[3px]"
                      style={{ background: color, opacity: active ? 1 : 0.5 }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {table.display_name || table.name}
                      </p>
                      <p className="font-mono text-xs text-[var(--text-muted)]">
                        {Number(table.row_count ?? table.rowCount ?? 0).toLocaleString()} rows
                      </p>
                    </div>
                    <span className={getHealthBadge(score)}>{score}</span>
                  </motion.button>
                )
              })}
              {filteredTables.length === 0 ? (
                <div className="px-4 py-4 text-xs text-[var(--text-muted)]">No table matches your search.</div>
              ) : null}
            </div>
          )}
        </aside>

        <main className="flex-1 overflow-y-auto px-6 py-6">
          {!activeTable ? (
            <div className="card grid min-h-[280px] place-items-center">
              <div className="text-center">
                <Database className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
                <p className="text-sm text-[var(--text-secondary)]">Select a table to view schema intelligence.</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.section
                key={activeTable.name}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.22 }}
              >
                <div className="flex items-start justify-between gap-4 border-l-[3px] pl-4" style={{ borderLeftColor: activeColor }}>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">{activeTable.display_name || activeTable.name}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="badge badge-muted">{stats.totalRows.toLocaleString()} rows</span>
                      <span className="badge badge-muted">{stats.totalColumns} columns</span>
                      <span className={getHealthBadge(activeHealth)}>Health: {activeHealth}</span>
                      {getLastUpdated(activeTable) ? <span className="badge badge-muted">Last updated: {getLastUpdated(activeTable)}</span> : null}
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border-default)] border-l-[3px] border-l-[var(--accent)] bg-[var(--bg-elevated)] px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <Sparkles className="h-3.5 w-3.5 text-[var(--accent-bright)]" />
                      <span>AI Summary</span>
                    </div>
                    <div className="inline-flex rounded-full border border-[var(--border-default)] p-1">
                      <button
                        onClick={() => setSummaryRole("business")}
                        className={`rounded-full px-3 py-1 text-xs ${
                          summaryRole === "business"
                            ? "border border-[var(--border-accent)] bg-[var(--accent-dim)] text-[var(--accent-bright)]"
                            : "border border-transparent text-[var(--text-muted)]"
                        }`}
                      >
                        Business
                      </button>
                      <button
                        onClick={() => setSummaryRole("developer")}
                        className={`rounded-full px-3 py-1 text-xs ${
                          summaryRole === "developer"
                            ? "border border-[var(--border-accent)] bg-[var(--accent-dim)] text-[var(--accent-bright)]"
                            : "border border-transparent text-[var(--text-muted)]"
                        }`}
                      >
                        Developer
                      </button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${summaryRole}-${activeTable.name}-${summaryRefreshTick}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-2"
                    >
                      {aiLoading && !aiDisplay ? (
                        <div className="space-y-2">
                          <div className="h-3 w-[80%] rounded skeleton bg-[var(--bg-overlay)]" />
                          <div className="h-3 w-[60%] rounded skeleton bg-[var(--bg-overlay)]" />
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{aiDisplay || "Waiting for analysis..."}</p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3">
                    <p className="mb-1 inline-flex items-center gap-1 text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      <Database className="h-3.5 w-3.5" />
                      Rows
                    </p>
                    <CountUpValue
                      value={stats.totalRows}
                      className="font-mono text-2xl font-bold text-[var(--success)]"
                    />
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Total records in this table</p>
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3">
                    <p className="mb-1 inline-flex items-center gap-1 text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      <Columns className="h-3.5 w-3.5" />
                      Columns
                    </p>
                    <CountUpValue
                      value={stats.totalColumns}
                      className="font-mono text-2xl font-bold text-[var(--info)]"
                    />
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Documented schema fields</p>
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3">
                    <p className="mb-1 inline-flex items-center gap-1 text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      <Shield className="h-3.5 w-3.5" />
                      Health
                    </p>
                    <CountUpValue
                      value={activeHealth}
                      className={`font-mono text-2xl font-bold ${
                        activeHealth >= 85
                          ? "text-[var(--success)]"
                          : activeHealth >= 70
                            ? "text-[var(--warning)]"
                            : "text-[var(--danger)]"
                      }`}
                    />
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Composite quality score</p>
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3">
                    <p className="mb-1 inline-flex items-center gap-1 text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      <ChevronRight className="h-3.5 w-3.5" />
                      Avg Null%
                    </p>
                    <CountUpValue
                      value={stats.avgNull}
                      formatter={(v) => `${v.toFixed(1)}%`}
                      className={`font-mono text-2xl font-bold ${
                        stats.avgNull < 5
                          ? "text-[var(--success)]"
                          : stats.avgNull <= 20
                            ? "text-[var(--warning)]"
                            : "text-[var(--danger)]"
                      }`}
                    />
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Average null density</p>
                  </div>
                </div>

                <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border-default)]">
                  <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3">
                    <div className="relative w-full max-w-[260px]">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        value={columnSearch}
                        onChange={(e) => setColumnSearch(e.target.value)}
                        placeholder="Search columns"
                        className="h-8 w-full rounded-full border border-[var(--border-default)] bg-[var(--bg-input)] pl-9 pr-3 font-mono text-xs text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
                      />
                    </div>
                  </div>

                  {loading ? (
                    <div className="p-4">
                      <SkeletonTable />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-separate border-spacing-0 text-sm">
                        <thead>
                          <tr className="h-9 bg-[var(--bg-elevated)] text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                            <th className="px-4 text-left">Name</th>
                            <th className="px-4 text-left">Type</th>
                            <th className="px-4 text-left">AI Description</th>
                            <th className="px-4 text-left">Null%</th>
                            <th className="px-4 text-left">Flags</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredColumns.map((col, idx) => {
                            const name = getColumnName(col, idx)
                            const type = getColumnType(col)
                            const description = getColumnDescription(col)
                            const nullPct = getNullPercent(col)
                            const fk = getColumnFk(col)
                            const family = getTypeFamily(type)
                            const chip = TYPE_BADGE_MAP[family]
                            const nullColor =
                              nullPct === null
                                ? "var(--text-muted)"
                                : nullPct < 5
                                  ? "var(--success)"
                                  : nullPct <= 20
                                    ? "var(--warning)"
                                    : "var(--danger)"

                            return (
                              <motion.tr
                                key={`${name}-${idx}`}
                                className="h-12 cursor-pointer border-b border-[var(--border-subtle)] transition hover:bg-[rgba(255,255,255,0.02)]"
                                onClick={() => openColumnDrawer(col, idx)}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: idx * 0.03 }}
                              >
                                <td className="px-4 font-mono text-sm font-medium text-[var(--accent-bright)]">
                                  {isColumnPk(col) ? <span className="mr-1 text-[#eab308]">◆</span> : null}
                                  {name}
                                </td>
                                <td className="px-4">
                                  <span
                                    className="inline-flex rounded-full border px-2 py-[2px] font-mono text-[11px]"
                                    style={{
                                      background: chip.bg,
                                      borderColor: chip.border,
                                      color: chip.color,
                                    }}
                                  >
                                    {type}
                                  </span>
                                </td>
                                <td className="max-w-[260px] px-4 text-xs text-[var(--text-secondary)]">
                                  {description ? (
                                    <span className="block truncate" title={description}>
                                      {description}
                                    </span>
                                  ) : (
                                    <span className="inline-block h-2.5 w-28 rounded skeleton bg-[var(--bg-overlay)]" />
                                  )}
                                </td>
                                <td className="px-4">
                                  <div className="w-20">
                                    <div className="h-[3px] overflow-hidden rounded bg-[var(--border-default)]">
                                      <div
                                        className="h-[3px]"
                                        style={{
                                          width: `${nullPct ?? 0}%`,
                                          background: nullColor,
                                        }}
                                      />
                                    </div>
                                    <p className="mt-1 text-right font-mono text-xs text-[var(--text-muted)]">
                                      {nullPct === null ? "--" : `${nullPct.toFixed(1)}%`}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-4">
                                  <div className="flex flex-wrap gap-1">
                                    {isColumnPk(col) ? (
                                      <span className="badge" style={{ background: "rgba(234,179,8,0.1)", color: "#eab308", border: "1px solid rgba(234,179,8,0.3)" }}>
                                        PK
                                      </span>
                                    ) : null}
                                    {fk !== "—" ? (
                                      <span className="badge" style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}>
                                        FK
                                      </span>
                                    ) : null}
                                    {isColumnNullable(col) === false ? (
                                      <span className="badge badge-muted">NN</span>
                                    ) : null}
                                  </div>
                                </td>
                              </motion.tr>
                            )
                          })}
                        </tbody>
                      </table>
                      {filteredColumns.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No columns found for your search.</div>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                    <Link className="h-4 w-4 text-[var(--accent-bright)]" />
                    Detected Relationships
                  </h3>
                  <div className="space-y-2">
                    {relationships.length === 0 ? (
                      <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-accent)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
                        No explicit FK mappings were detected for this table.
                      </div>
                    ) : (
                      relationships.map((rel) => (
                        <div
                          key={rel.id}
                          className="flex items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--border-accent)] bg-[var(--bg-surface)] px-4 py-3"
                        >
                          <span className="font-mono text-sm text-[var(--accent)]">{rel.source}</span>
                          <span className="text-[var(--text-muted)]">-&gt;</span>
                          <span className="font-mono text-sm text-[var(--accent-bright)]">{rel.target}</span>
                          <span className="ml-auto badge badge-info">{Math.round((rel.confidence || 0) * 100)}%</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.section>
            </AnimatePresence>
          )}
        </main>

        <aside className="hidden w-[300px] overflow-y-auto border-l border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-5 xl:block">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">AI Reasoning</p>
            <span className="pulse-ring relative inline-flex h-2 w-2 rounded-full bg-[var(--success)]" />
          </div>

          <div className="mt-4 space-y-3">
            {reasoningSteps.map((step, idx) => (
              <motion.div
                key={step.id}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[var(--text-muted)]">0{step.id}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{step.name}</span>
                </div>
                {step.status === "complete" ? (
                  <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                ) : step.status === "active" ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--accent)]" />
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--text-muted)]" />
                )}
              </motion.div>
            ))}
          </div>

          <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">{summaryRole === "business" ? "Business Summary" : "Developer Summary"}</span>
              <button
                onClick={() => {
                  if (activeTable) {
                    const next = tables.find((t) => t.name === activeTable.name)
                    if (next) setActiveTable({ ...next })
                  }
                  setSummaryRefreshTick((v) => v + 1)
                }}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Refresh
              </button>
            </div>

            {aiError ? (
              <div className="mb-2 rounded-[var(--radius-sm)] border border-[rgba(245,158,11,0.35)] bg-[var(--warning-dim)] px-2 py-1.5 text-[11px] text-[var(--warning)]">
                {aiError}
              </div>
            ) : null}

            <p className="min-h-[240px] whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
              {aiDisplay || "Waiting for analysis..."}
              {(aiLoading || (aiDisplay && aiDisplay.length < aiReasoning.length)) ? (
                <span className="ml-1 inline-block h-[1em] w-[6px] animate-pulse bg-[var(--accent)] align-middle" />
              ) : null}
            </p>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {columnDrawer ? (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40"
              onClick={closeColumnDrawer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.aside
              className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[460px] flex-col border-l border-[var(--border-default)] bg-[var(--bg-overlay)] shadow-[var(--shadow-lg)]"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="border-b border-[var(--border-default)] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Column Detail Drawer</p>
                    <h3 className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{columnDrawer.table}.{columnDrawer.column}</h3>
                  </div>
                  <button
                    onClick={closeColumnDrawer}
                    className="grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-2">
                    <p className="text-[var(--text-muted)]">Type</p>
                    <p className="font-medium text-[var(--text-primary)]">{columnContext?.data_type || getColumnType(columnDrawer.raw)}</p>
                  </div>
                  <div className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-2">
                    <p className="text-[var(--text-muted)]">Rows</p>
                    <p className="font-medium text-[var(--text-primary)]">{Number(columnContext?.row_count ?? columnDrawer.rowCount ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-2">
                    <p className="text-[var(--text-muted)]">Null %</p>
                    <p className="font-medium text-[var(--text-primary)]">{columnContext?.null_pct ?? "--"}</p>
                  </div>
                  <div className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-2">
                    <p className="text-[var(--text-muted)]">Uniqueness %</p>
                    <p className="font-medium text-[var(--text-primary)]">{columnContext?.uniqueness_pct ?? "--"}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {columnChatMessages.length === 0 ? (
                  <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 text-xs text-[var(--text-secondary)]">
                    Ask about this column's distribution, null impact, semantics, or reporting implications.
                  </div>
                ) : (
                  columnChatMessages.map((m, i) => (
                    <div
                      key={m.id || i}
                      className={`rounded-[var(--radius-md)] border p-3 text-sm ${
                        m.role === "user"
                          ? "ml-8 border-[var(--border-accent)] bg-[var(--accent-dim)] text-[var(--text-primary)]"
                          : "mr-4 border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {m.content || (columnChatLoading && m.role === "assistant" ? "Thinking..." : "")}
                      {m.role === "assistant" && m.diagnostics ? (
                        <div className="mt-2 border-t border-[var(--border-subtle)] pt-2 text-[11px] text-[var(--text-muted)]">
                          {m.diagnostics.model ? <span>Model: {m.diagnostics.model}</span> : null}
                          {m.diagnostics.latency_ms !== undefined ? <span className="ml-3">Latency: {m.diagnostics.latency_ms} ms</span> : null}
                          {m.diagnostics.generated_at ? <span className="ml-3">At: {new Date(m.diagnostics.generated_at).toLocaleTimeString()}</span> : null}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}

                {columnChatError ? (
                  <div className="rounded-[var(--radius-sm)] border border-[rgba(239,68,68,0.35)] bg-[var(--danger-dim)] px-2 py-1.5 text-xs text-[var(--danger)]">
                    {columnChatError}
                  </div>
                ) : null}
              </div>

              <div className="border-t border-[var(--border-default)] p-3">
                <div className="flex gap-2">
                  <input
                    value={columnQuestion}
                    onChange={(e) => setColumnQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendColumnQuestion()
                      }
                    }}
                    placeholder="Ask about this column..."
                    className="h-10 flex-1 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-input)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
                  />
                  <button
                    onClick={sendColumnQuestion}
                    disabled={columnChatLoading || !columnQuestion.trim()}
                    className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] border border-[var(--border-accent)] bg-[var(--accent-dim)] text-[var(--accent-bright)] transition hover:bg-[rgba(99,102,241,0.22)] disabled:opacity-50"
                    title="Send"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  )
}