"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, Clock, Send, CheckCircle, AlertCircle } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    userType: "",
    inquiryType: "",
    message: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");

  const userTypes = [
    "Parent",
    "Student",
    "Teacher",
    "School Administrator",
    "Other"
  ];

  const inquiryTypes = [
    "General Question",
    "Technical Support",
    "Billing Question",
    "School Partnership",
    "Media Inquiry",
    "Other"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage("");

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          submittedAt: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer || window.location.href
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      setSubmitStatus('success');
      setFormData({
        name: "",
        email: "",
        phone: "",
        userType: "",
        inquiryType: "",
        message: ""
      });

    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitStatus('error');
      setErrorMessage("Failed to send message. Please try again or email us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900" id="contact">
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
            Get in
            <span className="text-gradient bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> Touch</span>
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Have questions about PingLearn? Our support team is here to help you succeed.
            Reach out and we'll respond within 24 hours.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <h3 className="text-3xl font-bold mb-6">We're Here to Help</h3>
              <p className="text-white/70 text-lg leading-relaxed">
                Whether you're a parent looking to support your child's learning journey,
                a student ready to excel, or an educator interested in our platform,
                we'd love to hear from you.
              </p>
            </div>

            {/* Contact methods */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg p-3 flex-shrink-0">
                  <Mail className="w-full h-full text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white mb-2">Email Support</h4>
                  <p className="text-white/70 mb-2">Get help with any questions or technical issues</p>
                  <a
                    href="mailto:support@pinglearn.app"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors duration-300"
                  >
                    support@pinglearn.app
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg p-3 flex-shrink-0">
                  <Phone className="w-full h-full text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white mb-2">Phone Support</h4>
                  <p className="text-white/70 mb-2">Speak directly with our support team</p>
                  <a
                    href="tel:+919876543210"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors duration-300"
                  >
                    +91 98765 43210
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg p-3 flex-shrink-0">
                  <Clock className="w-full h-full text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white mb-2">Support Hours</h4>
                  <p className="text-white/70">Monday - Saturday: 9 AM - 6 PM IST</p>
                  <p className="text-white/70">Sunday: 10 AM - 4 PM IST</p>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h4 className="text-xl font-semibold text-white mb-4">Response Times</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">&lt; 2h</div>
                  <div className="text-white/60 text-sm">Email Response</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">&lt; 30s</div>
                  <div className="text-white/60 text-sm">Phone Pickup</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">Send us a Message</h3>

              {submitStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4 mb-6"
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-cyan-400" />
                    <p className="text-cyan-400 font-semibold">
                      Thank you! We'll respond within 24 hours.
                    </p>
                  </div>
                </motion.div>
              )}

              {submitStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6"
                >
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-white/60" />
                    <p className="text-white/60 font-semibold">{errorMessage}</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-white font-medium mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-cyan-500 transition-colors duration-300"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-white font-medium mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-cyan-500 transition-colors duration-300"
                    placeholder="Enter your email address"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-white font-medium mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    pattern="[0-9]{10}"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-cyan-500 transition-colors duration-300"
                    placeholder="Enter your phone number (optional)"
                  />
                </div>

                {/* User Type */}
                <div>
                  <label htmlFor="userType" className="block text-white font-medium mb-2">
                    I am a... *
                  </label>
                  <select
                    id="userType"
                    name="userType"
                    required
                    value={formData.userType}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors duration-300"
                  >
                    <option value="">Select your role</option>
                    {userTypes.map((type) => (
                      <option key={type} value={type} className="bg-black text-white">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Inquiry Type */}
                <div>
                  <label htmlFor="inquiryType" className="block text-white font-medium mb-2">
                    Inquiry Type *
                  </label>
                  <select
                    id="inquiryType"
                    name="inquiryType"
                    required
                    value={formData.inquiryType}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors duration-300"
                  >
                    <option value="">Select inquiry type</option>
                    {inquiryTypes.map((type) => (
                      <option key={type} value={type} className="bg-black text-white">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-white font-medium mb-2">
                    Your Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-cyan-500 transition-colors duration-300 resize-none"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>

              <p className="text-white/40 text-sm mt-4 text-center">
                We respect your privacy and will never share your information.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}