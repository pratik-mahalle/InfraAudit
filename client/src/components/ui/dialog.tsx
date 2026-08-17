"use client"

import * as React from "react"
import { Dialog as PrimeDialog } from "primereact/dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogContextValue { open: boolean; setOpen: (open: boolean) => void }
const DialogContext = React.createContext<DialogContextValue | null>(null)

interface DialogProps { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; children: React.ReactNode }
function Dialog({ open, defaultOpen, onOpenChange, children }: DialogProps) {
  const [internal, setInternal] = React.useState(defaultOpen ?? false)
  const value = open ?? internal
  const setOpen = (next: boolean) => { setInternal(next); onOpenChange?.(next) }
  return <DialogContext.Provider value={{ open: value, setOpen }}>{children}</DialogContext.Provider>
}

function DialogTrigger({ asChild, children, ...props }: { asChild?: boolean; children: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
  const context = React.useContext(DialogContext)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, { ...props, onClick: (event: React.MouseEvent) => { children.props.onClick?.(event); context?.setOpen(true) } })
  }
  return <button type="button" {...props} onClick={() => context?.setOpen(true)}>{children}</button>
}

const DialogPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DialogOverlay = () => null

function DialogContent({ className, children, ...props }: any) {
  const context = React.useContext(DialogContext)
  if (!context) return null
  return <PrimeDialog visible={context.open} onHide={() => context.setOpen(false)} modal closable className={cn("w-[min(92vw,36rem)]", className)} {...props}>{children}</PrimeDialog>
}

function DialogClose({ asChild, children, ...props }: { asChild?: boolean; children: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
  const context = React.useContext(DialogContext)
  const close = (event: React.MouseEvent) => { (children as any)?.props?.onClick?.(event); context?.setOpen(false) }
  if (asChild && React.isValidElement(children)) return React.cloneElement(children as React.ReactElement<any>, { ...props, onClick: close })
  return <button type="button" {...props} onClick={close}><X className="h-4 w-4" />{children}</button>
}

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => <h2 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />)
DialogTitle.displayName = "DialogTitle"
const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />)
DialogDescription.displayName = "DialogDescription"

export { Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription }
