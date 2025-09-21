import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PingLearn - AI-Powered Personalized Education Platform",
  description: "Revolutionary AI tutoring platform for grades 9-12. Real-time voice interaction, personalized learning paths, and comprehensive progress tracking. Join the future of education.",
  keywords: [
    "AI tutoring",
    "personalized learning",
    "online education",
    "grades 9-12",
    "voice interaction",
    "CBSE curriculum",
    "AI teacher",
    "educational technology",
    "student progress tracking",
    "interactive learning"
  ],
  authors: [{ name: "PingLearn Team" }],
  creator: "PingLearn",
  publisher: "PingLearn",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pinglearn.app",
    title: "PingLearn - AI-Powered Education Platform",
    description: "Experience the future of learning with AI-powered personalized tutoring for grades 9-12. Real-time voice interaction and adaptive learning paths.",
    siteName: "PingLearn",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PingLearn - AI-Powered Education Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PingLearn - AI-Powered Education",
    description: "Revolutionary AI tutoring platform with real-time voice interaction for grades 9-12",
    images: ["/og-image.png"],
    creator: "@pinglearn",
  },
  verification: {
    google: "your-google-site-verification-code",
  },
  alternates: {
    canonical: "https://pinglearn.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "PingLearn",
              "description": "AI-powered personalized education platform for grades 9-12",
              "url": "https://pinglearn.app",
              "logo": "https://pinglearn.app/wordmark/pinglearn-logo.svg",
              "sameAs": [
                "https://twitter.com/pinglearn",
                "https://linkedin.com/company/pinglearn"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+1-555-123-4567",
                "contactType": "customer service",
                "email": "hello@pinglearn.app"
              },
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "San Francisco",
                "addressRegion": "CA",
                "addressCountry": "US"
              }
            })
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
