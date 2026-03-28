import { motion, AnimatePresence } from "framer-motion"
import { X, Database, Columns, BarChart3 } from "lucide-react"
import { useVisualizationStore } from "../store/useVisualizationStore"

function scoreMeta(score) {
  if (score >= 85) return { text: "Excellent", color: "text-green-400", bar: "bg-green-500" }
  if (score >= 60) return { text: "Warning", color: "text-yellow-400", bar: "bg-yellow-500" }
  return { text: "Critical", color: "text-red-400", bar: "bg-red-500" }
}

export default function NodeDetailOverlay() {
  const { selectedNode, setSelectedNode } = useVisualizationStore()

  if (!selectedNode) return null

  const score = Number(selectedNode.qualityScore || 0)
  const meta = scoreMeta(score)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 24, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 24, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="absolute right-4 top-4 z-20 w-[340px] max-w-[90vw] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-overlay)]/95 p-4 shadow-[var(--shadow-lg)] backdrop-blur"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Table Detail</p>
            <h3 className="mt-1 break-words text-lg font-bold text-[var(--text-primary)]">{selectedNode.name}</h3>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="rounded-[var(--radius-sm)] p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
            aria-label="Close node details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2">
            <span className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]"><Database className="w-4 h-4" />Rows</span>
            <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">{Number(selectedNode.rows || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2">
            <span className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]"><Columns className="w-4 h-4" />Columns</span>
            <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">{(selectedNode.columns || []).length}</span>
          </div>
          <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2">
            <span className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]"><BarChart3 className="w-4 h-4" />Quality</span>
            <span className={`text-sm font-semibold ${meta.color}`}>{score}% ({meta.text})</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="h-2 overflow-hidden rounded-full bg-[var(--border-default)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(100, score))}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full ${meta.bar}`}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Columns</p>
          <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
            {(selectedNode.columns || []).map((col, idx) => {
              const colName = typeof col === "string" ? col : (col?.name || `column_${idx}`)
              return (
                <div key={`${colName}-${idx}`} className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1.5 text-xs text-[var(--text-secondary)]">
                  {colName}
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
