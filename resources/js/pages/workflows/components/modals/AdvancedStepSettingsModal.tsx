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
        
        show_tab_f1?: boolean;
        show_tab_f2?: boolean;
        show_tab_agreement?: boolean;
        show_tab_attachments?: boolean;
        show_tab_references?: boolean;
        show_tab_timeline?: boolean;
        show_tab_chat?: boolean;
        
        allow_f2_contract_no_edit?: boolean;
        allow_tax_toggle_edit?: boolean;
        show_info?: boolean;
        allow_timeline_edit?: boolean;
        allow_chat_edit?: boolean;
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

    const handleSetAll = (checked: boolean) => {
        onUpdateStep({
            meta: {
                ...(step.meta || {}),
                allow_info_edit: checked,
                allow_f1_edit: checked,
                allow_f2_edit: checked,
                allow_agreement_edit: checked,
                allow_attachment_edit: checked,
                allow_reference: checked,
                show_f2_contract_no: checked,
                show_tax_toggle: checked,
                show_tab_f1: checked,
                show_tab_f2: checked,
                show_tab_agreement: checked,
                show_tab_attachments: checked,
                show_tab_references: checked,
                show_tab_timeline: checked,
                show_tab_chat: checked,
                allow_f2_contract_no_edit: checked,
                allow_tax_toggle_edit: checked,
                show_info: checked,
                allow_timeline_edit: checked,
                allow_chat_edit: checked,
                show_action_panel: checked,
                show_document_detail: checked,
                show_tab_members: checked,
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Pengaturan Lanjutan Tahap</DialogTitle>
                    <DialogDescription>Konfigurasi kontrol perilaku & hak akses untuk tahap ini.</DialogDescription>
                </DialogHeader>

                <div className="flex justify-end gap-2 mt-2 -mb-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => handleSetAll(true)}>Centang Semua</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => handleSetAll(false)}>Kosongkan Semua</Button>
                </div>

                <div className="py-4">
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Fitur / Tab</th>
                                    <th className="px-4 py-3 font-semibold text-center w-28">Dapat Diedit</th>
                                    <th className="px-4 py-3 font-semibold text-center w-28">Tampilkan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-3 font-medium">F1 (Permohonan)</td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.allow_f1_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_f1_edit', !!c)} /></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_tab_f1 !== false} onCheckedChange={(c) => handleMetaChange('show_tab_f1', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-3 font-medium">F2 (Ringkasan)</td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.allow_f2_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_f2_edit', !!c)} /></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_tab_f2 !== false} onCheckedChange={(c) => handleMetaChange('show_tab_f2', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400 pl-8">↳ Field No. Kontrak</td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.allow_f2_contract_no_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_f2_contract_no_edit', !!c)} /></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_f2_contract_no !== false} onCheckedChange={(c) => handleMetaChange('show_f2_contract_no', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400 pl-8">↳ Field Penentuan Pajak</td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.allow_tax_toggle_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_tax_toggle_edit', !!c)} /></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_tax_toggle !== false} onCheckedChange={(c) => handleMetaChange('show_tax_toggle', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-3 font-medium">Draft Perjanjian</td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.allow_agreement_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_agreement_edit', !!c)} /></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_tab_agreement !== false} onCheckedChange={(c) => handleMetaChange('show_tab_agreement', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-3 font-medium">Lampiran</td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.allow_attachment_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_attachment_edit', !!c)} /></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_tab_attachments !== false} onCheckedChange={(c) => handleMetaChange('show_tab_attachments', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-3 font-medium">Kontrak Referensi</td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.allow_reference !== false} onCheckedChange={(c) => handleMetaChange('allow_reference', !!c)} /></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_tab_references !== false} onCheckedChange={(c) => handleMetaChange('show_tab_references', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-3 font-medium">Info Kontrak Utama</td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.allow_info_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_info_edit', !!c)} /></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_info !== false} onCheckedChange={(c) => handleMetaChange('show_info', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-3 font-medium">Alur Persetujuan</td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.allow_timeline_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_timeline_edit', !!c)} /></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_tab_timeline !== false} onCheckedChange={(c) => handleMetaChange('show_tab_timeline', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-3 font-medium">Chat</td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.allow_chat_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_chat_edit', !!c)} /></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_tab_chat !== false} onCheckedChange={(c) => handleMetaChange('show_tab_chat', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-3 font-medium">Panel Aksi (Approval)</td>
                                    <td className="px-4 py-3 text-center"><span className="text-slate-300 dark:text-slate-700">-</span></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_action_panel !== false} onCheckedChange={(c) => handleMetaChange('show_action_panel', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-3 font-medium">Detail Dokumen & Alur Kerja</td>
                                    <td className="px-4 py-3 text-center"><span className="text-slate-300 dark:text-slate-700">-</span></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_document_detail !== false} onCheckedChange={(c) => handleMetaChange('show_document_detail', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-3 font-medium">Daftar Member</td>
                                    <td className="px-4 py-3 text-center"><span className="text-slate-300 dark:text-slate-700">-</span></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_tab_members !== false} onCheckedChange={(c) => handleMetaChange('show_tab_members', !!c)} /></td>
                                </tr>
                            </tbody>
                        </table>
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