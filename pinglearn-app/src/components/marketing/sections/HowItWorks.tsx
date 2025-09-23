"use client";

import { motion } from "framer-motion";
import { UserPlus, Settings, BookOpen, TrendingUp, ArrowRight } from "lucide-react";
import ConicGradientButton from "../ui/ConicGradientButton";

const steps = [
  {
    number: "1",
    icon: UserPlus,
    title: "Sign Up in 30 Seconds",
    description: "Create your account with email or Google. No credit card required for the free trial.",
    details: [
      "Quick email verification",
      "Google sign-in option",
      "Instant access to platform"
    ],
    color: "from-blue-500 to-cyan-500"
  },
  {
    number: "2",
    icon: Settings,
    title: "Tell Us About Your Goals",
    description: "Share your grade level, subjects of interest, and learning preferences with our smart onboarding.",
    details: [
      "Grade level selection (9-12)",
      "Subject preferences",
      "Learning style assessment"
    ],
    color: "from-purple-500 to-pink-500"
  },
  {
    number: "3",
    icon: BookOpen,
    title: "Start Learning Instantly",
    description: "Begin with a friendly conversation with PingLearn. Ask questions, solve problems, and learn at your pace.",
    details: [
      "Voice or text interaction",
      "Instant math rendering",
      "Personalized difficulty"
    ],
    color: "from-green-500 to-teal-500"
  },
  {
    number: "4",
    icon: TrendingUp,
    title: "Track & Celebrate Progress",
    description: "Watch your confidence and grades improve with detailed analytics and achievement tracking.",
    details: [
      "Real-time progress updates",
      "Parent dashboard access",
      "Achievement badges & rewards"
    ],
    color: "from-orange-500 to-red-500"
  }
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900" id="how-it-works">
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
            Get Started in
            <span className="text-gradient bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> 4 Simple Steps</span>
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            From signup to success, we've made it incredibly easy to start your AI-powered learning journey.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-12 lg:space-y-0">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Desktop Layout */}
              <div className="hidden lg:block">
                <div className={`grid grid-cols-12 gap-8 items-center ${
                  index % 2 === 1 ? 'flex-row-reverse' : ''
                }`}>
                  {/* Content */}
                  <div className={`col-span-5 ${index % 2 === 1 ? 'col-start-8' : ''}`}>
                    <div className="flex items-center space-x-4 mb-6">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} p-3 flex items-center justify-center`}>
                        <step.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-6xl font-bold text-white/10">{step.number}</div>
                    </div>

                    <h3 className="text-3xl font-bold text-white mb-4">{step.title}</h3>
                    <p className="text-xl text-white/80 mb-6 leading-relaxed">{step.description}</p>

                    <ul className="space-y-3">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                          <span className="text-white/70">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Visual/Number */}
                  <div className={`col-span-2 flex justify-center ${index % 2 === 1 ? 'col-start-6' : 'col-start-6'}`}>
                    <div className="relative">
                      {/* Step number circle */}
                      <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                        <span className="text-3xl font-bold text-white">{step.number}</span>
                      </div>

                      {/* Connecting line (except for last step) */}
                      {index < steps.length - 1 && (
                        <div className="absolute top-24 left-1/2 transform -translate-x-1/2">
                          <ArrowRight className="w-8 h-8 text-white/30 rotate-90" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Visual representation */}
                  <div className={`col-span-5 ${index % 2 === 1 ? 'col-start-1' : 'col-start-8'}`}>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 h-64 flex items-center justify-center">
                      <div className="text-center">
                        <div className={`w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br ${step.color} opacity-20 mb-4`} />
                        <div className="text-white/60 text-sm">Step {step.number} Preview</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="lg:hidden">
                <div className="text-center">
                  <div className={`w-20 h-20 mx-auto rounded-xl bg-gradient-to-br ${step.color} p-4 mb-6`}>
                    <step.icon className="w-full h-full text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                  <p className="text-lg text-white/80 mb-6">{step.description}</p>

                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <ul className="space-y-3 text-left">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0" />
                          <span className="text-white/70">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Arrow for mobile */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center mt-8">
                      <ArrowRight className="w-8 h-8 text-white/30 rotate-90" />
                    </div>
                  )}
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
          <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-white/70 mb-6 text-lg">
              Join thousands of students who are already experiencing better grades and increased confidence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <ConicGradientButton href="/register" size="lg">
                Start Free Trial Now
              </ConicGradientButton>

              <button className="px-8 py-4 text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full transition-colors duration-300">
                Watch Demo First
              </button>
            </div>

            <p className="text-white/40 text-sm mt-4">
              No credit card required • 7-day free trial • Cancel anytime
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}