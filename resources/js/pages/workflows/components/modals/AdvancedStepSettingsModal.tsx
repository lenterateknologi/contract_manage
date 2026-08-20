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
        allow_period_edit?: boolean;
        allow_title_edit?: boolean;
        allow_vendor_edit?: boolean;
        allow_category_edit?: boolean;
        show_info?: boolean;
        show_title?: boolean;
        show_vendor?: boolean;
        show_category?: boolean;
        show_period?: boolean;
        require_f1?: boolean;
        require_f2?: boolean;
        require_agreement?: boolean;
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

    const isSectionChecked = (keys: string[]) => {
        if (keys.length === 0) return false;
        return keys.every((k) => (k.startsWith('require_') ? !!step.meta?.[k] : step.meta?.[k] !== false));
    };

    const toggleSection = (keys: string[]) => {
        if (keys.length === 0) return;
        const allChecked = isSectionChecked(keys);
        const newVal = !allChecked;
        const updates: Record<string, boolean> = {};
        keys.forEach((k) => {
            updates[k] = newVal;
        });
        onUpdateStep({
            meta: {
                ...(step.meta || {}),
                ...updates,
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
                allow_period_edit: checked,
                show_price: checked,
                show_period: checked,
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
            <DialogContent className="sm:max-w-[700px] p-0 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-[8px] overflow-hidden">
                <DialogHeader className="px-6 py-4 bg-primary dark:bg-zinc-800/90 text-white dark:text-zinc-100 border-b border-primary/20 dark:border-zinc-700/80">
                    <DialogTitle className="text-white dark:text-zinc-100 font-bold">Pengaturan Lanjutan Tahap</DialogTitle>
                    <DialogDescription className="text-white/80 dark:text-zinc-400">Konfigurasi kontrol perilaku & hak akses untuk tahap ini.</DialogDescription>
                </DialogHeader>

                <div className="px-6 py-4">
                    <div className="flex justify-end gap-2 mb-3">
                        <Button type="button" size="sm" variant="outline" className="border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 font-bold" onClick={() => handleSetAll(true)}>Centang Semua</Button>
                        <Button type="button" size="sm" variant="outline" className="border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 font-bold" onClick={() => handleSetAll(false)}>Kosongkan Semua</Button>
                    </div>

                    <div className="rounded-[8px] border border-slate-200/80 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/90 shadow-xs">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-primary text-white border-b border-primary/20 dark:bg-zinc-800/90 dark:border-zinc-700/80 dark:text-zinc-200">
                                <tr>
                                    <th className="px-4 py-3 font-bold text-white dark:text-zinc-200">Fitur / Tab</th>
                                    <th className="px-4 py-3 font-bold text-center w-24 text-white dark:text-zinc-200">Dapat Diedit</th>
                                    <th className="px-4 py-3 font-bold text-center w-24 text-white dark:text-zinc-200">Tampilkan</th>
                                    <th className="px-4 py-3 font-bold text-center w-28 text-white dark:text-zinc-200">Wajib Diisi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/60 dark:divide-zinc-800/80">
                                {/* Tab 1: Dokumen */}
                                <tr className="bg-slate-100/90 dark:bg-zinc-800/80 border-y border-slate-200 dark:border-zinc-700">
                                    <td className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                                        Tab 1: Dokumen (Sub-dokumen F1, F2, & Perjanjian)
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <Checkbox
                                            checked={isSectionChecked(['allow_f1_edit', 'allow_f2_edit', 'allow_agreement_edit'])}
                                            onCheckedChange={() => toggleSection(['allow_f1_edit', 'allow_f2_edit', 'allow_agreement_edit'])}
                                            title="Centang/Kosongkan Semua Dapat Diedit di Dokumen"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <Checkbox
                                            checked={isSectionChecked(['show_tab_f1', 'show_tab_f2', 'show_tab_agreement'])}
                                            onCheckedChange={() => toggleSection(['show_tab_f1', 'show_tab_f2', 'show_tab_agreement'])}
                                            title="Centang/Kosongkan Semua Tampilkan di Dokumen"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <Checkbox
                                            checked={isSectionChecked(['require_f1', 'require_f2', 'require_agreement'])}
                                            onCheckedChange={() => toggleSection(['require_f1', 'require_f2', 'require_agreement'])}
                                            title="Centang/Kosongkan Semua Wajib Diisi di Dokumen"
                                        />
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-zinc-200 pl-6">Sub-tab F1 (Permohonan)</td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={step.meta?.allow_f1_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_f1_edit', !!c)} /></td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={step.meta?.show_tab_f1 !== false} onCheckedChange={(c) => handleMetaChange('show_tab_f1', !!c)} /></td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={!!step.meta?.require_f1} onCheckedChange={(c) => handleMetaChange('require_f1', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-zinc-200 pl-6">Sub-tab F2 (Ringkasan)</td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={step.meta?.allow_f2_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_f2_edit', !!c)} /></td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={step.meta?.show_tab_f2 !== false} onCheckedChange={(c) => handleMetaChange('show_tab_f2', !!c)} /></td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={!!step.meta?.require_f2} onCheckedChange={(c) => handleMetaChange('require_f2', !!c)} /></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-zinc-200 pl-6">Sub-tab Perjanjian / Draft</td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={step.meta?.allow_agreement_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_agreement_edit', !!c)} /></td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={step.meta?.show_tab_agreement !== false} onCheckedChange={(c) => handleMetaChange('show_tab_agreement', !!c)} /></td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={!!step.meta?.require_agreement} onCheckedChange={(c) => handleMetaChange('require_agreement', !!c)} /></td>
                                </tr>

                                {/* Informational Section: Informasi Kontrak */}
                                <tr className="bg-slate-100/90 dark:bg-zinc-800/80 border-y border-slate-200 dark:border-zinc-700">
                                    <td className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                                        Informasi Kontrak (Panel & Field Data Utama)
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <Checkbox
                                            checked={isSectionChecked(['allow_info_edit', 'allow_title_edit', 'allow_vendor_edit', 'allow_category_edit', 'allow_f2_contract_no_edit', 'allow_tax_toggle_edit', 'allow_price_edit', 'allow_period_edit'])}
                                            onCheckedChange={() => toggleSection(['allow_info_edit', 'allow_title_edit', 'allow_vendor_edit', 'allow_category_edit', 'allow_f2_contract_no_edit', 'allow_tax_toggle_edit', 'allow_price_edit', 'allow_period_edit'])}
                                            title="Centang/Kosongkan Semua Dapat Diedit di Informasi Kontrak"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <Checkbox
                                            checked={isSectionChecked(['show_info', 'show_title', 'show_vendor', 'show_category', 'show_f2_contract_no', 'show_tax_toggle', 'show_price', 'show_period'])}
                                            onCheckedChange={() => toggleSection(['show_info', 'show_title', 'show_vendor', 'show_category', 'show_f2_contract_no', 'show_tax_toggle', 'show_price', 'show_period'])}
                                            title="Centang/Kosongkan Semua Tampilkan di Informasi Kontrak"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <span className="text-slate-300 dark:text-zinc-600">-</span>
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-zinc-200 pl-6">Info Kontrak Utama (Kanan)</td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={step.meta?.allow_info_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_info_edit', !!c)} /></td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={step.meta?.show_info !== false} onCheckedChange={(c) => handleMetaChange('show_info', !!c)} /></td>
                                    <td className="px-4 py-2.5 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-2 text-xs font-normal text-slate-600 dark:text-zinc-400 pl-10">↳ Field Judul Kontrak</td>
                                    <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_title_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_title_edit', !!c)} /></td>
                                    <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_title !== false} onCheckedChange={(c) => handleMetaChange('show_title', !!c)} /></td>
                                    <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-2 text-xs font-normal text-slate-600 dark:text-zinc-400 pl-10">↳ Field Pihak Kedua (Vendor)</td>
                                    <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_vendor_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_vendor_edit', !!c)} /></td>
                                    <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_vendor !== false} onCheckedChange={(c) => handleMetaChange('show_vendor', !!c)} /></td>
                                    <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-2 text-xs font-normal text-slate-600 dark:text-zinc-400 pl-10">↳ Field Kategori Kontrak</td>
                                    <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_category_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_category_edit', !!c)} /></td>
                                    <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_category !== false} onCheckedChange={(c) => handleMetaChange('show_category', !!c)} /></td>
                                    <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-2 text-xs font-normal text-slate-600 dark:text-zinc-400 pl-10">↳ Field No. Kontrak</td>
                                    <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_f2_contract_no_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_f2_contract_no_edit', !!c)} /></td>
                                    <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_f2_contract_no !== false} onCheckedChange={(c) => handleMetaChange('show_f2_contract_no', !!c)} /></td>
                                    <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-2 text-xs font-normal text-slate-600 dark:text-zinc-400 pl-10">↳ Field Penentuan Pajak</td>
                                    <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_tax_toggle_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_tax_toggle_edit', !!c)} /></td>
                                    <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_tax_toggle !== false} onCheckedChange={(c) => handleMetaChange('show_tax_toggle', !!c)} /></td>
                                    <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-2 text-xs font-normal text-slate-600 dark:text-zinc-400 pl-10">↳ Field Nilai / Harga Kontrak</td>
                                    <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_price_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_price_edit', !!c)} /></td>
                                    <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_price !== false} onCheckedChange={(c) => handleMetaChange('show_price', !!c)} /></td>
                                    <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-2 text-xs font-normal text-slate-600 dark:text-zinc-400 pl-10">↳ Field Masa Berlaku Kontrak</td>
                                    <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_period_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_period_edit', !!c)} /></td>
                                    <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_period !== false} onCheckedChange={(c) => handleMetaChange('show_period', !!c)} /></td>
                                    <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                </tr>

                                {/* Tab 2: Riwayat & Alur */}
                                <tr className="bg-slate-100/90 dark:bg-zinc-800/80 border-y border-slate-200 dark:border-zinc-700">
                                    <td className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                                        Tab 2: Riwayat & Alur (Sub-tab Alur & Audit Log)
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <Checkbox
                                            checked={isSectionChecked(['allow_timeline_edit'])}
                                            onCheckedChange={() => toggleSection(['allow_timeline_edit'])}
                                            title="Centang/Kosongkan Semua Dapat Diedit di Riwayat & Alur"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <Checkbox
                                            checked={isSectionChecked(['show_tab_timeline'])}
                                            onCheckedChange={() => toggleSection(['show_tab_timeline'])}
                                            title="Centang/Kosongkan Semua Tampilkan di Riwayat & Alur"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <span className="text-slate-300 dark:text-zinc-600">-</span>
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-zinc-200 pl-6">Sub-tab Alur Approval & Proses</td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={step.meta?.allow_timeline_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_timeline_edit', !!c)} /></td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={step.meta?.show_tab_timeline !== false} onCheckedChange={(c) => handleMetaChange('show_tab_timeline', !!c)} /></td>
                                    <td className="px-4 py-2.5 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                </tr>

                                {/* Tab 3: Diskusi & Member */}
                                <tr className="bg-slate-100/90 dark:bg-zinc-800/80 border-y border-slate-200 dark:border-zinc-700">
                                    <td className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                                        Tab 3: Diskusi & Member (Sub-tab Chat & Member)
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <Checkbox
                                            checked={isSectionChecked(['allow_chat_edit'])}
                                            onCheckedChange={() => toggleSection(['allow_chat_edit'])}
                                            title="Centang/Kosongkan Semua Dapat Diedit di Diskusi & Member"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <Checkbox
                                            checked={isSectionChecked(['show_tab_chat', 'show_tab_members'])}
                                            onCheckedChange={() => toggleSection(['show_tab_chat', 'show_tab_members'])}
                                            title="Centang/Kosongkan Semua Tampilkan di Diskusi & Member"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <span className="text-slate-300 dark:text-zinc-600">-</span>
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-zinc-200 pl-6">Sub-tab Chat & Diskusi Tim</td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={step.meta?.allow_chat_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_chat_edit', !!c)} /></td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={step.meta?.show_tab_chat !== false} onCheckedChange={(c) => handleMetaChange('show_tab_chat', !!c)} /></td>
                                    <td className="px-4 py-2.5 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-zinc-200 pl-6">Sub-tab Member / Anggota Tim</td>
                                    <td className="px-4 py-2.5 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={step.meta?.show_tab_members !== false} onCheckedChange={(c) => handleMetaChange('show_tab_members', !!c)} /></td>
                                    <td className="px-4 py-2.5 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                </tr>

                                {/* Tab Lainnya & Panel */}
                                <tr className="bg-slate-100/90 dark:bg-zinc-800/80 border-y border-slate-200 dark:border-zinc-700">
                                    <td className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                                        Tab Lainnya & Panel Utama
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <Checkbox
                                            checked={isSectionChecked(['allow_attachment_edit', 'allow_reference'])}
                                            onCheckedChange={() => toggleSection(['allow_attachment_edit', 'allow_reference'])}
                                            title="Centang/Kosongkan Semua Dapat Diedit di Tab Lainnya & Panel"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <Checkbox
                                            checked={isSectionChecked(['show_tab_attachments', 'show_tab_references', 'show_action_panel', 'show_document_detail'])}
                                            onCheckedChange={() => toggleSection(['show_tab_attachments', 'show_tab_references', 'show_action_panel', 'show_document_detail'])}
                                            title="Centang/Kosongkan Semua Tampilkan di Tab Lainnya & Panel"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <span className="text-slate-300 dark:text-zinc-600">-</span>
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-zinc-200">Tab Lampiran Berkas</td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={step.meta?.allow_attachment_edit !== false} onCheckedChange={(c) => handleMetaChange('allow_attachment_edit', !!c)} /></td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={step.meta?.show_tab_attachments !== false} onCheckedChange={(c) => handleMetaChange('show_tab_attachments', !!c)} /></td>
                                    <td className="px-4 py-2.5 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-zinc-200">Tab Kontrak Referensi</td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={step.meta?.allow_reference !== false} onCheckedChange={(c) => handleMetaChange('allow_reference', !!c)} /></td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={step.meta?.show_tab_references !== false} onCheckedChange={(c) => handleMetaChange('show_tab_references', !!c)} /></td>
                                    <td className="px-4 py-2.5 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-zinc-200">Panel Aksi Approval (Kanan)</td>
                                    <td className="px-4 py-2.5 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={step.meta?.show_action_panel !== false} onCheckedChange={(c) => handleMetaChange('show_action_panel', !!c)} /></td>
                                    <td className="px-4 py-2.5 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                </tr>
                                <tr className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-zinc-200">Container Detail Dokumen</td>
                                    <td className="px-4 py-2.5 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                    <td className="px-4 py-2.5 text-center"><Checkbox checked={step.meta?.show_document_detail !== false} onCheckedChange={(c) => handleMetaChange('show_document_detail', !!c)} /></td>
                                    <td className="px-4 py-2.5 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                    <Button variant="outline" className="border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 font-bold" onClick={() => onOpenChange(false)}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}