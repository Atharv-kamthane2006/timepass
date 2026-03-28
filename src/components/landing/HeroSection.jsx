import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Github } from "lucide-react";
import ParticleNetwork from "../effects/ParticleNetwork";

export default function HeroSection() {
  const navigate = useNavigate();

  const titleWords1 = "Connect any database.".split(" ");
  const titleWords2 = "Get intelligence".split(" ");
  const titleWords3 = "instantly.".split(" ");

  const wordAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <section className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center pt-24 text-center">
      {/* Background Layers */}
      <ParticleNetwork particleCount={80} maxDistance={130} />

      {/* Blob 1 */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          top: "10%", left: "15%",
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
          animation: "float1 8s ease-in-out infinite",
        }}
      />
      {/* Blob 2 */}
      <div 
        className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          top: "30%", right: "10%",
          background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "float2 10s ease-in-out infinite 2s",
        }}
      />

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`,
          backgroundSize: "48px 48px"
        }}
      />

      {/* CSS Keyframes injected here for ease */}
      <style dangerouslySetInlineStyle={{__html: `
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%      { transform: translate(30px, -20px) scale(1.05); }
          66%      { transform: translate(-20px, 15px) scale(0.97); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(-25px, 20px) scale(1.08); }
        }
        @keyframes greenPulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 max-w-4xl">
        <motion.h1 
          className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-white mb-6"
          initial="initial"
          animate="animate"
          transition={{ staggerChildren: 0.06, delayChildren: 0.3 }}
        >
          <div className="block">
            {titleWords1.map((w, i) => <motion.span key={i} variants={wordAnimation} transition={{duration: 0.6, ease:[0.16,1,0.3,1]}} className="inline-block mr-3">{w}</motion.span>)}
          </div>
          <div className="block mt-1">
            {titleWords2.map((w, i) => <motion.span key={i} variants={wordAnimation} transition={{duration: 0.6, ease:[0.16,1,0.3,1]}} className="inline-block mr-3">{w}</motion.span>)}
          </div>
          <div className="block mt-1">
            <motion.span variants={wordAnimation} transition={{duration: 0.6, ease:[0.16,1,0.3,1]}}
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #06b6d4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                display: "inline-block"
              }}
            >
              instantly.
            </motion.span>
          </div>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed"
        >
          An AI-powered data dictionary agent that automatically understands your schema,
          detects hidden relationships, scores data quality, and lets anyone query data
          in plain English — running fully local with zero API cost.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-10"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/upload')}
            className="px-8 py-3.5 rounded-xl font-semibold text-white bg-[#6366f1] transition-all duration-200 hover:bg-[#4f46e5] hover:-translate-y-0.5"
            style={{
              boxShadow: "0 0 0 0 rgba(99,102,241,0)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 1px rgba(99,102,241,0.5), 0 0 32px rgba(99,102,241,0.3), 0 0 64px rgba(99,102,241,0.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 0 rgba(99,102,241,0)";
            }}
          >
            Launch SchemaSense &rarr;
          </motion.button>
          
          <button className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all">
            <Github className="w-4 h-4" />
            View on GitHub
          </button>
        </motion.div>
      </div>

      <motion.div 
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="absolute bottom-8 flex flex-col items-center z-10"
      >
        <ChevronDown className="w-5 h-5 text-slate-500 mb-1" />
        <span className="text-xs text-slate-600">Scroll to explore</span>
      </motion.div>
    </section>
  );
}
