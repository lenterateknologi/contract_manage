import { Skeleton } from "@/components/ui/feedback/Skeleton";

export function ContractTableSkeleton({ rows = 8 }: { rows?: number }) {
    return (
        <div className="w-full h-full flex flex-col overflow-hidden animate-in fade-in duration-300">
            {/* Skeleton Table Header */}
            <div className="bg-primary/90 dark:bg-zinc-800 h-9 px-4 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <Skeleton className="h-4 w-4 rounded bg-white/30" />
                    <Skeleton className="h-3 w-32 rounded bg-white/30" />
                    <Skeleton className="h-3 w-48 rounded bg-white/30" />
                    <Skeleton className="h-3 w-28 rounded bg-white/30 hidden md:block" />
                    <Skeleton className="h-3 w-36 rounded bg-white/30 hidden lg:block" />
                </div>
                <Skeleton className="h-3 w-20 rounded bg-white/30" />
            </div>

            {/* Skeleton Table Rows */}
            <div className="flex-1 divide-y divide-surface-border/40 overflow-hidden">
                {[...Array(rows)].map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-zinc-900"
                    >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <Skeleton className="h-4 w-4 rounded shrink-0" />
                            <div className="space-y-1.5 flex-1 max-w-[320px]">
                                <Skeleton className="h-3.5 w-[85%] rounded" />
                                <Skeleton className="h-2.5 w-[50%] rounded" />
                            </div>
                            <Skeleton className="h-4.5 w-24 rounded-full hidden sm:block shrink-0" />
                            <Skeleton className="h-3 w-28 rounded hidden md:block" />
                            <Skeleton className="h-3 w-36 rounded hidden lg:block" />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Skeleton className="h-6 w-16 rounded-md" />
                            <Skeleton className="h-6 w-6 rounded-md" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ContractCardSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 p-4">
            {[...Array(9)].map((_, i) => (
                <div key={i} className="rounded-xl border border-surface-border p-3 space-y-2.5">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-4.5 w-16 rounded-full" />
                    </div>
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-[90%]" />
                        <Skeleton className="h-3 w-[40%]" />
                    </div>
                    <div className="pt-2 border-t border-surface-border/40 flex justify-between items-center">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-3.5 w-8 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}
