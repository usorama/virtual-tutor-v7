"use client"

import React from 'react'
import { GlassNavigation, GlassButton, GlassCard } from '@/components/glass'
import { LiquidGlassEngine } from '@/components/glass/LiquidGlassEngine'
import { FloatingElementsBackground } from '@/components/animated'
import { PingLearnLogo } from '@/components/brand'
import { VoiceDemo, PerformanceMetrics } from '@/components/interactive'
import {
  Mic, Zap, Shield, Users, Trophy, ChevronRight, Mail, Phone, MapPin, Star,
  Code, Activity, Clock, TrendingUp, Cpu, Globe, Layers, Database,
  MessageSquare, Headphones, Volume2, Waves
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const techFeatures = [
  {
    icon: Mic,
    title: "Real-time Audio-to-Audio AI",
    description: "Direct voice conversations without STT/TTS pipeline. Sub-500ms response time for natural learning flow.",
    badge: "Core Technology"
  },
  {
    icon: Zap,
    title: "Gemini Live Integration",
    description: "Powered by Google's most advanced conversational AI with educational context awareness.",
    badge: "Latest AI"
  },
  {
    icon: Activity,
    title: "LiveKit Infrastructure",
    description: "Enterprise-grade WebRTC platform ensuring 99.9% uptime and global scalability.",
    badge: "Infrastructure"
  },
  {
    icon: Shield,
    title: "Educational Safety",
    description: "COPPA/FERPA compliant with content filtering and age-appropriate AI responses.",
    badge: "Compliance"
  },
  {
    icon: Code,
    title: "Developer-Friendly API",
    description: "Easy integration with schools and platforms. SDK available for React, Python, and more.",
    badge: "Integration"
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description: "Support for 50+ languages with localized curriculum understanding and cultural context.",
    badge: "Global Ready"
  }
]

const partnerTestimonials = [
  {
    name: "Dr. Sarah Chen",
    role: "CTO, EduTech Solutions",
    company: "Delhi International School",
    content: "PingLearn reduced our AI tutoring latency by 80%. Students now have truly natural conversations with AI.",
    rating: 5,
    metrics: { students: "2,400+", improvement: "45%" }
  },
  {
    name: "Raj Patel",
    role: "Head of Technology",
    company: "Mumbai Learning Institute",
    content: "Like LiveKit for communication, PingLearn is the infrastructure we needed for voice-first education.",
    rating: 5,
    metrics: { students: "1,800+", improvement: "60%" }
  },
  {
    name: "Dr. Anita Krishnan",
    role: "Director of Innovation",
    company: "Bangalore Education Board",
    content: "The real-time voice AI capabilities have transformed how our students interact with educational content.",
    rating: 5,
    metrics: { students: "5,000+", improvement: "38%" }
  }
]

export default function PingLearnHomepage() {
  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToDemo = () => {
    document.getElementById('voice-demo')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <LiquidGlassEngine className="min-h-screen bg-gradient-to-br from-ping-dark via-background to-ping-primary/5">
      {/* Enhanced floating background elements for tech aesthetic */}
      <FloatingElementsBackground density="high" />

      {/* Audio wave visualization background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-ping-primary/20 via-ping-accent/20 to-ping-secondary/20" />
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 bg-gradient-to-t from-ping-accent to-ping-primary rounded-full"
              style={{
                left: `${5 + (i * 4.5)}%`,
                height: '20px'
              }}
              animate={{
                scaleY: [1, Math.random() * 3 + 1, 1],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1
              }}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <GlassNavigation
        logo={<PingLearnLogo size="lg" animated />}
        items={[
          { label: "Get Started", href: "/auth/signin", variant: "liquid-primary", size: "lg" },
          { label: "Try Demo", onClick: scrollToDemo, variant: "liquid-glass" },
          { label: "Docs", href: "#", variant: "liquid-glass" },
          { label: "Contact", onClick: scrollToContact, variant: "liquid-glass" }
        ]}
        depth="floating"
        fixed
        transparent
      />

      {/* Hero Section - PingLearn Tech Focus */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <span className="inline-block px-6 py-3 rounded-full liquid-glass text-sm font-medium text-ping-accent border border-ping-accent/20 mb-6">
              <Waves className="inline w-4 h-4 mr-2" />
              Real-time Voice AI for Education
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight"
          >
            <span className="bg-gradient-to-r from-ping-primary to-ping-accent bg-clip-text text-transparent">
              Voice AI
            </span>
            <br />
            <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              for Education
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed"
          >
            Like <span className="text-ping-primary font-semibold">LiveKit</span>, but specialized for learning environments.
            Real-time audio-to-audio conversations with educational context awareness.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
          >
            <GlassButton variant="liquid-primary" size="xl" glow depth="deep">
              <Code className="mr-2 w-5 h-5" />
              Start Building
              <ChevronRight className="ml-2 w-5 h-5" />
            </GlassButton>
            <GlassButton variant="liquid-outline" size="xl" depth="medium" onClick={scrollToDemo}>
              <Mic className="mr-2 w-5 h-5" />
              Try Voice Demo
            </GlassButton>
          </motion.div>

          {/* Live Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <PerformanceMetrics variant="compact" showLive />
          </motion.div>
        </div>
      </section>

      {/* Interactive Voice Demo Section */}
      <section id="voice-demo" className="py-20 px-4 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-ping-primary to-ping-accent bg-clip-text text-transparent">
              Experience Real-time Voice AI
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Try our revolutionary audio-to-audio AI conversation. No sign-up required.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <VoiceDemo className="mb-12" />
          </div>

          {/* Technical Architecture Visualization */}
          <GlassCard animated className="p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-semibold mb-6 text-center">How PingLearn Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-ping-primary/20 to-ping-primary/10 flex items-center justify-center mx-auto border border-ping-primary/20">
                  <Headphones className="w-8 h-8 text-ping-primary" />
                </div>
                <h4 className="font-semibold">Student Voice</h4>
                <p className="text-sm text-muted-foreground">Natural speech input captured with noise cancellation</p>
              </div>
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-ping-accent/20 to-ping-accent/10 flex items-center justify-center mx-auto border border-ping-accent/20">
                  <Zap className="w-8 h-8 text-ping-accent" />
                </div>
                <h4 className="font-semibold">PingLearn AI</h4>
                <p className="text-sm text-muted-foreground">Gemini Live + Educational context processing</p>
              </div>
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-ping-secondary/20 to-ping-secondary/10 flex items-center justify-center mx-auto border border-ping-secondary/20">
                  <Volume2 className="w-8 h-8 text-ping-secondary" />
                </div>
                <h4 className="font-semibold">AI Response</h4>
                <p className="text-sm text-muted-foreground">Natural voice output with educational explanations</p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <span className="text-ping-accent font-semibold">&lt; 500ms total latency</span>
              <span className="text-muted-foreground mx-2">•</span>
              <span className="text-muted-foreground">Powered by LiveKit + Gemini Live</span>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Technology Features Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Built for Developers & Educators
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Enterprise-grade voice AI infrastructure designed for educational environments
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {techFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <GlassCard
                  animated
                  hover
                  className="p-6 h-full relative overflow-hidden"
                >
                  {feature.badge && (
                    <div className="absolute top-4 right-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-ping-accent/20 text-ping-accent border border-ping-accent/20">
                        {feature.badge}
                      </span>
                    </div>
                  )}
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-ping-primary/20 to-ping-accent/10 flex items-center justify-center mb-4 border border-ping-primary/20">
                    <feature.icon className="w-6 h-6 text-ping-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Educational Partner Testimonials */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Trusted by Educational Leaders
            </h2>
            <p className="text-lg text-muted-foreground">
              See how institutions are transforming education with PingLearn voice AI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {partnerTestimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <GlassCard
                  animated
                  hover
                  className="p-6 h-full"
                >
                  <div className="flex items-center mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="border-t border-border/20 pt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ping-primary/20 to-ping-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-ping-primary">
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        <p className="text-xs text-ping-accent">{testimonial.company}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-ping-primary">{testimonial.metrics.students}</p>
                        <p className="text-xs text-muted-foreground">Students</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-ping-accent">{testimonial.metrics.improvement}</p>
                        <p className="text-xs text-muted-foreground">Improvement</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer CTA Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto max-w-4xl text-center">
          <GlassCard animated className="p-12 relative overflow-hidden">
            {/* Code pattern background */}
            <div className="absolute inset-0 opacity-5">
              <pre className="text-xs text-ping-primary overflow-hidden">
                {`import { PingLearnAI } from '@pinglearn/sdk'

const tutor = new PingLearnAI({
  subject: 'mathematics',
  grade: 10,
  curriculum: 'NCERT'
})

// Start voice conversation
await tutor.startVoiceSession({
  onTranscript: (text) => console.log('Student:', text),
  onResponse: (audio) => playAudio(audio)
})`}
              </pre>
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-ping-primary to-ping-accent bg-clip-text text-transparent">
                Ready to Build with Voice AI?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join educational institutions worldwide using PingLearn to power their voice AI experiences.
                Start building in minutes with our developer-friendly SDK.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <GlassButton variant="liquid-primary" size="xl" glow depth="deep">
                  <Code className="mr-2 w-5 h-5" />
                  Start Building
                  <ChevronRight className="ml-2 w-5 h-5" />
                </GlassButton>
                <GlassButton variant="liquid-outline" size="xl" depth="medium">
                  <MessageSquare className="mr-2 w-5 h-5" />
                  Talk to Sales
                </GlassButton>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-ping-accent" />
                  <span>SOC 2 Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-ping-accent" />
                  <span>99.9% Uptime</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-ping-accent" />
                  <span>&lt; 500ms Latency</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Get in Touch
            </h2>
            <p className="text-lg text-muted-foreground">
              Ready to integrate voice AI into your educational platform? Let's talk.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <GlassCard animated className="p-8">
              <h3 className="text-2xl font-semibold mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-ping-primary/20 to-ping-primary/10 flex items-center justify-center border border-ping-primary/20">
                    <Mail className="w-6 h-6 text-ping-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Developer Support</p>
                    <p className="text-muted-foreground">developers@pinglearn.app</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-ping-accent/20 to-ping-accent/10 flex items-center justify-center border border-ping-accent/20">
                    <MessageSquare className="w-6 h-6 text-ping-accent" />
                  </div>
                  <div>
                    <p className="font-semibold">Enterprise Sales</p>
                    <p className="text-muted-foreground">enterprise@pinglearn.app</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-ping-secondary/20 to-ping-secondary/10 flex items-center justify-center border border-ping-secondary/20">
                    <Code className="w-6 h-6 text-ping-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold">Technical Documentation</p>
                    <p className="text-muted-foreground">docs.pinglearn.app</p>
                  </div>
                </div>
                <div className="mt-8 p-4 rounded-lg bg-gradient-to-r from-ping-primary/10 to-ping-accent/10 border border-ping-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">Response Time</p>
                  <p className="font-semibold text-ping-primary">&lt; 24 hours for developer queries</p>
                  <p className="font-semibold text-ping-accent">&lt; 4 hours for enterprise clients</p>
                </div>
              </div>
            </GlassCard>

            {/* Contact Form */}
            <GlassCard animated className="p-8">
              <h3 className="text-2xl font-semibold mb-6">Start Your Integration</h3>
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full p-3 rounded-lg liquid-glass border-0 bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ping-primary/50 transition-all duration-300"
                  />
                  <input
                    type="email"
                    placeholder="Work Email"
                    className="w-full p-3 rounded-lg liquid-glass border-0 bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ping-primary/50 transition-all duration-300"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Organization Name"
                  className="w-full p-3 rounded-lg liquid-glass border-0 bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ping-primary/50 transition-all duration-300"
                />
                <select className="w-full p-3 rounded-lg liquid-glass border-0 bg-transparent text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ping-primary/50 transition-all duration-300">
                  <option value="">Use Case</option>
                  <option value="school">K-12 School Integration</option>
                  <option value="university">University Platform</option>
                  <option value="edtech">EdTech Startup</option>
                  <option value="enterprise">Enterprise Training</option>
                  <option value="other">Other</option>
                </select>
                <textarea
                  rows={4}
                  placeholder="Tell us about your voice AI requirements..."
                  className="w-full p-3 rounded-lg liquid-glass border-0 bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ping-primary/50 resize-none transition-all duration-300"
                />
                <GlassButton variant="liquid-primary" size="lg" className="w-full" glow depth="medium">
                  <Zap className="mr-2 w-5 h-5" />
                  Get Started with PingLearn
                </GlassButton>
              </form>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-ping-primary/20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <PingLearnLogo size="lg" className="mb-4" />
              <p className="text-muted-foreground mb-4 max-w-md">
                Real-time voice AI infrastructure for educational platforms.
                Like LiveKit, but specialized for learning environments.
              </p>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-ping-accent" />
                  99.9% Uptime
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-ping-accent" />
                  &lt; 500ms Latency
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-ping-accent" />
                  SOC 2 Compliant
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-ping-primary">Developers</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Documentation</div>
                <div>API Reference</div>
                <div>SDK Downloads</div>
                <div>Code Examples</div>
                <div>Status Page</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-ping-primary">Company</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>About</div>
                <div>Privacy Policy</div>
                <div>Terms of Service</div>
                <div>Security</div>
                <div>Contact</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-ping-primary/20">
            <p className="text-muted-foreground text-center">
              © 2025 PingLearn. All rights reserved.
              <span className="text-ping-accent"> Powering voice AI in education.</span>
            </p>
            <div className="flex gap-4">
              <GlassButton variant="liquid-ghost" size="sm">Status</GlassButton>
              <GlassButton variant="liquid-ghost" size="sm">Docs</GlassButton>
              <GlassButton variant="liquid-ghost" size="sm">Support</GlassButton>
            </div>
          </div>
        </div>
      </footer>
    </LiquidGlassEngine>
  )
}