import * as React from "react"
import { Avatar as PrimeAvatar } from "primereact/avatar"
import { cn } from "@/lib/utils"
const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <span ref={ref as any} className={cn("inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)} {...props} />)
const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(({ className, ...props }, ref) => <img ref={ref} className={cn("aspect-square h-full w-full", className)} {...props} />)
const AvatarFallback = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(({ className, ...props }, ref) => <span ref={ref} className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)} {...props} />)
export { Avatar, AvatarImage, AvatarFallback }
