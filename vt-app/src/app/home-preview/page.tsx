"use client"

import React from 'react'
import { GlassNavigation, GlassButton, GlassCard } from '@/components/glass'
import { LiquidGlassEngine } from '@/components/glass/LiquidGlassEngine'
import { AnimatedHero, FloatingElementsBackground } from '@/components/animated'
import { Brain, BookOpen, Zap, Shield, Users, Trophy, ChevronRight, Mail, Phone, MapPin, Star } from 'lucide-react'

// Mock logo component
const VirtualTutorLogo = () => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
      <Brain className="w-5 h-5 text-primary-foreground" />
    </div>
    <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
      Virtual Tutor
    </span>
  </div>
)

const features = [
  {
    icon: Brain,
    title: "AI-Powered Learning",
    description: "Experience personalized tutoring with advanced AI that adapts to your learning style and pace."
  },
  {
    icon: BookOpen,
    title: "CBSE Curriculum",
    description: "Complete coverage of Class 9-12 CBSE curriculum with interactive textbooks and exercises."
  },
  {
    icon: Zap,
    title: "Real-time Voice",
    description: "Natural voice conversations with your AI tutor using cutting-edge speech technology."
  },
  {
    icon: Shield,
    title: "Safe & Secure",
    description: "COPPA compliant platform ensuring student privacy and data protection."
  },
  {
    icon: Users,
    title: "One-on-One Focus",
    description: "Dedicated personal tutoring sessions tailored to individual learning needs."
  },
  {
    icon: Trophy,
    title: "Track Progress",
    description: "Comprehensive analytics and progress tracking to monitor learning achievements."
  }
]

const testimonials = [
  {
    name: "Priya Sharma",
    grade: "Class 12",
    content: "Virtual Tutor helped me improve my Mathematics scores by 40%. The AI explanations are so clear!",
    rating: 5
  },
  {
    name: "Arjun Patel",
    grade: "Class 10",
    content: "I love how the AI tutor explains Physics concepts. It's like having a teacher available 24/7.",
    rating: 5
  },
  {
    name: "Sneha Reddy",
    grade: "Class 11",
    content: "The personalized learning approach really works. My understanding of Chemistry has improved dramatically.",
    rating: 5
  }
]

export default function HomePreviewPage() {
  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <LiquidGlassEngine className="min-h-screen bg-gradient-to-br from-background via-background/95 to-secondary/5">
      {/* Floating background elements */}
      <FloatingElementsBackground density="medium" />

      {/* Navigation */}
      <GlassNavigation
        logo={<VirtualTutorLogo />}
        items={[
          { label: "Enter", href: "/auth/signin", variant: "liquid-primary", size: "lg" },
          { label: "Contact Us", onClick: scrollToContact, variant: "liquid-glass" }
        ]}
        depth="floating"
        fixed
        transparent
      />

      {/* Hero Section */}
      <AnimatedHero
        subtitle="🚀 Revolutionary AI Learning Platform"
        title="Transform Your Learning with Virtual Tutor"
        description="Experience the future of personalized education. Our AI-powered platform provides one-on-one tutoring for CBSE students with real-time voice interaction and adaptive learning."
      >
        <GlassButton variant="liquid-primary" size="xl" glow depth="deep">
          Start Learning Now
          <ChevronRight className="ml-2 w-5 h-5" />
        </GlassButton>
        <GlassButton variant="liquid-outline" size="xl" depth="medium">
          Watch Demo
        </GlassButton>
      </AnimatedHero>

      {/* Features Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Why Choose Virtual Tutor?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the features that make our AI tutoring platform the most effective way to learn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <GlassCard
                key={index}
                animated
                hover
                className="p-6 h-full"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Student Success Stories
            </h2>
            <p className="text-lg text-muted-foreground">
              See how Virtual Tutor is transforming education for students across India
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <GlassCard
                key={index}
                animated
                hover
                className="p-6"
              >
                <div className="flex items-center mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.grade}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto max-w-4xl text-center">
          <GlassCard animated className="p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already experiencing personalized AI tutoring. Start your journey today!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <GlassButton variant="liquid-primary" size="xl" glow depth="deep">
                Get Started Free
                <ChevronRight className="ml-2 w-5 h-5" />
              </GlassButton>
              <GlassButton variant="liquid-outline" size="xl" depth="medium">
                Schedule Demo
              </GlassButton>
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
              Have questions? We'd love to hear from you. Reach out to our team!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <GlassCard animated className="p-8">
              <h3 className="text-2xl font-semibold mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Email</p>
                    <p className="text-muted-foreground">support@virtualtutor.in</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Phone</p>
                    <p className="text-muted-foreground">+91 98765 43210</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Address</p>
                    <p className="text-muted-foreground">
                      Bangalore, Karnataka<br />
                      India
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Contact Form */}
            <GlassCard animated className="p-8">
              <h3 className="text-2xl font-semibold mb-6">Send us a Message</h3>
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full p-3 rounded-lg liquid-glass border-0 bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    className="w-full p-3 rounded-lg liquid-glass border-0 bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Subject"
                  className="w-full p-3 rounded-lg liquid-glass border-0 bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300"
                />
                <textarea
                  rows={4}
                  placeholder="Your Message"
                  className="w-full p-3 rounded-lg liquid-glass border-0 bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all duration-300"
                />
                <GlassButton variant="liquid-primary" size="lg" className="w-full" glow depth="medium">
                  Send Message
                </GlassButton>
              </form>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/20">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <VirtualTutorLogo />
            <p className="text-muted-foreground text-center">
              © 2025 Virtual Tutor. All rights reserved. Transforming education with AI.
            </p>
            <div className="flex gap-4">
              <GlassButton variant="liquid-ghost" size="sm">Privacy</GlassButton>
              <GlassButton variant="liquid-ghost" size="sm">Terms</GlassButton>
              <GlassButton variant="liquid-ghost" size="sm">Support</GlassButton>
            </div>
          </div>
        </div>
      </footer>
    </LiquidGlassEngine>
  )
}