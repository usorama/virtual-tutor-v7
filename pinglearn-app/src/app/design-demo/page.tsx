import '../../styles/glass-morphism.css';
import { Clock, Trophy, BookOpen, Brain, ChevronRight, Sparkles, Zap, Target } from 'lucide-react';

export default function DesignDemoPage() {
  return (
    <div className="min-h-screen bg-app">
      {/* Navigation Bar */}
      <nav className="liquid-glass fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" />
            <span className="text-xl font-bold text-primary">PingLearn Design System</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="glass-button-secondary px-4 py-2 text-sm">
              Documentation
            </button>
            <button className="glass-button px-4 py-2 text-sm">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 pt-24 pb-12">
        {/* Hero Section */}
        <section className="mb-16 text-center">
          <h1 className="text-largeTitle text-primary mb-4">
            Apple's Liquid Glass Design
          </h1>
          <p className="text-body text-secondary max-w-2xl mx-auto mb-2">
            Crafted with Apple's new material called Liquid Glass - a translucent material that
          </p>
          <p className="text-body text-secondary max-w-2xl mx-auto">
            reflects and refracts its surroundings, bringing greater focus to content
          </p>
        </section>

        {/* Apple Typography System */}
        <section className="mb-16">
          <h2 className="text-title1 text-primary mb-8">SF Pro Typography System</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Typography Scale */}
            <div className="glass-card p-6">
              <h3 className="text-headline text-primary mb-6">Typography Scale</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-largeTitle text-primary">Large Title</p>
                  <p className="text-caption1 text-tertiary">34pt • Regular • SF Pro Display</p>
                </div>
                <div>
                  <p className="text-title1 text-primary">Title 1</p>
                  <p className="text-caption1 text-tertiary">28pt • Regular • SF Pro Display</p>
                </div>
                <div>
                  <p className="text-title2 text-primary">Title 2</p>
                  <p className="text-caption1 text-tertiary">22pt • Regular • SF Pro Display</p>
                </div>
                <div>
                  <p className="text-title3 text-primary">Title 3</p>
                  <p className="text-caption1 text-tertiary">20pt • Regular • SF Pro Display</p>
                </div>
                <div>
                  <p className="text-headline text-primary">Headline</p>
                  <p className="text-caption1 text-tertiary">17pt • Semibold • SF Pro Text</p>
                </div>
                <div>
                  <p className="text-body text-primary">Body</p>
                  <p className="text-caption1 text-tertiary">17pt • Regular • SF Pro Text</p>
                </div>
                <div>
                  <p className="text-callout text-primary">Callout</p>
                  <p className="text-caption1 text-tertiary">16pt • Regular • SF Pro Text</p>
                </div>
                <div>
                  <p className="text-subheadline text-primary">Subheadline</p>
                  <p className="text-caption1 text-tertiary">15pt • Regular • SF Pro Text</p>
                </div>
                <div>
                  <p className="text-footnote text-primary">Footnote</p>
                  <p className="text-caption1 text-tertiary">13pt • Regular • SF Pro Text</p>
                </div>
                <div>
                  <p className="text-caption1 text-primary">Caption 1</p>
                  <p className="text-caption1 text-tertiary">12pt • Regular • SF Pro Text</p>
                </div>
                <div>
                  <p className="text-caption2 text-primary">Caption 2</p>
                  <p className="text-caption1 text-tertiary">11pt • Regular • SF Pro Text</p>
                </div>
              </div>
            </div>

            {/* Font Weights */}
            <div className="glass-card p-6">
              <h3 className="text-headline text-primary mb-6">Font Weights</h3>
              <div className="space-y-4">
                <p className="text-body font-ultralight text-primary">Ultralight (100)</p>
                <p className="text-body font-thin text-primary">Thin (200)</p>
                <p className="text-body font-light text-primary">Light (300)</p>
                <p className="text-body font-regular text-primary">Regular (400)</p>
                <p className="text-body font-medium text-primary">Medium (500)</p>
                <p className="text-body font-semibold text-primary">Semibold (600)</p>
                <p className="text-body font-bold text-primary">Bold (700)</p>
                <p className="text-body font-heavy text-primary">Heavy (800)</p>
                <p className="text-body font-black text-primary">Black (900)</p>
              </div>

              <div className="mt-8 p-4 bg-white/[0.01] rounded-lg">
                <p className="text-caption1 text-tertiary mb-2">SF Pro Font Family</p>
                <p className="text-footnote text-muted">
                  • SF Pro Display: Large text (20pt+)<br />
                  • SF Pro Text: Body text (&lt;20pt)<br />
                  • SF Pro Rounded: Friendly variant<br />
                  • SF Mono: Code and monospace
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Metric Cards Grid */}
        <section className="mb-16">
          <h2 className="text-title2 text-primary mb-8">Dashboard Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Metric Card 1 */}
            <div className="glass-card glass-card-hover p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-caption1 text-tertiary mb-1">Study Sessions</p>
                  <p className="text-title1 font-semibold text-primary">127</p>
                </div>
                <Clock className="w-5 h-5 text-tertiary" />
              </div>
              <div className="flex items-center gap-2">
                <span className="glass-badge-active">+12%</span>
                <span className="text-caption2 text-muted">from last week</span>
              </div>
            </div>

            {/* Metric Card 2 */}
            <div className="glass-card glass-card-hover p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-caption1 text-tertiary mb-1">Achievements</p>
                  <p className="text-title1 font-semibold text-primary">89</p>
                </div>
                <Trophy className="w-5 h-5 text-accent" />
              </div>
              <div className="flex items-center gap-2">
                <span className="glass-badge-active">New Badge</span>
                <span className="text-caption2 text-muted">Math Expert</span>
              </div>
            </div>

            {/* Metric Card 3 */}
            <div className="glass-card glass-card-hover p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-caption1 text-tertiary mb-1">Textbooks</p>
                  <p className="text-title1 font-semibold text-primary">24</p>
                </div>
                <BookOpen className="w-5 h-5 text-tertiary" />
              </div>
              <div className="flex items-center gap-2">
                <span className="glass-badge">3 New</span>
                <span className="text-caption2 text-muted">this month</span>
              </div>
            </div>

            {/* Metric Card 4 */}
            <div className="glass-card glass-card-hover p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-caption1 text-tertiary mb-1">Topics Learned</p>
                  <p className="text-title1 font-semibold text-primary">156</p>
                </div>
                <Brain className="w-5 h-5 text-tertiary" />
              </div>
              <div className="flex items-center gap-2">
                <span className="glass-badge-muted">2 Review</span>
                <span className="text-caption2 text-muted">needed</span>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Cards */}
        <section className="mb-16">
          <h2 className="text-title2 text-primary mb-8">Interactive Components</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Learning Session Card */}
            <div className="liquid-glass p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-headline text-primary">Quick Start Learning</h3>
                <span className="glass-badge pulse-glow">
                  <Zap className="w-3 h-3 inline mr-1" />
                  Active
                </span>
              </div>

              <div className="space-y-4">
                <div className="glass-interactive p-4 flex items-center justify-between group cursor-pointer hover-lift">
                  <div>
                    <p className="text-primary font-medium">Mathematics - Algebra</p>
                    <p className="text-footnote text-secondary">Continue where you left off</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-tertiary group-hover:text-accent transition-colors" />
                </div>

                <div className="glass-interactive p-4 flex items-center justify-between group cursor-pointer hover-lift">
                  <div>
                    <p className="text-primary font-medium">Physics - Motion</p>
                    <p className="text-footnote text-secondary">New chapter available</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-tertiary group-hover:text-accent transition-colors" />
                </div>
              </div>

              <button className="glass-button-primary w-full mt-6">
                Start Learning Session
              </button>
            </div>

            {/* Progress Card */}
            <div className="liquid-glass p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-headline text-primary">Your Progress</h3>
                <Target className="w-5 h-5 text-accent" />
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-secondary">Mathematics</span>
                    <span className="text-sm text-primary font-medium">78%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full" style={{ width: '78%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-secondary">Physics</span>
                    <span className="text-sm text-primary font-medium">65%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-secondary">Chemistry</span>
                    <span className="text-sm text-primary font-medium">92%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-accent-cyan/10 border border-accent-cyan/20 rounded-lg">
                <p className="text-sm text-accent font-medium">🎯 Daily Goal</p>
                <p className="text-xs text-secondary mt-1">Complete 3 more topics to reach your target</p>
              </div>
            </div>
          </div>
        </section>

        {/* Button Examples */}
        <section className="mb-16">
          <h2 className="text-title2 text-primary mb-8">Button Variants</h2>
          <div className="glass-card p-8">
            <div className="flex flex-wrap gap-4">
              <button className="glass-button-primary">Primary (Pulse)</button>
              <button className="glass-button">Standard Button</button>
              <button className="glass-button-secondary">Secondary</button>
            </div>
          </div>
        </section>

        {/* Form Elements */}
        <section className="mb-16">
          <h2 className="text-title2 text-primary mb-8">Form Elements</h2>
          <div className="glass-card p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-secondary mb-2">Email Address</label>
                <input
                  type="email"
                  className="glass-interactive w-full px-4 py-3 bg-transparent text-primary placeholder:text-muted outline-none"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm text-secondary mb-2">Subject</label>
                <select className="glass-interactive w-full px-4 py-3 bg-transparent text-primary outline-none">
                  <option>Mathematics</option>
                  <option>Physics</option>
                  <option>Chemistry</option>
                </select>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm text-secondary mb-2">Message</label>
              <textarea
                className="glass-interactive w-full px-4 py-3 bg-transparent text-primary placeholder:text-muted outline-none resize-none glass-scrollbar"
                rows={4}
                placeholder="Type your message here..."
              />
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section className="mb-16">
          <h2 className="text-title2 text-primary mb-8">Color System</h2>
          <div className="glass-card p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-full h-24 bg-[#0D0D0D] rounded-lg border border-white/10 mb-2" />
                <p className="text-sm text-secondary">Background</p>
                <p className="text-xs text-muted">#0D0D0D</p>
              </div>
              <div className="text-center">
                <div className="w-full h-24 bg-white rounded-lg mb-2" />
                <p className="text-sm text-secondary">Primary Text</p>
                <p className="text-xs text-muted">#FFFFFF</p>
              </div>
              <div className="text-center">
                <div className="w-full h-24 bg-[#06B6D4] rounded-lg mb-2" />
                <p className="text-sm text-secondary">Accent Cyan</p>
                <p className="text-xs text-muted">#06B6D4</p>
              </div>
              <div className="text-center">
                <div className="w-full h-24 bg-white/10 rounded-lg border border-white/10 mb-2" />
                <p className="text-sm text-secondary">Glass Effect</p>
                <p className="text-xs text-muted">White 3%</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}