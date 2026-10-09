import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    ExternalLink,
    Copy,
    Eye,
    FileEdit,
    Check,
    FileText,
} from 'lucide-react';
import { Contract } from '@/features/Contracts/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/feedback/Toast';

export interface ContractContextMenuProps {
    contract: Contract | null;
    position: { x: number; y: number } | null;
    onClose: () => void;
    onOpenDetail?: (contract: Contract) => void;
    onEdit?: (contract: Contract) => void;
}

export function ContractContextMenu({
    contract,
    position,
    onClose,
    onOpenDetail,
    onEdit,
}: ContractContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();
    const [adjustedPos, setAdjustedPos] = useState<{ x: number; y: number } | null>(position);
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedNo, setCopiedNo] = useState(false);

    useEffect(() => {
        if (!position) {
            setAdjustedPos(null);
            return;
        }

        // Calculate boundary constraints
        const menuWidth = 220;
        const menuHeight = 180;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        let posX = position.x;
        let posY = position.y;

        if (posX + menuWidth > screenWidth - 10) {
            posX = screenWidth - menuWidth - 10;
        }
        if (posY + menuHeight > screenHeight - 10) {
            posY = screenHeight - menuHeight - 10;
        }

        setAdjustedPos({ x: Math.max(10, posX), y: Math.max(10, posY) });
    }, [position]);

    useEffect(() => {
        if (!position) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        const handleScroll = () => {
            onClose();
        };

        window.addEventListener('mousedown', handleClickOutside, true);
        window.addEventListener('contextmenu', handleClickOutside, true);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            window.removeEventListener('mousedown', handleClickOutside, true);
            window.removeEventListener('contextmenu', handleClickOutside, true);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [position, onClose]);

    if (!contract || !adjustedPos) return null;

    const contractUrl = `${window.location.origin}/contracts/${contract.id}`;
    const formOrContractNo = contract.form_no || contract.contract_no || '';
    const isDraft = (contract.status || '').toLowerCase() === 'draft';

    const handleOpenNewTab = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(contractUrl, '_blank', 'noopener,noreferrer');
        onClose();
    };

    const handleOpenDetail = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onOpenDetail) {
            onOpenDetail(contract);
        }
        onClose();
    };

    const handleCopyLink = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(contractUrl);
            setCopiedLink(true);
            showToast('Tautan pengajuan berhasil disalin!', 'success');
            setTimeout(() => {
                setCopiedLink(false);
                onClose();
            }, 500);
        } catch {
            showToast('Gagal menyalin tautan.', 'error');
        }
    };

    const handleCopyNumber = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!formOrContractNo) return;
        try {
            await navigator.clipboard.writeText(formOrContractNo);
            setCopiedNo(true);
            showToast(`Nomor ${formOrContractNo} berhasil disalin!`, 'success');
            setTimeout(() => {
                setCopiedNo(false);
                onClose();
            }, 500);
        } catch {
            showToast('Gagal menyalin nomor.', 'error');
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onEdit) {
            onEdit(contract);
        }
        onClose();
    };

    return createPortal(
        <div
            ref={menuRef}
            style={{
                position: 'fixed',
                left: `${adjustedPos.x}px`,
                top: `${adjustedPos.y}px`,
                zIndex: 99999,
            }}
            className={cn(
                'w-56 overflow-hidden rounded-lg border border-surface-border bg-surface-card p-1 shadow-xl',
                'animate-in fade-in-0 zoom-in-95 duration-100 select-none backdrop-blur-md'
            )}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header info */}
            <div className="border-b border-surface-border px-2.5 py-1.5 mb-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-desc">
                    Opsi Pengajuan
                </div>
                <div className="text-xs font-semibold text-text-main truncate" title={contract.title}>
                    {contract.title}
                </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-0.5">
                <button
                    type="button"
                    onClick={handleOpenNewTab}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-text-main transition-colors hover:bg-primary hover:text-white group"
                >
                    <ExternalLink size={14} className="text-primary group-hover:text-white transition-colors" />
                    <span>Buka di Tab Baru</span>
                </button>

                <button
                    type="button"
                    onClick={handleOpenDetail}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-text-main transition-colors hover:bg-primary hover:text-white group"
                >
                    <Eye size={14} className="text-text-desc group-hover:text-white transition-colors" />
                    <span>Lihat Detail</span>
                </button>

                <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-text-main transition-colors hover:bg-primary hover:text-white group"
                >
                    {copiedLink ? (
                        <Check size={14} className="text-emerald-500 group-hover:text-white" />
                    ) : (
                        <Copy size={14} className="text-text-desc group-hover:text-white transition-colors" />
                    )}
                    <span>Salin Tautan Pengajuan</span>
                </button>

                {formOrContractNo && (
                    <button
                        type="button"
                        onClick={handleCopyNumber}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-text-main transition-colors hover:bg-primary hover:text-white group"
                    >
                        {copiedNo ? (
                            <Check size={14} className="text-emerald-500 group-hover:text-white" />
                        ) : (
                            <FileText size={14} className="text-text-desc group-hover:text-white transition-colors" />
                        )}
                        <span className="truncate">Salin No ({formOrContractNo})</span>
                    </button>
                )}

                {isDraft && onEdit && (
                    <>
                        <div className="border-t border-surface-border my-1" />
                        <button
                            type="button"
                            onClick={handleEdit}
                            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 transition-colors hover:bg-amber-500 hover:text-white group"
                        >
                            <FileEdit size={14} className="group-hover:text-white transition-colors" />
                            <span>Lanjutkan Edit Draft</span>
                        </button>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
}
