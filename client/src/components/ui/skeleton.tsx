import { cn } from "@/lib/utils"
import { Skeleton as PrimeSkeleton } from "primereact/skeleton"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <PrimeSkeleton className={cn("rounded-md", className)} {...props} />
  )
}

export { Skeleton }
