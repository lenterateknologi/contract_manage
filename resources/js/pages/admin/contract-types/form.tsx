import { FormSection, ManagementForm } from '@/components/admin/ManagementForm';
import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
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
            }
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
                                className="h-10 rounded-xl border-rose-500/20 px-6 text-[10px] font-black uppercase transition-all hover:bg-rose-500 hover:text-white active:scale-95"
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

                    <div className="animate-in fade-in grid grid-cols-1 gap-16 duration-300 select-none lg:grid-cols-2 w-full">
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
                                    <label className="text-primary/60 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest dark:text-white/60">
                                        <Settings2 size={12} className="opacity-50" /> Klasifikasi Induk
                                    </label>
                                    <Select
                                        value={String(form.data.parent_id)}
                                        onValueChange={(v: string) => form.setData('parent_id', String(v))}
                                    >
                                        <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-12 rounded-xl text-xs font-semibold transition-all shadow-sm ring-1 ring-black/[0.03]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-primary/10 rounded-xl bg-white shadow-2xl dark:bg-black">
                                            <SelectItem value="none" className="py-4 text-xs font-semibold uppercase opacity-40">
                                                -- TANPA INDUK (TIPE UTAMA) --
                                            </SelectItem>
                                            {parentTypes.map((t: any) => (
                                                <SelectItem key={t.id} value={String(t.id)} className="py-4 text-xs font-semibold uppercase text-black dark:text-white">
                                                    {t.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">
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
                                            className="h-8 rounded-lg border-primary/20 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all"
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
                                                className="group flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-5 text-left transition-all hover:border-primary/30 hover:bg-white hover:shadow-xl"
                                            >
                                                <div 
                                                    className="flex flex-1 flex-col overflow-hidden cursor-pointer"
                                                    onClick={() => router.visit(route('admin.contract-types.edit', child.id))}
                                                >
                                                    <span className="text-[13px] font-semibold text-slate-700 group-hover:text-primary truncate">
                                                        {child.name}
                                                    </span>
                                                    <span className="font-mono text-[10px] text-slate-400 mt-1 uppercase tracking-tight">{child.code}</span>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteSub(child)}
                                                        className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => router.visit(route('admin.contract-types.edit', child.id))}
                                                        className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg"
                                                    >
                                                        <Settings2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
                                        <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                                            <LayoutTemplate size={28} className="text-slate-200" />
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-center">
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
