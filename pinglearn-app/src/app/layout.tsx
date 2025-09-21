import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/katex.css";
import { AuthProvider } from '@/lib/auth/auth-provider';

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Virtual Tutor - Personalized AI Learning Assistant",
  description: "Experience personalized one-on-one tutoring with AI. Support for Class 9-12 CBSE curriculum.",
  keywords: ["AI tutor", "online learning", "CBSE", "personalized education", "virtual classroom"],
  authors: [{ name: "Virtual Tutor Team" }],
  openGraph: {
    title: "Virtual Tutor",
    description: "Personalized AI Learning Assistant",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
