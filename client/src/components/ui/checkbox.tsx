import * as React from "react"
import { Checkbox as PrimeCheckbox } from "primereact/checkbox"
import { cn } from "@/lib/utils"
const Checkbox = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<"input"> & { checked?: boolean | "indeterminate"; onCheckedChange?: (checked: boolean) => void }>(({ className, checked, onCheckedChange, disabled, ...props }, ref) => <PrimeCheckbox ref={ref as any} binary checked={checked === true} onChange={(event) => onCheckedChange?.(event.checked ?? false)} disabled={disabled} className={cn(className)} {...(props as any)} />)
Checkbox.displayName = "Checkbox"
export { Checkbox }
