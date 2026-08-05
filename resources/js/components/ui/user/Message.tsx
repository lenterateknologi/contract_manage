import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const messageVariants = cva("group relative flex w-full gap-3 text-sm", {
  variants: {
    align: {
      start: "flex-row items-end justify-start",
      end: "flex-row-reverse items-end justify-start",
    },
  },
  defaultVariants: {
    align: "start",
  },
});

interface MessageProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof messageVariants> {}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ className, align = "start", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(messageVariants({ align }), className)}
      {...props}
    />
  )
);
Message.displayName = "Message";

const MessageGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-2", className)} {...props} />
));
MessageGroup.displayName = "MessageGroup";

const MessageAvatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full", className)}
    {...props}
  />
));
MessageAvatar.displayName = "MessageAvatar";

const MessageContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex max-w-[85%] flex-col gap-1", className)}
    {...props}
  />
));
MessageContent.displayName = "MessageContent";

const MessageHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2 text-xs text-muted-foreground px-1 mb-0.5", className)}
    {...props}
  />
));
MessageHeader.displayName = "MessageHeader";

const MessageFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-1.5 text-[10px] text-muted-foreground px-1 mt-0.5", className)}
    {...props}
  />
));
MessageFooter.displayName = "MessageFooter";

const bubbleVariants = cva(
  "relative rounded-2xl px-4 py-2.5 text-xs font-medium transition-all break-words leading-relaxed shadow-xs",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground font-medium",
        muted: "bg-muted/80 text-foreground border border-border/60 dark:bg-zinc-800/80 dark:border-zinc-700/60 font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BubbleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bubbleVariants> {}

const Bubble = React.forwardRef<HTMLDivElement, BubbleProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(bubbleVariants({ variant }), className)}
      {...props}
    />
  )
);
Bubble.displayName = "Bubble";

const BubbleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("leading-relaxed", className)} {...props} />
));
BubbleContent.displayName = "BubbleContent";

const BubbleReactions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute -bottom-2 right-2 flex items-center gap-1 rounded-full border border-border bg-background px-1.5 py-0.5 text-[11px] font-medium shadow-xs transition-transform hover:scale-105 select-none cursor-pointer",
      className
    )}
    {...props}
  />
));
BubbleReactions.displayName = "BubbleReactions";

const BubbleGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-1", className)} {...props} />
));
BubbleGroup.displayName = "BubbleGroup";

const Marker = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2 text-xs text-muted-foreground px-3 py-1.5 rounded-full border border-border/50 bg-muted/40 w-fit", className)}
    {...props}
  />
));
Marker.displayName = "Marker";

const MarkerContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center gap-1.5", className)} {...props} />
));
MarkerContent.displayName = "MarkerContent";

export {
  Message,
  MessageGroup,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageFooter,
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
  Marker,
  MarkerContent,
};
