import React from "react";
import { Cpu, Server, Zap, Code, Database, Layers, Box, Globe } from "lucide-react";

const stack = [
  { name: "phi3:mini", icon: Cpu },
  { name: "Ollama", icon: Server },
  { name: "FastAPI", icon: Zap },
  { name: "React 18", icon: Code },
  { name: "SQLite", icon: Database },
  { name: "sentence-transformers", icon: Layers },
  { name: "Three.js", icon: Box },
  { name: "Vercel + ngrok", icon: Globe },
];

export default function TechStrip() {
  return (
    <section id="tech-stack" className="py-16 w-full overflow-hidden border-y border-white/5" style={{ background: "rgba(13,18,32,0.5)" }}>
      <div className="text-center mb-8">
        <span className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest font-semibold">
          Built on Modern Primitives
        </span>
      </div>

      <div className="relative flex w-full group">
        <style dangerouslySetInlineStyle={{__html: `
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            display: flex;
            width: 200%;
            animation: marquee 25s linear infinite;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}} />

        <div className="animate-marquee gap-6 px-3">
          {/* Double the array for infinite smooth scrolling */}
          {[...stack, ...stack].map((Tech, i) => (
            <div 
              key={i}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-default"
            >
              <Tech.icon size={16} className="text-slate-400" />
              <span className="font-mono text-sm font-medium text-slate-400 whitespace-nowrap">
                {Tech.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
