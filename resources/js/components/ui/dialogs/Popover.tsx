import * as React from "react"
import { Popover as HeadlessPopover, PopoverButton, PopoverPanel, Portal } from "@headlessui/react"
import { cn } from "@/lib/utils"

const Popover = HeadlessPopover

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  as?: any
}

const PopoverTrigger = React.forwardRef<any, PopoverTriggerProps>(({ asChild, as, ...props }, ref) => {
  return <PopoverButton ref={ref} as={asChild ? (as || 'div') : (as || 'button')} {...props} />
})
PopoverTrigger.displayName = "PopoverTrigger"

interface PopoverContentProps extends Omit<React.ComponentPropsWithoutRef<typeof PopoverPanel>, 'anchor'> {
  align?: "start" | "center" | "end"
  anchor?: any
}

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  PopoverContentProps
>(({ className, align = "start", anchor, ...props }, ref) => {
  const anchorConfig = anchor || {
    to: align === "end" ? "bottom end" : align === "center" ? "bottom" : "bottom start",
    gap: 4,
    offset: 0,
  }

  return (
    <Portal>
      <PopoverPanel
        ref={ref}
        anchor={anchorConfig}
        transition
        className={cn(
          "z-[999999] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 text-slate-900 dark:text-zinc-100 shadow-2xl focus:outline-none",
          "transition data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150",
          "data-[enter]:data-[closed]:translate-y-1 data-[leave]:data-[closed]:translate-y-1",
          className
        )}
        {...props}
      />
    </Portal>
  )
})
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }


