"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Send,
  MessageSquare,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  School,
  Users,
  HelpCircle
} from "lucide-react";

export default function ContactRedesigned() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    userType: "parent",
    subject: "",
    message: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus("success");

      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitStatus("idle");
        setFormData({
          name: "",
          email: "",
          userType: "parent",
          subject: "",
          message: ""
        });
      }, 3000);
    }, 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "support@pinglearn.com",
      response: "Response within 2 hours"
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Available 24/7",
      response: "Instant response"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "+91 1800-PINGLEARN",
      response: "Mon-Fri, 9 AM - 6 PM IST"
    }
  ];

  const commonQuestions = [
    "How do I start my free trial?",
    "What subjects are covered?",
    "How does voice learning work?",
    "Can multiple children use one account?",
    "What's your refund policy?",
    "How do I track my child's progress?"
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-black" id="contact">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-cyan-400/60 text-sm tracking-[0.3em] uppercase font-medium mb-4">
            Get In Touch
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            We&apos;re Here to
            <span className="text-gradient bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> Help</span>
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Questions about our platform? Need help getting started? Our support team is ready to assist you.
          </p>
        </motion.div>

        {/* Contact Methods */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 mb-16"
        >
          {contactMethods.map((method, index) => (
            <div
              key={method.title}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-cyan-500/30 transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <method.icon className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{method.title}</h3>
              <p className="text-white/80 mb-2">{method.description}</p>
              <p className="text-cyan-400 text-sm">{method.response}</p>
            </div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-white">Send us a Message</h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Input */}
                <div>
                  <label htmlFor="name" className="block text-white/80 mb-2 text-sm font-medium">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-white/80 mb-2 text-sm font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                {/* User Type Select */}
                <div>
                  <label htmlFor="userType" className="block text-white/80 mb-2 text-sm font-medium">
                    I am a
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <select
                      id="userType"
                      name="userType"
                      value={formData.userType}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white appearance-none focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                    >
                      <option value="parent" className="bg-gray-900">Parent</option>
                      <option value="student" className="bg-gray-900">Student</option>
                      <option value="teacher" className="bg-gray-900">Teacher</option>
                      <option value="school" className="bg-gray-900">School Administrator</option>
                    </select>
                  </div>
                </div>

                {/* Subject Input */}
                <div>
                  <label htmlFor="subject" className="block text-white/80 mb-2 text-sm font-medium">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="How can we help?"
                  />
                </div>

                {/* Message Textarea */}
                <div>
                  <label htmlFor="message" className="block text-white/80 mb-2 text-sm font-medium">
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                    placeholder="Tell us more about your needs..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || submitStatus === "success"}
                  className={`w-full py-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                    submitStatus === "success"
                      ? "bg-green-500/20 border border-green-500 text-green-400"
                      : submitStatus === "error"
                      ? "bg-red-500/20 border border-red-500 text-red-400"
                      : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600"
                  } ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : submitStatus === "success" ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Message Sent Successfully!</span>
                    </>
                  ) : submitStatus === "error" ? (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      <span>Error. Please try again.</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-2 text-white">Frequently Asked Questions</h3>
                <p className="text-white/60">Quick answers to common questions</p>
              </div>

              <div className="space-y-4">
                {commonQuestions.map((question, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3">
                      <HelpCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                      <span className="text-white/80 group-hover:text-white transition-colors">
                        {question}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Response Time Card */}
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-6 mt-8">
                <div className="flex items-center space-x-3 mb-3">
                  <Clock className="w-6 h-6 text-cyan-400" />
                  <h4 className="text-lg font-semibold text-white">Our Promise</h4>
                </div>
                <p className="text-white/70">
                  We respond to all inquiries within <span className="text-cyan-400 font-semibold">2 hours</span> during business hours
                  and <span className="text-cyan-400 font-semibold">30 seconds</span> on live chat.
                </p>
              </div>

              {/* School Inquiry Card */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <School className="w-6 h-6 text-cyan-400" />
                  <h4 className="text-lg font-semibold text-white">For Schools</h4>
                </div>
                <p className="text-white/70 mb-4">
                  Looking for bulk licenses or custom solutions for your institution?
                </p>
                <a
                  href="#"
                  className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Contact our Enterprise Team →
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}