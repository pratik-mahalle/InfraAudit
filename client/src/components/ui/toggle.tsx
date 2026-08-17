import * as React from "react"
import { Button } from "primereact/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
const toggleVariants = cva("inline-flex items-center justify-center rounded-md text-sm font-medium gap-2", { variants: { variant: { default: "", outline: "border border-input" }, size: { default: "h-10 px-3", sm: "h-9 px-2.5", lg: "h-11 px-5" } }, defaultVariants: { variant: "default", size: "default" } })
const Toggle = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<"button"> & VariantProps<typeof toggleVariants> & { pressed?: boolean; onPressedChange?: (pressed: boolean) => void }>(({ className, variant, size, pressed, onPressedChange, onClick, children, ...props }, ref) => <Button ref={ref as any} text={!pressed} outlined={variant === "outline"} size={size === "sm" ? "small" : size === "lg" ? "large" : undefined} aria-pressed={pressed} className={cn(toggleVariants({ variant, size }), className)} onClick={(event) => { onPressedChange?.(!pressed); onClick?.(event) }} {...(props as any)}>{children}</Button>)
Toggle.displayName = "Toggle"
export { Toggle, toggleVariants }
