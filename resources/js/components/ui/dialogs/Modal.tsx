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
                    'p-0 border-none shadow-2xl bg-surface-base rounded-[24px] overflow-hidden',
                    className
                )}
            >
                {(title || description) && (
                    isBannerHeader ? (
                        <div className="p-[1px] pb-0">
                            <div className={cn(bgClass, "px-5 py-3.5 relative overflow-hidden flex items-center justify-between rounded-[8px] border border-white/10 shadow-xs")}>
                                <div className="flex items-center gap-3 z-10 pr-10">
                                    {headerIcon && (
                                        <div className="bg-white/15 border border-white/20 shadow-xs flex h-9 w-9 items-center justify-center rounded-lg backdrop-blur-xs text-white">
                                            {headerIcon}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-sm font-bold tracking-wide text-white">{title}</h3>
                                        {description && (
                                            <p className="text-white/80 text-[10.5px] font-normal mt-0.5">{description}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <DialogHeader className="p-8 border-b border-surface-border bg-surface-muted/30 text-left overflow-hidden rounded-t-[24px]">
                            {title && (
                                <DialogTitle className="text-base font-bold text-text-main">
                                    {title}
                                </DialogTitle>
                            )}
                            {description && (
                                <DialogDescription className="text-xs font-medium text-text-desc mt-1">
                                    {description}
                                </DialogDescription>
                            )}
                        </DialogHeader>
                    )
                )}
                
                <div className="p-8">
                    {children}
                </div>

                {footer && (
                    <DialogFooter className="p-6 border-t border-surface-border bg-surface-muted/30 rounded-b-[24px] overflow-hidden">
                        {footer}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
