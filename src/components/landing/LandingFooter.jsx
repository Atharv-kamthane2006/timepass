import React from "react";

export default function LandingFooter() {
  return (
    <footer className="w-full border-t border-white/5 pt-16 pb-8 px-6 mt-10">
      <div className="max-w-[1100px] mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between gap-12 md:gap-0">
          {/* Left Block */}
          <div className="flex flex-col items-start">
            <div className="flex items-center">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <polygon
                  points="12,2 20,7 20,17 12,22 4,17 4,7"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="1.5"
                />
                <polygon
                  points="12,6 17,9 17,15 12,18 7,15 7,9"
                  fill="#6366f133"
                />
              </svg>
              <span className="ml-2 text-base font-semibold text-white">SchemaSense</span>
              <span className="ml-1 text-base font-semibold text-indigo-400 italic">AI</span>
            </div>
            <p className="text-sm text-slate-500 mt-4 max-w-sm leading-relaxed">
              Built for VIT Code Apex 2.0<br/>
              Track 2: AI Agents<br/>
              Problem Statement 2.1 — Data Dictionary Agent
            </p>
          </div>

          {/* Right Block */}
          <div className="flex gap-16">
            <div className="flex flex-col gap-3">
              <h4 className="text-white font-semibold text-sm mb-1">Team</h4>
              <span className="text-sm text-slate-400">Team Member 1 — Backend/AI</span>
              <span className="text-sm text-slate-400">Team Member 2 — Frontend/UI</span>
              <span className="text-sm text-slate-400">Team Member 3 — 3D/Demo</span>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="text-white font-semibold text-sm mb-1">Built With</h4>
              <span className="text-sm text-slate-400 font-mono">phi3:mini · Ollama</span>
              <span className="text-sm text-slate-400 font-mono">FastAPI · SQLite</span>
              <span className="text-sm text-slate-400 font-mono">React · Three.js</span>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-xs text-slate-600">
            &copy; 2026 SchemaSense AI · VIT Code Apex 2.0
          </span>
          <span className="text-xs text-slate-600">
            Made with <span className="text-red-500">&hearts;</span> in 24 hours
          </span>
        </div>

      </div>
    </footer>
  );
}
