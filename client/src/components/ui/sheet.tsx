"use client"
import * as React from "react"
import { Sidebar } from "primereact/sidebar"
import { cn } from "@/lib/utils"
const SheetContext = React.createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null)
function Sheet({ open, defaultOpen, onOpenChange, children }: { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; children: React.ReactNode }) { const [internal, setInternal] = React.useState(defaultOpen ?? false); const value = open ?? internal; return <SheetContext.Provider value={{ open: value, setOpen: (next) => { setInternal(next); onOpenChange?.(next) } }}>{children}</SheetContext.Provider> }
function SheetTrigger({ asChild, children, ...props }: any) { const context = React.useContext(SheetContext); if (asChild && React.isValidElement(children)) return React.cloneElement(children, { ...props, onClick: (event: any) => { (children as any).props.onClick?.(event); context?.setOpen(true) } }); return <button type="button" {...props} onClick={() => context?.setOpen(true)}>{children}</button> }
const SheetClose = ({ asChild, children, ...props }: any) => { const context = React.useContext(SheetContext); if (asChild && React.isValidElement(children)) return React.cloneElement(children, { ...props, onClick: (event: any) => { (children as any).props.onClick?.(event); context?.setOpen(false) } }); return <button type="button" {...props} onClick={() => context?.setOpen(false)}>{children}</button> }
const SheetPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>
const SheetOverlay = () => null
function SheetContent({ side = "right", className, children, ...props }: any) { const context = React.useContext(SheetContext); return <Sidebar visible={context?.open ?? false} onHide={() => context?.setOpen(false)} position={side} className={cn("w-full sm:max-w-xl", className)} {...props}>{children}</Sidebar> }
const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
const SheetTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => <h2 ref={ref} className={cn("text-lg font-semibold", className)} {...props} />)
const SheetDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />)
export { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription }
