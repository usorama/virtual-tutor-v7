"use client";

import { motion } from "framer-motion";
import {
  X,
  Check,
  TrendingDown,
  TrendingUp,
  Frown,
  Smile,
  AlertCircle,
  Trophy,
  BookX,
  BookOpen,
  Clock,
  Zap
} from "lucide-react";

export default function StudentComparison() {
  const beforeTraits = [
    { icon: Frown, text: "Struggling with math concepts", color: "text-red-400" },
    { icon: AlertCircle, text: "Grades dropping consistently", color: "text-red-400" },
    { icon: BookX, text: "Avoiding homework", color: "text-red-400" },
    { icon: Clock, text: "Hours of frustration daily", color: "text-red-400" },
    { icon: TrendingDown, text: "Losing confidence", color: "text-red-400" },
  ];

  const afterTraits = [
    { icon: Smile, text: "Mastering complex problems", color: "text-cyan-400" },
    { icon: Trophy, text: "92% grade improvement", color: "text-cyan-400" },
    { icon: BookOpen, text: "Excited about learning", color: "text-cyan-400" },
    { icon: Zap, text: "Quick problem solving", color: "text-cyan-400" },
    { icon: TrendingUp, text: "Building real confidence", color: "text-cyan-400" },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900" id="transformation">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-cyan-400/60 text-sm tracking-[0.3em] uppercase font-medium mb-4">
            Real Impact
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            The PingLearn
            <span className="text-gradient bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> Difference</span>
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            See how students transform from struggling to thriving with personalized AI support
          </p>
        </motion.div>

        {/* Comparison Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Before Card */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-red-900/20 to-red-950/10 border border-red-500/20 rounded-2xl p-8 h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-red-400 font-medium text-sm uppercase tracking-wider mb-2">Before PingLearn</p>
                    <h3 className="text-2xl font-bold text-white">Traditional Learning</h3>
                  </div>
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                    <X className="w-8 h-8 text-red-400" />
                  </div>
                </div>

                {/* Traits */}
                <div className="space-y-4">
                  {beforeTraits.map((trait, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center space-x-3"
                    >
                      <trait.icon className={`w-5 h-5 ${trait.color}`} />
                      <span className="text-white/80">{trait.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Student Avatar & Stats */}
                <div className="mt-8 pt-8 border-t border-red-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                        <Frown className="w-6 h-6 text-red-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Average Student</p>
                        <p className="text-red-400 text-sm">Grade: C-</p>
                      </div>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-400" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* After Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-3xl rounded-2xl" />

              <div className="relative bg-gradient-to-br from-cyan-900/20 to-blue-950/10 border border-cyan-500/30 rounded-2xl p-8 h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-cyan-400 font-medium text-sm uppercase tracking-wider mb-2">After PingLearn</p>
                    <h3 className="text-2xl font-bold text-white">AI-Powered Success</h3>
                  </div>
                  <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-cyan-400" />
                  </div>
                </div>

                {/* Traits */}
                <div className="space-y-4">
                  {afterTraits.map((trait, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center space-x-3"
                    >
                      <trait.icon className={`w-5 h-5 ${trait.color}`} />
                      <span className="text-white/80">{trait.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Student Avatar & Stats */}
                <div className="mt-8 pt-8 border-t border-cyan-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
                        <Smile className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">PingLearn Student</p>
                        <p className="text-cyan-400 text-sm">Grade: A+</p>
                      </div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-cyan-400" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Center Arrow/Divider for Desktop */}
          <div className="hidden md:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full p-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-12 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-6"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-cyan-400">92%</p>
                <p className="text-white/60 text-sm">Grade Improvement</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-cyan-400">3x</p>
                <p className="text-white/60 text-sm">Faster Learning</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-cyan-400">50k+</p>
                <p className="text-white/60 text-sm">Happy Students</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-cyan-400">4.9★</p>
                <p className="text-white/60 text-sm">Parent Rating</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}