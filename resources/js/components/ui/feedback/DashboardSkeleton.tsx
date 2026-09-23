import { Skeleton } from "@/components/ui/feedback/Skeleton";

export function DashboardSkeleton() {
    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            {/* 1. Welcome & Quick Action Hero Skeleton */}
            <div className="rounded-lg border border-surface-border bg-surface-base p-4">
                <div className="flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-40 rounded" />
                            <Skeleton className="h-5 w-20 rounded-md" />
                        </div>
                        <Skeleton className="h-3.5 w-64 rounded" />
                        <Skeleton className="h-6 w-80 rounded-md" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-11 w-32 rounded-lg" />
                        <Skeleton className="h-11 w-36 rounded-lg" />
                    </div>
                </div>
            </div>

            {/* 2. KPI Cards Skeleton (5 cards) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="rounded-xl border border-surface-border bg-surface-base p-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-3.5 w-24 rounded" />
                            <Skeleton className="h-7 w-7 rounded-lg" />
                        </div>
                        <div className="flex items-baseline justify-between">
                            <Skeleton className="h-7 w-16 rounded" />
                            <Skeleton className="h-4 w-12 rounded-full" />
                        </div>
                        <Skeleton className="h-3 w-full rounded" />
                    </div>
                ))}
            </div>

            {/* 3. Main Grid Sections Skeleton (Chart + Approvals + Renewals) */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                {/* Left Large Column (Chart + Distribution) */}
                <div className="space-y-4 lg:col-span-8">
                    {/* Trend Chart Card Skeleton */}
                    <div className="rounded-xl border border-surface-border bg-surface-base p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-44 rounded" />
                                <Skeleton className="h-3 w-56 rounded" />
                            </div>
                            <div className="flex gap-1.5">
                                <Skeleton className="h-7 w-16 rounded-md" />
                                <Skeleton className="h-7 w-16 rounded-md" />
                            </div>
                        </div>
                        <Skeleton className="h-[260px] w-full rounded-lg" />
                    </div>

                    {/* Breakdown Distribution Grid Skeleton */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-surface-border bg-surface-base p-4 space-y-3">
                            <Skeleton className="h-4 w-36 rounded" />
                            <Skeleton className="h-[180px] w-full rounded-lg" />
                        </div>
                        <div className="rounded-xl border border-surface-border bg-surface-base p-4 space-y-3">
                            <Skeleton className="h-4 w-36 rounded" />
                            <Skeleton className="h-[180px] w-full rounded-lg" />
                        </div>
                    </div>
                </div>

                {/* Right Column (Pending Approvals + Upcoming Expiry) */}
                <div className="space-y-4 lg:col-span-4">
                    {/* Pending Approvals Card Skeleton */}
                    <div className="rounded-xl border border-surface-border bg-surface-base p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-36 rounded" />
                            <Skeleton className="h-5 w-8 rounded-full" />
                        </div>
                        <div className="space-y-2.5">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="rounded-lg border border-surface-border/60 p-2.5 space-y-2">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-3 w-20 rounded" />
                                        <Skeleton className="h-3 w-14 rounded" />
                                    </div>
                                    <Skeleton className="h-3.5 w-[85%] rounded" />
                                    <Skeleton className="h-3 w-[50%] rounded" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Expiry Renewals Card Skeleton */}
                    <div className="rounded-xl border border-surface-border bg-surface-base p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-40 rounded" />
                            <Skeleton className="h-5 w-8 rounded-full" />
                        </div>
                        <div className="space-y-2.5">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="rounded-lg border border-surface-border/60 p-2.5 space-y-2">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-3 w-24 rounded" />
                                        <Skeleton className="h-4 w-12 rounded-full" />
                                    </div>
                                    <Skeleton className="h-3.5 w-[90%] rounded" />
                                    <Skeleton className="h-3 w-[60%] rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
