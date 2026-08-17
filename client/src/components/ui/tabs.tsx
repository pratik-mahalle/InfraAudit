import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsContextValue { value?: string; onValueChange?: (value: string) => void }
const TabsContext = React.createContext<TabsContextValue>({})

interface TabsProps { value?: string; defaultValue?: string; onValueChange?: (value: string) => void; children: React.ReactNode; className?: string }
function Tabs({ value, defaultValue, onValueChange, children, className }: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue)
  const selected = value ?? internal
  const change = (next: string) => { setInternal(next); onValueChange?.(next) }
  return <TabsContext.Provider value={{ value: selected, onValueChange: change }}><div className={className}>{children}</div></TabsContext.Provider>
}

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)} {...props} />)
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }>(({ className, value, onClick, ...props }, ref) => {
  const context = React.useContext(TabsContext)
  return <button ref={ref} type="button" aria-selected={context.value === value} className={cn("p-button p-component inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium", context.value === value && "bg-background text-foreground shadow-sm", className)} onClick={(event) => { context.onValueChange?.(value); onClick?.(event) }} {...props} />
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(({ className, value, children, ...props }, ref) => {
  const context = React.useContext(TabsContext)
  if (context.value !== value) return null
  return <div ref={ref} className={cn("mt-2", className)} {...props}>{children}</div>
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
