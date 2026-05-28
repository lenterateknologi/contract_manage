import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/overlays/Dialog';
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
}: ModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent 
                className={cn(
                    maxWidthMap[maxWidth],
                    'p-0 border-none shadow-2xl bg-surface-base rounded-[24px]',
                    className
                )}
            >
                {(title || description) && (
                    <DialogHeader className="p-8 border-b border-surface-border bg-surface-muted/30 text-left rounded-t-[24px] overflow-hidden">
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
