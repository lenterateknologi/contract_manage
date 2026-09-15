import { Skeleton } from "@/components/ui/feedback/Skeleton";

export function TemplateTreeSkeleton() {
    return (
        <div className="w-64 md:w-72 lg:w-80 shrink-0 border-r border-surface-border bg-surface-card flex flex-col h-full overflow-hidden">
            {/* Tree Header / Search */}
            <div className="p-3 border-b border-surface-border space-y-2.5 bg-surface-muted/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-3.5 w-28 rounded" />
                    </div>
                    <Skeleton className="h-6 w-6 rounded-md" />
                </div>
                <Skeleton className="h-8 w-full rounded-lg" />
            </div>

            {/* Tree Content Nodes */}
            <div className="flex-1 p-2 space-y-1.5 overflow-hidden">
                {/* Root Repository Item */}
                <div className="flex items-center justify-between rounded-lg p-2 bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-3.5 w-3.5 rounded bg-primary/30" />
                        <Skeleton className="h-3 w-36 rounded bg-primary/30" />
                    </div>
                    <Skeleton className="h-3.5 w-6 rounded-full bg-primary/30" />
                </div>

                <div className="my-1.5 border-t border-surface-border/50" />

                {/* Hierarchical folder items */}
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between rounded-lg px-2 py-1.5"
                        style={{ paddingLeft: `${((i % 3)) * 14 + 8}px` }}
                    >
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-3 w-3 rounded" />
                            <Skeleton className="h-3.5 w-3.5 rounded" />
                            <Skeleton className="h-3 rounded" style={{ width: `${60 + (i * 17) % 50}px` }} />
                        </div>
                        <Skeleton className="h-3.5 w-5 rounded-full" />
                    </div>
                ))}
            </div>

            {/* Tree Footer */}
            <div className="p-2.5 border-t border-surface-border bg-surface-muted/30 flex items-center justify-between shrink-0">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
            </div>
        </div>
    );
}

export function TemplateTableSkeleton({ rows = 8 }: { rows?: number }) {
    return (
        <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden animate-in fade-in duration-300 bg-surface-base">
            {/* Header / Actions bar */}
            <div className="p-4 border-b border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface-card">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5 rounded" />
                        <Skeleton className="h-5 w-40 rounded" />
                    </div>
                    <Skeleton className="h-3.5 w-64 rounded" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8.5 w-28 rounded-lg" />
                    <Skeleton className="h-8.5 w-32 rounded-lg" />
                </div>
            </div>

            {/* Breadcrumb Trail */}
            <div className="flex items-center justify-between border-b border-surface-border bg-surface-card/40 px-5 py-2.5 shrink-0">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-28 rounded" />
                    <Skeleton className="h-3 w-3 rounded" />
                    <Skeleton className="h-3.5 w-20 rounded" />
                </div>
                <Skeleton className="h-3 w-16 rounded" />
            </div>

            {/* Table Header */}
            <div className="bg-primary/90 dark:bg-zinc-800 h-9 px-4 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <Skeleton className="h-4 w-4 rounded bg-white/30" />
                    <Skeleton className="h-3 w-44 rounded bg-white/30" />
                    <Skeleton className="h-3 w-24 rounded bg-white/30 hidden sm:block" />
                    <Skeleton className="h-3 w-20 rounded bg-white/30 hidden md:block" />
                    <Skeleton className="h-3 w-28 rounded bg-white/30 hidden lg:block" />
                    <Skeleton className="h-3 w-24 rounded bg-white/30 hidden xl:block" />
                </div>
                <Skeleton className="h-3 w-12 rounded bg-white/30" />
            </div>

            {/* Table Rows */}
            <div className="flex-1 divide-y divide-surface-border/40 overflow-hidden">
                {[...Array(rows)].map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-zinc-900"
                    >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <Skeleton className="h-4 w-4 rounded shrink-0" />
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 max-w-[340px]">
                                <Skeleton className="h-5 w-5 rounded shrink-0" />
                                <div className="space-y-1 flex-1">
                                    <Skeleton className="h-3.5 w-[85%] rounded" />
                                    <Skeleton className="h-2.5 w-[50%] rounded" />
                                </div>
                            </div>
                            <Skeleton className="h-4.5 w-16 rounded-md hidden sm:block shrink-0" />
                            <Skeleton className="h-3 w-16 rounded hidden md:block" />
                            <Skeleton className="h-3 w-28 rounded hidden lg:block" />
                            <Skeleton className="h-3 w-20 rounded hidden xl:block" />
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Skeleton className="h-6 w-6 rounded-md" />
                            <Skeleton className="h-6 w-6 rounded-md" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ContractTemplateSkeleton() {
    return (
        <div className="flex-1 flex h-[calc(100vh-64px)] w-full overflow-hidden animate-in fade-in duration-300">
            <TemplateTreeSkeleton />
            <TemplateTableSkeleton />
        </div>
    );
}
