import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/overlays/Dialog';
import { Button } from '@/components/ui/base/Button';
import { Checkbox } from '@/components/ui/base/Checkbox';
import { WorkflowStep } from '../../types';

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
                    <DialogDescription>Konfigurasi filter organisasi dan kontrol perilaku & hak akses untuk tahap ini.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Filter Organisasi</h4>
                        <p className="text-xs text-slate-500">Batasi *approver* berdasarkan struktur organisasi inisiator kontrak.</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <div className="space-y-0.5">
                                    <label htmlFor={`is_manager_${step.id}`} className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        Atasan Langsung (Manager)
                                    </label>
                                    <p className="text-[11px] text-slate-500">Otomatis berdasarkan inisiator</p>
                                </div>
                                <Checkbox
                                    id={`is_manager_${step.id}`}
                                    checked={!!step.meta?.is_manager}
                                    onCheckedChange={(c) => handleMetaChange('is_manager', !!c)}
                                />
                            </div>
                            <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <div className="space-y-0.5">
                                    <label htmlFor={`filter_department_${step.id}`} className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        Departemen
                                    </label>
                                    <p className="text-[11px] text-slate-500">Sama dengan inisiator</p>
                                </div>
                                <Checkbox
                                    id={`filter_department_${step.id}`}
                                    checked={!!step.filter_department}
                                    onCheckedChange={(c) => handleCheckedChange('filter_department', !!c)}
                                />
                            </div>
                            <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <div className="space-y-0.5">
                                    <label htmlFor={`filter_company_group_${step.id}`} className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        Grup Perusahaan
                                    </label>
                                    <p className="text-[11px] text-slate-500">Sama dengan inisiator</p>
                                </div>
                                <Checkbox
                                    id={`filter_company_group_${step.id}`}
                                    checked={!!step.filter_company_group}
                                    onCheckedChange={(c) => handleCheckedChange('filter_company_group', !!c)}
                                />
                            </div>
                            <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <div className="space-y-0.5">
                                    <label htmlFor={`filter_region_${step.id}`} className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        Wilayah
                                    </label>
                                    <p className="text-[11px] text-slate-500">Sama dengan inisiator</p>
                                </div>
                                <Checkbox
                                    id={`filter_region_${step.id}`}
                                    checked={!!step.filter_region}
                                    onCheckedChange={(c) => handleCheckedChange('filter_region', !!c)}
                                />
                            </div>
                            <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <div className="space-y-0.5">
                                    <label htmlFor={`filter_company_${step.id}`} className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        Perusahaan
                                    </label>
                                    <p className="text-[11px] text-slate-500">Sama dengan inisiator</p>
                                </div>
                                <Checkbox
                                    id={`filter_company_${step.id}`}
                                    checked={!!step.filter_company}
                                    onCheckedChange={(c) => handleCheckedChange('filter_company', !!c)}
                                />
                            </div>
                        </div>
                    </div>

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