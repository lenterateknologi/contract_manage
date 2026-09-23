import { Skeleton } from "@/components/ui/feedback/Skeleton";

export function ChatSidebarSkeleton() {
    return (
        <div className="w-full md:w-80 lg:w-96 flex flex-col border-r border-border bg-background shrink-0 h-full overflow-hidden animate-in fade-in duration-300">
            {/* Header & Search */}
            <div className="p-3 border-b border-border flex flex-col gap-2.5 bg-muted/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-3.5 w-32 rounded" />
                    </div>
                    <Skeleton className="h-7 w-7 rounded-lg" />
                </div>
                <Skeleton className="h-8.5 w-full rounded-lg" />
            </div>

            {/* Date Group Label */}
            <div className="px-3 pt-3 pb-1">
                <Skeleton className="h-2.5 w-20 rounded" />
            </div>

            {/* Contract List Items */}
            <div className="flex-1 p-2 space-y-2 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl p-2.5 border border-border/40 bg-card/60"
                    >
                        <Skeleton className="h-8.5 w-8.5 rounded-full shrink-0" />
                        <div className="flex flex-1 flex-col min-w-0 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-2.5 w-20 rounded" />
                                <Skeleton className="h-2.5 w-14 rounded" />
                            </div>
                            <Skeleton className="h-3.5 w-[85%] rounded" />
                            <div className="flex items-center justify-between pt-0.5">
                                <Skeleton className="h-2.5 w-24 rounded" />
                                <Skeleton className="h-3.5 w-12 rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ChatContentSkeleton() {
    return (
        <div className="flex-1 flex flex-col h-full bg-background min-w-0 overflow-hidden animate-in fade-in duration-300">
            {/* Top Chat Header */}
            <div className="h-14 border-b border-border px-4 flex items-center justify-between bg-card/80 shrink-0">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-9 rounded-full shrink-0" />
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-3.5 w-40 rounded" />
                            <Skeleton className="h-4 w-14 rounded-full" />
                        </div>
                        <Skeleton className="h-2.5 w-56 rounded" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 space-y-4 overflow-hidden flex flex-col justify-end">
                {/* Date separator */}
                <div className="flex justify-center">
                    <Skeleton className="h-4 w-24 rounded-full" />
                </div>

                {/* Left Bubble (incoming) */}
                <div className="flex items-end gap-2 max-w-[70%]">
                    <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                    <div className="space-y-1">
                        <Skeleton className="h-2.5 w-16 rounded" />
                        <div className="p-3 rounded-2xl rounded-bl-sm bg-muted space-y-1.5">
                            <Skeleton className="h-3.5 w-48 rounded" />
                            <Skeleton className="h-3.5 w-36 rounded" />
                        </div>
                    </div>
                </div>

                {/* Right Bubble (outgoing) */}
                <div className="flex items-end justify-end gap-2 self-end max-w-[70%]">
                    <div className="p-3 rounded-2xl rounded-br-sm bg-primary/20 space-y-1.5">
                        <Skeleton className="h-3.5 w-44 rounded" />
                        <Skeleton className="h-3 w-28 rounded" />
                    </div>
                </div>

                {/* Left Bubble with attachment skeleton */}
                <div className="flex items-end gap-2 max-w-[70%]">
                    <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                    <div className="space-y-1">
                        <Skeleton className="h-2.5 w-20 rounded" />
                        <div className="p-3 rounded-2xl rounded-bl-sm bg-muted space-y-2">
                            <Skeleton className="h-3.5 w-52 rounded" />
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-background/80 border border-border">
                                <Skeleton className="h-8 w-8 rounded-lg" />
                                <div className="space-y-1 flex-1">
                                    <Skeleton className="h-3 w-32 rounded" />
                                    <Skeleton className="h-2 w-16 rounded" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Bubble (short) */}
                <div className="flex items-end justify-end gap-2 self-end max-w-[70%]">
                    <div className="p-3 rounded-2xl rounded-br-sm bg-primary/20">
                        <Skeleton className="h-3.5 w-32 rounded" />
                    </div>
                </div>
            </div>

            {/* Chat Input Editor Bar */}
            <div className="p-3 border-t border-border bg-card/60 flex items-center gap-2 shrink-0">
                <Skeleton className="h-11 w-9 rounded-lg shrink-0" />
                <Skeleton className="h-11 flex-1 rounded-lg" />
                <Skeleton className="h-11 w-20 rounded-lg shrink-0" />
            </div>
        </div>
    );
}

export function ChatPageSkeleton() {
    return (
        <div className="flex-1 flex h-[calc(100vh-64px)] w-full overflow-hidden animate-in fade-in duration-300">
            <ChatSidebarSkeleton />
            <ChatContentSkeleton />
        </div>
    );
}
