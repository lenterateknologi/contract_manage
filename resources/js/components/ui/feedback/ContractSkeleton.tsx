import { Skeleton } from "@/components/ui/feedback/Skeleton";

export function ContractTableSkeleton() {
    return (
        <div className="w-full space-y-4">
            <div className="flex items-center space-x-4 px-4 py-3 border-b border-surface-border/60 bg-surface-muted/20">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-20" />
            </div>
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 px-4 py-4 border-b border-surface-border/30">
                    <Skeleton className="h-4 w-4" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[40%]" />
                        <Skeleton className="h-3 w-[20%]" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-xl" />
                </div>
            ))}
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
