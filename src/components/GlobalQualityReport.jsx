import { useState } from "react";
import { AlertCircle, AlertTriangle, Calculator, ListChecks, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

export default function GlobalQualityReport({ report = null }) {
  const [expanded, setExpanded] = useState({
    critical: true,
    warnings: true,
    math: true,
    actions: true,
    verdict: true,
  });

  const toggleSection = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  // Fallback default structure if backend doesn't send yet
  const data = report || {
    critical: ["No explicitly defined foreign key constraints in schema", "Table 'order_payments' lacks primary key detection"],
    warnings: ["Nullable columns found in critical paths (e.g., zip_code_prefix)", "Low freshness on 'products' table data"],
    math_summary: "Processed 9 tables, 52 total columns. Database average completeness score: 87%. Total detected relationships: 12.",
    actions: [
      "Explicitly define Composite Primary Keys on junction tables",
      "Set ON DELETE CASCADE rules for order_items",
      "Remove orphan rows in geolocation table"
    ],
    verdict: "Data schema is moderately healthy but relational constraints must be strictly enforced before production use."
  };

  return (
    <div className="mb-8 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="h-6 w-6 text-[var(--accent-bright)]" />
        <h2 className="text-xl font-bold text-[var(--text-primary)]">AI Database Health Assessment</h2>
      </div>

      <div className="space-y-4">
        {/* Critical */}
        {data.critical?.length > 0 && (
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-[rgba(239,68,68,0.3)] bg-[var(--danger-dim)]">
            <button onClick={() => toggleSection('critical')} className="flex w-full items-center justify-between bg-[rgba(239,68,68,0.1)] px-4 py-3 transition hover:bg-[rgba(239,68,68,0.16)]">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-[var(--danger)]" />
                <span className="font-semibold text-[var(--danger)]">Critical Issues ({data.critical.length})</span>
              </div>
              {expanded.critical ? <ChevronUp className="h-4 w-4 text-[var(--danger)]" /> : <ChevronDown className="h-4 w-4 text-[var(--danger)]" />}
            </button>
            {expanded.critical && (
              <div className="p-4">
                <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                  {data.critical.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Warnings */}
        {data.warnings?.length > 0 && (
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-[rgba(245,158,11,0.3)] bg-[var(--warning-dim)]">
            <button onClick={() => toggleSection('warnings')} className="flex w-full items-center justify-between bg-[rgba(245,158,11,0.1)] px-4 py-3 transition hover:bg-[rgba(245,158,11,0.16)]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[var(--warning)]" />
                <span className="font-semibold text-[var(--warning)]">Warnings ({data.warnings.length})</span>
              </div>
              {expanded.warnings ? <ChevronUp className="h-4 w-4 text-[var(--warning)]" /> : <ChevronDown className="h-4 w-4 text-[var(--warning)]" />}
            </button>
            {expanded.warnings && (
              <div className="p-4">
                <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                  {data.warnings.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Math Summary */}
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[rgba(59,130,246,0.3)] bg-[var(--info-dim)]">
          <button onClick={() => toggleSection('math')} className="flex w-full items-center justify-between bg-[rgba(59,130,246,0.1)] px-4 py-3 transition hover:bg-[rgba(59,130,246,0.16)]">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-[var(--info)]" />
              <span className="font-semibold text-[var(--info)]">Math Summary</span>
            </div>
            {expanded.math ? <ChevronUp className="h-4 w-4 text-[var(--info)]" /> : <ChevronDown className="h-4 w-4 text-[var(--info)]" />}
          </button>
          {expanded.math && (
            <div className="p-4 text-sm text-[var(--text-secondary)]">
              {data.math_summary}
            </div>
          )}
        </div>

        {/* Actions */}
        {data.actions?.length > 0 && (
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-[rgba(16,185,129,0.3)] bg-[var(--success-dim)]">
            <button onClick={() => toggleSection('actions')} className="flex w-full items-center justify-between bg-[rgba(16,185,129,0.1)] px-4 py-3 transition hover:bg-[rgba(16,185,129,0.16)]">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-[var(--success)]" />
                <span className="font-semibold text-[var(--success)]">Recommended Actions</span>
              </div>
              {expanded.actions ? <ChevronUp className="h-4 w-4 text-[var(--success)]" /> : <ChevronDown className="h-4 w-4 text-[var(--success)]" />}
            </button>
            {expanded.actions && (
              <div className="p-4">
                <div className="space-y-2">
                  {data.actions.map((item, i) => (
                    <label key={i} className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" className="mt-1 rounded border border-[rgba(16,185,129,0.35)] bg-[var(--bg-input)] text-[var(--success)] outline-none" />
                      <span className="text-sm text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)]">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Verdict */}
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-accent)] bg-[var(--accent-dim)]">
          <button onClick={() => toggleSection('verdict')} className="flex w-full items-center justify-between bg-[rgba(99,102,241,0.12)] px-4 py-3 transition hover:bg-[rgba(99,102,241,0.2)]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--accent-bright)]" />
              <span className="font-semibold text-[var(--accent-bright)]">Final Verdict</span>
            </div>
            {expanded.verdict ? <ChevronUp className="h-4 w-4 text-[var(--accent-bright)]" /> : <ChevronDown className="h-4 w-4 text-[var(--accent-bright)]" />}
          </button>
          {expanded.verdict && (
            <div className="p-4">
              <p className="text-sm font-medium text-[var(--text-primary)]">{data.verdict}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
