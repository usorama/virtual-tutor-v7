import Hero from '@/components/marketing/sections/Hero';
import ProblemSolution from '@/components/marketing/sections/ProblemSolution';
import Features from '@/components/marketing/sections/Features';
import HowItWorks from '@/components/marketing/sections/HowItWorks';
import Pricing from '@/components/marketing/sections/Pricing';
import Contact from '@/components/marketing/sections/Contact';
import Footer from '@/components/marketing/sections/Footer';

export default function MarketingHome() {
  return (
    <div className="relative">
      <Hero />
      <ProblemSolution />
      <Features />
      <HowItWorks />
      <Pricing />
      <Contact />
      <Footer />

      {/* Future sections to be added */}
      {/* <Curriculum />
      <Testimonials />
      <Comparison />
      <FAQ /> */}
    </div>
  );
}