import * as React from "react"
import { Popover as HeadlessPopover, PopoverButton, PopoverPanel, Portal } from "@headlessui/react"
import { cn } from "@/lib/utils"

const Popover = HeadlessPopover

const PopoverTrigger = PopoverButton

interface PopoverContentProps extends Omit<React.ComponentPropsWithoutRef<typeof PopoverPanel>, 'anchor'> {
  align?: "start" | "center" | "end"
}

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  PopoverContentProps
>(({ className, align = "start", ...props }, ref) => (
  <Portal>
    <PopoverPanel
      ref={ref}
      anchor={{ to: "bottom start", gap: 4, offset: 0 }}
      transition
      className={cn(
        "z-[9999] rounded-xl border border-slate-100 bg-white p-4 text-slate-900 shadow-2xl focus:outline-none",
        "transition data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150",
        "data-[enter]:data-[closed]:translate-y-1 data-[leave]:data-[closed]:translate-y-1",
        className
      )}
      {...props}
    />
  </Portal>
))
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }

