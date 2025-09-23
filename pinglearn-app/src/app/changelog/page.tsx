"use client";

import React from "react";
import { Timeline } from "@/components/ui/timeline";
import Navigation from "@/components/marketing/sections/Navigation";
import Footer from "@/components/marketing/sections/Footer";
import { CheckCircle, Rocket, Code, Users, Brain, Shield } from "lucide-react";

export default function ChangelogPage() {
  const data = [
    {
      title: "Jan 2025",
      content: (
        <div>
          <p className="text-white font-semibold text-sm md:text-base mb-8">
            🚀 PingLearn v2.0 - Major Platform Overhaul
          </p>
          <div className="mb-8">
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm mb-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              Redesigned UI with glassmorphism effects
            </div>
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm mb-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              Integrated Gemini Live API for enhanced learning
            </div>
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm mb-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              Real-time streaming display improvements
            </div>
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm mb-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              Protected core architecture implementation
            </div>
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              Performance improvements: 400ms response time
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <Rocket className="w-5 h-5 text-cyan-400" />
              <span className="text-white font-medium">Key Achievement</span>
            </div>
            <p className="text-white/60 text-sm">
              Successfully reduced latency by 60% through WebSocket optimization
              and smart caching strategies.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Dec 2024",
      content: (
        <div>
          <p className="text-white font-semibold text-sm md:text-base mb-8">
            🎄 Holiday Update - Voice Recognition Enhancements
          </p>
          <div className="mb-8">
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm mb-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              LiveKit voice agent integration
            </div>
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm mb-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              Multi-language support (10 languages)
            </div>
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm mb-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              Improved math equation recognition
            </div>
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              KaTeX rendering optimization
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
              <Code className="w-8 h-8 text-cyan-400 mb-2" />
              <p className="text-white/80 text-sm font-medium">15k+</p>
              <p className="text-white/60 text-xs">Lines of Code</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
              <Users className="w-8 h-8 text-cyan-400 mb-2" />
              <p className="text-white/80 text-sm font-medium">5,000+</p>
              <p className="text-white/60 text-xs">Beta Users</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Nov 2024",
      content: (
        <div>
          <p className="text-white font-semibold text-sm md:text-base mb-8">
            📚 CBSE Curriculum Integration
          </p>
          <div className="mb-8">
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm mb-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              Complete Grade 10 Mathematics syllabus
            </div>
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm mb-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              NCERT textbook integration
            </div>
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm mb-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              Chapter-wise progress tracking
            </div>
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm mb-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              500+ practice problems added
            </div>
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              Exam preparation mode launched
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Oct 2024",
      content: (
        <div>
          <p className="text-white font-semibold text-sm md:text-base mb-8">
            🏗️ Foundation & Architecture
          </p>
          <div className="mb-8">
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm mb-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              Next.js 15 migration completed
            </div>
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm mb-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              Supabase integration for auth & database
            </div>
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm mb-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              TypeScript strict mode enabled
            </div>
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              Initial MVP with basic chat functionality
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <Brain className="w-5 h-5 text-cyan-400" />
              <span className="text-white font-medium">Innovation</span>
            </div>
            <p className="text-white/60 text-sm">
              Pioneered the SHOW-then-TELL approach: mathematical concepts appear
              400ms before voice explanation for optimal comprehension.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Sep 2024",
      content: (
        <div>
          <p className="text-white font-semibold text-sm md:text-base mb-8">
            💡 Project Inception
          </p>
          <div className="mb-8">
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm mb-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              PingLearn concept ideation
            </div>
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm mb-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              Market research & competitor analysis
            </div>
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm mb-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              Initial wireframes and prototypes
            </div>
            <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              Technology stack finalized
            </div>
          </div>
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span className="text-white font-medium">Our Promise</span>
            </div>
            <p className="text-white/60 text-sm">
              Building a safe, COPPA-compliant learning platform that puts
              student privacy and educational outcomes first.
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-black">
        <div className="pt-32">
          <Timeline data={data} />
        </div>
      </div>
      <Footer />
    </>
  );
}