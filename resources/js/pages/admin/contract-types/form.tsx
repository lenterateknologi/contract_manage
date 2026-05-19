import { FormSection, ManagementForm } from '@/components/admin/ManagementForm';
import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { Head, router, useForm } from '@inertiajs/react';
import { ChevronRight, FileText, Info, LayoutGrid, Settings2, Trash2 } from 'lucide-react';
import React from 'react';

interface Props {
    contractType?: any;
    formTemplates: any[];
    contractTemplates: any[];
}

const MechanismOptions = ({
    mechanism,
    formTemplateId,
    setFormTemplateId,
    contractTemplateId,
    setContractTemplateId,
    templates,
    physTemplates,
    type,
}: {
    mechanism: string;
    formTemplateId: string;
    setFormTemplateId: (id: string | number) => void;
    contractTemplateId: string;
    setContractTemplateId: (id: string | number) => void;
    templates: any[];
    physTemplates: any[];
    type: 'F1' | 'F2';
}) => {
    if (mechanism === 'digital') {
        return (
            <div className="animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                    <label className="text-primary/60 flex items-center gap-2 text-[10px] font-bold uppercase dark:text-white/60">
                        <LayoutGrid size={10} /> Tautan Templat Digital {type}
                    </label>
                    <Select value={String(formTemplateId || 'none')} onValueChange={(v: string) => setFormTemplateId(v === 'none' ? 'none' : v)}>
                        <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-10 rounded-xl text-xs font-bold transition-all">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-primary/10 rounded-xl bg-white shadow-2xl dark:bg-black">
                            <SelectItem value="none" className="py-2.5 text-xs font-bold uppercase opacity-40">
                                -- TANPA TEMPLAT TERPAUT --
                            </SelectItem>
                            {templates.map((t: any) => (
                                <SelectItem key={t.id} value={String(t.id)} className="py-2.5 text-xs font-bold uppercase">
                                    {t.name} ({t.document_type || 'ADHOC'})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        );
    }
    if (mechanism === 'folder') {
        return (
            <div className="animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                    <label className="text-primary/60 flex items-center gap-2 text-[10px] font-bold uppercase dark:text-white/60">
                        <FileText size={10} /> Tautan Templat Folder ({type})
                    </label>
                    <Select
                        value={String(contractTemplateId || 'none')}
                        onValueChange={(v: string) => setContractTemplateId(v === 'none' ? 'none' : v)}
                    >
                        <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-10 rounded-xl text-xs font-bold transition-all">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-primary/10 rounded-xl bg-white shadow-2xl dark:bg-black">
                            <SelectItem value="none" className="py-2.5 text-xs font-bold uppercase opacity-40">
                                -- TIDAK ADA TEMPLAT TERPILIH --
                            </SelectItem>
                            {physTemplates.map((t: any) => (
                                <SelectItem key={t.id} value={String(t.id)} className="py-2.5 text-xs font-bold uppercase">
                                    {t.name} ({t.file_type || 'PDF'})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        );
    }
    return (
        <div className="animate-in fade-in border-primary/10 bg-primary/[0.01] rounded-2xl border border-dashed p-6 text-center dark:border-white/10 dark:bg-white/[0.01]">
            <p className="text-primary/30 text-[10px] font-bold tracking-[0.2em] uppercase italic dark:text-white/30">
                {type === 'F1' ? 'PENGGUNA INTERNAL' : 'VENDOR'} AKAN MENGUNGGAH PDF MANUAL UNTUK {type}
            </p>
        </div>
    );
};

export default function ContractTypeForm({ contractType, formTemplates, contractTemplates }: Props) {
    const isEdit = !!contractType;
    const { showToast } = useToast();
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

    const form = useForm({
        name: contractType?.name || '',
        description: contractType?.description || '',
        f1_input_mechanism: contractType?.f1_input_mechanism || 'digital',
        f1_form_template_id: contractType?.f1_form_template_id || 'none',
        f1_contract_template_id: contractType?.f1_contract_template_id || 'none',
        f2_input_mechanism: contractType?.f2_input_mechanism || 'digital',
        f2_form_template_id: contractType?.f2_form_template_id || 'none',
        f2_contract_template_id: contractType?.f2_contract_template_id || 'none',
    });

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const payload = {
            ...form.data,
            f1_form_template_id: form.data.f1_form_template_id === 'none' ? null : form.data.f1_form_template_id,
            f1_contract_template_id: form.data.f1_contract_template_id === 'none' ? null : form.data.f1_contract_template_id,
            f2_form_template_id: form.data.f2_form_template_id === 'none' ? null : form.data.f2_form_template_id,
            f2_contract_template_id: form.data.f2_contract_template_id === 'none' ? null : form.data.f2_contract_template_id,
        };

        const options = {
            onSuccess: () => {
                showToast(isEdit ? 'Konfigurasi klasifikasi diperbarui' : 'Klasifikasi kontrak baru berhasil didaftarkan', 'success');
            },
            onError: (errors: any) => {
                showToast(errors.error || 'Gagal menyimpan klasifikasi', 'danger');
            },
        };

        if (isEdit) router.put(route('admin.contract-types.update', contractType.id), payload, options);
        else router.post(route('admin.contract-types.store'), payload, options);
    };

    return (
        <>
            <Head title={isEdit ? `Edit Klasifikasi: ${contractType.name}` : 'Registrasi Klasifikasi'} />

            <div className="flex h-full flex-col bg-white antialiased dark:bg-black">
                <ManagementForm
                    title={isEdit ? 'Parameter Klasifikasi' : 'Registrasi Klasifikasi'}
                    subtitle={
                        isEdit ? `Konfigurasi aset untuk tipe ${form.data.name}` : 'Mendefinisikan mekanisme pengajuan dokumen dua tahap (F1 & F2)'
                    }
                    onClose={() => router.visit(route('admin.contract-types'))}
                    onSave={handleSubmit}
                    processing={form.processing}
                    isDirty={form.isDirty}
                    isEdit={isEdit}
                    headerActions={
                        isEdit && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsConfirmOpen(true)}
                                className="h-10 rounded-xl border-rose-500/20 px-6 text-[10px] font-bold text-rose-500 uppercase transition-all hover:bg-rose-500 hover:text-white active:scale-95"
                            >
                                <Trash2 size={14} className="mr-2" /> Hapus Klasifikasi
                            </Button>
                        )
                    }
                >
                    <ConfirmationModal
                        open={isConfirmOpen}
                        onClose={() => setIsConfirmOpen(false)}
                        onConfirm={() => {
                            setIsConfirmOpen(false);
                            router.delete(route('admin.contract-types.destroy', contractType.id), {
                                onSuccess: () => {
                                    showToast('Klasifikasi kontrak telah dihapus secara permanen', 'success');
                                },
                            });
                        }}
                        title="Eliminasi Klasifikasi"
                        description={`Apakah Anda yakin ingin menghapus "${contractType?.name}" secara permanen? Data historis yang bergantung pada tipe ini mungkin tidak dapat diakses.`}
                        confirmText="Ya, Hapus Klasifikasi"
                    />

                    <div className="space-y-12">
                        <FormSection title="Arsitektur Identitas" subtitle="Metadata dasar untuk pengenalan klasifikasi kontrak">
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
                                <div className="md:col-span-4">
                                    <CompactInput
                                        label="Nama Klasifikasi"
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        required
                                        placeholder="CONTOH: PERJANJIAN JASA"
                                        icon={Settings2}
                                    />
                                </div>
                                <div className="md:col-span-8">
                                    <CompactInput
                                        label="Deskripsi Ruang Lingkup"
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                        placeholder="Jelaskan konteks penggunaan klasifikasi ini secara singkat..."
                                        icon={Info}
                                    />
                                </div>
                            </div>
                        </FormSection>

                        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                            {/* F1 Configuration */}
                            <FormSection
                                title="Konfigurasi Fase F1"
                                subtitle="Parameter alur kerja permohonan internal"
                                className="bg-primary/[0.01] border-primary/5 rounded-[2rem] border p-8 dark:bg-white/[0.01]"
                            >
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-primary/60 flex items-center gap-2 text-[10px] font-bold uppercase dark:text-white/60">
                                            <Settings2 size={10} /> Mekanisme Pengajuan F1
                                        </label>
                                        <Select
                                            value={form.data.f1_input_mechanism}
                                            onValueChange={(v: string) => form.setData('f1_input_mechanism', String(v))}
                                        >
                                            <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-10 rounded-xl text-xs font-bold transition-all">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="border-primary/10 rounded-xl bg-white shadow-2xl dark:bg-black">
                                                <SelectItem value="digital" className="py-2.5 text-xs font-bold uppercase">
                                                    PENGISIAN FORMULIR DIGITAL
                                                </SelectItem>
                                                <SelectItem value="folder" className="py-2.5 text-xs font-bold uppercase">
                                                    TEMPLAT FOLDER KONTRAK
                                                </SelectItem>
                                                <SelectItem value="manual" className="py-2.5 text-xs font-bold uppercase">
                                                    UNGGAH DOKUMEN MANUAL (PDF)
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="pt-4">
                                        <div className="mb-4 flex items-center gap-3">
                                            <ChevronRight size={14} className="text-primary/20" />
                                            <span className="text-primary/40 text-[10px] font-semibold uppercase">Opsi Keterkaitan Aset</span>
                                        </div>
                                        <MechanismOptions
                                            mechanism={form.data.f1_input_mechanism}
                                            formTemplateId={form.data.f1_form_template_id}
                                            setFormTemplateId={(v) => form.setData('f1_form_template_id', v)}
                                            contractTemplateId={form.data.f1_contract_template_id}
                                            setContractTemplateId={(v) => form.setData('f1_contract_template_id', v)}
                                            templates={formTemplates}
                                            physTemplates={contractTemplates}
                                            type="F1"
                                        />
                                    </div>
                                </div>
                            </FormSection>

                            {/* F2 Configuration */}
                            <FormSection
                                title="Konfigurasi Fase F2"
                                subtitle="Parameter alur kerja resume eksternal/vendor"
                                className="bg-primary/[0.01] border-primary/5 rounded-[2rem] border p-8 dark:bg-white/[0.01]"
                            >
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-primary/60 flex items-center gap-2 text-[10px] font-bold uppercase dark:text-white/60">
                                            <Settings2 size={10} /> Mekanisme Pengajuan F2
                                        </label>
                                        <Select
                                            value={form.data.f2_input_mechanism}
                                            onValueChange={(v: string) => form.setData('f2_input_mechanism', String(v))}
                                        >
                                            <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-10 rounded-xl text-xs font-bold transition-all">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="border-primary/10 rounded-xl bg-white shadow-2xl dark:bg-black">
                                                <SelectItem value="digital" className="py-2.5 text-xs font-bold uppercase">
                                                    PENGISIAN FORMULIR DIGITAL
                                                </SelectItem>
                                                <SelectItem value="folder" className="py-2.5 text-xs font-bold uppercase">
                                                    TEMPLAT FOLDER KONTRAK
                                                </SelectItem>
                                                <SelectItem value="manual" className="py-2.5 text-xs font-bold uppercase">
                                                    UNGGAH DOKUMEN MANUAL (PDF)
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="pt-4">
                                        <div className="mb-4 flex items-center gap-3">
                                            <ChevronRight size={14} className="text-primary/20" />
                                            <span className="text-primary/40 text-[10px] font-semibold uppercase">Opsi Keterkaitan Aset</span>
                                        </div>
                                        <MechanismOptions
                                            mechanism={form.data.f2_input_mechanism}
                                            formTemplateId={form.data.f2_form_template_id}
                                            setFormTemplateId={(v) => form.setData('f2_form_template_id', v)}
                                            contractTemplateId={form.data.f2_contract_template_id}
                                            setContractTemplateId={(v) => form.setData('f2_contract_template_id', v)}
                                            templates={formTemplates}
                                            physTemplates={contractTemplates}
                                            type="F2"
                                        />
                                    </div>
                                </div>
                            </FormSection>
                        </div>
                    </div>
                </ManagementForm>
            </div>
        </>
    );
}
