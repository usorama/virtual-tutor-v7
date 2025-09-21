"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import FadeInSection from "@/components/animations/FadeInSection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  Users,
  Rocket,
  CheckCircle,
  ArrowRight,
  Bell
} from "lucide-react";

const milestones = [
  {
    phase: "Phase 1",
    title: "Core Platform",
    status: "completed",
    date: "Q3 2025",
    features: ["AI Voice Engine", "Basic Curriculum", "User Accounts"]
  },
  {
    phase: "Phase 2",
    title: "Advanced Features",
    status: "in-progress",
    date: "Q4 2025",
    features: ["Math Rendering", "Progress Analytics", "Parent Dashboard"]
  },
  {
    phase: "Phase 3",
    title: "Public Launch",
    status: "upcoming",
    date: "Q1 2026",
    features: ["Full Curriculum", "Mobile Apps", "Collaborative Tools"]
  }
];

export default function ComingSoon() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setEmail("");
      // Here you would typically send the email to your backend
      setTimeout(() => setIsSubmitted(false), 3000);
    }
  };

  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
      <div className="container mx-auto px-4">
        <FadeInSection className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center space-x-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Clock className="w-4 h-4" />
              <span>Coming Soon</span>
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
              The Future of Learning is
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                {" "}Almost Here
              </span>
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              We're putting the finishing touches on PingLearn to ensure you get the most
              revolutionary learning experience possible. Be among the first to experience it.
            </p>
          </motion.div>
        </FadeInSection>

        {/* Development Timeline */}
        <FadeInSection delay={0.2} className="mb-16">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center text-neutral-900 mb-8">
              Development Roadmap
            </h3>
            <div className="space-y-6">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="p-6 border-l-4 border-l-blue-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            {milestone.phase}
                          </span>
                          <span className="text-sm text-neutral-500">{milestone.date}</span>
                          {milestone.status === "completed" && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {milestone.status === "in-progress" && (
                            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                          )}
                          {milestone.status === "upcoming" && (
                            <Clock className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>
                        <h4 className="text-xl font-semibold text-neutral-900 mb-2">
                          {milestone.title}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {milestone.features.map((feature, featureIndex) => (
                            <span
                              key={featureIndex}
                              className="text-sm bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeInSection>

        {/* Beta Signup */}
        <FadeInSection delay={0.4}>
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 text-center bg-white shadow-xl">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                viewport={{ once: true }}
                className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Bell className="w-8 h-8 text-white" />
              </motion.div>

              <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                Get Early Access
              </h3>
              <p className="text-neutral-600 mb-6">
                Join our exclusive beta program and be among the first 100 students to experience
                PingLearn. Early access includes lifetime premium features at no cost.
              </p>

              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <Button
                      type="submit"
                      size="lg"
                      className="bg-blue-700 hover:bg-blue-800 px-8"
                    >
                      Join Beta
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-neutral-500">
                    No spam, unsubscribe at any time. We respect your privacy.
                  </p>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-green-600 mb-2">
                    You're In!
                  </h4>
                  <p className="text-neutral-600">
                    Thanks for joining our beta program. We'll notify you as soon as early access is available.
                  </p>
                </motion.div>
              )}

              {/* Beta Benefits */}
              <div className="mt-8 pt-6 border-t border-neutral-200">
                <h4 className="font-semibold text-neutral-900 mb-4">Beta Program Benefits:</h4>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Lifetime premium access</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Priority customer support</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Direct feedback channel</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Exclusive beta community</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </FadeInSection>

        {/* Current Stats */}
        <FadeInSection delay={0.6} className="mt-16">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Users, label: "Beta Signups", value: "1,247", change: "+127 this week" },
              { icon: Calendar, label: "Expected Launch", value: "Q1 2026", change: "On schedule" },
              { icon: Rocket, label: "Features Ready", value: "85%", change: "+15% this month" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 text-center">
                  <stat.icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-neutral-900 mb-1">{stat.value}</div>
                  <div className="text-sm font-medium text-neutral-700 mb-1">{stat.label}</div>
                  <div className="text-xs text-neutral-500">{stat.change}</div>
                </Card>
              </motion.div>
            ))}
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}