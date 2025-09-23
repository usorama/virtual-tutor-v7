import { Inter } from 'next/font/google';
import Navigation from '@/components/marketing/sections/Navigation';
import { Metadata } from 'next';
import '@/styles/marketing.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
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

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className} min-h-screen bg-black text-white`}>
      <Navigation />
      <main className="pt-20">
        {children}
      </main>
    </div>
  );
}