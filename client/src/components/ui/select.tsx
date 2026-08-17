"use client"

import * as React from "react"
import { Dropdown } from "primereact/dropdown"
import { cn } from "@/lib/utils"

type SelectOption = { label: string; value: string; disabled?: boolean }
interface SelectContextValue {
  value?: string
  onValueChange?: (value: any) => void
  options: SelectOption[]
  disabled?: boolean
}

const SelectContext = React.createContext<SelectContextValue>({ options: [] })

function collectOptions(children: React.ReactNode): SelectOption[] {
  const options: SelectOption[] = []
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    if (child.type === SelectItem) {
      const props = child.props as SelectItemProps
      options.push({ label: typeof props.children === "string" ? props.children : String(props.value), value: props.value, disabled: props.disabled })
      return
    }
    options.push(...collectOptions(child.props.children))
  })
  return options
}

interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: any) => void
  disabled?: boolean
  children: React.ReactNode
}

function Select({ value, defaultValue, onValueChange, disabled, children }: SelectProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const selectedValue = value ?? internalValue
  const options = React.useMemo(() => collectOptions(children), [children])
  const change = (next: string) => { setInternalValue(next); onValueChange?.(next) }
  return <SelectContext.Provider value={{ value: selectedValue, onValueChange: change, options, disabled }}>{children}</SelectContext.Provider>
}

const SelectGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>
const SelectValue = (_props: { placeholder?: string }) => null

const SelectTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  const valueNode = React.Children.toArray(children).find((child) => React.isValidElement(child) && child.type === SelectValue)
  const placeholder = React.isValidElement(valueNode) ? (valueNode.props as { placeholder?: string }).placeholder : undefined
  return <div ref={ref} {...props} className={cn("min-w-0", className)}><Dropdown value={context.value} onChange={(event) => context.onValueChange?.(event.value)} options={context.options} optionDisabled="disabled" placeholder={placeholder} disabled={context.disabled} className="w-full" /></div>
})
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>
const SelectLabel = ({ children }: { children: React.ReactNode }) => <>{children}</>
interface SelectItemProps { value: string; disabled?: boolean; children: React.ReactNode }
const SelectItem = (_props: SelectItemProps) => null
const SelectSeparator = () => null
const SelectScrollUpButton = () => null
const SelectScrollDownButton = () => null

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton }
