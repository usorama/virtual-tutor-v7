"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import TypewriterText from "@/components/TypewriterText";
import ConicGradientButton from "@/components/ConicGradientButton";

export default function Home() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Rotating words for the AI tutor description
  const words = ["empathetic", "adaptive", "personalized", "mindful"];

  // Features for infinite carousel
  const features = [
    { icon: "∞", label: "Infinite patience" },
    { icon: "◉", label: "Complete understanding" },
    { icon: "♡", label: "Genuine care" },
    { icon: "⚡", label: "Real-time assistance" },
    { icon: "🎯", label: "Personalized learning" },
    { icon: "🌟", label: "Adaptive curriculum" },
    { icon: "🔊", label: "Voice interaction" },
    { icon: "📊", label: "Progress tracking" },
    { icon: "🧠", label: "AI-powered insights" },
    { icon: "🌙", label: "24/7 availability" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset states
    setError("");
    setSuccessMessage("");

    // Validate email
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409) {
          setError("You're already on the waitlist! We'll notify you soon.");
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
        return;
      }

      // Success!
      setSuccessMessage("Welcome to the future of learning!");
      setIsSubmitted(true);
      setEmail("");

      // Reset after 7 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setSuccessMessage("");
      }, 7000);

    } catch (error) {
      console.error("Submission error:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden noise-bg">
      {/* Wavy Mesh Background Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 1440 800"
        >
          <defs>
            <linearGradient id="wavyGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(6,182,212,0.05)" />
              <stop offset="50%" stopColor="rgba(6,182,212,0.02)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="wavyGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(6,182,212,0.03)" />
              <stop offset="50%" stopColor="rgba(59,130,246,0.01)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          <path
            d="M0,300 C300,250 600,350 900,300 C1200,250 1440,320 1440,320 L1440,0 L0,0 Z"
            fill="url(#wavyGradient1)"
            opacity="0.5"
          />

          <path
            d="M0,500 C400,450 800,550 1200,500 C1440,470 1440,500 1440,500 L1440,800 L0,800 Z"
            fill="url(#wavyGradient2)"
            opacity="0.5"
          />
        </svg>

        {/* Subtle aurora overlay for depth */}
        <motion.div
          animate={{
            opacity: [0.02, 0.04, 0.02],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 min-h-screen flex flex-col justify-between py-8">

        {/* Header */}
        <header className="flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-2xl font-bold"
          >
            <span className="text-white">Ping</span>
            <span className="text-cyan-500">Learn</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-sm text-white/60"
          >
            <TypewriterText
              words={["coming soon...", "October 4, 2025", "join the waitlist", "future of learning"]}
              className="text-white/60"
            />
          </motion.div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="max-w-5xl w-full">
            {/* Curved Text Animation - Centered */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="text-center mb-12"
            >
              <p className="text-white/40 text-sm tracking-[0.3em] uppercase">
                The future of learning is personal
              </p>
            </motion.div>

            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-center mb-8"
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                An AI tutor that is
                <br />
                <TypewriterText
                  words={words}
                  className="text-cyan-500 text-glow-cyan"
                />
                <br />
                to you
              </h1>

              <p className="text-xl text-white/60 max-w-2xl mx-auto mb-2">
                Beyond answers. Beyond grades.
              </p>
              <p className="text-lg text-white/40 max-w-2xl mx-auto">
                A learning companion that understands your mind, adapts to your pace, and cares about your wellbeing.
              </p>
            </motion.div>

            {/* Infinite Features Carousel */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="mt-16 w-full overflow-hidden"
            >
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

                <motion.div
                  animate={{
                    x: ["0%", "-50%"],
                  }}
                  transition={{
                    x: {
                      duration: 30,
                      repeat: Infinity,
                      ease: "linear",
                    },
                  }}
                  className="flex space-x-12"
                >
                  {/* First set of features */}
                  {features.map((feature, index) => (
                    <div key={`set1-${index}`} className="flex-shrink-0 text-center">
                      <div className="text-cyan-500/50 text-3xl mb-2 font-light">
                        {feature.icon}
                      </div>
                      <p className="text-white/40 text-sm whitespace-nowrap">
                        {feature.label}
                      </p>
                    </div>
                  ))}

                  {/* Duplicate set for seamless loop */}
                  {features.map((feature, index) => (
                    <div key={`set2-${index}`} className="flex-shrink-0 text-center">
                      <div className="text-cyan-500/50 text-3xl mb-2 font-light">
                        {feature.icon}
                      </div>
                      <p className="text-white/40 text-sm whitespace-nowrap">
                        {feature.label}
                      </p>
                    </div>
                  ))}
                </motion.div>
              </div>
            </motion.div>

            {/* Single CTA - Email Waitlist with Conic Gradient Button */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="max-w-md mx-auto mt-20"
            >
              {!isSubmitted ? (
                <>
                  <form onSubmit={handleSubmit} className="relative">
                    <div className={`relative rounded-full bg-white/[0.02] backdrop-blur-sm border ${
                      error ? 'border-red-500/50' : 'border-white/10'
                    } transition-colors`}>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError(""); // Clear error on typing
                        }}
                        placeholder="Enter your email for early access"
                        className="w-full px-6 py-4 pr-36 bg-transparent text-white placeholder-white/30 focus:outline-none rounded-full"
                        disabled={isLoading}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <ConicGradientButton>
                          {isLoading ? (
                            <span className="flex items-center">
                              <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="inline-block mr-2"
                              >
                                ⚡
                              </motion.span>
                              Processing...
                            </span>
                          ) : (
                            "Join Waitlist"
                          )}
                        </ConicGradientButton>
                      </div>
                    </div>
                  </form>

                  {/* Error Message */}
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm text-center mt-3"
                    >
                      {error}
                    </motion.p>
                  )}
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4 rounded-full bg-white/[0.02] backdrop-blur-sm border border-cyan-500/30"
                  style={{
                    boxShadow: "0 0 40px rgba(6,182,212,0.15), inset 0 0 20px rgba(6,182,212,0.05)"
                  }}
                >
                  <p className="text-cyan-500">{successMessage || "Welcome to the future of learning."}</p>
                  <p className="text-white/60 text-sm mt-1">We'll reach out soon.</p>
                </motion.div>
              )}

              <p className="text-center text-white/30 text-sm mt-4">
                Join 1,247 educators and students waiting for October 4, 2025
              </p>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-white/30 text-sm">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <p className="mb-2">
              Questions? Reach out at{" "}
              <a
                href="mailto:support@pinglearn.app"
                className="text-cyan-500/70 hover:text-cyan-500 transition-colors"
              >
                support@pinglearn.app
              </a>
            </p>
            <p className="text-white/20">
              © 2025 PingLearn. Building the future of education.
            </p>
          </motion.div>
        </footer>
      </div>
    </main>
  );
}