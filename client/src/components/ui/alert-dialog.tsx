import * as React from "react"
import { Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
const AlertDialog = Dialog
const AlertDialogPortal = DialogPortal
const AlertDialogOverlay = DialogOverlay
const AlertDialogTrigger = DialogTrigger
const AlertDialogContent = DialogContent
const AlertDialogHeader = DialogHeader
const AlertDialogFooter = DialogFooter
const AlertDialogTitle = DialogTitle
const AlertDialogDescription = DialogDescription
const AlertDialogAction = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>((props, ref) => <Button ref={ref} {...props} />)
const AlertDialogCancel = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(({ className, ...props }, ref) => <Button ref={ref} variant="outline" className={className} {...props} />)
export { AlertDialog, AlertDialogPortal, AlertDialogOverlay, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, DialogClose as AlertDialogCancelClose }
