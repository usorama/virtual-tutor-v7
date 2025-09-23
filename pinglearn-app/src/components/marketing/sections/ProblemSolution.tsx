"use client";

import { motion } from "framer-motion";
import { AlertTriangle, DollarSign, Clock, TrendingDown, Zap, Heart, Brain } from "lucide-react";

const problems = [
  {
    icon: AlertTriangle,
    title: "Math Anxiety & Fear",
    description: "Students develop fear of mathematics due to traditional teaching methods that focus on memorization rather than understanding.",
    stat: "73% of students experience math anxiety",
    color: "from-red-500 to-red-600"
  },
  {
    icon: DollarSign,
    title: "Expensive Private Tutoring",
    description: "Quality tutors charge ₹5,000+ per month, making personalized learning unaffordable for most families.",
    stat: "₹60,000+ per year average cost",
    color: "from-orange-500 to-orange-600"
  },
  {
    icon: Clock,
    title: "Rigid Schedules",
    description: "Fixed tuition timings don't fit busy student schedules, leading to missed sessions and inconsistent learning.",
    stat: "40% of sessions missed due to scheduling",
    color: "from-yellow-500 to-yellow-600"
  },
  {
    icon: TrendingDown,
    title: "One-Size-Fits-All Teaching",
    description: "Traditional methods ignore individual learning pace and style, leaving many students behind.",
    stat: "65% feel teaching is too fast/slow",
    color: "from-purple-500 to-purple-600"
  }
];

const solutions = [
  {
    icon: Heart,
    title: "Patient & Encouraging",
    description: "PingLearn never gets frustrated, always maintains patience, and celebrates every small victory with your child.",
    benefit: "Builds confidence & reduces anxiety"
  },
  {
    icon: Brain,
    title: "Adaptive Intelligence",
    description: "AI analyzes your child's learning pattern and adjusts difficulty, pace, and teaching style in real-time.",
    benefit: "Personalized learning experience"
  },
  {
    icon: Zap,
    title: "Available 24/7",
    description: "Study whenever your child feels ready - early morning, late evening, or during weekend breaks.",
    benefit: "Learn at your convenience"
  },
  {
    icon: DollarSign,
    title: "Affordable Excellence",
    description: "Premium learning at just ₹999/month - less than the cost of 2 traditional tuition sessions.",
    benefit: "Save ₹50,000+ annually"
  }
];

export default function ProblemSolution() {
  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900" id="problems">
      <div className="container mx-auto px-4">
        {/* Problems Section */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              The Learning Crisis in
              <span className="text-gradient bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent"> Indian Education</span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Despite spending thousands on tuition, most students still struggle with mathematics.
              Here's why traditional tutoring is failing our children.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {problems.map((problem, index) => (
              <motion.div
                key={problem.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative group"
              >
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 h-full hover:bg-white/10 transition-all duration-300">
                  {/* Icon with gradient background */}
                  <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${problem.color} p-3 mb-4`}>
                    <problem.icon className="w-full h-full text-white" />
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-3">{problem.title}</h3>
                  <p className="text-white/70 mb-4 leading-relaxed">{problem.description}</p>

                  <div className="text-sm font-semibold text-cyan-400 bg-cyan-400/10 rounded-lg px-3 py-2 inline-block">
                    {problem.stat}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Transition */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center py-16"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-3xl" />
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                There's a <span className="text-cyan-400">Better Way</span>
              </h3>
              <p className="text-xl text-white/80">
                Introducing AI-powered personalized tutoring that adapts to every child's unique learning needs
              </p>
            </div>
          </div>
        </motion.div>

        {/* Solutions Section */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How PingLearn
              <span className="text-gradient bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> Solves Everything</span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              PingLearn addresses each problem with innovative technology and empathetic teaching.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            {solutions.map((solution, index) => (
              <motion.div
                key={solution.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="flex items-start space-x-6"
              >
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-3">
                  <solution.icon className="w-full h-full text-white" />
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-white mb-3">{solution.title}</h3>
                  <p className="text-white/70 mb-4 leading-relaxed text-lg">{solution.description}</p>
                  <div className="text-cyan-400 font-semibold bg-cyan-400/10 rounded-lg px-4 py-2 inline-block">
                    ✓ {solution.benefit}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Before vs After comparison */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <h3 className="text-3xl font-bold text-center mb-12">Student Transformation</h3>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Before */}
              <div className="text-center">
                <div className="text-6xl mb-4">😰</div>
                <h4 className="text-xl font-semibold text-white/60 mb-4">Before PingLearn</h4>
                <ul className="text-white/70 space-y-2 text-left max-w-sm mx-auto">
                  <li>• Afraid to ask questions</li>
                  <li>• Struggles with homework</li>
                  <li>• Anxious about exams</li>
                  <li>• Falling behind in class</li>
                  <li>• Low confidence in math</li>
                </ul>
              </div>

              {/* After */}
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h4 className="text-xl font-semibold text-cyan-400 mb-4">After PingLearn</h4>
                <ul className="text-white/70 space-y-2 text-left max-w-sm mx-auto">
                  <li>• Confident in problem-solving</li>
                  <li>• Enjoys learning math</li>
                  <li>• Improved grades consistently</li>
                  <li>• Ahead of class curriculum</li>
                  <li>• Excited about challenges</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}