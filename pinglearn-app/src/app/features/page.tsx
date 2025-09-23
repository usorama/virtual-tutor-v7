"use client";

import Navigation from "@/components/marketing/sections/Navigation";
import Features from "@/components/marketing/sections/Features";
import Footer from "@/components/marketing/sections/Footer";
import { motion } from "framer-motion";

export default function FeaturesPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-black pt-32">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <p className="text-cyan-400/60 text-sm tracking-[0.3em] uppercase font-medium mb-4">
              Platform Capabilities
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Features That Make Learning
              <span className="text-gradient bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> Magical</span>
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Discover how our AI-powered platform transforms education with cutting-edge technology
              and personalized learning experiences.
            </p>
          </motion.div>
        </div>

        {/* Features Section */}
        <Features />

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto px-4 py-20"
        >
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Experience These Features?
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already learning with our advanced AI platform.
            </p>
            <a
              href="/register"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 shadow-[0_4px_20px_rgba(6,182,212,0.5)]"
            >
              Start Your Free Trial
            </a>
          </div>
        </motion.div>
      </div>
      <Footer />
    </>
  );
}