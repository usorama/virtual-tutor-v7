'use client'

import React, { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Sparkles, ChevronRight, Users, BookOpen, Headphones,
  Star, ArrowRight, CheckCircle2, Shield, Globe,
  TrendingUp, Brain, Trophy, Heart, Zap, GraduationCap,
  BarChart3, Clock, Target, Lightbulb, Activity, Award,
  PlayCircle, MessageCircle, Video, Calendar, Calculator,
  Microscope, Palette, Music, Languages, Code, Gamepad2,
  Bot, Rocket, Lock, Eye, HelpCircle, Phone, Mail,
  Twitter, Github, Linkedin, Youtube, Instagram
} from 'lucide-react'
import { PingLearnLogoPro } from '@/components/brand/PingLearnLogoPro'
import { VoiceDemoPro } from '@/components/interactive/VoiceDemoPro'
import { PerformanceMetricsPro } from '@/components/interactive/PerformanceMetricsPro'
import { GlassCard, GlassButton, GlassNavigation } from '@/components/glass'
import { cn } from '@/lib/utils'

export default function PingLearnV3() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [selectedGrade, setSelectedGrade] = useState<string>('')
  const [email, setEmail] = useState('')
  const [showDemoModal, setShowDemoModal] = useState(false)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleStartLearning = () => {
    router.push('/auth/signup')
  }

  const handleParentPortal = () => {
    router.push('/parent-portal')
  }

  const handleScheduleDemo = () => {
    setShowDemoModal(true)
  }

  const handleContactSales = () => {
    scrollToSection('contact-form')
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

      {/* Demo Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <GlassCard className="p-8">
              <h3 className="text-2xl font-bold mb-4">Schedule a Demo</h3>
              <p className="text-muted-foreground mb-6">
                Get a personalized walkthrough of PingLearn's features
              </p>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full p-3 rounded-lg bg-background/50 border border-white/10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <select className="w-full p-3 rounded-lg bg-background/50 border border-white/10">
                  <option>Select preferred time</option>
                  <option>Tomorrow 10 AM</option>
                  <option>Tomorrow 2 PM</option>
                  <option>Next Week</option>
                </select>
                <GlassButton
                  variant="liquid-primary"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    alert('Demo scheduled! We\'ll send confirmation to ' + email)
                    setShowDemoModal(false)
                  }}
                >
                  Confirm Demo
                </GlassButton>
                <button
                  onClick={() => setShowDemoModal(false)}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}

      {/* Navigation */}
      <GlassNavigation
        logo={<PingLearnLogoPro size="md" animated />}
        items={[
          { label: "How It Works", onClick: () => scrollToSection('how-it-works') },
          { label: "Subjects", onClick: () => scrollToSection('subjects') },
          { label: "For Parents", onClick: () => scrollToSection('parents') },
          { label: "For Schools", onClick: () => scrollToSection('schools') },
          { label: "Start Learning", onClick: handleStartLearning, variant: "liquid-primary", size: "lg" }
        ]}
        depth="floating"
        fixed
        transparent
      />

      {/* Hero Section - Student Focused */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ping-primary/10 border border-ping-primary/20 cursor-pointer hover:bg-ping-primary/20 transition-colors"
              onClick={() => scrollToSection('ai-features')}
            >
              <Sparkles className="w-4 h-4 text-ping-accent" />
              <span className="text-sm font-medium">AI-Powered Personalized Learning</span>
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
                <span>Learn Anything,</span>
                <br />
                <span className="bg-gradient-to-r from-ping-primary via-ping-accent to-ping-secondary bg-clip-text text-transparent">
                  Master Everything
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Your personal AI tutor that adapts to how you learn.
                Get instant help, practice problems, and master any subject at your own pace.
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
                onClick={handleStartLearning}
              >
                <span>Start Learning Free</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </GlassButton>
              <GlassButton
                variant="liquid-glass"
                size="xl"
                depth="shallow"
                onClick={() => scrollToSection('demo')}
                className="min-w-[200px] group"
              >
                <Headphones className="w-5 h-5 mr-2" />
                <span>Try AI Tutor</span>
              </GlassButton>
            </motion.div>

            {/* Student Success Metrics */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center justify-center gap-8 text-sm"
            >
              <div className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform"
                   onClick={() => scrollToSection('testimonials')}>
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span>2M+ Students</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-orange-500" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform"
                   onClick={() => scrollToSection('schools')}>
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>85% Grade Improvement</span>
              </div>
            </motion.div>

            {/* Quick Grade Selection */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-2 mt-8"
            >
              <span className="text-sm text-muted-foreground mr-2">Quick Start:</span>
              {['K-2', '3-5', '6-8', '9-12', 'College'].map((grade) => (
                <button
                  key={grade}
                  onClick={() => {
                    setSelectedGrade(grade)
                    handleStartLearning()
                  }}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm transition-all",
                    "bg-white/5 hover:bg-ping-primary/20 border border-white/10",
                    selectedGrade === grade && "bg-ping-primary/30 border-ping-primary"
                  )}
                >
                  Grade {grade}
                </button>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works - Student Journey */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Your Learning Journey Starts Here
            </h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to academic success
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Tell Us About You",
                description: "Share your grade level, subjects you're studying, and what you want to achieve",
                icon: <Target className="w-6 h-6" />,
                action: () => handleStartLearning()
              },
              {
                step: "2",
                title: "Learn Your Way",
                description: "Chat with your AI tutor, ask questions, and get explanations that match your learning style",
                icon: <Brain className="w-6 h-6" />,
                action: () => scrollToSection('demo')
              },
              {
                step: "3",
                title: "Track Your Progress",
                description: "See your improvement with detailed analytics and celebrate your achievements",
                icon: <BarChart3 className="w-6 h-6" />,
                action: () => scrollToSection('metrics')
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="cursor-pointer"
                onClick={item.action}
              >
                <GlassCard className="relative h-full p-6 hover:scale-[1.02] transition-transform">
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-ping-primary rounded-full flex items-center justify-center text-white font-bold">
                    {item.step}
                  </div>
                  <div className="mt-4 space-y-4">
                    <div className="p-3 bg-gradient-to-br from-ping-primary/20 to-ping-accent/20 rounded-lg inline-block">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Voice Demo Section */}
      <section id="demo" className="py-20 px-4 bg-gradient-to-b from-background to-ping-primary/5">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Experience Your AI Tutor
            </h2>
            <p className="text-lg text-muted-foreground">
              Ask any question and get instant, personalized explanations
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <GlassButton
                variant="liquid-glass"
                size="sm"
                onClick={() => alert('Math tutor mode activated!')}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Math Mode
              </GlassButton>
              <GlassButton
                variant="liquid-glass"
                size="sm"
                onClick={() => alert('Science tutor mode activated!')}
              >
                <Microscope className="w-4 h-4 mr-2" />
                Science Mode
              </GlassButton>
              <GlassButton
                variant="liquid-glass"
                size="sm"
                onClick={() => alert('Language tutor mode activated!')}
              >
                <Languages className="w-4 h-4 mr-2" />
                Language Mode
              </GlassButton>
            </div>
          </motion.div>
          <VoiceDemoPro />
        </div>
      </section>

      {/* Expanded Subject Coverage */}
      <section id="subjects" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Every Subject, Every Level
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From elementary basics to advanced topics, we've got you covered
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Activity className="w-6 h-6" />,
                title: "Mathematics",
                topics: ["Algebra", "Calculus", "Geometry", "Statistics"],
                color: "from-blue-500/20 to-indigo-500/20",
                link: '/subjects/math'
              },
              {
                icon: <Lightbulb className="w-6 h-6" />,
                title: "Science",
                topics: ["Physics", "Chemistry", "Biology", "Earth Science"],
                color: "from-green-500/20 to-emerald-500/20",
                link: '/subjects/science'
              },
              {
                icon: <BookOpen className="w-6 h-6" />,
                title: "English",
                topics: ["Writing", "Grammar", "Literature", "Essay Help"],
                color: "from-purple-500/20 to-pink-500/20",
                link: '/subjects/english'
              },
              {
                icon: <Globe className="w-6 h-6" />,
                title: "Social Studies",
                topics: ["History", "Geography", "Economics", "Government"],
                color: "from-orange-500/20 to-red-500/20",
                link: '/subjects/social'
              }
            ].map((subject, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => router.push(subject.link)}
                className="cursor-pointer"
              >
                <GlassCard
                  animated
                  className={cn(
                    "h-full p-6 hover:scale-[1.02] transition-transform",
                    "bg-gradient-to-br",
                    subject.color
                  )}
                >
                  <div className="space-y-4">
                    <div className="p-3 bg-background/50 rounded-lg inline-block">
                      {subject.icon}
                    </div>
                    <h3 className="text-xl font-semibold">{subject.title}</h3>
                    <ul className="space-y-1">
                      {subject.topics.map((topic, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-ping-accent" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                    <button className="text-sm text-ping-accent hover:text-ping-primary transition-colors">
                      Explore {subject.title} →
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Additional Subjects */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="text-muted-foreground mb-4">Also available:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { icon: <Code className="w-4 h-4" />, name: "Computer Science" },
                { icon: <Languages className="w-4 h-4" />, name: "Foreign Languages" },
                { icon: <Music className="w-4 h-4" />, name: "Music Theory" },
                { icon: <Palette className="w-4 h-4" />, name: "Art & Design" },
                { icon: <Gamepad2 className="w-4 h-4" />, name: "Game Development" }
              ].map((subject, i) => (
                <button
                  key={i}
                  onClick={() => alert(`${subject.name} curriculum coming soon!`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-ping-primary/20 transition-colors border border-white/10"
                >
                  {subject.icon}
                  <span className="text-sm">{subject.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI Features Section */}
      <section id="ai-features" className="py-20 px-4 bg-gradient-to-b from-background to-ping-primary/5">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Designed for Student Success
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Features that adapt to your unique learning style
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Brain className="w-6 h-6" />,
                title: "Adaptive Learning",
                description: "AI adjusts difficulty and pace based on your progress and understanding",
                demo: "Try adaptive quiz"
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: "24/7 Availability",
                description: "Get help anytime, whether it's late-night homework or weekend studying",
                demo: "Check availability"
              },
              {
                icon: <Heart className="w-6 h-6" />,
                title: "Patient & Encouraging",
                description: "Never feel rushed. Take your time and ask the same question as many times as you need",
                demo: "See example"
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Instant Feedback",
                description: "Know immediately if you're on the right track with real-time corrections",
                demo: "Try it now"
              },
              {
                icon: <Trophy className="w-6 h-6" />,
                title: "Gamified Progress",
                description: "Earn badges, unlock achievements, and compete with friends",
                demo: "View leaderboard"
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Safe & Private",
                description: "COPPA/FERPA compliant with parent controls and content filtering",
                demo: "Learn more"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="h-full p-6 group hover:scale-[1.02] transition-transform">
                  <div className="space-y-4">
                    <div className="p-3 bg-gradient-to-br from-ping-primary/20 to-ping-accent/20 rounded-lg inline-block">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                    <button
                      onClick={() => alert(`Demo: ${feature.title}`)}
                      className="text-sm text-ping-accent hover:text-ping-primary transition-colors opacity-0 group-hover:opacity-100"
                    >
                      {feature.demo} →
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Parent Dashboard Section */}
      <section id="parents" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Parents Love PingLearn Too
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Stay involved in your child's education with comprehensive insights and controls
              </p>

              <div className="space-y-4">
                {[
                  { text: "Real-time progress tracking and grade predictions", icon: <BarChart3 className="w-5 h-5" /> },
                  { text: "Weekly reports on strengths and areas for improvement", icon: <TrendingUp className="w-5 h-5" /> },
                  { text: "Screen time controls and content filtering", icon: <Lock className="w-5 h-5" /> },
                  { text: "Direct communication with human tutors when needed", icon: <MessageCircle className="w-5 h-5" /> },
                  { text: "Curriculum alignment with school standards", icon: <BookOpen className="w-5 h-5" /> }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 group cursor-pointer"
                    onClick={() => alert(`Feature: ${item.text}`)}
                  >
                    <div className="text-ping-accent group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <span className="group-hover:text-ping-primary transition-colors">{item.text}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="mt-8 space-x-4"
              >
                <GlassButton
                  variant="liquid-primary"
                  size="lg"
                  glow
                  className="group"
                  onClick={handleParentPortal}
                >
                  <span>Parent Portal</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </GlassButton>
                <GlassButton
                  variant="liquid-glass"
                  size="lg"
                  onClick={() => window.open('/parent-guide.pdf', '_blank')}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  <span>Parent Guide</span>
                </GlassButton>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <GlassCard className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Sarah's Progress</h3>
                    <select className="text-sm bg-background/50 rounded px-2 py-1 border border-white/10">
                      <option>This Week</option>
                      <option>This Month</option>
                      <option>All Time</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg">
                      <span className="text-sm">Math Grade</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">B+</span>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-500">+5%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg">
                      <span className="text-sm">Study Time</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">12.5 hrs</span>
                        <Clock className="w-4 h-4 text-blue-500" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg">
                      <span className="text-sm">Problems Solved</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">247</span>
                        <Trophy className="w-4 h-4 text-purple-500" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg">
                      <span className="text-sm">Streak</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">14 days</span>
                        <Zap className="w-4 h-4 text-orange-500" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Weekly Goal</span>
                      <span className="text-sm font-bold">85%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-ping-primary to-ping-accent"
                        initial={{ width: 0 }}
                        whileInView={{ width: '85%' }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleParentPortal}
                    className="w-full text-sm text-ping-accent hover:text-ping-primary transition-colors"
                  >
                    View Full Dashboard →
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* School Integration with Interactive Stats */}
      <section id="schools" className="py-20 px-4 bg-gradient-to-b from-background to-ping-primary/5">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by Schools Nationwide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Enhance classroom learning with AI-powered support
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <GlassButton
                variant="liquid-primary"
                size="lg"
                onClick={handleContactSales}
              >
                <Phone className="w-4 h-4 mr-2" />
                Contact Sales
              </GlassButton>
              <GlassButton
                variant="liquid-glass"
                size="lg"
                onClick={handleScheduleDemo}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Demo
              </GlassButton>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <GraduationCap className="w-8 h-8" />,
                stat: "500+",
                label: "Partner Schools",
                growth: "+120 this year"
              },
              {
                icon: <Users className="w-8 h-8" />,
                stat: "2M+",
                label: "Active Students",
                growth: "+45% YoY"
              },
              {
                icon: <Award className="w-8 h-8" />,
                stat: "85%",
                label: "Grade Improvement",
                growth: "Average increase"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="cursor-pointer"
                onClick={() => alert(`Learn more about: ${item.label}`)}
              >
                <GlassCard className="p-8 text-center hover:scale-[1.02] transition-transform">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-gradient-to-br from-ping-primary/20 to-ping-accent/20 rounded-xl">
                      {item.icon}
                    </div>
                  </div>
                  <motion.div
                    className="text-3xl font-bold mb-2"
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.2 + 0.3 }}
                  >
                    {item.stat}
                  </motion.div>
                  <div className="text-muted-foreground">{item.label}</div>
                  <div className="text-sm text-ping-accent mt-2">{item.growth}</div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* School Features */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-ping-primary" />
                Classroom Integration
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  LMS Integration (Canvas, Blackboard, Google Classroom)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Single Sign-On (SSO) Support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Bulk Student Management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Custom Curriculum Alignment
                </li>
              </ul>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-ping-accent" />
                Enterprise Security
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  COPPA & FERPA Compliant
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  SOC 2 Type II Certified
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Data Encryption at Rest & Transit
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Regular Security Audits
                </li>
              </ul>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Enhanced Student Testimonials */}
      <section id="testimonials" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Students Love Learning with PingLearn
            </h2>
            <p className="text-lg text-muted-foreground">
              Real stories from real students
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                quote: "I went from failing math to getting an A! The AI tutor explains things in a way I actually understand.",
                author: "Emma S.",
                grade: "10th Grade",
                school: "Lincoln High School",
                improvement: "+2 Grade Levels",
                subject: "Algebra II",
                rating: 5,
                video: true
              },
              {
                quote: "It's like having a patient teacher available 24/7. I can ask 'dumb' questions without feeling embarrassed.",
                author: "Alex M.",
                grade: "8th Grade",
                school: "Roosevelt Middle",
                improvement: "Honor Roll",
                subject: "Science",
                rating: 5,
                verified: true
              },
              {
                quote: "The voice AI makes learning feel like a conversation. Way better than reading textbooks!",
                author: "Jordan L.",
                grade: "11th Grade",
                school: "Washington Prep",
                improvement: "SAT +200 points",
                subject: "SAT Prep",
                rating: 5,
                featured: true
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="h-full p-6 relative">
                  {testimonial.featured && (
                    <div className="absolute -top-3 -right-3">
                      <span className="px-3 py-1 bg-gradient-to-r from-ping-primary to-ping-accent text-white text-xs rounded-full">
                        Featured
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col h-full">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      ))}
                      {testimonial.verified && (
                        <span className="ml-2 text-xs text-green-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-6 flex-grow">
                      "{testimonial.quote}"
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{testimonial.author}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.grade} • {testimonial.school}</p>
                        </div>
                        {testimonial.video && (
                          <button
                            onClick={() => alert('Video testimonial coming soon!')}
                            className="p-2 rounded-full bg-ping-primary/20 hover:bg-ping-primary/30 transition-colors"
                          >
                            <PlayCircle className="w-4 h-4 text-ping-primary" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <span className="text-xs text-muted-foreground">{testimonial.subject}</span>
                        <span className="text-sm text-ping-accent font-medium">{testimonial.improvement}</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/testimonials')}
              className="text-ping-accent hover:text-ping-primary transition-colors"
            >
              Read more success stories →
            </button>
          </div>
        </div>
      </section>

      {/* Live Performance Metrics */}
      <section id="metrics" className="py-20 px-4 bg-gradient-to-b from-background to-ping-primary/5">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Learning Happening Right Now
            </h2>
            <p className="text-lg text-muted-foreground">
              Live statistics from students around the world
            </p>
          </motion.div>
          <PerformanceMetricsPro />
        </div>
      </section>

      {/* Enhanced CTA Section with Form */}
      <section id="contact-form" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <GlassCard className="p-12 text-center bg-gradient-to-br from-ping-primary/10 to-ping-accent/10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Boost Your Grades?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join millions of students who are already learning smarter, not harder.
                Start your free trial today!
              </p>

              {/* Quick Start Form */}
              <div className="max-w-md mx-auto space-y-4 my-8">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-lg bg-background/50 border border-white/10 focus:border-ping-primary/50 focus:outline-none transition-colors"
                />
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full p-3 rounded-lg bg-background/50 border border-white/10 focus:border-ping-primary/50 focus:outline-none transition-colors"
                >
                  <option value="">Select your grade level</option>
                  <option value="k-2">Grades K-2</option>
                  <option value="3-5">Grades 3-5</option>
                  <option value="6-8">Grades 6-8</option>
                  <option value="9-12">Grades 9-12</option>
                  <option value="college">College</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <GlassButton
                  variant="liquid-primary"
                  size="xl"
                  glow
                  depth="deep"
                  className="min-w-[200px] group"
                  onClick={() => {
                    if (email && selectedGrade) {
                      handleStartLearning()
                    } else {
                      alert('Please enter your email and select a grade level')
                    }
                  }}
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </GlassButton>
                <GlassButton
                  variant="liquid-glass"
                  size="xl"
                  depth="shallow"
                  className="min-w-[200px]"
                  onClick={handleScheduleDemo}
                >
                  <Video className="w-5 h-5 mr-2" />
                  <span>Watch Demo</span>
                </GlassButton>
              </div>

              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mt-8">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Free for 7 days</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Cancel anytime</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex justify-center gap-8 mt-8 pt-8 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  <span>SSL Secure</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>COPPA Compliant</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span>Privacy Protected</span>
                </div>
              </div>
            </motion.div>
          </GlassCard>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2 space-y-4">
              <PingLearnLogoPro size="sm" />
              <p className="text-sm text-muted-foreground">
                AI-powered personalized learning for every student.
                Making education accessible, engaging, and effective.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => window.open('https://twitter.com/pinglearn', '_blank')}
                  className="p-2 rounded-full bg-white/5 hover:bg-ping-primary/20 transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => window.open('https://youtube.com/pinglearn', '_blank')}
                  className="p-2 rounded-full bg-white/5 hover:bg-ping-primary/20 transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                </button>
                <button
                  onClick={() => window.open('https://instagram.com/pinglearn', '_blank')}
                  className="p-2 rounded-full bg-white/5 hover:bg-ping-primary/20 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </button>
                <button
                  onClick={() => window.open('https://linkedin.com/company/pinglearn', '_blank')}
                  className="p-2 rounded-full bg-white/5 hover:bg-ping-primary/20 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                </button>
                <button
                  onClick={() => window.open('https://github.com/pinglearn', '_blank')}
                  className="p-2 rounded-full bg-white/5 hover:bg-ping-primary/20 transition-colors"
                >
                  <Github className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Students</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-foreground transition-colors">How It Works</button></li>
                <li><button onClick={() => scrollToSection('subjects')} className="hover:text-foreground transition-colors">Subjects</button></li>
                <li><button onClick={() => router.push('/pricing')} className="hover:text-foreground transition-colors">Pricing</button></li>
                <li><button onClick={() => router.push('/success-stories')} className="hover:text-foreground transition-colors">Success Stories</button></li>
                <li><button onClick={() => router.push('/mobile-app')} className="hover:text-foreground transition-colors">Mobile App</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Parents</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={handleParentPortal} className="hover:text-foreground transition-colors">Parent Portal</button></li>
                <li><button onClick={() => router.push('/progress-tracking')} className="hover:text-foreground transition-colors">Progress Tracking</button></li>
                <li><button onClick={() => router.push('/safety')} className="hover:text-foreground transition-colors">Safety & Privacy</button></li>
                <li><button onClick={() => router.push('/parent-faqs')} className="hover:text-foreground transition-colors">FAQs</button></li>
                <li><button onClick={() => router.push('/parent-resources')} className="hover:text-foreground transition-colors">Resources</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Schools</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => router.push('/school-dashboard')} className="hover:text-foreground transition-colors">School Dashboard</button></li>
                <li><button onClick={() => router.push('/bulk-pricing')} className="hover:text-foreground transition-colors">Bulk Pricing</button></li>
                <li><button onClick={() => router.push('/integration')} className="hover:text-foreground transition-colors">LMS Integration</button></li>
                <li><button onClick={handleContactSales} className="hover:text-foreground transition-colors">Contact Sales</button></li>
                <li><button onClick={() => router.push('/case-studies')} className="hover:text-foreground transition-colors">Case Studies</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
              <p>© 2025 PingLearn. Making learning personal for everyone.</p>
              <div className="flex gap-6 mt-4 md:mt-0">
                <button onClick={() => router.push('/privacy')} className="hover:text-foreground transition-colors">Privacy</button>
                <button onClick={() => router.push('/terms')} className="hover:text-foreground transition-colors">Terms</button>
                <button onClick={() => router.push('/support')} className="hover:text-foreground transition-colors">Support</button>
                <button onClick={() => router.push('/blog')} className="hover:text-foreground transition-colors">Blog</button>
                <button onClick={() => router.push('/careers')} className="hover:text-foreground transition-colors">Careers</button>
                <button onClick={() => window.open('https://status.pinglearn.app', '_blank')} className="hover:text-foreground transition-colors">Status</button>
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col md:flex-row gap-4 mt-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3" />
                <span>support@pinglearn.app</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3" />
                <span>1-800-PINGLEARN</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-3 h-3" />
                <span>Live Chat Available</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}