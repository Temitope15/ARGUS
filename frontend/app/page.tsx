import { Nav } from "@/components/landing/Nav";
import { HeroSection } from "@/components/landing/HeroSection";
import { SocialProofBar } from "@/components/landing/SocialProofBar";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ContagionSection } from "@/components/landing/ContagionSection";
import { LivePreviewSection } from "@/components/landing/LivePreviewSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";

export default function Home() {
  return (
    <main className="min-h-screen bg-void">
      <Nav />
      <HeroSection />
      <SocialProofBar />
      <div id="solution">
        <SolutionSection />
      </div>
      <ProblemSection />
      <HowItWorksSection />
      <ContagionSection />
      <LivePreviewSection />
      <FinalCTASection />
    </main>
  );
}
