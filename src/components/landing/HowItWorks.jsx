import React from "react";
import { motion } from "framer-motion";

const steps = [
  {
    num: "1",
    title: "Upload Your Data",
    desc: "Drop any CSV, SQLite database, or ZIP of CSVs. SchemaSense instantly parses the schema, detects column types, and loads everything into memory.",
    badge: "< 5 seconds"
  },
  {
    num: "2",
    title: "AI Analyzes Everything",
    desc: "phi3:mini running locally generates business summaries, column descriptions, quality scores, and detects implicit relationships — zero cloud, zero cost.",
    badge: "phi3:mini local"
  },
  {
    num: "3",
    title: "Query and Explore",
    desc: "Ask questions in plain English, explore the 3D ER graph, download quality reports, and modify your schema — all from one interface.",
    badge: "instant results"
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 max-w-[900px] mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <span className="font-mono text-xs text-indigo-400 uppercase tracking-widest block mb-3">
          Three Steps
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          From upload to insight in minutes
        </h2>
      </motion.div>

      <div className="relative mt-16 flex flex-col md:flex-row gap-10 md:gap-4">
        {/* Desktop dashed line connecting steps */}
        <div className="hidden md:block absolute top-8 left-[10%] right-[10%] border-t-2 border-dashed border-indigo-500/20 z-0" />
        
        {steps.map((step, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.2 }}
            className="flex-1 flex flex-col items-center text-center relative z-10"
          >
            {/* Pulsing Circle */}
            <motion.div 
              whileInView={{ boxShadow: ["0 0 0 0px rgba(99,102,241,0.4)", "0 0 0 16px rgba(99,102,241,0)"] }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: i * 0.2 + 0.3 }}
              className="w-16 h-16 rounded-full flex items-center justify-center bg-indigo-500/10 border-2 border-indigo-500/30 text-2xl font-mono font-bold text-indigo-400 mb-6"
            >
              {step.num}
            </motion.div>

            <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
            <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed mb-4">
              {step.desc}
            </p>
            <span className="px-3 py-1 font-mono text-[11px] text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              {step.badge}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
