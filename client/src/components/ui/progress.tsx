"use client"

import * as React from "react"
import { ProgressBar } from "primereact/progressbar"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof ProgressBar> & { max?: number }
>(({ className, value, max = 100, ...props }, ref) => (
  <ProgressBar ref={ref as any} value={Math.min(100, (Number(value ?? 0) / max) * 100)} className={cn("h-4", className)} {...(props as any)} />
))
Progress.displayName = "Progress"

export { Progress }
