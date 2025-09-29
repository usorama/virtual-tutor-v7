import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/katex.css";
import "../styles/marketing.css";
import "../styles/glass-morphism.css";
import { AuthProvider } from '@/lib/auth/auth-provider';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ErrorBoundary } from '@/lib/error-handling/error-boundary';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent FOUC with inline script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storedTheme = localStorage.getItem('theme');
                  const theme = storedTheme || 'system';

                  let resolved;
                  if (theme === 'system') {
                    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches
                      ? 'dark'
                      : 'light';
                  } else {
                    resolved = theme;
                  }

                  document.documentElement.classList.add(resolved);
                  document.documentElement.style.colorScheme = resolved;
                } catch (e) {
                  // Fallback to dark theme if anything fails
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        <ErrorBoundary
          onError={(error, errorInfo) => {
            // Log to error reporting service in production
            if (process.env.NODE_ENV === 'production') {
              console.error('App-level error caught:', error, errorInfo);
              // TODO: Send to error reporting service (e.g., Sentry)
            }
          }}
        >
          <ThemeProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}