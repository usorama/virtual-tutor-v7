import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const glassButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        glass: "glass-button text-foreground hover:bg-white/20 dark:hover:bg-white/10",
        "glass-primary": "glass-button bg-primary/10 text-primary-foreground hover:bg-primary/20 border-primary/20",
        "glass-secondary": "glass-button bg-secondary/20 text-secondary-foreground hover:bg-secondary/30 border-secondary/30",
        "glass-destructive": "glass-button bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20",
        "glass-outline": "backdrop-blur-lg border border-input bg-transparent shadow-lg hover:bg-accent hover:text-accent-foreground",
        "glass-ghost": "backdrop-blur-sm hover:bg-accent/20 hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-lg px-8",
        xl: "h-12 rounded-xl px-10 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "glass",
      size: "default",
    },
  }
)

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  asChild?: boolean
  animated?: boolean
  glow?: boolean
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant, size, asChild = false, animated = true, glow = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const Component = animated ? motion.button : Comp

    return (
      <Component
        className={cn(glassButtonVariants({ variant, size, className }))}
        ref={ref}
        {...(animated && {
          whileHover: {
            scale: 1.05,
            y: -2,
            boxShadow: glow ? "0 0 20px rgba(255, 255, 255, 0.3)" : undefined
          },
          whileTap: { scale: 0.98 },
          transition: { type: "spring", stiffness: 400, damping: 25 }
        })}
        {...props}
      >
        {/* Glass reflection effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Inner glow for special variants */}
        {glow && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 opacity-0 transition-opacity duration-500 group-hover:opacity-100 animate-shimmer" />
        )}

        {/* Content */}
        <span className="relative z-10">
          {children}
        </span>
      </Component>
    )
  }
)
GlassButton.displayName = "GlassButton"

export { GlassButton, glassButtonVariants }