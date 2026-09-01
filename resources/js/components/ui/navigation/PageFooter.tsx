import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PageFooterProps {
    className?: string;
    children?: React.ReactNode;
    pagination?: {
        currentPage: number;
        lastPage: number;
        total: number;
        from?: number;
        to?: number;
        onPageChange: (page: number) => void;
        perPage?: number;
        onPerPageChange?: (perPage: number) => void;
    };
}

export function PageFooter({ className, children, pagination }: PageFooterProps) {
    const currentYear = new Date().getFullYear();

    // Helper pagination buttons range mapping (limit to max 5 page numbers visible)
    const pageButtons = React.useMemo(() => {
        if (!pagination) return [];
        const { currentPage, lastPage } = pagination;
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(lastPage, start + 4);
        
        if (end - start < 4) {
            start = Math.max(1, end - 4);
        }
        
        const pages = [];
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    }, [pagination]);

    return (
        <footer className={cn(
            "mt-auto border-t border-border bg-white px-6 py-4 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground",
            className
        )}>
            {pagination ? (
                <>
                    <div>
                        {pagination.from !== undefined && pagination.to !== undefined ? (
                            <div className="flex items-center gap-1.5">
                                <span>Menampilkan</span>
                                {pagination.onPerPageChange && pagination.perPage !== undefined ? (
                                    <input
                                        type="number"
                                        min={1}
                                        max={9999}
                                        defaultValue={pagination.perPage}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = parseInt((e.target as HTMLInputElement).value, 10);
                                                if (val >= 1 && val <= 9999) {
                                                    pagination.onPerPageChange?.(val);
                                                } else {
                                                    (e.target as HTMLInputElement).value = String(pagination.perPage);
                                                }
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const val = parseInt(e.target.value, 10);
                                            if (val >= 1 && val <= 9999 && val !== pagination.perPage) {
                                                pagination.onPerPageChange?.(val);
                                            } else {
                                                e.target.value = String(pagination.perPage);
                                            }
                                        }}
                                        className="h-6 min-w-12 max-w-16 px-1 rounded border border-border bg-card text-center text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        title="Tekan Enter untuk mengubah limit data (1 - 9999)"
                                    />
                                ) : (
                                    <span className="font-semibold text-text-main">{pagination.to - pagination.from + 1}</span>
                                )}
                                <span>data per halaman dari <span className="font-semibold text-text-main">{pagination.total}</span> data</span>
                            </div>
                        ) : (
                            <span>Total: {pagination.total} data</span>
                        )}
                    </div>
                    {pagination.lastPage > 1 && (
                        <div className="flex items-center gap-1.5 select-none">
                            {/* Advance Prev (Jump back 5 pages) */}
                            <button
                                onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 5))}
                                disabled={pagination.currentPage === 1}
                                title="Mundur 5 Halaman"
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-all hover:bg-muted/50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                                <ChevronsLeft size={13} />
                            </button>

                            {/* Prev Page */}
                            <button
                                onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
                                disabled={pagination.currentPage === 1}
                                title="Halaman Sebelumnya"
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-all hover:bg-muted/50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                                <ChevronLeft size={13} />
                            </button>

                            {/* Page Numbers (max 5 items) */}
                            {pageButtons.map((page) => {
                                const isCurrent = page === pagination.currentPage;
                                if (isCurrent) {
                                    return (
                                        <input
                                            key={page}
                                            type="number"
                                            min={1}
                                            max={pagination.lastPage}
                                            defaultValue={page}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = parseInt((e.target as HTMLInputElement).value, 10);
                                                    if (val >= 1 && val <= pagination.lastPage) {
                                                        pagination.onPageChange(val);
                                                    } else {
                                                        (e.target as HTMLInputElement).value = String(pagination.currentPage);
                                                    }
                                                }
                                            }}
                                            className="flex h-7 w-10 items-center justify-center rounded-md border border-primary bg-primary text-primary-foreground font-semibold text-center text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            title="Ketik halaman lalu tekan Enter"
                                        />
                                    );
                                }
                                return (
                                    <button
                                        key={page}
                                        onClick={() => pagination.onPageChange(page)}
                                        className={cn(
                                            'flex h-7 w-7 items-center justify-center rounded-md text-xs transition-all cursor-pointer font-medium border border-border bg-card text-muted-foreground hover:bg-muted/50',
                                        )}
                                    >
                                        {page}
                                    </button>
                                );
                            })}

                            {/* Next Page */}
                            <button
                                onClick={() => pagination.onPageChange(Math.min(pagination.lastPage, pagination.currentPage + 1))}
                                disabled={pagination.currentPage === pagination.lastPage}
                                title="Halaman Selanjutnya"
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-all hover:bg-muted/50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                                <ChevronRight size={13} />
                            </button>

                            {/* Advance Next (Jump forward 5 pages) */}
                            <button
                                onClick={() => pagination.onPageChange(Math.min(pagination.lastPage, pagination.currentPage + 5))}
                                disabled={pagination.currentPage === pagination.lastPage}
                                title="Maju 5 Halaman"
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-all hover:bg-muted/50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                                <ChevronsRight size={13} />
                            </button>
                        </div>
                    )}
                </>
            ) : children ? children : (
                <>
                    <div>
                        <span>&copy; {currentYear} Contract Manage. All rights reserved.</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="hover:text-foreground cursor-pointer transition-colors">Panduan</span>
                        <span className="hover:text-foreground cursor-pointer transition-colors">Bantuan</span>
                        <span className="text-border dark:text-zinc-800">|</span>
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded border font-mono">v1.0.0</span>
                    </div>
                </>
            )}
        </footer>
    );
}
