import * as React from "react"
import { cn } from "@/lib/utils"
type MenuContextValue = { open: boolean; setOpen: (open: boolean) => void }
const MenuContext = React.createContext<MenuContextValue | null>(null)
function DropdownMenu({ children }: { children: React.ReactNode }) { const [open, setOpen] = React.useState(false); return <MenuContext.Provider value={{ open, setOpen }}><div className="relative inline-block">{children}</div></MenuContext.Provider> }
function DropdownMenuTrigger({ asChild, children, ...props }: any) { const context = React.useContext(MenuContext); if (asChild && React.isValidElement(children)) return React.cloneElement(children, { ...props, onClick: (event: any) => { (children as any).props.onClick?.(event); context?.setOpen(!context.open) } }); return <button type="button" {...props} onClick={() => context?.setOpen(!context.open)}>{children}</button> }
const DropdownMenuContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { align?: string; sideOffset?: number }>(({ className, children, ...props }, ref) => { const context = React.useContext(MenuContext); if (!context?.open) return null; return <div ref={ref} className={cn("absolute right-0 z-50 mt-2 min-w-40 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", className)} {...props}>{children}</div> })
const DropdownMenuItem = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { inset?: boolean }>(({ className, onClick, ...props }, ref) => { const context = React.useContext(MenuContext); return <button ref={ref} type="button" className={cn("relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent", className)} onClick={(event) => { onClick?.(event); context?.setOpen(false) }} {...props} /> })
const DropdownMenuLabel = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("px-2 py-1.5 text-sm font-semibold", className)} {...props} />
const DropdownMenuSeparator = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
const DropdownMenuGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuSubContent = DropdownMenuContent
const DropdownMenuSubTrigger = DropdownMenuItem
const DropdownMenuRadioGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuCheckboxItem = DropdownMenuItem
const DropdownMenuRadioItem = DropdownMenuItem
const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => <span className={cn("ml-auto text-xs opacity-60", className)} {...props} />
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup }
