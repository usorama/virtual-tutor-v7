"use client";

import { motion } from "framer-motion";
import { Play, Users, Star, Award } from "lucide-react";
import TypewriterText from "../ui/TypewriterText";
import ConicGradientButton from "../ui/ConicGradientButton";
import Navigation from "./Navigation";
import { Marquee } from "@/components/ui/marquee";

// Import the shape background component
import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";

const trustBadges = [
  { icon: Users, label: "50,000+ Students", color: "text-cyan-400" },
  { icon: Star, label: "4.9★ Parent Rating", color: "text-cyan-300" },
  { icon: Award, label: "CBSE Aligned", color: "text-blue-400" },
  { icon: Award, label: "COPPA Compliant", color: "text-blue-500" }
];

const features = [
  { icon: "🎙️", label: "Voice conversations" },
  { icon: "📐", label: "Real-time math rendering" },
  { icon: "🧠", label: "Adaptive learning" },
  { icon: "📊", label: "Progress tracking" },
  { icon: "🌙", label: "24/7 availability" },
  { icon: "🎯", label: "Exam preparation" },
  { icon: "💬", label: "Instant feedback" },
  { icon: "👨‍🏫", label: "Patient teaching" },
];

// Animated shape component
function ElegantShape({
    className,
    delay = 0,
    width = 400,
    height = 100,
    rotate = 0,
    gradient = "from-white/[0.08]",
}: {
    className?: string;
    delay?: number;
    width?: number;
    height?: number;
    rotate?: number;
    gradient?: string;
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: -150,
                rotate: rotate - 15,
            }}
            animate={{
                opacity: 1,
                y: 0,
                rotate: rotate,
            }}
            transition={{
                duration: 2.4,
                delay,
                ease: "easeOut",
                opacity: { duration: 1.2 },
            }}
            className={cn("absolute", className)}
        >
            <motion.div
                animate={{
                    y: [0, 30, 0],
                    rotate: [0, 5, 0],
                    scale: [1, 1.05, 1],
                }}
                transition={{
                    duration: 8,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
                style={{
                    width,
                    height,
                }}
                className="relative"
            >
                <div
                    className={cn(
                        "absolute inset-0 rounded-full",
                        "bg-gradient-to-r to-transparent",
                        gradient,
                        "backdrop-blur-[2px] border-2 border-white/[0.15]",
                        "shadow-[0_8px_32px_0_rgba(6,182,212,0.1)]",
                        "after:absolute after:inset-0 after:rounded-full",
                        "after:bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.2),transparent_70%)]"
                    )}
                />
            </motion.div>
        </motion.div>
    );
}

export default function Hero() {
  const rotatingWords = ["Patient", "Adaptive", "Available 24/7", "Encouraging"];

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      <Navigation transparent />
      <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black">
        {/* Gradient background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.05] via-transparent to-blue-500/[0.05] blur-3xl" />

        {/* Animated shapes */}
        <div className="absolute inset-0 overflow-hidden">
            <ElegantShape
                delay={0.3}
                width={600}
                height={140}
                rotate={12}
                gradient="from-cyan-500/[0.15]"
                className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
            />

            <ElegantShape
                delay={0.5}
                width={500}
                height={120}
                rotate={-15}
                gradient="from-blue-500/[0.15]"
                className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
            />

            <ElegantShape
                delay={0.4}
                width={300}
                height={80}
                rotate={-8}
                gradient="from-cyan-400/[0.15]"
                className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
            />

            <ElegantShape
                delay={0.6}
                width={200}
                height={60}
                rotate={20}
                gradient="from-blue-400/[0.15]"
                className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
            />

            <ElegantShape
                delay={0.7}
                width={150}
                height={40}
                rotate={-25}
                gradient="from-cyan-500/[0.15]"
                className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
            />

            {/* Additional floating particles */}
            <motion.div
                className="absolute top-[30%] left-[70%] w-4 h-4 bg-cyan-400/20 rounded-full"
                animate={{
                    y: [0, -20, 0],
                    opacity: [0.2, 0.8, 0.2],
                }}
                transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
            />

            <motion.div
                className="absolute top-[60%] left-[30%] w-3 h-3 bg-blue-400/20 rounded-full"
                animate={{
                    y: [0, -15, 0],
                    x: [0, 10, 0],
                    opacity: [0.3, 1, 0.3],
                }}
                transition={{
                    duration: 6,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: 1,
                }}
            />

            <motion.div
                className="absolute top-[40%] right-[10%] w-2 h-2 bg-cyan-300/30 rounded-full"
                animate={{
                    y: [0, -25, 0],
                    x: [0, -5, 0],
                    scale: [1, 1.5, 1],
                }}
                transition={{
                    duration: 5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: 2,
                }}
            />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 md:px-6 pt-24">
          <div className="max-w-6xl mx-auto text-center">
            {/* Badge */}
            <motion.div
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8 md:mb-12"
            >
                <Circle className="h-2 w-2 fill-cyan-500/80" />
                <span className="text-sm text-white/60 tracking-wide">
                    The future of learning is personal
                </span>
            </motion.div>

            {/* Main headline */}
            <motion.div
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
            >
                <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-6 md:mb-8 tracking-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
                        Meet Your Child&apos;s
                    </span>
                    <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-white/90 to-blue-300">
                        <TypewriterText words={rotatingWords} />
                    </span>
                    <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
                        AI Teacher
                    </span>
                </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.div
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 1, delay: 0.9, ease: "easeOut" }}
            >
                <p className="text-base sm:text-lg md:text-xl text-white/40 mb-8 leading-relaxed font-light tracking-wide max-w-3xl mx-auto px-4">
                  <span className="text-white/50 block mb-2">
                    Beyond tutoring. Beyond homework help.
                  </span>
                  <span className="text-white/70 block">
                    A learning companion that understands, adapts, and never gives up on your child.
                  </span>
                </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <ConicGradientButton href="/register" size="lg">
                Start Free Trial
              </ConicGradientButton>

              <button className="px-8 py-4 rounded-full font-semibold border border-white/20 backdrop-blur-sm text-white hover:bg-white/10 transition-all duration-300 flex items-center justify-center space-x-2">
                <Play className="w-5 h-5" />
                <span>Watch Demo</span>
                <div className="text-sm text-white/60">See PingLearn in action</div>
              </button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="flex flex-wrap justify-center gap-6 mb-20"
            >
              {trustBadges.map((badge, index) => (
                <div
                  key={badge.label}
                  className="flex items-center space-x-2 text-white/60"
                >
                  <badge.icon className={`w-5 h-5 ${badge.color}`} />
                  <span className="text-sm">{badge.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Feature Marquee (Bottom) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.4 }}
              className="max-w-6xl mx-auto"
            >
              <Marquee pauseOnHover={true} speed={50} className="py-4">
                {features.map((feature, index) => (
                  <div
                    key={feature.label}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 flex items-center space-x-3 mx-2 min-w-fit"
                  >
                    <span className="text-2xl">{feature.icon}</span>
                    <span className="text-white/70 text-sm whitespace-nowrap">{feature.label}</span>
                  </div>
                ))}
              </Marquee>
            </motion.div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none" />
      </section>
    </>
  );
}