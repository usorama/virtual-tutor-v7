"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import ConicGradientButton from "../ui/ConicGradientButton";
import { useAuth } from "@/lib/auth/auth-provider";

interface NavigationProps {
  transparent?: boolean;
}

const menuItems = [
  {
    label: "Features",
    href: "/features",
    dropdown: [
      { label: "Voice Learning", href: "/features#voice-learning" },
      { label: "Real-time Math", href: "/features#math-rendering" },
      { label: "Adaptive Learning", href: "/features#adaptive" },
      { label: "Progress Tracking", href: "/features#progress" }
    ]
  },
  {
    label: "Subjects",
    href: "#subjects",
    dropdown: [
      { label: "Mathematics", href: "#mathematics" },
      { label: "Science", href: "#science" },
      { label: "Physics", href: "#physics" },
      { label: "Chemistry", href: "#chemistry" }
    ]
  },
  {
    label: "How It Works",
    href: "#how-it-works"
  },
  {
    label: "Pricing",
    href: "/pricing"
  },
  {
    label: "Changelog",
    href: "/changelog"
  },
  {
    label: "Resources",
    dropdown: [
      { label: "Blog", href: "/blog" },
      { label: "Study Guides", href: "/resources/guides" },
      { label: "Parent Guide", href: "/resources/parents" },
      { label: "Success Stories", href: "#testimonials" }
    ]
  },
  {
    label: "Contact",
    href: "#contact"
  }
];

export default function Navigation({ transparent = false }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { user, loading } = useAuth();

  // Marketing navigation should always be visible on marketing pages
  // The app has different navigation for authenticated users in the main app area

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      transparent ? 'bg-transparent' : 'bg-black/80 backdrop-blur-md border-b border-white/10'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logos/pinglearn-logo.png"
              alt="PingLearn"
              width={225}
              height={75}
              className="h-16 w-auto"
              priority
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-8">
            {menuItems.map((item) => (
              <div key={item.label} className="relative group">
                {item.dropdown ? (
                  <>
                    <button
                      className="flex items-center space-x-1 text-white/80 hover:text-white transition-colors duration-200"
                      onMouseEnter={() => setOpenDropdown(item.label)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <span>{item.label}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    <AnimatePresence>
                      {openDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 mt-2 w-56 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg shadow-xl overflow-hidden"
                          onMouseEnter={() => setOpenDropdown(item.label)}
                          onMouseLeave={() => setOpenDropdown(null)}
                        >
                          {item.dropdown.map((dropItem) => (
                            <Link
                              key={dropItem.label}
                              href={dropItem.href}
                              className="block px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-colors duration-200"
                            >
                              {dropItem.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className="text-white/80 hover:text-white transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              href="/login"
              className="text-white/80 hover:text-white transition-colors duration-200 px-4 py-2"
            >
              Sign In
            </Link>
            <ConicGradientButton href="/register" size="sm">
              Start Free Trial
            </ConicGradientButton>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden text-white p-2"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden bg-black/95 backdrop-blur-md border-t border-white/10 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                {menuItems.map((item) => (
                  <div key={item.label}>
                    {item.dropdown ? (
                      <>
                        <button
                          onClick={() => handleDropdownToggle(item.label)}
                          className="flex items-center justify-between w-full text-white/80 hover:text-white transition-colors duration-200 py-2"
                        >
                          <span>{item.label}</span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              openDropdown === item.label ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        <AnimatePresence>
                          {openDropdown === item.label && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="ml-4 space-y-2 overflow-hidden"
                            >
                              {item.dropdown.map((dropItem) => (
                                <Link
                                  key={dropItem.label}
                                  href={dropItem.href}
                                  className="block text-white/60 hover:text-white transition-colors duration-200 py-2"
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  {dropItem.label}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <Link
                        href={item.href}
                        className="block text-white/80 hover:text-white transition-colors duration-200 py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    )}
                  </div>
                ))}

                {/* Mobile Auth Buttons */}
                <div className="pt-4 space-y-3 border-t border-white/10">
                  <Link
                    href="/login"
                    className="block text-center text-white/80 hover:text-white transition-colors duration-200 py-3"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <ConicGradientButton
                    href="/register"
                    className="w-full text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Start Free Trial
                  </ConicGradientButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}