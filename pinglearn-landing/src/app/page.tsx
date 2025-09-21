"use client";

import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import ComingSoon from "@/components/sections/ComingSoon";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <ComingSoon />
      <Footer />
    </main>
  );
}
