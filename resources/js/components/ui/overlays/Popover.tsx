import * as React from "react"
import { Popover as HeadlessPopover, PopoverButton, PopoverPanel, Transition } from "@headlessui/react"
import { cn } from "@/lib/utils"

const Popover = HeadlessPopover

const PopoverTrigger = PopoverButton

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof PopoverPanel> & { align?: "start" | "center" | "end" }
>(({ className, align = "center", ...props }, ref) => (
  <Transition
    as={React.Fragment}
    enter="transition ease-out duration-200"
    enterFrom="opacity-0 translate-y-1"
    enterTo="opacity-100 translate-y-0"
    leave="transition ease-in duration-150"
    leaveFrom="opacity-100 translate-y-0"
    leaveTo="opacity-0 translate-y-1"
  >
    <PopoverPanel
      ref={ref}
      className={cn(
        "z-50 w-72 rounded-xl border border-slate-100 bg-white p-4 text-slate-900 shadow-2xl focus:outline-none",
        align === "start" && "left-0",
        align === "end" && "right-0",
        className
      )}
      {...props}
    />
  </Transition>
))
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
