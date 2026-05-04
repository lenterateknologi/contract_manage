import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { ManagementForm, FormSection } from '@/components/admin/ManagementForm';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { CompactSelect } from '@/components/ui/forms/CompactSelect';
import { Button } from '@/components/ui/base/Button';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { useToast } from '@/components/contracts/Toast';
import { 
    FileText, 
    Info, 
    LayoutGrid, 
    Settings2, 
    ChevronRight,
    Trash2
} from 'lucide-react';

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
                <CompactSelect 
                    label={`Tautan Templat Digital ${type}`}
                    value={formTemplateId || 'none'}
                    onChange={setFormTemplateId}
                    options={[
                        { label: '-- TANPA TEMPLAT TERPAUT --', value: 'none' },
                        ...templates.map((t: any) => ({
                            label: `${t.name} (${t.document_type || 'ADHOC'})`,
                            value: t.id
                        }))
                    ]}
                    icon={LayoutGrid}
                />
            </div>
        );
    }
    if (mechanism === 'folder') {
        return (
            <div className="animate-in fade-in slide-in-from-top-2">
                <CompactSelect 
                    label={`Tautan Templat Folder (${type})`}
                    value={contractTemplateId || 'none'}
                    onChange={setContractTemplateId}
                    options={[
                        { label: '-- TIDAK ADA TEMPLAT TERPILIH --', value: 'none' },
                        ...physTemplates.map((t: any) => ({
                            label: `${t.name} (${t.file_type || 'PDF'})`,
                            value: t.id
                        }))
                    ]}
                    icon={FileText}
                />
            </div>
        );
    }
    return (
        <div className="animate-in fade-in rounded-2xl border border-dashed border-primary/10 bg-primary/[0.01] p-6 text-center dark:border-white/10 dark:bg-white/[0.01]">
            <p className="text-[10px] font-bold tracking-[0.2em] text-primary/30 uppercase dark:text-white/30 italic">
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
            }
        };

        if (isEdit) router.put(route('admin.contract-types.update', contractType.id), payload, options);
        else router.post(route('admin.contract-types.store'), payload, options);
    };

    return (
        <>
            <Head title={isEdit ? `Edit Klasifikasi: ${contractType.name}` : 'Registrasi Klasifikasi'} />
            
            <div className="flex h-full flex-col bg-white dark:bg-black antialiased">
                <ManagementForm
                    title={isEdit ? 'Parameter Klasifikasi' : 'Registrasi Klasifikasi'}
                    subtitle={isEdit ? `Konfigurasi aset untuk tipe ${form.data.name}` : 'Mendefinisikan mekanisme pengajuan dokumen dua tahap (F1 & F2)'}
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
                                className="h-10 rounded-xl border-rose-500/20 px-6 text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
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
                                className="bg-primary/[0.01] dark:bg-white/[0.01] rounded-[2rem] p-8 border border-primary/5"
                            >
                                <div className="space-y-8">
                                    <CompactSelect 
                                        label="Mekanisme Pengajuan F1"
                                        value={form.data.f1_input_mechanism}
                                        onChange={(v) => form.setData('f1_input_mechanism', v as string)}
                                        options={[
                                            { label: 'PENGISIAN FORMULIR DIGITAL', value: 'digital' },
                                            { label: 'TEMPLAT FOLDER KONTRAK', value: 'folder' },
                                            { label: 'UNGGAH DOKUMEN MANUAL (PDF)', value: 'manual' },
                                        ]}
                                        icon={Settings2}
                                    />

                                    <div className="pt-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <ChevronRight size={14} className="text-primary/20" />
                                            <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/40">Opsi Keterkaitan Aset</span>
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
                                className="bg-primary/[0.01] dark:bg-white/[0.01] rounded-[2rem] p-8 border border-primary/5"
                            >
                                <div className="space-y-8">
                                    <CompactSelect 
                                        label="Mekanisme Pengajuan F2"
                                        value={form.data.f2_input_mechanism}
                                        onChange={(v) => form.setData('f2_input_mechanism', v as string)}
                                        options={[
                                            { label: 'PENGISIAN FORMULIR DIGITAL', value: 'digital' },
                                            { label: 'TEMPLAT FOLDER KONTRAK', value: 'folder' },
                                            { label: 'UNGGAH DOKUMEN MANUAL (PDF)', value: 'manual' },
                                        ]}
                                        icon={Settings2}
                                    />

                                    <div className="pt-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <ChevronRight size={14} className="text-primary/20" />
                                            <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/40">Opsi Keterkaitan Aset</span>
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
