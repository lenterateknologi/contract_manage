import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialogs/Dialog';
import { Button } from '@/components/ui/buttons/Button';
import { Checkbox } from '@/components/ui/selection/Checkbox';
export interface WorkflowStep {
    id: any;
    meta?: {
        allow_info_edit?: boolean;
        allow_f1_edit?: boolean;
        allow_f2_edit?: boolean;
        allow_agreement_edit?: boolean;
        allow_attachment_edit?: boolean;
        allow_reference?: boolean;
        is_manager?: boolean;
        show_f2_contract_no?: boolean;
        show_tax_toggle?: boolean;
    };
    filter_department?: boolean;
    filter_company_group?: boolean;
    filter_region?: boolean;
    filter_company?: boolean;
    [key: string]: any;
}

interface AdvancedStepSettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    step: WorkflowStep;
    onUpdateStep: (updates: Partial<WorkflowStep>) => void;
}

export function AdvancedStepSettingsModal({ open, onOpenChange, step, onUpdateStep }: AdvancedStepSettingsModalProps) {
    const handleCheckedChange = (field: keyof WorkflowStep, checked: boolean) => {
        onUpdateStep({ [field]: checked });
    };

    const handleMetaChange = (field: string, checked: boolean) => {
        onUpdateStep({
            meta: {
                ...(step.meta || {}),
                [field]: checked,
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Pengaturan Lanjutan Tahap</DialogTitle>
                    <DialogDescription>Konfigurasi kontrol perilaku & hak akses untuk tahap ini.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">

                    <div className="space-y-3">
                        <h4 className="text-sm font-bold tracking-wide uppercase text-slate-900 dark:text-slate-100">Formulir & Dokumen</h4>
                        <p className="text-xs text-slate-500">Kontrol akses untuk form pengisian dan berkas lampiran kontrak.</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Edit F1 (Permohonan)</label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Ubah form permohonan</p>
                                </div>
                                <Checkbox
                                    checked={step.meta?.allow_f1_edit !== false}
                                    onCheckedChange={(c) => handleMetaChange('allow_f1_edit', !!c)}
                                />
                            </div>
                            <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Edit F2 (Ringkasan)</label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Ubah form ringkasan</p>
                                </div>
                                <Checkbox
                                    checked={step.meta?.allow_f2_edit !== false}
                                    onCheckedChange={(c) => handleMetaChange('allow_f2_edit', !!c)}
                                />
                            </div>
                            <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Edit Draft Perjanjian</label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Upload & ubah dokumen</p>
                                </div>
                                <Checkbox
                                    checked={step.meta?.allow_agreement_edit !== false}
                                    onCheckedChange={(c) => handleMetaChange('allow_agreement_edit', !!c)}
                                />
                            </div>
                            <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Upload Lampiran</label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Tambah dokumen pendukung</p>
                                </div>
                                <Checkbox
                                    checked={step.meta?.allow_attachment_edit !== false}
                                    onCheckedChange={(c) => handleMetaChange('allow_attachment_edit', !!c)}
                                />
                            </div>
                            <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Ubah Kontrak Referensi</label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Tautkan ke kontrak lain</p>
                                </div>
                                <Checkbox
                                    checked={step.meta?.allow_reference !== false}
                                    onCheckedChange={(c) => handleMetaChange('allow_reference', !!c)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-150 dark:border-slate-800">
                        <h4 className="text-sm font-bold tracking-wide uppercase text-slate-900 dark:text-slate-100">Informasi Kontrak</h4>
                        <p className="text-xs text-slate-500">Kontrol akses untuk mengubah detail informasi umum kontrak.</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Edit Info Kontrak</label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Ubah data utama kontrak</p>
                                </div>
                                <Checkbox
                                    checked={step.meta?.allow_info_edit !== false}
                                    onCheckedChange={(c) => handleMetaChange('allow_info_edit', !!c)}
                                />
                            </div>
                            <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Tampilkan No. Kontrak (F2)</label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Tampilkan field nomor kontrak F2</p>
                                </div>
                                <Checkbox
                                    checked={step.meta?.show_f2_contract_no !== false}
                                    onCheckedChange={(c) => handleMetaChange('show_f2_contract_no', !!c)}
                                />
                            </div>
                            <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Tampilkan Penentuan Pajak</label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Tampilkan pengaturan penentuan PPN/Pajak</p>
                                </div>
                                <Checkbox
                                    checked={step.meta?.show_tax_toggle !== false}
                                    onCheckedChange={(c) => handleMetaChange('show_tax_toggle', !!c)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="default" onClick={() => onOpenChange(false)}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}