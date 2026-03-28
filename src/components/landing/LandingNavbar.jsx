import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function LandingNavbar() {
  const navigate = useNavigate();

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav 
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 h-[60px] z-50 px-6 flex items-center justify-between"
      style={{
        background: "rgba(5, 6, 10, 0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
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

      <div className="hidden lg:flex items-center gap-6">
        <button onClick={() => scrollTo("features")} className="text-sm text-slate-400 hover:text-white transition-colors">Features</button>
        <button onClick={() => scrollTo("how-it-works")} className="text-sm text-slate-400 hover:text-white transition-colors">How It Works</button>
        <button onClick={() => scrollTo("tech-stack")} className="text-sm text-slate-400 hover:text-white transition-colors">Tech Stack</button>
        <button onClick={() => scrollTo("demo")} className="text-sm text-slate-400 hover:text-white transition-colors">Demo</button>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/upload')}
          className="bg-indigo-500 hover:brightness-110 text-white text-sm font-medium px-4 py-2 rounded-lg transition-transform hover:-translate-y-[1px]"
        >
          Launch App &rarr;
        </button>
      </div>
    </motion.nav>
  );
}
