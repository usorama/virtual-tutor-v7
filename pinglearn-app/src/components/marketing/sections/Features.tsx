"use client";

import { motion } from "framer-motion";
import { Mic, Calculator, Brain, BarChart3, Clock, Target, MessageCircle, Sparkles } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Natural Voice Conversations",
    description: "Talk to PingLearn just like you would with a human teacher. Ask questions, explain your thinking, and get instant responses.",
    benefits: ["Natural speech recognition", "Multi-language support", "Emotional tone detection"],
    demoType: "voice",
    gradient: "from-blue-500 to-cyan-500",
    demoContent: "\"Hey PingLearn, can you help me solve this quadratic equation?\" → \"Of course! Let's work through it step by step...\""
  },
  {
    icon: Calculator,
    title: "Instant Math Rendering",
    description: "See beautiful mathematical equations appear in real-time as you speak or type. Complex formulas are rendered perfectly.",
    benefits: ["LaTeX equation support", "Interactive graphs", "Step-by-step solutions"],
    demoType: "math",
    gradient: "from-cyan-500 to-blue-500",
    demoContent: "x² + 5x + 6 = 0"
  },
  {
    icon: Brain,
    title: "Adaptive AI Learning",
    description: "Our AI analyzes your learning patterns and automatically adjusts difficulty, pace, and teaching style to match your needs.",
    benefits: ["Real-time difficulty adjustment", "Learning style detection", "Personalized pathways"],
    demoType: "adaptive",
    gradient: "from-blue-500 to-cyan-500",
    demoContent: "AI detected: Student prefers visual explanations → Switching to diagram-based teaching"
  },
  {
    icon: BarChart3,
    title: "Comprehensive Progress Tracking",
    description: "Parents and students can monitor learning progress with detailed analytics, skill assessments, and achievement tracking.",
    benefits: ["Real-time progress updates", "Skill mastery tracking", "Parent dashboard"],
    demoType: "progress",
    gradient: "from-cyan-500 to-blue-500",
    demoContent: "Math Grade: 85% → 94% (↑9% this month)"
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Learn whenever inspiration strikes. PingLearn is always ready to help, whether it's 6 AM or midnight.",
    benefits: ["Always available", "No scheduling conflicts", "Instant help"],
    demoType: "availability",
    gradient: "from-blue-500 to-cyan-500",
    demoContent: "Available now: 24/7 • Last session: 11:30 PM • Next available: Anytime"
  },
  {
    icon: Target,
    title: "Exam Preparation Mode",
    description: "Specialized modes for CBSE boards, JEE, NEET, and other competitive exams with targeted practice and mock tests.",
    benefits: ["Board exam focus", "Competition prep", "Mock test practice"],
    demoType: "exam",
    gradient: "from-cyan-500 to-blue-500",
    demoContent: "CBSE Class 10 Board Prep • 45 days remaining • 89% syllabus covered"
  }
];

const FeatureDemo = ({ feature }: { feature: typeof features[0] }) => {
  return (
    <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-4 font-mono text-sm">
      {feature.demoType === "voice" && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-cyan-400">Listening...</span>
          </div>
          <div className="text-white/80">{feature.demoContent}</div>
        </div>
      )}

      {feature.demoType === "math" && (
        <div className="text-center py-8">
          <div className="text-2xl text-white mb-4">
            x² + 5x + 6 = 0
          </div>
          <div className="text-cyan-400 text-sm">
            Factors: (x + 2)(x + 3) = 0
          </div>
          <div className="text-cyan-400 text-sm mt-2">
            Solutions: x = -2, x = -3
          </div>
        </div>
      )}

      {feature.demoType === "adaptive" && (
        <div className="space-y-2">
          <div className="text-cyan-400">🧠 AI Analysis</div>
          <div className="text-white/80 text-xs">{feature.demoContent}</div>
          <div className="flex space-x-2 mt-2">
            <div className="h-2 bg-cyan-500 rounded flex-1" />
            <div className="h-2 bg-cyan-500 rounded flex-1" />
            <div className="h-2 bg-cyan-300 rounded flex-1" />
            <div className="h-2 bg-gray-600 rounded flex-1" />
          </div>
        </div>
      )}

      {feature.demoType === "progress" && (
        <div className="space-y-3">
          <div className="text-cyan-400 font-semibold">{feature.demoContent}</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-cyan-400 font-bold">47</div>
              <div className="text-white/60">Problems Solved</div>
            </div>
            <div className="text-center">
              <div className="text-cyan-400 font-bold">12h</div>
              <div className="text-white/60">Study Time</div>
            </div>
            <div className="text-center">
              <div className="text-blue-400 font-bold">8</div>
              <div className="text-white/60">Streak Days</div>
            </div>
          </div>
        </div>
      )}

      {feature.demoType === "availability" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-cyan-400">● Online</span>
            <span className="text-white/60 text-xs">Always Ready</span>
          </div>
          <div className="text-white/80 text-xs">{feature.demoContent}</div>
        </div>
      )}

      {feature.demoType === "exam" && (
        <div className="space-y-2">
          <div className="text-cyan-400 font-semibold text-xs">{feature.demoContent}</div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-cyan-400 to-blue-400 h-2 rounded-full" style={{ width: '89%' }} />
          </div>
          <div className="text-white/60 text-xs">Next: Trigonometry Practice</div>
        </div>
      )}
    </div>
  );
};

export default function Features() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-black" id="features">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Learning Reimagined with
            <span className="text-gradient bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> AI Technology</span>
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Experience the future of education with features designed to make learning engaging, effective, and enjoyable.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="space-y-20">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`grid lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Content */}
              <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} p-3`}>
                    <feature.icon className="w-full h-full text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white">{feature.title}</h3>
                </div>

                <p className="text-xl text-white/80 mb-8 leading-relaxed">
                  {feature.description}
                </p>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white/90 mb-3">Key Benefits:</h4>
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center space-x-3">
                        <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                        <span className="text-white/80">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Demo */}
              <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                <div className="relative">
                  {/* Glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-20 blur-3xl rounded-2xl`} />

                  {/* Demo container */}
                  <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full" />
                        <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                        <div className="w-3 h-3 bg-green-400 rounded-full" />
                      </div>
                      <div className="text-white/40 text-sm">PingLearn</div>
                    </div>

                    <FeatureDemo feature={feature} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-8">
            <h3 className="text-3xl font-bold mb-4">Ready to Experience PingLearn?</h3>
            <p className="text-white/70 mb-6 text-lg">
              Start your free trial today and see the difference personalized AI learning can make.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300"
            >
              Start Free Trial Now
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}