import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Button as PrimeButton } from "primereact/button"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }), "p-button p-component")
    const severity = variant === "destructive" ? "danger" : variant === "secondary" ? "secondary" : undefined
    const isText = variant === "ghost" || variant === "link"

    // Keep the existing asChild contract for navigation links while using the
    // PrimeReact button class system and design tokens underneath.
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: cn(classes, children.props.className),
      })
    }

    return (
      <PrimeButton
        ref={ref as any}
        {...props}
        severity={severity}
        outlined={variant === "outline"}
        text={isText}
        link={variant === "link"}
        size={size === "sm" ? "small" : size === "lg" ? "large" : undefined}
        className={classes}
      >
        {children}
      </PrimeButton>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
