import Hero from '@/components/marketing/sections/Hero';
import { PingLearnFeaturesModern } from '@/components/marketing/sections/PingLearnFeaturesModern';
import StudentComparison from '@/components/marketing/sections/StudentComparison';
import HowItWorks from '@/components/marketing/sections/HowItWorks';
import ContactRedesigned from '@/components/marketing/sections/ContactRedesigned';
import Footer from '@/components/marketing/sections/Footer';

export default function MarketingHome() {
  return (
    <div className="relative">
      <Hero />
      <PingLearnFeaturesModern />
      <StudentComparison />
      <HowItWorks />
      <ContactRedesigned />
      <Footer />

      {/* Future sections to be added */}
      {/* <Curriculum />
      <Testimonials />
      <Comparison />
      <FAQ /> */}
    </div>
  );
}