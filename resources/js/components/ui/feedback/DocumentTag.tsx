import React from 'react';
import { Badge } from '@/components/ui/feedback/Badge';
import { ChipIcon, type ChipIconSize } from '@/components/ui/feedback/ChipIcon';
import { FileImage, FileSpreadsheet, FileText, FileArchive, Paperclip, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileTypeConfig {
    icon: LucideIcon;
    bg: string;
}

/**
 * Returns configuration for file icon based on extension.
 * Optimized for crisp readability in both light and dark mode.
 */
export function getFileTypeConfig(fileName: string): FileTypeConfig {
    const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';

    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp'].includes(ext)) {
        return {
            icon: FileImage,
            bg: 'bg-violet-600 dark:bg-violet-600/90',
        };
    }

    if (['pdf'].includes(ext)) {
        return {
            icon: FileText,
            bg: 'bg-rose-500 dark:bg-rose-600/90',
        };
    }

    if (['xls', 'xlsx', 'csv'].includes(ext)) {
        return {
            icon: FileSpreadsheet,
            bg: 'bg-emerald-600 dark:bg-emerald-600/90',
        };
    }

    if (['doc', 'docx', 'rtf', 'odt', 'txt'].includes(ext)) {
        return {
            icon: FileText,
            bg: 'bg-blue-600 dark:bg-blue-600/90',
        };
    }

    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        return {
            icon: FileArchive,
            bg: 'bg-amber-600 dark:bg-amber-600/90',
        };
    }

    return {
        icon: FileText,
        bg: 'bg-primary dark:bg-primary/90',
    };
}

export interface FileChipIconProps {
    fileName?: string;
    size?: ChipIconSize;
    className?: string;
}

/**
 * Uniform File Icon component across all modals, tables, and attachments.
 */
export function FileChipIcon({ fileName = '', size = 'sm', className }: FileChipIconProps) {
    const { icon, bg } = getFileTypeConfig(fileName);
    return <ChipIcon size={size} bg={bg} icon={icon} className={className} />;
}

/**
 * Helper function for backward compatibility returning <FileChipIcon />
 */
export function getFileIcon(fileName: string, size: ChipIconSize = 'sm') {
    return <FileChipIcon fileName={fileName} size={size} />;
}

export interface AttachmentCategoryBadgeProps {
    item?: any;
    category?: string;
    isVendorDoc?: boolean;
    isChatDoc?: boolean;
    className?: string;
}

/**
 * Uniform Attachment Category Badge with optimized dark mode styling.
 */
export function AttachmentCategoryBadge({
    item,
    category,
    isVendorDoc,
    isChatDoc,
    className,
}: AttachmentCategoryBadgeProps) {
    const isVendor = isVendorDoc ?? item?.is_vendor_doc ?? (category === 'Vendor Document' || item?.category === 'Vendor Document');
    const isChat = isChatDoc ?? item?.is_chat_doc ?? (category === 'Lampiran Diskusi' || item?.category === 'Lampiran Diskusi');

    if (isVendor) {
        return (
            <Badge
                variant="outline"
                className={cn(
                    'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:bg-amber-950/40 dark:border-amber-700/50 dark:text-amber-300 px-1.5 py-0 text-[8px] font-bold uppercase tracking-wider rounded-xs select-none',
                    className,
                )}
            >
                CATALOG
            </Badge>
        );
    }

    if (isChat) {
        return (
            <Badge
                variant="outline"
                className={cn(
                    'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-700/50 dark:text-emerald-300 px-1.5 py-0 text-[8px] font-bold uppercase tracking-wider rounded-xs select-none',
                    className,
                )}
            >
                DISKUSI
            </Badge>
        );
    }

    return (
        <Badge
            variant="outline"
            className={cn(
                'border-primary/30 bg-primary/10 text-primary dark:bg-primary/20 dark:border-primary/40 dark:text-primary-foreground/90 px-1.5 py-0 text-[8px] font-bold uppercase tracking-wider rounded-xs select-none',
                className,
            )}
        >
            LAMPIRAN
        </Badge>
    );
}

/**
 * Helper function for rendering category badge uniformly
 */
export function getAttachmentBadge(atOrCategory: any, className?: string) {
    if (typeof atOrCategory === 'string') {
        return <AttachmentCategoryBadge category={atOrCategory} className={className} />;
    }
    return <AttachmentCategoryBadge item={atOrCategory} className={className} />;
}
