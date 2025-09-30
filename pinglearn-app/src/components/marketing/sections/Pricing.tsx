"use client";

import { motion } from "framer-motion";
import { Check, Star, Zap, Crown, Users } from "lucide-react";
import ConicGradientButton from "../ui/ConicGradientButton";

const plans = [
  {
    name: "Free Trial",
    price: "₹0",
    originalPrice: null,
    duration: "7 days",
    description: "Perfect for trying out PingLearn",
    features: [
      "Full access to PingLearn",
      "All subjects included",
      "Voice & text interaction",
      "Progress tracking",
      "Math equation rendering",
      "Up to 10 sessions"
    ],
    limitations: [
      "Limited to 7 days",
      "Max 10 learning sessions"
    ],
    cta: "Start Free Trial",
    href: "/register",
    popular: false,
    icon: Zap,
    color: "from-cyan-500 to-blue-500",
    savings: null
  },
  {
    name: "Monthly Plan",
    price: "₹999",
    originalPrice: "₹1,499",
    duration: "per month",
    description: "Most popular choice for families",
    features: [
      "Everything in Free Trial",
      "Unlimited learning sessions",
      "Parent dashboard access",
      "Priority support",
      "Exam preparation mode",
      "Detailed progress reports",
      "Achievement badges",
      "Study reminders"
    ],
    limitations: [],
    cta: "Choose Monthly",
    href: "/register?plan=monthly",
    popular: true,
    icon: Star,
    color: "from-cyan-500 to-blue-500",
    savings: "Save ₹500"
  },
  {
    name: "Annual Plan",
    price: "₹8,999",
    originalPrice: "₹11,988",
    duration: "per year",
    description: "Best value for serious learners",
    features: [
      "Everything in Monthly Plan",
      "2 months completely FREE",
      "Downloadable worksheets",
      "Sibling account (50% off)",
      "Success guarantee",
      "Priority feature access",
      "1-on-1 onboarding call",
      "Learning consultant support"
    ],
    limitations: [],
    cta: "Choose Annual",
    href: "/register?plan=annual",
    popular: false,
    icon: Crown,
    color: "from-blue-500 to-cyan-500",
    savings: "Save ₹2,989"
  }
];

const comparisonFeatures = [
  "PingLearn Access",
  "Voice Interaction",
  "Math Rendering",
  "Progress Tracking",
  "Parent Dashboard",
  "Exam Preparation",
  "Study Reminders",
  "Priority Support",
  "Downloadable Content",
  "Sibling Accounts"
];

const enterprises = [
  "Schools & Educational Institutions",
  "Coaching Centers",
  "Corporate Training Programs",
  "Government Education Initiatives"
];

export default function Pricing() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-black" id="pricing">
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
            Invest in Your Child&apos;s
            <span className="text-gradient bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> Future</span>
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8">
            Choose the plan that fits your learning needs. All plans include PingLearn,
            but with different levels of access and support.
          </p>

          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-cyan-400 text-sm font-semibold">
              🔥 Limited Time: Save up to 25% on all plans
            </p>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative ${plan.popular ? 'scale-105 z-10' : ''}`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Card */}
              <div className={`relative bg-white/5 backdrop-blur-sm border ${
                plan.popular ? 'border-cyan-500/50' : 'border-white/10'
              } rounded-2xl p-8 h-full hover:bg-white/10 transition-all duration-300`}>

                {/* Glow effect for popular plan */}
                {plan.popular && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-3xl -z-10" />
                )}

                {/* Plan header */}
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${plan.color} p-3`}>
                    <plan.icon className="w-full h-full text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-white/60 text-sm mb-4">{plan.description}</p>

                  <div className="mb-4">
                    <div className="flex items-baseline justify-center space-x-2">
                      <span className="text-5xl font-bold text-white">{plan.price}</span>
                      <span className="text-white/60">/{plan.duration}</span>
                    </div>

                    {plan.originalPrice && (
                      <div className="flex items-center justify-center space-x-2 mt-2">
                        <span className="text-white/40 line-through">{plan.originalPrice}</span>
                        {plan.savings && (
                          <span className="text-cyan-400 text-sm font-semibold bg-cyan-400/10 px-2 py-1 rounded">
                            {plan.savings}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <h4 className="text-white font-semibold mb-4">Everything included:</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center space-x-3">
                        <Check className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                        <span className="text-white/80 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.limitations.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-white/10">
                      <h5 className="text-white/60 font-semibold mb-2 text-sm">Limitations:</h5>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, idx) => (
                          <li key={idx} className="text-white/50 text-sm">• {limitation}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="mt-auto">
                  {plan.popular ? (
                    <ConicGradientButton
                      href={plan.href}
                      className="w-full text-center"
                    >
                      {plan.cta}
                    </ConicGradientButton>
                  ) : (
                    <button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white font-semibold py-3 rounded-full transition-all duration-300">
                      {plan.cta}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Enterprise section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-8"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Users className="w-8 h-8 text-blue-400" />
                <h3 className="text-3xl font-bold">Enterprise & Schools</h3>
              </div>
              <p className="text-white/80 mb-6">
                Custom solutions for educational institutions with bulk pricing,
                dedicated support, and advanced analytics.
              </p>

              <ul className="space-y-2 mb-6">
                {enterprises.map((enterprise, idx) => (
                  <li key={idx} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-blue-400" />
                    <span className="text-white/70">{enterprise}</span>
                  </li>
                ))}
              </ul>

              <button className="bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-white font-semibold px-8 py-3 rounded-full transition-colors duration-300">
                Contact Sales Team
              </button>
            </div>

            <div className="text-center">
              <div className="text-6xl mb-4">🏫</div>
              <div className="text-white/60">
                <div className="text-3xl font-bold text-blue-400 mb-2">500+</div>
                <div className="text-sm">Schools Already Using PingLearn</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* FAQ teaser */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <h3 className="text-2xl font-bold mb-4">Have Questions About Pricing?</h3>
          <p className="text-white/70 mb-6">
            Check our FAQ section below or contact our support team for personalized assistance.
          </p>
          <button className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors duration-300">
            View FAQ Section ↓
          </button>
        </motion.div>
      </div>
    </section>
  );
}