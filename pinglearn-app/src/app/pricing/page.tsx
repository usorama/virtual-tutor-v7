"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/marketing/sections/Navigation";
import Footer from "@/components/marketing/sections/Footer";
import { motion } from "framer-motion";
import { Check, Star, Zap, Crown, Globe, MapPin } from "lucide-react";
import ConicGradientButton from "@/components/marketing/ui/ConicGradientButton";

export default function PricingPage() {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('USD');
  const [isMonthly, setIsMonthly] = useState(true);
  const [userLocation, setUserLocation] = useState<string>('');

  // Detect user location on mount
  useEffect(() => {
    // Try to get location from IP
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const country = data.country_code;
        setUserLocation(data.city + ', ' + data.country_name);

        // Set currency based on location
        if (country === 'IN') {
          setCurrency('INR');
        } else {
          setCurrency('USD');
        }
      })
      .catch(() => {
        // Default to USD if location detection fails
        setCurrency('USD');
        setUserLocation('Global');
      });
  }, []);

  const plans = [
    {
      name: "Free Trial",
      priceINR: "₹0",
      priceUSD: "$0",
      yearlyPriceINR: "₹0",
      yearlyPriceUSD: "$0",
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
      priceINR: "₹999",
      priceUSD: "$12",
      yearlyPriceINR: "₹799",
      yearlyPriceUSD: "$9.60",
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
      savingsINR: "Save ₹500",
      savingsUSD: "Save $3"
    },
    {
      name: "Annual Plan",
      priceINR: "₹8,999",
      priceUSD: "$108",
      yearlyPriceINR: "₹8,999",
      yearlyPriceUSD: "$108",
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
      savingsINR: "Save ₹2,989",
      savingsUSD: "Save $36"
    }
  ];

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-black pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Location Banner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-sm font-medium">
                Pricing for {userLocation || 'your location'}
              </span>
            </div>
          </motion.div>

          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Invest in Your Child&apos;s
              <span className="text-gradient bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> Future</span>
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Choose the plan that fits your learning needs. All plans include PingLearn,
              but with different levels of access and support.
            </p>
          </motion.div>

          {/* Currency Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center items-center space-x-6 mb-8"
          >
            <button
              onClick={() => setCurrency('INR')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currency === 'INR'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              ₹ INR
            </button>

            <Globe className="w-5 h-5 text-white/40" />

            <button
              onClick={() => setCurrency('USD')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currency === 'USD'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              $ USD
            </button>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex justify-center items-center space-x-4 mb-12"
          >
            <span className={`font-medium ${isMonthly ? 'text-white' : 'text-white/60'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsMonthly(!isMonthly)}
              className="relative w-14 h-7 bg-white/20 rounded-full transition-colors duration-300"
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-cyan-500 rounded-full transition-transform duration-300 ${
                  isMonthly ? 'left-1' : 'left-8'
                }`}
              />
            </button>
            <span className={`font-medium ${!isMonthly ? 'text-white' : 'text-white/60'}`}>
              Yearly
              <span className="text-cyan-400 text-sm ml-2">(Save 20%)</span>
            </span>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
                className={`relative ${plan.popular ? 'lg:-mt-8' : ''}`}
              >
                <div
                  className={`
                    bg-white/5 backdrop-blur-sm border rounded-2xl p-8 h-full
                    ${plan.popular
                      ? 'border-cyan-500 shadow-[0_0_40px_rgba(0,212,255,0.3)]'
                      : 'border-white/10'
                    }
                  `}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-current" />
                        <span>Most Popular</span>
                      </div>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${plan.color} mb-4`}>
                      <plan.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-white/60">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center space-x-2">
                      <span className="text-4xl font-bold text-white">
                        {currency === 'INR'
                          ? (isMonthly || plan.name === 'Annual Plan' ? plan.priceINR : plan.yearlyPriceINR)
                          : (isMonthly || plan.name === 'Annual Plan' ? plan.priceUSD : plan.yearlyPriceUSD)
                        }
                      </span>
                      <span className="text-white/60">
                        {plan.duration}
                      </span>
                    </div>

                    {plan.savingsINR && !isMonthly && (
                      <div className="mt-2">
                        <span className="text-cyan-400 text-sm font-medium bg-cyan-400/10 px-2 py-1 rounded">
                          {currency === 'INR' ? plan.savingsINR : plan.savingsUSD}
                        </span>
                      </div>
                    )}
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
                  <div>
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
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-8"
          >
            <div className="text-center">
              <h3 className="text-3xl font-bold mb-4">Enterprise & Schools</h3>
              <p className="text-white/70 mb-8 max-w-2xl mx-auto">
                Custom solutions for educational institutions with bulk pricing,
                dedicated support, and advanced analytics.
              </p>
              <button className="bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-white font-semibold px-8 py-3 rounded-full transition-colors duration-300">
                Contact Sales Team
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
}