import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialogs/Dialog';
import { cn } from '@/lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    description?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
    className?: string;
    showClose?: boolean;
    headerVariant?: 'default' | 'primary' | 'danger';
    headerIcon?: React.ReactNode;
}

const maxWidthMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-[95vw]',
};

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    maxWidth = 'md',
    className,
    showClose = true,
    headerVariant = 'default',
    headerIcon,
}: ModalProps) {
    const isBannerHeader = headerVariant === 'primary' || headerVariant === 'danger';
    const bgClass = headerVariant === 'danger' ? 'bg-rose-600 text-white' : 'bg-primary text-primary-foreground';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent 
                className={cn(
                    maxWidthMap[maxWidth],
                    'p-0 border border-slate-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 rounded-[8px] overflow-hidden',
                    className
                )}
            >
                {(title || description) && (
                    isBannerHeader ? (
                        <div className="px-6 py-4 border-b border-primary/20 dark:border-zinc-700/80 bg-primary dark:bg-zinc-800/90 text-white dark:text-zinc-200 flex items-center justify-between rounded-t-[8px]">
                            <div className="flex items-center gap-3 z-10 pr-10">
                                {headerIcon && (
                                    <div className="bg-white/20 text-white border border-white/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30 flex h-9 w-9 items-center justify-center rounded-lg">
                                        {headerIcon}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-sm font-bold tracking-tight text-white dark:text-zinc-200">{title}</h3>
                                    {description && (
                                        <p className="text-white/80 dark:text-zinc-400 text-xs font-medium mt-0.5">{description}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <DialogHeader className="px-6 py-4 border-b border-primary/20 dark:border-zinc-700/80 bg-primary dark:bg-zinc-800/90 text-white dark:text-zinc-200 text-left overflow-hidden rounded-t-[8px]">
                            {title && (
                                <DialogTitle className="text-sm font-bold text-white dark:text-zinc-100 tracking-tight">
                                    {title}
                                </DialogTitle>
                            )}
                            {description && (
                                <DialogDescription className="text-xs font-medium text-white/80 dark:text-zinc-400 mt-0.5">
                                    {description}
                                </DialogDescription>
                            )}
                        </DialogHeader>
                    )
                )}
                
                <div className="p-8 text-text-main bg-white dark:bg-zinc-900">
                    {children}
                </div>

                {footer && (
                    <DialogFooter className="p-6 border-t border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-b-[8px] overflow-hidden">
                        {footer}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
