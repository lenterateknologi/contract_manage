import { FormSection, ManagementForm } from '@/pages/admin/components/ManagementForm';
import { Button } from '@/components/ui/base/Button';
import { useToast } from '@/components/ui/feedback/Toast';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { Head, router, useForm } from '@inertiajs/react';
import { Info, LayoutTemplate, PlusCircle, Settings2, Trash2 } from 'lucide-react';
import React from 'react';
import { CreateSubCategoryModal } from './CreateSubCategoryModal';

interface Props {
    contractType?: any;
    parentTypes: any[];
}

export default function ContractTypeForm({ contractType, parentTypes = [] }: Props) {
    const isEdit = !!contractType;
    const { showToast } = useToast();
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
    const [isSubCreateOpen, setIsSubCreateOpen] = React.useState(false);
    const [deletingSub, setDeletingSub] = React.useState<any>(null);

    const form = useForm({
        code: contractType?.code || '',
        name: contractType?.name || '',
        description: contractType?.description || '',
        parent_id: contractType?.parent_id || 'none',
    });

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const payload = {
            ...form.data,
            parent_id: form.data.parent_id === 'none' ? null : form.data.parent_id,
        };

        const options = {
            onSuccess: () => {
                showToast(isEdit ? 'Konfigurasi klasifikasi diperbarui' : 'Klasifikasi kontrak baru berhasil didaftarkan', 'success');
            },
            onError: (errors: any) => {
                showToast(errors.error || errors.code || errors.name || 'Gagal menyimpan klasifikasi', 'danger');
            },
        };

        if (isEdit) router.put(route('admin.contract-types.update', contractType.id), payload, options);
        else router.post(route('admin.contract-types.store'), payload, options);
    };

    const handleDeleteSub = (sub: any) => {
        setDeletingSub(sub);
    };

    const confirmDeleteSub = () => {
        if (!deletingSub) return;
        router.delete(route('admin.contract-types.destroy', deletingSub.id), {
            onSuccess: () => {
                showToast(`Sub-klasifikasi "${deletingSub.name}" telah dihapus`, 'success');
                setDeletingSub(null);
            },
        });
    };

    return (
        <>
            <Head title={isEdit ? `Edit Klasifikasi: ${contractType.name}` : 'Registrasi Klasifikasi'} />

            <div className="flex h-full flex-col bg-white antialiased dark:bg-black">
                <ManagementForm
                    title={isEdit ? 'Parameter Klasifikasi' : 'Registrasi Klasifikasi'}
                    subtitle={
                        isEdit ? `Konfigurasi identitas untuk tipe ${form.data.name}` : 'Mendefinisikan identitas dan hierarki klasifikasi kontrak'
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
                                className="h-10 rounded-xl border-rose-500/20 px-6 text-[10px] font-semibold uppercase transition-all hover:bg-rose-500 hover:text-white active:scale-95"
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

                    <ConfirmationModal
                        open={!!deletingSub}
                        onClose={() => setDeletingSub(null)}
                        onConfirm={confirmDeleteSub}
                        title="Hapus Sub-Klasifikasi"
                        description={`Apakah Anda yakin ingin menghapus sub-kategori "${deletingSub?.name}"? Aksi ini tidak dapat dibatalkan.`}
                        confirmText="Ya, Hapus Sub-Kategori"
                    />

                    {isEdit && (
                        <CreateSubCategoryModal
                            open={isSubCreateOpen}
                            onClose={() => setIsSubCreateOpen(false)}
                            parentId={contractType.id}
                            parentName={contractType.name}
                        />
                    )}

                    <div className="animate-in fade-in grid w-full grid-cols-1 gap-16 duration-300 select-none lg:grid-cols-2">
                        {/* Side 1: Full Configuration */}
                        <div className="space-y-12">
                            <FormSection title="Konfigurasi Utama" subtitle="Mendefinisikan parameter dasar dan identitas klasifikasi">
                                <div className="grid grid-cols-1 gap-y-10">
                                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                        <CompactInput
                                            label="Kode Klasifikasi"
                                            value={form.data.code}
                                            onChange={(e) => form.setData('code', e.target.value)}
                                            required
                                            placeholder="CONTOH: PERJANJIAN_JASA"
                                            icon={Settings2}
                                        />
                                        <CompactInput
                                            label="Nama Klasifikasi"
                                            value={form.data.name}
                                            onChange={(e) => form.setData('name', e.target.value)}
                                            required
                                            placeholder="CONTOH: PERJANJIAN JASA"
                                            icon={Settings2}
                                        />
                                    </div>

                                    <div className="w-full">
                                        <CompactInput
                                            label="Deskripsi Ruang Lingkup"
                                            value={form.data.description}
                                            onChange={(e) => form.setData('description', e.target.value)}
                                            placeholder="Jelaskan peran status ini dalam alur bisnis secara mendalam..."
                                            icon={Info}
                                        />
                                    </div>
                                </div>
                            </FormSection>

                            <FormSection title="Relasi Hierarki" subtitle="Menentukan posisi klasifikasi dalam pohon kategori">
                                <div className="space-y-4">
                                    <label className="text-primary/60 flex items-center gap-2 text-[10px] font-semibold tracking-widest uppercase dark:text-white/60">
                                        <Settings2 size={12} className="opacity-50" /> Klasifikasi Induk
                                    </label>
                                    <Select value={String(form.data.parent_id)} onValueChange={(v: string) => form.setData('parent_id', String(v))}>
                                        <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-12 rounded-xl text-xs font-semibold shadow-sm ring-1 ring-black/[0.03] transition-all">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-primary/10 rounded-xl bg-white shadow-2xl dark:bg-black">
                                            <SelectItem value="none" className="py-4 text-xs font-semibold uppercase opacity-40">
                                                -- TANPA INDUK (TIPE UTAMA) --
                                            </SelectItem>
                                            {parentTypes.map((t: any) => (
                                                <SelectItem
                                                    key={t.id}
                                                    value={String(t.id)}
                                                    className="py-4 text-xs font-semibold text-black uppercase dark:text-white"
                                                >
                                                    {t.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] leading-relaxed font-medium text-slate-400 italic">
                                        Tentukan jika kategori ini merupakan turunan dari kategori lain untuk pengelompokan yang lebih rapi.
                                    </p>
                                </div>
                            </FormSection>
                        </div>

                        {/* Side 2: Structure & Visualization */}
                        <div className="space-y-12">
                            <FormSection
                                title="Daftar Sub-Klasifikasi"
                                subtitle="Struktur turunan yang terdaftar di bawah kategori ini"
                                headerAction={
                                    isEdit && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsSubCreateOpen(true)}
                                            className="border-primary/20 text-primary hover:bg-primary h-8 rounded-lg text-[9px] font-semibold tracking-widest uppercase transition-all hover:text-white"
                                        >
                                            <PlusCircle size={12} className="mr-1.5" /> Tambah Sub
                                        </Button>
                                    )
                                }
                            >
                                {isEdit && contractType?.children && contractType.children.length > 0 ? (
                                    <div className="flex flex-col gap-3">
                                        {contractType.children.map((child: any) => (
                                            <div
                                                key={child.id}
                                                className="group hover:border-primary/30 flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-5 text-left transition-all hover:bg-white hover:shadow-xl"
                                            >
                                                <div
                                                    className="flex flex-1 cursor-pointer flex-col overflow-hidden"
                                                    onClick={() => router.visit(route('admin.contract-types.edit', child.id))}
                                                >
                                                    <span className="group-hover:text-primary truncate text-[13px] font-semibold text-slate-700">
                                                        {child.name}
                                                    </span>
                                                    <span className="mt-1 font-mono text-[10px] tracking-tight text-slate-400 uppercase">
                                                        {child.code}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteSub(child)}
                                                        className="h-8 w-8 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => router.visit(route('admin.contract-types.edit', child.id))}
                                                        className="hover:text-primary hover:bg-primary/5 h-8 w-8 rounded-lg text-slate-400"
                                                    >
                                                        <Settings2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50/30 p-20">
                                        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
                                            <LayoutTemplate size={28} className="text-slate-200" />
                                        </div>
                                        <p className="text-center text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
                                            Belum ada sub-klasifikasi terdaftar
                                        </p>
                                    </div>
                                )}
                            </FormSection>
                        </div>
                    </div>
                </ManagementForm>
            </div>
        </>
    );
}
