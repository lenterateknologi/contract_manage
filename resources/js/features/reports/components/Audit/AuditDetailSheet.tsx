import { Button } from '@/components/ui/buttons/Button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/dialogs/Sheet';
import { formatDateTime } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Clock, ExternalLink, FileText, Layers, User } from 'lucide-react';
import React from 'react';
import type { AuditLog } from '../../types/reports.types';

interface AuditDetailSheetProps {
    log: AuditLog | null;
    open: boolean;
    onClose: () => void;
}

export function AuditDetailSheet({ log, open, onClose }: AuditDetailSheetProps) {
    if (!log) return null;

    return (
        <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <SheetContent className="custom-scrollbar w-full overflow-y-auto border-neutral-300 bg-white sm:max-w-lg dark:border-neutral-700 dark:bg-neutral-900">
                <SheetHeader className="border-b border-neutral-200 pb-4 text-left dark:border-neutral-800">
                    <SheetTitle className="text-base font-bold text-black dark:text-white">Detail Transaksi Jejak Audit</SheetTitle>
                    <SheetDescription className="text-xs text-neutral-500">
                        ID Log: <span className="font-mono">{log.id}</span>
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Timestamp & Action */}
                    <div className="rounded-[4px] border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-500">Tipe Aksi</span>
                            <span className="rounded-[4px] border border-neutral-300 bg-neutral-200/60 px-2 py-0.5 text-xs font-bold uppercase text-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                                {log.action}
                            </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                            <Clock size={13} className="text-neutral-400" />
                            <span>Waktu: {formatDateTime(log.created_at)}</span>
                        </div>
                    </div>

                    {/* Actor Details */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 dark:border-neutral-800">
                            <User size={14} className="text-black dark:text-white" />
                            <h4 className="text-xs font-bold text-black uppercase dark:text-white">Identitas Pelaksana (Actor)</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <span className="text-[11px] text-neutral-500">Nama Pelaksana</span>
                                <p className="font-semibold text-black dark:text-white">{log.actor || 'System Auto'}</p>
                            </div>
                            <div>
                                <span className="text-[11px] text-neutral-500">Email</span>
                                <p className="font-medium text-neutral-700 dark:text-neutral-300">{log.actor_email || '—'}</p>
                            </div>
                            <div>
                                <span className="text-[11px] text-neutral-500">Divisi</span>
                                <p className="font-medium text-neutral-700 dark:text-neutral-300">{log.actor_division || '—'}</p>
                            </div>
                            <div>
                                <span className="text-[11px] text-neutral-500">Departemen</span>
                                <p className="font-medium text-neutral-700 dark:text-neutral-300">{log.actor_department || '—'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Contract Details */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 dark:border-neutral-800">
                            <FileText size={14} className="text-black dark:text-white" />
                            <h4 className="text-xs font-bold text-black uppercase dark:text-white">Informasi Dokumen / Kontrak</h4>
                        </div>
                        <div className="space-y-2 text-xs">
                            <div>
                                <span className="text-[11px] text-neutral-500">No. Form / Pengajuan</span>
                                <p className="font-mono font-bold text-black dark:text-white">{log.form_no || '—'}</p>
                            </div>
                            <div>
                                <span className="text-[11px] text-neutral-500">No. Kontrak</span>
                                <p className="font-mono font-bold text-black dark:text-white">{log.contract_no || '—'}</p>
                            </div>
                            <div>
                                <span className="text-[11px] text-neutral-500">Judul Kontrak</span>
                                <p className="font-medium text-black dark:text-white">{log.contract_title || '—'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <div>
                                    <span className="text-[11px] text-neutral-500">Tipe Kontrak</span>
                                    <p className="font-medium text-neutral-700 dark:text-neutral-300">{log.contract_type || '—'}</p>
                                </div>
                                <div>
                                    <span className="text-[11px] text-neutral-500">Status Terakhir</span>
                                    <p className="font-semibold text-black dark:text-white">{log.contract_status || '—'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Workflow Step info */}
                    {(log.step_name || log.step_number) && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 dark:border-neutral-800">
                                <Layers size={14} className="text-black dark:text-white" />
                                <h4 className="text-xs font-bold text-black uppercase dark:text-white">Tahapan Alur Kerja (Workflow)</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-[11px] text-neutral-500">Nama Step</span>
                                    <p className="font-semibold text-black dark:text-white">{log.step_name || '—'}</p>
                                </div>
                                <div>
                                    <span className="text-[11px] text-neutral-500">Urutan Step</span>
                                    <p className="font-semibold text-black dark:text-white">
                                        {log.step_number !== undefined ? `Step #${log.step_number}` : '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Description Notes */}
                    <div className="space-y-2">
                        <span className="text-[11px] font-bold text-black uppercase dark:text-white">Catatan / Deskripsi Lengkap</span>
                        <div className="rounded-[4px] border border-neutral-200 bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-800 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-200">
                            {log.description || 'Tidak ada keterangan tambahan pada transaksi ini.'}
                        </div>
                    </div>

                    {/* Shortcut Link to Contract Detail */}
                    {log.contract_id && (
                        <div className="pt-2">
                            <Link href={`/contracts?detail=${log.contract_id}`}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-2 rounded-[4px] border-neutral-300 text-xs font-bold text-black dark:border-neutral-700 dark:text-white"
                                >
                                    <ExternalLink size={13} />
                                    <span>Buka Detail Kontrak Terkait</span>
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
export default AuditDetailSheet;
