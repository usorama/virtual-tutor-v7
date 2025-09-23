"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Brain, Clock, Heart, Trophy } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "100% Adaptive",
    description: "PingLearn adapts to each student's unique learning style, pace, and preferences in real-time.",
    highlight: "Personalized for every child"
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description: "COPPA compliant with enterprise-grade security. Your child's data and privacy are our top priority.",
    highlight: "Bank-level encryption"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "400ms response time with instant math rendering. No waiting, no lag, just seamless learning.",
    highlight: "Real-time interactions"
  },
  {
    icon: Clock,
    title: "Always Available",
    description: "Learn at 3 PM or 3 AM. PingLearn is ready whenever your child is inspired to learn.",
    highlight: "24/7 availability"
  },
  {
    icon: Heart,
    title: "Infinitely Patient",
    description: "Never frustrated, always encouraging. Every question is welcomed, every mistake is a learning opportunity.",
    highlight: "Emotional support"
  },
  {
    icon: Trophy,
    title: "Proven Results",
    description: "92% grade improvement average. Students gain confidence and excel beyond their expectations.",
    highlight: "Measurable success"
  }
];

export default function ProblemSolutionRedesigned() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-black" id="problem-solution">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-cyan-400/60 text-sm tracking-[0.3em] uppercase font-medium mb-4">
            Complete Learning Solution
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            PingLearn Solves
            <span className="text-gradient bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> Everything</span>
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            One platform that addresses every challenge in your child's educational journey
            with innovative technology and empathetic teaching.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 h-full hover:border-cyan-500/30 transition-all duration-300">
                {/* Icon */}
                <div className="mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-cyan-400" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-white/70 mb-4">
                  {feature.description}
                </p>
                <p className="text-cyan-400 text-sm font-medium">
                  {feature.highlight}
                </p>

                {/* Hover Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-6 py-3">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400 font-medium">
              Join 50,000+ students already excelling with PingLearn
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}