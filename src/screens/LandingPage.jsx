import React, { useEffect } from "react";
import LandingNavbar from "../components/landing/LandingNavbar";
import HeroSection from "../components/landing/HeroSection";
import StatsBar from "../components/landing/StatsBar";
import FeaturesGrid from "../components/landing/FeaturesGrid";
import HowItWorks from "../components/landing/HowItWorks";
import DemoPreview from "../components/landing/DemoPreview";
import TechStrip from "../components/landing/TechStrip";
import CTASection from "../components/landing/CTASection";
import LandingFooter from "../components/landing/LandingFooter";

export default function LandingPage() {
  useEffect(() => {
    // Ensuring background color covers everything unconditionally
    document.body.style.backgroundColor = "#05060a";
    return () => {
      document.body.style.backgroundColor = ""; // reset on unmount if needed
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#05060a] text-slate-200 selection:bg-indigo-500/30 font-sans overflow-x-hidden">
      <LandingNavbar />
      <HeroSection />
      <StatsBar />
      <FeaturesGrid />
      <HowItWorks />
      <DemoPreview />
      <TechStrip />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
