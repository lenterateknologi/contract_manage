import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-border bg-surface-base px-3.5 py-2.5 text-sm font-normal text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:bg-slate-100/70 dark:disabled:bg-zinc-900/80 disabled:border-slate-200 dark:disabled:border-zinc-800 disabled:text-slate-500 dark:disabled:text-zinc-400 disabled:shadow-none read-only:cursor-default read-only:bg-slate-50/70 dark:read-only:bg-zinc-900/50 read-only:text-slate-700 dark:read-only:text-zinc-300 transition-all leading-relaxed",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
