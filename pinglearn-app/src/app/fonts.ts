import { Inter } from 'next/font/google'

// Inter is an open-source font that's very similar to SF Pro
// It's designed specifically for user interfaces and has excellent legibility
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
})

// System font stack that will use SF Pro on Apple devices
// and fall back to appropriate system fonts on other platforms
export const systemFontStack = `
  ui-sans-serif,
  -apple-system,
  BlinkMacSystemFont,
  "SF Pro Display",
  "SF Pro Text",
  "SF Pro Icons",
  "Segoe UI",
  Roboto,
  "Helvetica Neue",
  Arial,
  "Noto Sans",
  sans-serif,
  "Apple Color Emoji",
  "Segoe UI Emoji",
  "Segoe UI Symbol",
  "Noto Color Emoji"
`

// Export typography scale matching Apple's system
export const typographyScale = {
  largeTitle: '2.125rem',  // 34pt
  title1: '1.75rem',        // 28pt
  title2: '1.375rem',       // 22pt
  title3: '1.25rem',        // 20pt
  headline: '1.0625rem',    // 17pt
  body: '1.0625rem',        // 17pt
  callout: '1rem',          // 16pt
  subheadline: '0.9375rem', // 15pt
  footnote: '0.8125rem',    // 13pt
  caption1: '0.75rem',      // 12pt
  caption2: '0.6875rem',    // 11pt
}

// Font weight mappings
export const fontWeights = {
  ultralight: 100,
  thin: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  heavy: 800,
  black: 900,
}