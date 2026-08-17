import * as React from "react"
import { RadioButton } from "primereact/radiobutton"
import { cn } from "@/lib/utils"
const RadioContext = React.createContext<{ value?: string; onValueChange?: (value: string) => void }>({})
const RadioGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value?: string; defaultValue?: string; onValueChange?: (value: string) => void }>(({ className, value, defaultValue, onValueChange, children, ...props }, ref) => { const [internal, setInternal] = React.useState(defaultValue); return <RadioContext.Provider value={{ value: value ?? internal, onValueChange: (next) => { setInternal(next); onValueChange?.(next) } }}><div ref={ref} className={cn("grid gap-2", className)} {...props}>{children}</div></RadioContext.Provider> })
RadioGroup.displayName = "RadioGroup"
const RadioGroupItem = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { value: string }>(({ className, value, disabled, id, ...props }, ref) => { const context = React.useContext(RadioContext); return <RadioButton ref={ref as any} inputId={id} value={value} checked={context.value === value} onChange={() => context.onValueChange?.(value)} disabled={disabled} className={cn(className)} {...(props as any)} /> })
RadioGroupItem.displayName = "RadioGroupItem"
export { RadioGroup, RadioGroupItem }
