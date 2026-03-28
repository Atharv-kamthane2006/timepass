import React from "react";
import { motion } from "framer-motion";
import { Database, Link2, ShieldCheck, MessageSquare, BarChart2, GitBranch } from "lucide-react";

const features = [
  {
    icon: Database,
    title: "Instant Schema Intelligence",
    desc: "Auto-detects tables, columns, primary keys, foreign keys, and data types from any uploaded file in under 5 seconds.",
    bg: "rgba(99,102,241,0.12)",
    color: "#818cf8", // indigo
  },
  {
    icon: Link2,
    title: "Implicit FK Detection",
    desc: "Discovers hidden relationships between tables that the schema never formally declared — using smart column name pattern matching.",
    bg: "rgba(16,185,129,0.12)",
    color: "#34d399", // emerald
  },
  {
    icon: ShieldCheck,
    title: "Data Quality Scoring",
    desc: "Scores every table 0-100 on completeness, freshness, and consistency. Flags nulls, orphan records, and stale date columns automatically.",
    bg: "rgba(245,158,11,0.12)",
    color: "#fbbf24", // amber
  },
  {
    icon: MessageSquare,
    title: "Natural Language to SQL",
    desc: "Ask questions in plain English. phi3:mini generates accurate SQL, executes it, and explains the result — no SQL knowledge required.",
    bg: "rgba(239,68,68,0.12)",
    color: "#f87171", // red
  },
  {
    icon: BarChart2,
    title: "Mathematical Analysis",
    desc: "Full statistical profiling: mean, std, IQR, skewness, kurtosis, outlier detection, correlation matrix, and modelling readiness.",
    bg: "rgba(6,182,212,0.12)",
    color: "#22d3ee", // cyan
  },
  {
    icon: GitBranch,
    title: "Interactive 3D ER Graph",
    desc: "Explore your database as a live 3D force graph with quality heatmap mode, query flow highlighting, and click-through node detail overlays.",
    bg: "rgba(139,92,246,0.12)",
    color: "#a78bfa", // violet
  }
];

export default function FeaturesGrid() {
  return (
    <section id="features" className="py-24 px-6 max-w-[1100px] mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <span className="font-mono text-xs text-indigo-400 uppercase tracking-widest block mb-3">
          What SchemaSense Does
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Everything your data team needs
        </h2>
        <p className="text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
          More than just an ER diagram. SchemaSense combines deterministic profiling
          with local LLMs to understand the shape, context, and quality of your data.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-16">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group relative rounded-2xl p-7 transition-all duration-300 overflow-hidden"
            style={{
              background: "rgba(13,18,32,0.6)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(10px)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
              e.currentTarget.style.background = "rgba(13,18,32,0.9)";
              e.currentTarget.style.boxShadow = "0 0 0 1px rgba(99,102,241,0.1), 0 8px 32px rgba(0,0,0,0.4), 0 0 40px rgba(99,102,241,0.08)";
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
              e.currentTarget.style.background = "rgba(13,18,32,0.6)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {/* Top highlight bar */}
            <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
              style={{ background: f.bg }}
            >
              <f.icon size={22} color={f.color} />
            </div>

            <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
