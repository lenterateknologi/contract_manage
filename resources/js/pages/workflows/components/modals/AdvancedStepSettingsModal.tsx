import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/overlays/Dialog';
import { Button } from '@/components/ui/base/Button';
import { Checkbox } from '@/components/ui/base/Checkbox';
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
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Kontrol Perilaku & Hak Akses</h4>
                        <p className="text-xs text-slate-500">Hak apa saja yang dimiliki pengguna saat tahapan ini aktif.</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Edit Info</label>
                                    <p className="text-[11px] text-slate-500">Ubah data utama kontrak</p>
                                </div>
                                <Checkbox
                                    checked={step.meta?.allow_info_edit !== false}
                                    onCheckedChange={(c) => handleMetaChange('allow_info_edit', !!c)}
                                />
                            </div>
                            <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Edit F1</label>
                                    <p className="text-[11px] text-slate-500">Ubah form permohonan</p>
                                </div>
                                <Checkbox
                                    checked={step.meta?.allow_f1_edit !== false}
                                    onCheckedChange={(c) => handleMetaChange('allow_f1_edit', !!c)}
                                />
                            </div>
                            <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Edit F2</label>
                                    <p className="text-[11px] text-slate-500">Ubah form ringkasan</p>
                                </div>
                                <Checkbox
                                    checked={step.meta?.allow_f2_edit !== false}
                                    onCheckedChange={(c) => handleMetaChange('allow_f2_edit', !!c)}
                                />
                            </div>
                            <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Edit Draf Perjanjian</label>
                                    <p className="text-[11px] text-slate-500">Upload & ubah dokumen</p>
                                </div>
                                <Checkbox
                                    checked={step.meta?.allow_agreement_edit !== false}
                                    onCheckedChange={(c) => handleMetaChange('allow_agreement_edit', !!c)}
                                />
                            </div>
                            <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Upload Lampiran</label>
                                    <p className="text-[11px] text-slate-500">Tambah dokumen pendukung</p>
                                </div>
                                <Checkbox
                                    checked={step.meta?.allow_attachment_edit !== false}
                                    onCheckedChange={(c) => handleMetaChange('allow_attachment_edit', !!c)}
                                />
                            </div>
                            <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Ubah Referensi</label>
                                    <p className="text-[11px] text-slate-500">Tautkan ke kontrak lain</p>
                                </div>
                                <Checkbox
                                    checked={step.meta?.allow_reference !== false}
                                    onCheckedChange={(c) => handleMetaChange('allow_reference', !!c)}
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