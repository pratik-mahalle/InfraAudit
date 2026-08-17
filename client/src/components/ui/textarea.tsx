import * as React from "react"
import { InputTextarea } from "primereact/inputtextarea"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(({ className, ...props }, ref) => <InputTextarea ref={ref as any} className={cn("w-full", className)} {...(props as any)} />)
Textarea.displayName = "Textarea"
export { Textarea }
