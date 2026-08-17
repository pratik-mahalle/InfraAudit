import * as React from "react"
import { InputSwitch } from "primereact/inputswitch"
import { cn } from "@/lib/utils"

interface SwitchProps extends Omit<React.ComponentPropsWithoutRef<"button">, "onChange"> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(({ className, checked, defaultChecked, onCheckedChange, disabled, ...props }, ref) => {
  const [internal, setInternal] = React.useState(defaultChecked ?? false)
  const value = checked ?? internal
  return <span ref={ref as any} className={cn("inline-flex", className)} {...props}><InputSwitch checked={value} onChange={(event) => { setInternal(event.value); onCheckedChange?.(event.value) }} disabled={disabled} /></span>
})
Switch.displayName = "Switch"
export { Switch }
