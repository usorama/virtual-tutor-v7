"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import PingLearnLogo from "@/components/wordmark/PingLearnLogo";
import { ArrowRight, Play, Star } from "lucide-react";

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const floatingAnimation = {
    y: [-10, 10, -10]
  };

  const floatingTransition = {
    duration: 4,
    repeat: Infinity
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-75"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-150"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-8">
        {/* Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-between items-center py-6"
        >
          <PingLearnLogo size="lg" animated={true} />
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-neutral-600 hover:text-blue-700 transition-colors">Features</a>
            <a href="#demo" className="text-neutral-600 hover:text-blue-700 transition-colors">Demo</a>
            <a href="#about" className="text-neutral-600 hover:text-blue-700 transition-colors">About</a>
            <Button variant="outline" size="sm">
              Contact
            </Button>
          </div>
        </motion.nav>

        {/* Hero Content */}
        <div className="flex flex-col lg:flex-row items-center justify-between py-12 lg:py-20">
          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex-1 lg:pr-12 text-center lg:text-left"
          >
            {/* Trust Badge */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6"
            >
              <Star className="w-4 h-4 fill-current" />
              <span>AI-Powered Education Platform</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight mb-6"
            >
              The Future of
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                {" "}Personalized Learning
              </span>
              {" "}is Here
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={itemVariants}
              className="text-xl text-neutral-600 mb-8 max-w-2xl"
            >
              Experience revolutionary AI tutoring with real-time voice interaction,
              personalized curriculum, and comprehensive progress tracking for grades 9-12.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 mb-8"
            >
              <Button size="lg" className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-4">
                Join Beta Waitlist
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-4">
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-neutral-500"
            >
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 bg-gradient-to-br from-blue-400 to-green-400 rounded-full border-2 border-white"
                    />
                  ))}
                </div>
                <span>500+ students in beta</span>
              </div>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-1">4.9/5 rating</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Interactive Demo */}
          <motion.div
            initial={{ y: 0 }}
            animate={floatingAnimation}
            transition={floatingTransition}
            className="flex-1 lg:pl-12 mt-12 lg:mt-0"
          >
            <div className="relative">
              {/* Main Demo Card */}
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-neutral-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-neutral-500 ml-4">AI Tutor Session</span>
                </div>

                {/* Chat Interface */}
                <div className="space-y-4">
                  <div className="flex justify-start">
                    <div className="bg-blue-100 text-blue-900 rounded-lg rounded-bl-none px-4 py-3 max-w-xs">
                      <p className="text-sm">Hello! I'm your AI tutor. What math topic would you like to explore today?</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <div className="bg-neutral-100 text-neutral-900 rounded-lg rounded-br-none px-4 py-3 max-w-xs">
                      <p className="text-sm">Can you help me with quadratic equations?</p>
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <div className="bg-blue-100 text-blue-900 rounded-lg rounded-bl-none px-4 py-3 max-w-xs">
                      <p className="text-sm">Absolutely! Let's start with the general form:</p>
                      <div className="mt-2 p-2 bg-white rounded text-center font-mono">
                        ax² + bx + c = 0
                      </div>
                    </div>
                  </div>

                  {/* Typing Indicator */}
                  <div className="flex justify-start">
                    <div className="bg-blue-50 rounded-lg rounded-bl-none px-4 py-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Voice Indicator */}
                <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-neutral-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Voice interaction active</span>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg"
              />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-br from-green-400 to-blue-400 rounded-full"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-neutral-300 rounded-full flex justify-center"
        >
          <div className="w-1 h-3 bg-neutral-400 rounded-full mt-2"></div>
        </motion.div>
      </motion.div>
    </section>
  );
}