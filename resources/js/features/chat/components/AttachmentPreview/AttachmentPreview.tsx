import DocumentPreviewModal from '@/features/Contracts/components/modals/DocumentPreviewModal';
import React from 'react';

interface AttachmentPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    url?: string | null;
    title?: string;
}

export function AttachmentPreview({ isOpen, onClose, url, title }: AttachmentPreviewProps) {
    if (!isOpen || !url) return null;

    return (
        <DocumentPreviewModal
            isOpen={isOpen}
            onClose={onClose}
            url={url}
            title={title || 'Pratinjau Berkas'}
        />
    );
}
