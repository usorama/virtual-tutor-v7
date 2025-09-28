import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/katex.css";
import "../styles/marketing.css";
import "../styles/glass-morphism.css";
import { AuthProvider } from '@/lib/auth/auth-provider';
import Navigation from '@/components/marketing/sections/Navigation';
import { ThemeProvider } from '@/contexts/ThemeContext';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://pinglearn.app'),
  title: 'PingLearn - AI Math Tutor for CBSE Students | Voice-Powered Learning',
  description: 'Revolutionary AI tutor that helps students excel in Mathematics and Science through voice conversations. CBSE aligned, 24/7 available. Start free trial.',
  keywords: [
    'AI math tutor',
    'online tutoring India',
    'CBSE math help',
    'voice AI teacher',
    'personalized learning app',
    'math tuition online',
    'adaptive learning platform',
    'Class 10 math tutor',
    'JEE preparation app',
    'NCERT solutions'
  ].join(', '),
  authors: [{ name: 'PingLearn' }],
  creator: 'PingLearn',
  publisher: 'PingLearn',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://pinglearn.app',
    siteName: 'PingLearn',
    title: 'PingLearn - AI Math Tutor for CBSE Students',
    description: 'Revolutionary AI tutor that helps students excel in Mathematics and Science through voice conversations. CBSE aligned, 24/7 available.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PingLearn - AI Math Tutor',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PingLearn - AI Math Tutor for CBSE Students',
    description: 'Revolutionary AI tutor that helps students excel in Mathematics and Science through voice conversations.',
    images: ['/og-image.jpg'],
    creator: '@pinglearn',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        {/* Critical CSS to prevent white flash */}
        <style dangerouslySetInnerHTML={{
          __html: `
            html {
              background-color: #000000 !important;
              height: 100%;
            }
            body {
              background-color: #000000 !important;
              min-height: 100vh;
            }
          `
        }} />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen text-foreground`}
        style={{ backgroundColor: '#000000', minHeight: '100vh' }}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
