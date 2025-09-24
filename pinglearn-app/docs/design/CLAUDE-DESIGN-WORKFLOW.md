# Claude Design Implementation Workflow
**For Claude Code SDK - Automatic Design System Application**

## 🤖 How I'll Apply This Design System

### Every Time I Create/Modify UI Components:

1. **Check Component Type**
   - Card/Container → Apply `glass-card` class
   - Button → Use `LiquidGlassButton` component
   - Navigation → Apply `liquid-glass` class
   - Form inputs → Apply `glass-interactive` class

2. **Apply Standard Properties**
   ```tsx
   // Every card must have:
   className="glass-card hover-lift" // Base glass + hover animation

   // Every button must have:
   className="glass-button hover-glow" // Glass button + glow on hover

   // Every text element must use:
   className="text-white" // or text-white/70, text-white/50
   ```

3. **Shadow Requirements**
   - No component without shadow
   - Minimum: `shadow-md` (Tailwind)
   - Custom: `box-shadow: 0 4px 24px rgba(0,0,0,0.3)`

4. **Background Rules**
   - Page background: `bg-[#0D0D0D]` (95% black)
   - Card background: Glass effect overlay
   - Never pure white backgrounds
   - Never pure black (#000000) except for special cases

5. **Cyan Accent Usage**
   - Primary buttons: Cyan fill on active/selected
   - Active states: Cyan border glow
   - Success indicators: Cyan color
   - Links on hover: Cyan color

## 🔄 Automated Checks I Perform

Before implementing any UI change, I will:

1. **Verify glass effect is applied**
   ```css
   backdrop-filter: blur(20px);
   border: 1px solid rgba(255,255,255,0.1);
   ```

2. **Ensure shadows are present**
   ```css
   box-shadow: 0 4px 24px rgba(0,0,0,0.3);
   ```

3. **Check hover states exist**
   ```css
   transition: all 0.3s ease;
   :hover { transform: translateY(-2px); }
   ```

4. **Validate color usage**
   - Background: #0D0D0D (not #000000)
   - Text: White with opacity variants
   - Accent: #06B6D4 (cyan from logo)

## 📦 Component Selection Priority

When building UI, I'll use in this order:

1. **Premium Components** (if applicable)
   - GlareCard for cards
   - BentoGrid for layouts
   - LiquidGlassButton for CTAs

2. **Custom Glass Classes**
   - `.liquid-glass` for containers
   - `.glass-card` for cards
   - `.glass-button` for buttons

3. **Fallback to styled shadcn**
   - Apply glass effects to shadcn components
   - Override default styles with our system

## 🎨 Standard Component Patterns

### Dashboard Metric Card
```tsx
<GlareCard className="relative overflow-hidden">
  <div className="glass-card p-6 hover-lift">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-white/50 mb-1">{label}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
      <div className="text-white/30">{icon}</div>
    </div>
  </div>
</GlareCard>
```

### Interactive Button
```tsx
<LiquidGlassButton
  className="relative overflow-hidden group"
  onClick={action}
>
  <span className="relative z-10 text-white group-hover:text-white">
    {text}
  </span>
  <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-colors" />
</LiquidGlassButton>
```

### Form Input
```tsx
<div className="glass-interactive p-3 rounded-lg">
  <input
    className="w-full bg-transparent text-white placeholder:text-white/30 outline-none"
    placeholder={placeholder}
  />
</div>
```

## 🚀 Implementation Commands

When starting any UI work:

```bash
# 1. Check if components are installed
ls components/ui/glare-card.tsx
ls components/ui/liquid-glass-button.tsx
ls components/ui/bento-grid.tsx

# 2. If missing, install required components
npx shadcn@latest add [component-url]

# 3. Verify global styles include glass effects
grep "liquid-glass" globals.css

# 4. Apply design system to component
# Follow patterns above
```

## ✅ Quality Checklist

Before marking any UI task complete:

- [ ] Background is 95% black (#0D0D0D), not pure black
- [ ] All cards have glass effect with backdrop-filter
- [ ] All elements have appropriate shadows
- [ ] Hover states are smooth with transitions
- [ ] Text uses white with opacity (100%, 70%, 50%, 30%)
- [ ] Cyan accent is used for active/primary actions
- [ ] No flat white borders (use rgba(255,255,255,0.1))
- [ ] Border radius follows system (20px, 16px, 12px, 10px)
- [ ] Animations use cubic-bezier easing
- [ ] Components feel premium and polished

## 🔍 Visual Validation

I will mentally check against these criteria:

1. **Does it look flat?** → Add shadows and glass
2. **Is text hard to read?** → Adjust opacity
3. **Missing depth?** → Add hover lift animation
4. **Too stark?** → Soften with glass blur
5. **No visual feedback?** → Add transitions

## 📝 Notes

- This workflow is **mandatory** for all UI changes
- No exceptions for "quick fixes" - maintain consistency
- When in doubt, refer to inspiration images saved
- Always test in both light and dark modes (even though we're dark-first)

---

**This document is loaded into my context for every UI task to ensure consistent application of the PingLearn Design System V2.0**