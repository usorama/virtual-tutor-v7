'use client'

import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Zap, Shield, Globe, Code2, Sparkles, ChevronRight,
  Users, BookOpen, Headphones, Star, ArrowRight,
  CheckCircle2, Clock, TrendingUp
} from 'lucide-react'
import { PingLearnLogoPro } from '@/components/brand/PingLearnLogoPro'
import { VoiceDemoPro } from '@/components/interactive/VoiceDemoPro'
import { PerformanceMetricsPro } from '@/components/interactive/PerformanceMetricsPro'
import { GlassCard, GlassButton, GlassNavigation } from '@/components/glass'
import { cn } from '@/lib/utils'

export default function PingLearnV3() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-background overflow-x-hidden">
      {/* Enhanced Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-ping-primary/5" />
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(0, 102, 255, 0.1) 0%, transparent 50%)',
            y: backgroundY
          }}
        />
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(0, 212, 170, 0.1) 0%, transparent 50%)',
            y: backgroundY
          }}
        />
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
      </div>

      {/* Navigation */}
      <GlassNavigation
        logo={<PingLearnLogoPro size="md" animated />}
        items={[
          { label: "Product", href: "#product" },
          { label: "Developers", href: "#developers" },
          { label: "Pricing", href: "#pricing" },
          { label: "Docs", href: "https://docs.pinglearn.app", external: true },
          { label: "Start Free Trial", href: "/signup", variant: "liquid-primary", size: "lg" }
        ]}
        depth="floating"
        fixed
        transparent
      />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ping-primary/10 border border-ping-primary/20"
            >
              <Sparkles className="w-4 h-4 text-ping-accent" />
              <span className="text-sm font-medium">Introducing Voice AI for Education</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>

            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-4"
            >
              <h1 className="text-5xl md:text-7xl font-bold">
                <span className="bg-gradient-to-r from-ping-primary via-ping-accent to-ping-secondary bg-clip-text text-transparent">
                  Voice AI
                </span>
                <br />
                <span>for Education</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Like LiveKit, but specialized for learning environments.
                Real-time audio-to-audio conversations with educational context awareness.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <GlassButton
                variant="liquid-primary"
                size="xl"
                glow
                depth="deep"
                className="min-w-[200px] group"
              >
                <span>Start 7-Day Free Trial</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </GlassButton>
              <GlassButton
                variant="liquid-glass"
                size="xl"
                depth="shallow"
                onClick={() => scrollToSection('demo')}
                className="min-w-[200px]"
              >
                <Headphones className="w-5 h-5 mr-2" />
                <span>Try Live Demo</span>
              </GlassButton>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center justify-center gap-8 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>COPPA/FERPA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <span>SOC 2 Type II</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-500" />
                <span>50+ Languages</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Performance Metrics */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Real-Time Performance</h2>
            <p className="text-lg text-muted-foreground">
              Live metrics from our global infrastructure
            </p>
          </motion.div>
          <PerformanceMetricsPro />
        </div>
      </section>

      {/* Voice Demo Section */}
      <section id="demo" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <VoiceDemoPro />
        </div>
      </section>

      {/* Technology Features */}
      <section id="product" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Scale, Designed for Learning
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade infrastructure meets educational expertise
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Sub-200ms Latency",
                description: "Direct audio-to-audio processing without STT/TTS pipeline overhead",
                gradient: "from-ping-primary/20 to-ping-accent/20"
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Educational Safety",
                description: "COPPA/FERPA compliant with content filtering and age-appropriate responses",
                gradient: "from-green-500/20 to-emerald-500/20"
              },
              {
                icon: <Globe className="w-6 h-6" />,
                title: "Global Infrastructure",
                description: "14 regions worldwide with automatic failover and 99.99% uptime SLA",
                gradient: "from-blue-500/20 to-cyan-500/20"
              },
              {
                icon: <BookOpen className="w-6 h-6" />,
                title: "Curriculum Aware",
                description: "Pre-trained on K-12 and university curricula across subjects",
                gradient: "from-purple-500/20 to-pink-500/20"
              },
              {
                icon: <Code2 className="w-6 h-6" />,
                title: "Developer First",
                description: "RESTful APIs, WebSocket support, and SDKs for all major platforms",
                gradient: "from-orange-500/20 to-red-500/20"
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Personalization Engine",
                description: "Adapts to individual learning styles and pacing in real-time",
                gradient: "from-indigo-500/20 to-purple-500/20"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard
                  animated
                  className={cn(
                    "h-full p-6 hover:scale-[1.02] transition-transform",
                    "bg-gradient-to-br",
                    feature.gradient
                  )}
                >
                  <div className="space-y-4">
                    <div className="p-3 bg-background/50 rounded-lg inline-block">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section id="developers" className="py-20 px-4 bg-gradient-to-b from-background to-ping-primary/5">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ship Voice AI in Minutes
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our SDK handles the complexity. You focus on creating amazing learning experiences.
              </p>

              <div className="space-y-4">
                {[
                  "WebRTC infrastructure with automatic scaling",
                  "Voice activity detection and noise suppression",
                  "Real-time transcription and translation",
                  "Educational context injection and management",
                  "Automatic session recording and analytics"
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-ping-accent flex-shrink-0" />
                    <span>{item}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="mt-8"
              >
                <GlassButton
                  variant="liquid-primary"
                  size="lg"
                  glow
                  className="group"
                >
                  <span>View Documentation</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </GlassButton>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <GlassCard className="p-6 bg-black/50">
                <pre className="text-sm overflow-x-auto">
                  <code className="language-javascript">
{`import { PingLearnAI } from '@pinglearn/sdk'

const ai = new PingLearnAI({
  apiKey: process.env.PINGLEARN_API_KEY,
  curriculum: 'K12_MATH',
  language: 'en',
  mode: 'voice'
})

// Start real-time voice session
const session = await ai.createSession({
  studentId: 'student_123',
  subject: 'algebra',
  adaptiveMode: true
})

session.on('transcript', (text) => {
  console.log('Student:', text)
})

session.on('response', (audio, text) => {
  console.log('AI:', text)
  playAudio(audio)
})

await session.start()`}
                  </code>
                </pre>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by Educational Leaders
            </h2>
            <p className="text-lg text-muted-foreground">
              Powering voice AI for institutions worldwide
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                quote: "PingLearn reduced our voice AI latency by 80%. Students now have truly natural conversations.",
                author: "Dr. Sarah Chen",
                role: "CTO, EduTech Solutions",
                institution: "Stanford University Partner",
                rating: 5
              },
              {
                quote: "The educational context awareness is unmatched. It understands curriculum nuances perfectly.",
                author: "Michael Rodriguez",
                role: "Head of Innovation",
                institution: "Khan Academy",
                rating: 5
              },
              {
                quote: "We deployed PingLearn in 2 days. The SDK is incredibly well-designed and documented.",
                author: "Lisa Park",
                role: "Engineering Lead",
                institution: "Coursera",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="h-full p-6">
                  <div className="flex flex-col h-full">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 flex-grow">
                      "{testimonial.quote}"
                    </p>
                    <div>
                      <p className="font-semibold">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      <p className="text-sm text-ping-accent">{testimonial.institution}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <GlassCard className="p-12 text-center bg-gradient-to-br from-ping-primary/10 to-ping-accent/10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Transform Education with Voice AI?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join thousands of institutions using PingLearn to create engaging,
                personalized learning experiences at scale.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                <GlassButton
                  variant="liquid-primary"
                  size="xl"
                  glow
                  depth="deep"
                  className="min-w-[200px] group"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </GlassButton>
                <GlassButton
                  variant="liquid-glass"
                  size="xl"
                  depth="shallow"
                  className="min-w-[200px]"
                >
                  <span>Schedule Demo</span>
                </GlassButton>
              </div>

              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mt-8">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>7-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </motion.div>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <PingLearnLogoPro size="sm" />
              <p className="text-sm text-muted-foreground">
                Voice AI infrastructure for the next generation of educational experiences.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>© 2025 PingLearn, Inc. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
              <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
              <a href="#" className="hover:text-foreground transition-colors">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}