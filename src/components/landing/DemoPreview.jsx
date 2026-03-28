import React from "react";
import { motion } from "framer-motion";
import { Zap, Shield, Cpu, RotateCw, CheckCircle2, Sparkles } from "lucide-react";

export default function DemoPreview() {
  return (
    <section id="demo" className="py-24 px-6 max-w-[1000px] mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <span className="font-mono text-xs text-indigo-400 uppercase tracking-widest block mb-3">
          See It In Action
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">
          A real database. Real AI. Real results.
        </h2>
      </motion.div>

      <div className="relative mt-8">
        
        {/* Floating Annotations */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, delay: 0 }}
          className="absolute -top-6 md:-left-8 z-20 flex flex-col p-3 rounded-[10px] shadow-2xl"
          style={{ background: "rgba(13,18,32,0.95)", border: "1px solid rgba(99,102,241,0.35)", minWidth: "160px" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-indigo-400" />
            <span className="text-sm font-semibold text-white">Analyzed in 2.3s</span>
          </div>
          <span className="text-xs text-slate-400 pl-5">9 tables loaded</span>
        </motion.div>

        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3.5, delay: 1 }}
          className="hidden md:flex absolute -top-4 -right-8 z-20 flex-col p-3 rounded-[10px] shadow-2xl"
          style={{ background: "rgba(13,18,32,0.95)", border: "1px solid rgba(99,102,241,0.35)", minWidth: "160px" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Shield size={14} className="text-emerald-400" />
            <span className="text-sm font-semibold text-white">Health Score: 92/100</span>
          </div>
          <span className="text-xs text-slate-400 pl-5">3 issues detected</span>
        </motion.div>

        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 3.2, delay: 0.5 }}
          className="hidden md:flex absolute -bottom-6 -right-6 z-20 flex-col p-3 rounded-[10px] shadow-2xl"
          style={{ background: "rgba(13,18,32,0.95)", border: "1px solid rgba(99,102,241,0.35)", minWidth: "160px" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Cpu size={14} className="text-cyan-400" />
            <span className="text-sm font-semibold text-white">phi3:mini · Local</span>
          </div>
          <span className="text-xs text-slate-400 pl-5">Zero cloud cost</span>
        </motion.div>

        {/* Browser Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16,1,0.3,1] }}
          className="rounded-[16px] overflow-hidden"
          style={{
            background: "rgba(13,18,32,0.9)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 0 0 1px rgba(99,102,241,0.1), 0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(99,102,241,0.06)"
          }}
        >
          {/* Browser Chrome */}
          <div className="h-10 flex items-center justify-between px-4 border-b border-white/5 bg-white/5">
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
            </div>
            <div className="flex-1 flex justify-center px-4 max-w-[280px]">
              <div className="w-full bg-white/5 rounded-md px-3 py-1 flex items-center justify-center">
                <span className="font-mono text-[11px] text-slate-500 truncate">schemasense-ai.vercel.app/dictionary</span>
              </div>
            </div>
            <div className="w-2.5">
               {/* Right balancer */}
            </div>
          </div>

          {/* App UI Area */}
          <div className="flex flex-col md:flex-row h-[420px]">
            {/* Left Sidebar */}
            <div className="hidden md:flex w-[200px] border-r border-white/5 flex-col">
              <div className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase p-3 border-b border-white/5">
                Tables
              </div>
              <div className="flex-1 overflow-hidden p-2 space-y-1">
                
                <div className="relative bg-indigo-500/10 rounded-md p-2 pl-3 border-l-[3px] border-indigo-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm text-white font-medium">olist_orders</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">99,441 rows</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">92</span>
                  </div>
                </div>

                <div className="relative hover:bg-white/5 rounded-md p-2 pl-3 border-l-[3px] border-transparent cursor-pointer transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm text-slate-300 font-medium">olist_customers</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">99,441 rows</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">88</span>
                  </div>
                </div>

                <div className="relative hover:bg-white/5 rounded-md p-2 pl-3 border-l-[3px] border-transparent cursor-pointer transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm text-slate-300 font-medium">order_reviews</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">99,224 rows</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-[10px] font-mono">72</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-5 bg-[#080c14] overflow-hidden flex flex-col">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-white">olist_orders</h3>
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-slate-300 font-mono">99,441 rows</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">Health: 92</span>
              </div>

              {/* AI Summary */}
              <div className="mt-5 relative bg-[#111827] border border-white/10 border-l-[3px] border-l-indigo-500 rounded-lg p-4">
                <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] text-indigo-400 font-mono uppercase bg-indigo-500/10 px-1.5 py-0.5 rounded">
                  <Sparkles size={10} />
                  AI Generated
                </div>
                <p className="text-sm text-slate-400 leading-relaxed pr-16">
                  Records every customer purchase order in the Brazilian e-commerce platform, tracking status from purchase to delivery.
                </p>
              </div>

              {/* Mock Table */}
              <div className="mt-5 flex-1 overflow-hidden border border-white/5 rounded-lg bg-[#0d1220]">
                <div className="grid grid-cols-[1.5fr,1fr,2fr,0.5fr] gap-2 p-2 border-b border-white/5 bg-white/5 text-xs text-slate-500 font-medium">
                  <div>Column</div>
                  <div>Type</div>
                  <div>Description (AI)</div>
                  <div className="text-right">Null %</div>
                </div>
                
                <div className="grid grid-cols-[1.5fr,1fr,2fr,0.5fr] gap-2 p-2.5 border-b border-white/5 text-sm items-center">
                  <div className="font-mono text-slate-300">order_id</div>
                  <div><span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20">PK string</span></div>
                  <div className="text-slate-400 text-xs truncate">UUID primary key</div>
                  <div className="text-right font-mono text-xs text-slate-500">0%</div>
                </div>

                <div className="grid grid-cols-[1.5fr,1fr,2fr,0.5fr] gap-2 p-2.5 border-b border-white/5 text-sm items-center">
                  <div className="font-mono text-slate-300">customer_id</div>
                  <div><span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded border border-purple-500/20">FK string</span></div>
                  <div className="text-slate-400 text-xs truncate">Links to customer</div>
                  <div className="text-right font-mono text-xs text-slate-500">0%</div>
                </div>

                <div className="grid grid-cols-[1.5fr,1fr,2fr,0.5fr] gap-2 p-2.5 border-b border-white/5 text-sm items-center">
                  <div className="font-mono text-slate-300">order_status</div>
                  <div><span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">category</span></div>
                  <div className="text-slate-400 text-xs truncate">Current status (7 vals)</div>
                  <div className="text-right font-mono text-xs text-slate-500">0%</div>
                </div>

                <div className="grid grid-cols-[1.5fr,1fr,2fr,0.5fr] gap-2 p-2.5 border-b border-white/5 text-sm items-center">
                  <div className="font-mono text-slate-300">order_date</div>
                  <div><span className="text-[10px] px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded border border-cyan-500/20">datetime</span></div>
                  <div className="text-slate-400 text-xs truncate">Purchase timestamp</div>
                  <div className="text-right font-mono text-xs text-slate-500">0%</div>
                </div>

              </div>
            </div>

            {/* Right Sidebar */}
            <div className="hidden lg:flex w-[240px] border-l border-white/5 flex-col p-4 bg-[#0d1220]">
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex h-1.5 w-1.5">
                  <div className="absolute h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
                  <div className="relative h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
                </div>
                <h4 className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">AI Reasoning</h4>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-slate-300 leading-tight">Scanning schema metadata & structure</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-slate-300 leading-tight">Profiling columns & detecting FKs</span>
                </div>
                <div className="flex gap-2">
                  <RotateCw size={14} className="text-indigo-400 animate-spin mt-0.5 shrink-0" />
                  <span className="text-xs text-indigo-300 font-medium leading-tight">Generating context with phi3:mini...</span>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
