import React from "react";
import { motion } from "framer-motion";
import { Database, BarChart2, MessageSquare, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="relative py-32 px-6 overflow-hidden">
      {/* Background Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)" }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 border-2 border-[#05060a] flex items-center justify-center -mr-3 z-30">
            <Database size={20} className="text-indigo-400" />
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border-2 border-[#05060a] flex items-center justify-center -mr-3 z-20">
            <BarChart2 size={20} className="text-emerald-400" />
          </div>
          <div className="w-12 h-12 rounded-full bg-cyan-500/10 border-2 border-[#05060a] flex items-center justify-center z-10">
            <MessageSquare size={20} className="text-cyan-400" />
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center">
          Ready to understand your data?
        </h2>
        
        <p className="text-slate-400 text-lg text-center mt-5 max-w-lg mx-auto leading-relaxed">
          Upload any database and get a complete AI-powered data dictionary
          in under 5 minutes. Free. Local. No credit card.
        </p>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/upload')}
          className="mt-10 px-10 py-4 rounded-xl font-semibold text-white bg-[#6366f1] text-lg transition-all duration-200 hover:bg-[#4f46e5] hover:-translate-y-0.5"
          style={{ boxShadow: "0 0 0 0 rgba(99,102,241,0)" }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = "0 0 0 1px rgba(99,102,241,0.5), 0 0 32px rgba(99,102,241,0.3), 0 0 64px rgba(99,102,241,0.1)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = "0 0 0 0 rgba(99,102,241,0)";
          }}
        >
          Start Exploring Your Data &rarr;
        </motion.button>

        <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span className="text-sm font-medium text-slate-400">No cloud required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span className="text-sm font-medium text-slate-400">No API cost</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span className="text-sm font-medium text-slate-400">Open source</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
