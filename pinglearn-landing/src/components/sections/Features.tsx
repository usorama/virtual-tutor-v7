"use client";

import { motion } from "framer-motion";
import FadeInSection from "@/components/animations/FadeInSection";
import { Card } from "@/components/ui/card";
import {
  Mic,
  Brain,
  BookOpen,
  BarChart3,
  Users,
  Shield,
  Zap,
  Target,
  MessageSquare
} from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Voice-First Learning",
    description: "Natural conversation with AI tutors using advanced speech recognition and real-time audio processing.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Brain,
    title: "Adaptive AI Intelligence",
    description: "Personalized learning paths that adapt to your learning style, pace, and comprehension level.",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: BookOpen,
    title: "Comprehensive Curriculum",
    description: "Complete CBSE curriculum coverage for grades 9-12 with interactive lessons and practice.",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description: "Detailed insights into learning progress with personalized recommendations and goal tracking.",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: MessageSquare,
    title: "Math Rendering",
    description: "Beautiful mathematical equation rendering with step-by-step solution explanations.",
    color: "from-indigo-500 to-blue-500"
  },
  {
    icon: Users,
    title: "Collaborative Learning",
    description: "Connect with peers, share progress, and learn together in a safe, moderated environment.",
    color: "from-teal-500 to-green-500"
  },
  {
    icon: Shield,
    title: "Privacy & Safety",
    description: "COPPA-compliant platform with robust privacy controls and parental oversight features.",
    color: "from-slate-500 to-gray-600"
  },
  {
    icon: Zap,
    title: "Instant Feedback",
    description: "Real-time corrections and explanations to help you learn from mistakes immediately.",
    color: "from-yellow-500 to-orange-500"
  },
  {
    icon: Target,
    title: "Goal-Oriented",
    description: "Set learning goals, track milestones, and celebrate achievements with gamified rewards.",
    color: "from-rose-500 to-pink-500"
  }
];

export default function Features() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section id="features" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <FadeInSection className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              Platform Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
              Everything You Need for
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                {" "}Academic Success
              </span>
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Our AI-powered platform combines cutting-edge technology with proven educational
              methodologies to deliver a truly personalized learning experience.
            </p>
          </motion.div>
        </FadeInSection>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <Card className="p-6 h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
                  <div className="flex flex-col h-full">
                    {/* Icon */}
                    <div className="mb-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} p-3 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neutral-900 mb-3 group-hover:text-blue-700 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-neutral-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>

                    {/* Hover Effect */}
                    <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-sm font-medium text-blue-600">
                        Learn more →
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <FadeInSection delay={0.4} className="text-center mt-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 md:p-12"
          >
            <h3 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-4">
              Ready to Transform Your Learning?
            </h3>
            <p className="text-lg text-neutral-600 mb-6 max-w-2xl mx-auto">
              Join thousands of students already experiencing the future of education with PingLearn.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-4 rounded-lg font-medium transition-colors"
              >
                Start Free Trial
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white px-8 py-4 rounded-lg font-medium transition-colors"
              >
                Schedule Demo
              </motion.button>
            </div>
          </motion.div>
        </FadeInSection>
      </div>
    </section>
  );
}