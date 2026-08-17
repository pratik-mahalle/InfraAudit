import * as React from "react"
import { cn } from "@/lib/utils"
const TooltipProvider = ({ children, ..._props }: { children: React.ReactNode; delayDuration?: number }) => <>{children}</>
const Tooltip = ({ children }: { children: React.ReactNode }) => <>{children}</>
const TooltipTrigger = ({ asChild, children, ...props }: any) => { if (asChild && React.isValidElement(children)) return React.cloneElement(children, { ...props }); return <span {...props}>{children}</span> }
const TooltipContent = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & { side?: string; sideOffset?: number }>(({ className, side: _side, sideOffset: _sideOffset, ...props }, ref) => <span ref={ref} className={cn("z-50 rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md", className)} {...props} />)
TooltipContent.displayName = "TooltipContent"
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
