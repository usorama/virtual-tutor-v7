import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const liquidGlassButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden transform-gpu cursor-pointer",
  {
    variants: {
      variant: {
        "liquid-glass": "liquid-glass-button text-foreground",
        "liquid-primary": "liquid-glass-button text-primary-foreground bg-gradient-to-r from-primary/20 to-primary/10",
        "liquid-secondary": "liquid-glass-button text-secondary-foreground bg-gradient-to-r from-secondary/20 to-secondary/10",
        "liquid-destructive": "liquid-glass-button text-destructive bg-gradient-to-r from-destructive/20 to-destructive/10",
        "liquid-outline": "liquid-glass text-foreground border-2 border-white/20",
        "liquid-ghost": "liquid-glass text-foreground hover:bg-white/10 dark:hover:bg-white/5",
      },
      size: {
        default: "h-10 px-5 py-2 rounded-xl",
        sm: "h-8 px-3 text-xs rounded-lg",
        lg: "h-12 px-8 text-base rounded-xl",
        xl: "h-14 px-10 text-lg rounded-2xl",
        icon: "h-10 w-10 rounded-xl",
      },
      intensity: {
        subtle: "backdrop-blur-sm",
        medium: "backdrop-blur-md",
        strong: "backdrop-blur-xl"
      }
    },
    defaultVariants: {
      variant: "liquid-glass",
      size: "default",
      intensity: "medium"
    },
  }
)

export interface LiquidGlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof liquidGlassButtonVariants> {
  asChild?: boolean
  animated?: boolean
  glow?: boolean
  depth?: 'shallow' | 'medium' | 'deep'
}

const hoverAnimation = {
  scale: 1.05,
  y: -3,
  rotateX: 1,
  transition: {
    type: "spring",
    stiffness: 500,
    damping: 30
  }
}

const tapAnimation = {
  scale: 0.95,
  y: 0,
  transition: {
    type: "spring",
    stiffness: 600,
    damping: 35
  }
}

const LiquidGlassButton = React.forwardRef<HTMLButtonElement, LiquidGlassButtonProps>(
  ({ className, variant, size, intensity, asChild = false, animated = true, glow = false, depth = 'medium', children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const Component = animated ? motion.button : Comp

    const depthTransform = {
      shallow: 'translateZ(3px)',
      medium: 'translateZ(5px)',
      deep: 'translateZ(8px)'
    }

    return (
      <Component
        className={cn(liquidGlassButtonVariants({ variant, size, intensity, className }))}
        ref={ref}
        style={{
          transform: depthTransform[depth]
        }}
        {...(animated && {
          whileHover: hoverAnimation,
          whileTap: tapAnimation
        })}
        {...(props as any)}
      >
        {/* Apple Liquid Glass handles all glass effects automatically */}

        {/* Enhanced glow effect for special variants */}
        {glow && (
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-500 hover:opacity-100"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              transform: 'skewX(-12deg) translateX(-100%)',
              animation: 'shimmer 2s infinite'
            }}
          />
        )}

        {/* Content with proper layering */}
        <span className="relative z-20 transform-gpu">
          {children}
        </span>
      </Component>
    )
  }
)

LiquidGlassButton.displayName = "LiquidGlassButton"

// Shimmer animation for glow effect
const shimmerKeyframes = `
  @keyframes shimmer {
    0% { transform: skewX(-12deg) translateX(-100%); }
    100% { transform: skewX(-12deg) translateX(200%); }
  }
`

// Inject keyframes into document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = shimmerKeyframes
  document.head.appendChild(style)
}

// Maintain backward compatibility
export { LiquidGlassButton as GlassButton, liquidGlassButtonVariants as glassButtonVariants }