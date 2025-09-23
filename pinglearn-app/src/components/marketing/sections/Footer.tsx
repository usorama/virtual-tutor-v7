"use client";

import { motion } from "framer-motion";
import { Heart, Mail, Phone, Twitter, Linkedin, Youtube, Instagram } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
      { label: "Success Stories", href: "#testimonials" },
      { label: "FAQ", href: "#faq" }
    ]
  },
  {
    title: "Subjects",
    links: [
      { label: "Mathematics", href: "#mathematics" },
      { label: "Science", href: "#science" },
      { label: "Physics", href: "#physics" },
      { label: "Chemistry", href: "#chemistry" },
      { label: "English", href: "#english" }
    ]
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
      { label: "Press", href: "/press" },
      { label: "Contact", href: "#contact" }
    ]
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Parent Guide", href: "/resources/parents" },
      { label: "Student Resources", href: "/resources/students" },
      { label: "Technical Support", href: "/support" },
      { label: "Feedback", href: "/feedback" }
    ]
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "COPPA Compliance", href: "/coppa" },
      { label: "Data Security", href: "/security" },
      { label: "Cookie Policy", href: "/cookies" }
    ]
  }
];

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com/pinglearn", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/company/pinglearn", label: "LinkedIn" },
  { icon: Youtube, href: "https://youtube.com/@pinglearn", label: "YouTube" },
  { icon: Instagram, href: "https://instagram.com/pinglearn", label: "Instagram" }
];

const certifications = [
  { label: "COPPA Compliant", icon: "🛡️" },
  { label: "ISO 27001 Certified", icon: "🔒" },
  { label: "SSL Secured", icon: "🔐" }
];

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black border-t border-white/10">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h3 className="text-3xl font-bold mb-4">
              Get Learning Tips & Updates
            </h3>
            <p className="text-white/70 mb-8">
              Subscribe to our newsletter for the latest educational insights,
              study tips, and product updates.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-cyan-500 transition-colors duration-300"
              />
              <button className="bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-300">
                Subscribe
              </button>
            </div>

            <p className="text-white/40 text-sm mt-4">
              No spam, unsubscribe anytime. We respect your privacy.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Link href="/" className="inline-block mb-6">
                <Image
                  src="/logos/pinglearn-logo.png"
                  alt="PingLearn"
                  width={225}
                  height={75}
                  className="h-14 w-auto"
                />
              </Link>

              <p className="text-white/70 mb-6 text-sm leading-relaxed">
                Empowering students with AI-powered personalized learning.
                Making quality education accessible to everyone.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <a
                    href="mailto:support@pinglearn.app"
                    className="text-white/70 hover:text-white transition-colors duration-300 text-sm"
                  >
                    support@pinglearn.app
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-cyan-400" />
                  <a
                    href="tel:+919876543210"
                    className="text-white/70 hover:text-white transition-colors duration-300 text-sm"
                  >
                    +91 98765 43210
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="col-span-1"
            >
              <h4 className="text-white font-semibold mb-6">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/60 hover:text-white transition-colors duration-300 text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
            {/* Copyright */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center lg:text-left"
            >
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-white/60 text-sm">
                <span>© 2025</span>
                <Image
                  src="/logos/pinglearn-logo.png"
                  alt="PingLearn"
                  width={80}
                  height={27}
                  className="h-5 w-auto opacity-80"
                />
                <span>All rights reserved.</span>
                <span className="flex items-center gap-1">
                  Made with <Heart className="w-4 h-4 text-cyan-400" fill="currentColor" /> for learners everywhere.
                </span>
              </div>
            </motion.div>

            {/* Certifications */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex items-center space-x-6"
            >
              {certifications.map((cert) => (
                <div key={cert.label} className="flex items-center space-x-2">
                  <span className="text-lg">{cert.icon}</span>
                  <span className="text-white/60 text-xs">{cert.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex items-center space-x-4"
            >
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors duration-300 group"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-white/60 group-hover:text-white transition-colors duration-300" />
                </a>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
}