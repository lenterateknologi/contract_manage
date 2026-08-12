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
        allow_price_edit?: boolean;
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
                allow_price_edit: checked,
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
            <DialogContent className="sm:max-w-[700px] bg-slate-100/90 dark:bg-zinc-800/90 border border-slate-200/80 dark:border-zinc-700/80 text-slate-800 dark:text-zinc-100">
                <DialogHeader>
                    <DialogTitle className="text-slate-800 dark:text-zinc-100 font-bold">Pengaturan Lanjutan Tahap</DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-zinc-400">Konfigurasi kontrol perilaku & hak akses untuk tahap ini.</DialogDescription>
                </DialogHeader>

                <div className="flex justify-end gap-2 mt-2 -mb-2">
                    <Button type="button" size="sm" variant="outline" className="border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 font-bold" onClick={() => handleSetAll(true)}>Centang Semua</Button>
                    <Button type="button" size="sm" variant="outline" className="border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 font-bold" onClick={() => handleSetAll(false)}>Kosongkan Semua</Button>
                </div>

                <div className="py-4">
                    <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/90 shadow-xs">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100/90 dark:bg-zinc-800/90 text-slate-800 dark:text-zinc-200 border-b border-slate-200/80 dark:border-zinc-700/80">
                                <tr>
                                    <th className="px-4 py-3 font-bold">Fitur / Tab</th>
                                    <th className="px-4 py-3 font-bold text-center w-28">Dapat Diedit</th>
                                    <th className="px-4 py-3 font-bold text-center w-28">Tampilkan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/60 dark:divide-zinc-800/80">
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-zinc-200">F1 (Permohonan)</td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.allow_f1_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_f1_edit', !!c)} /></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_tab_f1 !== false} onCheckedChange={(c) => handleMetaChange('show_tab_f1', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-zinc-200">F2 (Ringkasan)</td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.allow_f2_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_f2_edit', !!c)} /></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_tab_f2 !== false} onCheckedChange={(c) => handleMetaChange('show_tab_f2', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-400 pl-8">↳ Field No. Kontrak</td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.allow_f2_contract_no_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_f2_contract_no_edit', !!c)} /></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_f2_contract_no !== false} onCheckedChange={(c) => handleMetaChange('show_f2_contract_no', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-400 pl-8">↳ Field Penentuan Pajak</td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.allow_tax_toggle_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_tax_toggle_edit', !!c)} /></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_tax_toggle !== false} onCheckedChange={(c) => handleMetaChange('show_tax_toggle', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-400 pl-8">↳ Field Nilai / Harga Kontrak</td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.allow_price_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_price_edit', !!c)} /></td>
                                    <td className="px-4 py-3 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-zinc-200">Draft Perjanjian</td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.allow_agreement_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_agreement_edit', !!c)} /></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_tab_agreement !== false} onCheckedChange={(c) => handleMetaChange('show_tab_agreement', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-zinc-200">Lampiran</td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.allow_attachment_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_attachment_edit', !!c)} /></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_tab_attachments !== false} onCheckedChange={(c) => handleMetaChange('show_tab_attachments', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-zinc-200">Kontrak Referensi</td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.allow_reference !== false} onCheckedChange={(c) => handleMetaChange('allow_reference', !!c)} /></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_tab_references !== false} onCheckedChange={(c) => handleMetaChange('show_tab_references', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-zinc-200">Info Kontrak Utama</td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.allow_info_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_info_edit', !!c)} /></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_info !== false} onCheckedChange={(c) => handleMetaChange('show_info', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-zinc-200">Alur Persetujuan</td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.allow_timeline_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_timeline_edit', !!c)} /></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_tab_timeline !== false} onCheckedChange={(c) => handleMetaChange('show_tab_timeline', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-zinc-200">Chat</td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.allow_chat_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_chat_edit', !!c)} /></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_tab_chat !== false} onCheckedChange={(c) => handleMetaChange('show_tab_chat', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-zinc-200">Panel Aksi (Approval)</td>
                                    <td className="px-4 py-3 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_action_panel !== false} onCheckedChange={(c) => handleMetaChange('show_action_panel', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-zinc-200">Detail Dokumen & Alur Kerja</td>
                                    <td className="px-4 py-3 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_document_detail !== false} onCheckedChange={(c) => handleMetaChange('show_document_detail', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-zinc-200">Daftar Member</td>
                                    <td className="px-4 py-3 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                    <td className="px-4 py-3 text-center"><Checkbox checked={step.meta?.show_tab_members !== false} onCheckedChange={(c) => handleMetaChange('show_tab_members', !!c)} /></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" className="border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 font-bold" onClick={() => onOpenChange(false)}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}