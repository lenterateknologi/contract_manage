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
                    'p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-[#1e293b] rounded-[24px]',
                    className
                )}
            >
                {(title || description) && (
                    <DialogHeader className="p-8 border-b border-black/5 dark:border-white/5 bg-[#0f172a]/5 dark:bg-white/5 text-left">
                        {title && (
                            <DialogTitle className="text-base font-bold text-black dark:text-white">
                                {title}
                            </DialogTitle>
                        )}
                        {description && (
                            <DialogDescription className="text-xs font-medium text-black dark:text-white mt-1">
                                {description}
                            </DialogDescription>
                        )}
                    </DialogHeader>
                )}
                
                <div className="p-8">
                    {children}
                </div>

                {footer && (
                    <DialogFooter className="p-6 border-t border-black/5 dark:border-white/5 bg-[#0f172a]/5 dark:bg-white/5">
                        {footer}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
