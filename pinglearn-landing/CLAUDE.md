# PingLearn Landing Page - Development Guidelines

## 🎨 Brand Assets & Logo Usage

### Official Logo
**Primary Logo**: `/public/logos/logo-transparent.svg`
- **Format**: Premium Package SVG (vector format)
- **File Size**: 9.9KB (optimized for web)
- **Quality**: Crystal clear at all resolutions
- **Usage**: Use this logo for ALL frontend UI components across the application

### Logo Implementation Guidelines
```jsx
// Standard logo implementation
<img
  src="/logos/logo-transparent.svg"
  alt="PingLearn Logo"
  className="h-16 md:h-20 lg:h-24 w-auto"
/>
```

### Responsive Sizing Standards
- **Mobile**: `h-16` (64px)
- **Tablet**: `h-20` (80px)
- **Desktop**: `h-24` (96px)

### Logo Specifications
- **Design**: Cyan hexagonal icon with white "pinglearn" text
- **Background**: Transparent (works on any background)
- **Format**: SVG vector for perfect scalability
- **Source**: Premium Package from professional logo files

### Alternative Logo Files Available
- `logo-colored.png` (91KB) - Colored version if needed
- `logo-original.png` (105KB) - Original design variant
- `logo-transparent.png` (101KB) - PNG fallback version

## 🎯 Logo Usage Rules

1. **Always use SVG version** for web applications (`logo-transparent.svg`)
2. **Maintain aspect ratio** with `w-auto` class
3. **Use responsive sizing** classes for different breakpoints
4. **Ensure proper alt text** for accessibility
5. **Test on dark backgrounds** to ensure visibility

## 📝 Implementation Notes

- Logo has been optimized for the dark theme landing page
- Minimal top padding (`pt-0`) ensures proper header alignment
- SVG format ensures crisp rendering at all zoom levels
- File is 90% smaller than PNG equivalent for faster loading

---

**Last Updated**: September 21, 2025
**Logo Version**: Premium Package SVG
**Status**: Production Ready