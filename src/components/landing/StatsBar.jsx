import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

function AnimatedNumber({ value, prefix = "", suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = parseInt(value.replace(/,/g, ''), 10);
    // If it's a string that doesn't parse to an int (like "Zero" or "phi3:mini"), logic differs.
    if (isNaN(end)) return;

    const duration = 1500;
    const startTime = performance.now();

    const animateNumber = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutExpo
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      setCount(Math.floor(easeProgress * end));

      if (progress < 1) {
        requestAnimationFrame(animateNumber);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animateNumber);
  }, [isInView, value]);

  const isNumeric = !isNaN(parseInt(value.replace(/,/g, ''), 10));

  return (
    <span ref={ref} className="text-2xl font-bold font-mono text-indigo-400">
      {prefix}
      {isNumeric ? count.toLocaleString() : value}
      {suffix}
    </span>
  );
}

export default function StatsBar() {
  return (
    <div className="relative w-full overflow-hidden border-y border-white/5" style={{ background: "rgba(13,18,32,0.8)", backdropFilter: "blur(8px)" }}>
      {/* Shimmer overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-50"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.05) 50%, transparent 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 3s ease infinite"
        }}
      />
      <style dangerouslySetInlineStyle={{__html: `
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}} />

      <div className="relative z-10 max-w-6xl mx-auto py-6 px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-white/10">
          
          <div className="flex flex-col items-center py-2 md:py-0 text-center">
            <AnimatedNumber value="9" />
            <span className="text-xs text-slate-500 mt-1">Tables analyzed in &lt; 5s</span>
          </div>

          <div className="flex flex-col items-center py-2 md:py-0 text-center">
            <AnimatedNumber value="100" suffix="K+" />
            <span className="text-xs text-slate-500 mt-1">Rows processed</span>
          </div>

          <div className="flex flex-col items-center py-2 md:py-0 text-center">
            <AnimatedNumber value="Zero" />
            <span className="text-xs text-slate-500 mt-1">API cost — fully local</span>
          </div>

          <div className="flex flex-col items-center py-2 md:py-0 text-center">
            <AnimatedNumber value="phi3:mini" />
            <span className="text-xs text-slate-500 mt-1">3.8B params on 4GB VRAM</span>
          </div>

        </div>
      </div>
    </div>
  );
}
