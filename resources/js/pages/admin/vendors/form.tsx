import { ManagementForm, FormSection } from '@/components/admin/ManagementForm';
import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Checkbox } from '@/components/ui/base/Checkbox';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/overlays/Dialog';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { CompactSelect } from '@/components/ui/forms/CompactSelect';
import { cn } from '@/lib/utils';
import { Head, router, useForm } from '@inertiajs/react';
import { usePermissions } from '@/hooks/use-permissions';
import { 
    FileText, 
    ShieldCheck, 
    Trash2, 
    UploadCloud, 
    Building2, 
    UserCheck, 
    CreditCard, 
    Gavel,
    Globe,
    Phone,
    Mail,
    MapPin,
    ExternalLink,
    CheckCircle2,
    Clock
} from 'lucide-react';
import React, { FormEvent, useRef, useState, useMemo } from 'react';

interface Props {
    vendor: any;
    breadcrumbs: any;
}

export default function VendorForm({ vendor, breadcrumbs }: Props) {
    const isEdit = !!vendor;
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, put, processing, isDirty, errors } = useForm({
        code: vendor?.code || '',
        name: vendor?.name || '',
        category: vendor?.category || '',
        email: vendor?.email || '',
        phone: vendor?.phone || '',
        address: vendor?.address || '',
        is_active: vendor !== undefined ? !!vendor.is_active : true,
        company_type: vendor?.company_type || '',
        is_individual: vendor !== undefined ? !!vendor.is_individual : false,
        website: vendor?.website || '',
        pic_name: vendor?.pic_name || '',
        pic_position: vendor?.pic_position || '',
        npwp: vendor?.npwp || '',
        nib: vendor?.nib || '',
        siup: vendor?.siup || '',
        director_name: vendor?.director_name || '',
        bank_name: vendor?.bank_name || '',
        bank_account_no: vendor?.bank_account_no || '',
        bank_account_name: vendor?.bank_account_name || '',
    });

    const docForm = useForm({
        document_file: null as File | null,
        document_type: '',
        expires_at: '',
    });

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isDeleteDocOpen, setIsDeleteDocOpen] = useState(false);
    const [isDeleteVendorOpen, setIsDeleteVendorOpen] = useState(false);
    const [docToDelete, setDocToDelete] = useState<number | null>(null);
    const { canDelete } = usePermissions('ADMIN_VENDORS');

    const handleSave = (e?: FormEvent) => {
        if (e) e.preventDefault();
        const options = {
            onSuccess: () => showToast(`Data vendor berhasil diperbarui`, 'success'),
            onError: () => showToast('Gagal menyimpan data vendor.', 'danger'),
        };
        if (isEdit) {
            put(route('admin.vendors.update', vendor.id), options);
        } else {
            post(route('admin.vendors.store'), options);
        }
    };

    const handleUploadDoc = (e: FormEvent) => {
        e.preventDefault();
        if (!vendor) return;
        docForm.post(route('admin.vendors.documents.upload', vendor.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsUploadModalOpen(false);
                docForm.reset();
                showToast('Dokumen berhasil diunggah', 'success');
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    const confirmDeleteDoc = () => {
        if (!vendor || !docToDelete) return;
        router.delete(route('admin.vendors.documents.destroy', { vendor: vendor.id, document: docToDelete }), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteDocOpen(false);
                setDocToDelete(null);
                showToast('Dokumen berhasil dihapus', 'success');
            },
        });
    };

    const docCats = useMemo(() => {
        const type = data.company_type;
        
        if (type === 'INDIVIDU') {
            return [
                { label: 'Identitas Pribadi', types: ['KTP_DIREKTUR', 'NPWP'] },
                { label: 'Dokumen Pendukung', types: ['REKENING_KORAN', 'OTHER'] },
            ];
        }

        if (type === 'CV') {
            return [
                { label: 'Legalitas Utama', types: ['NPWP', 'NIB', 'SIUP', 'TDP'] },
                { label: 'Dokumen Notaril', types: ['AKTA_PENDIRIAN', 'AKTA_PERUBAHAN'] },
                { label: 'Pendukung & Bank', types: ['REKENING_KORAN', 'COMPANY_PROFILE', 'KTP_DIREKTUR'] },
            ];
        }

        // Default to PT / Persero / Firma (Full Docs)
        return [
            { label: 'Legalitas Utama', types: ['NPWP', 'NIB', 'SIUP', 'TDP', 'SPPKP', 'SK_KEMENKUMHAM'] },
            { label: 'Dokumen Notaril', types: ['AKTA_PENDIRIAN', 'AKTA_PERUBAHAN'] },
            { label: 'Pendukung & Bank', types: ['REKENING_KORAN', 'COMPANY_PROFILE', 'KTP_DIREKTUR', 'OTHER'] },
        ];
    }, [data.company_type]);

    const auditScore = useMemo(() => {
        if (!vendor?.documents) return 0;
        const requiredTypes = docCats.flatMap(cat => cat.types);
        const uploadedRequired = vendor.documents.filter((d: any) => requiredTypes.includes(d.document_type)).length;
        return Math.min(100, Math.round((uploadedRequired / requiredTypes.length) * 100));
    }, [vendor, docCats]);

    return (
        <ManagementForm
            title={isEdit ? 'Profil Strategis Vendor' : 'Registrasi Vendor Baru'}
            subtitle={isEdit ? `Mengelola parameter operasional dan audit kepatuhan untuk ${vendor.name}` : 'Mendaftarkan mitra bisnis baru ke dalam ekosistem perusahaan'}
            onClose={() => router.get(route('admin.vendors'))}
            onSave={handleSave}
            processing={processing}
            isDirty={isDirty}
            isEdit={isEdit}
            headerActions={
                isEdit && (
                    <div className="flex items-center gap-4">
                        {canDelete && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsDeleteVendorOpen(true)}
                                className="h-9 hover:bg-rose-500 hover:text-white text-rose-500 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest transition-all border border-rose-500/10 active:scale-95"
                            >
                                <Trash2 size={14} className="mr-2" /> Hapus Vendor
                            </Button>
                        )}
                        <div className="flex items-center gap-4 bg-primary/5 dark:bg-white/5 px-4 py-2 rounded-2xl border border-primary/10 dark:border-white/10">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black tracking-widest text-primary/40 dark:text-white/40 uppercase">Audit Compliance</span>
                                <span className={cn(
                                    "text-[11px] font-black tracking-tight",
                                    auditScore >= 80 ? "text-emerald-500" : auditScore >= 50 ? "text-amber-500" : "text-rose-500"
                                )}>
                                    {auditScore}% SECURE
                                </span>
                            </div>
                            <div className="h-8 w-[1px] bg-primary/10 dark:bg-white/10" />
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "h-2 w-2 rounded-full animate-pulse",
                                    data.is_active ? "bg-emerald-500" : "bg-rose-500"
                                )} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary dark:text-white">
                                    {data.is_active ? 'Active' : 'Suspended'}
                                </span>
                            </div>
                        </div>
                    </div>
                )
            }
        >
            <Head title={isEdit ? `Vendor: ${vendor.name}` : 'Registrasi Vendor'} />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                {/* Main Content Column */}
                <div className="md:col-span-8 space-y-12">
                    {/* Section 1: Profil Perusahaan */}
                    <FormSection 
                        title="Identitas Resmi Entitas" 
                        subtitle="Data legal formal yang terdaftar pada sistem pemerintahan"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <div className="flex flex-col md:flex-row gap-4 items-start">
                                    <div className="w-full md:w-32">
                                        <CompactSelect 
                                            label="Bentuk"
                                            value={data.company_type}
                                            onChange={v => setData('company_type', v as string)}
                                            options={[
                                                { label: 'PT', value: 'PT' },
                                                { label: 'CV', value: 'CV' },
                                                { label: 'Firma', value: 'FIRMA' },
                                                { label: 'Persero', value: 'PERSERO' },
                                                { label: 'Individu', value: 'INDIVIDU' },
                                            ]}
                                        />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <CompactInput 
                                            label="Nama Resmi Perusahaan"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            placeholder="CONTOH: ADHI KARYA (PERSERO) TBK"
                                            error={errors.name}
                                        />
                                    </div>
                                </div>
                            </div>
                            <CompactInput 
                                label="Internal Vendor Code"
                                value={data.code}
                                onChange={e => setData('code', e.target.value)}
                                placeholder="AUTO-GENERATE"
                                error={errors.code}
                            />
                            <CompactSelect 
                                label="Kategori Bisnis"
                                value={data.category}
                                onChange={v => setData('category', v as string)}
                                options={[
                                    { label: 'Supplier / Pemasok', value: 'SUPPLIER' },
                                    { label: 'Konsultan / Jasa Professional', value: 'CONSULTANT' },
                                    { label: 'Kontraktor / Konstruksi', value: 'CONTRACTOR' },
                                    { label: 'Maintenance / Pemeliharaan', value: 'MAINTENANCE' },
                                    { label: 'IT Services', value: 'IT SERVICES' },
                                    { label: 'Logistik & Transportasi', value: 'LOGISTICS' },
                                ]}
                            />
                        </div>
                    </FormSection>

                    {/* Section 2: Kontak & Alamat */}
                    <FormSection 
                        title="Titik Kontak & Domisili" 
                        subtitle="Informasi korespondensi dan alamat operasional"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CompactInput 
                                label="Email Korespondensi"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                icon={Mail}
                                placeholder="vendor@perusahaan.com"
                                error={errors.email}
                            />
                            <CompactInput 
                                label="Telepon Kantor"
                                value={data.phone}
                                onChange={e => setData('phone', e.target.value)}
                                icon={Phone}
                                placeholder="+62 ..."
                                error={errors.phone}
                            />
                            <div className="md:col-span-2">
                                <CompactInput 
                                    label="Alamat Domisili Sesuai NPWP"
                                    value={data.address}
                                    onChange={e => setData('address', e.target.value)}
                                    icon={MapPin}
                                    placeholder="Jl. Sudirman No. 123, Jakarta Selatan..."
                                    error={errors.address}
                                />
                            </div>
                            <CompactInput 
                                label="Situs Web Perusahaan"
                                value={data.website}
                                onChange={e => setData('website', e.target.value)}
                                icon={Globe}
                                placeholder="https://..."
                                error={errors.website}
                            />
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/[0.03] dark:bg-white/[0.03] border border-primary/10 dark:border-white/10">
                                <Checkbox 
                                    id="is_individual"
                                    checked={data.is_individual}
                                    onCheckedChange={c => setData('is_individual', !!c)}
                                />
                                <label htmlFor="is_individual" className="text-[10px] font-black uppercase tracking-widest text-primary/60 dark:text-white/60 cursor-pointer">
                                    Registrasi Sebagai Perorangan / Individu
                                </label>
                            </div>
                        </div>
                    </FormSection>

                    {/* Section 3: PIC */}
                    <FormSection 
                        title="Representatif (PIC)" 
                        subtitle="Penanggung jawab komunikasi operasional"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CompactInput 
                                label="Nama Lengkap PIC"
                                value={data.pic_name}
                                onChange={e => setData('pic_name', e.target.value)}
                                icon={UserCheck}
                                placeholder="NAMA LENGKAP REPRESENTATIF"
                            />
                            <CompactInput 
                                label="Jabatan PIC"
                                value={data.pic_position}
                                onChange={e => setData('pic_position', e.target.value)}
                                placeholder="CONTOH: SALES MANAGER / DIREKTUR"
                            />
                        </div>
                    </FormSection>

                    {/* Section 4: Perpajakan & Bank */}
                    <FormSection 
                        title="Legalitas Keuangan" 
                        subtitle="Nomor identitas pajak dan data perbankan untuk transaksi"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CompactInput 
                                label="NPWP (Pajak)"
                                value={data.npwp}
                                onChange={e => setData('npwp', e.target.value)}
                                icon={Gavel}
                                placeholder="00.000.000.0-000.000"
                            />
                            <CompactInput 
                                label="NIB (Nomer Induk Berusaha)"
                                value={data.nib}
                                onChange={e => setData('nib', e.target.value)}
                                placeholder="NOMOR NIB RESMI"
                            />
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-dashed border-primary/10 dark:border-white/10">
                                <CompactInput 
                                    label="Institusi Bank"
                                    value={data.bank_name}
                                    onChange={e => setData('bank_name', e.target.value)}
                                    icon={CreditCard}
                                    placeholder="CONTOH: MANDIRI / BCA"
                                />
                                <CompactInput 
                                    label="Nomor Rekening"
                                    value={data.bank_account_no}
                                    onChange={e => setData('bank_account_no', e.target.value)}
                                    placeholder="NOMOR REKENING..."
                                />
                                <CompactInput 
                                    label="Atas Nama Rekening"
                                    value={data.bank_account_name}
                                    onChange={e => setData('bank_account_name', e.target.value)}
                                    placeholder="NAMA PEMEGANG REKENING..."
                                />
                            </div>
                        </div>
                    </FormSection>
                </div>

                {/* Sidebar / Document Audit Column */}
                <div className="md:col-span-4 space-y-10">
                    <div className="sticky top-6 space-y-10">
                         {/* Status Widget */}
                        <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] p-8 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <ShieldCheck size={80} strokeWidth={1} />
                            </div>

                            <h3 className="text-[10px] font-black tracking-[0.3em] text-primary dark:text-white uppercase mb-6 flex items-center gap-2">
                                <ShieldCheck size={14} /> Kendali Status
                            </h3>

                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-black/40 border border-primary/10 dark:border-white/10 shadow-sm mb-6">
                                <Checkbox 
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={c => setData('is_active', !!c)}
                                    className="h-5 w-5"
                                />
                                <div className="flex flex-col">
                                    <label htmlFor="is_active" className="text-[11px] font-black text-primary dark:text-white uppercase tracking-wider cursor-pointer">
                                        Vendor Aktif
                                    </label>
                                    <span className="text-[9px] font-bold text-primary/30 dark:text-white/30 uppercase">Siap untuk penugasan kontrak</span>
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-dashed border-primary/10 dark:border-white/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black text-primary/40 dark:text-white/40 uppercase tracking-widest">Audit Score</span>
                                    <span className="text-[11px] font-black text-primary dark:text-white">{auditScore}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-primary/10 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                        className={cn(
                                            "h-full transition-all duration-1000",
                                            auditScore >= 80 ? "bg-emerald-500" : auditScore >= 50 ? "bg-amber-500" : "bg-rose-500"
                                        )} 
                                        style={{ width: `${auditScore}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Audit Documents Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-[10px] font-black tracking-[0.3em] text-primary dark:text-white uppercase">Compliance Docs</h3>
                                <span className="bg-primary/10 dark:bg-white/10 px-2 py-0.5 rounded text-[9px] font-black text-primary dark:text-white">
                                    {vendor?.documents?.length || 0} / 10
                                </span>
                            </div>

                            {!isEdit ? (
                                <div className="p-8 text-center rounded-2xl border-2 border-dashed border-primary/10 dark:border-white/10 bg-primary/[0.01] dark:bg-white/[0.01]">
                                    <Clock className="mx-auto mb-4 text-primary/20 dark:text-white/20" size={32} strokeWidth={1} />
                                    <p className="text-[9px] font-black text-primary/30 dark:text-white/30 uppercase tracking-widest leading-loose">
                                        SIMPAN PROFIL UNTUK<br/>MENGAKTIFKAN MODUL AUDIT
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {docCats.map(cat => (
                                        <div key={cat.label} className="space-y-3">
                                            <div className="px-2 text-[9px] font-black text-primary/40 dark:text-white/40 uppercase tracking-[0.2em]">
                                                {cat.label}
                                            </div>
                                            <div className="space-y-2">
                                                {cat.types.map(type => {
                                                    const doc = vendor.documents?.find((d: any) => d.document_type === type);
                                                    return (
                                                        <div 
                                                            key={type}
                                                            className={cn(
                                                                "group flex items-center justify-between p-3 rounded-xl border transition-all",
                                                                doc 
                                                                    ? "bg-white dark:bg-white/[0.02] border-primary/10 dark:border-white/10" 
                                                                    : "bg-primary/[0.01] dark:bg-white/[0.01] border-dashed border-primary/10 dark:border-white/10"
                                                            )}
                                                        >
                                                            <div className="min-w-0">
                                                                <div className="text-[10px] font-black uppercase tracking-tight text-primary dark:text-white truncate">
                                                                    {type.replace(/_/g, ' ')}
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    {doc ? (
                                                                        <CheckCircle2 size={10} className="text-emerald-500" />
                                                                    ) : (
                                                                        <Clock size={10} className="text-primary/20 dark:text-white/20" />
                                                                    )}
                                                                    <span className="text-[8px] font-bold text-primary/30 dark:text-white/30 uppercase truncate">
                                                                        {doc ? 'Verified' : 'Pending Upload'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {doc ? (
                                                                    <>
                                                                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => window.open(doc.file_url, '_blank')}>
                                                                            <ExternalLink size={12} />
                                                                        </Button>
                                                                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-rose-500 hover:bg-rose-500/10" onClick={() => { setDocToDelete(doc.id); setIsDeleteDocOpen(true); }}>
                                                                            <Trash2 size={12} />
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-primary dark:text-white hover:bg-primary/10 dark:hover:bg-white/10" onClick={() => { docForm.setData('document_type', type); setIsUploadModalOpen(true); }}>
                                                                        <UploadCloud size={14} />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-black p-8 shadow-2xl sm:max-w-[450px]">
                    <DialogTitle className="mb-8 border-b border-primary/5 dark:border-white/5 pb-4 text-[12px] font-black tracking-[0.2em] text-primary dark:text-white uppercase flex items-center gap-3">
                        <UploadCloud size={18} /> Upload Berkas Kepatuhan
                    </DialogTitle>
                    <form onSubmit={handleUploadDoc} className="space-y-8">
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-primary/[0.03] dark:bg-white/[0.03] border border-primary/10 dark:border-white/10">
                                <span className="text-[9px] font-black text-primary/40 dark:text-white/40 uppercase tracking-widest block mb-1">Tipe Dokumen</span>
                                <span className="text-[11px] font-black text-primary dark:text-white uppercase">{docForm.data.document_type.replace(/_/g, ' ')}</span>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="ml-1 text-[10px] font-black tracking-widest text-primary/40 dark:text-white/40 uppercase">Pilih File (PDF/JPG/PNG)</label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) => docForm.setData('document_file', e.target.files?.[0] || null)}
                                    required
                                    className="w-full text-xs text-primary/60 dark:text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-primary file:text-white dark:file:bg-white dark:file:text-black cursor-pointer"
                                />
                            </div>
                            
                            <CompactInput 
                                label="Masa Berlaku (Jika Ada)"
                                type="date"
                                value={docForm.data.expires_at}
                                onChange={(e) => docForm.setData('expires_at', e.target.value)}
                            />
                        </div>
                        <DialogFooter className="pt-6">
                            <Button variant="primary" type="submit" disabled={docForm.processing} className="h-12 w-full shadow-xl active:scale-95 group">
                                <UploadCloud className="mr-2 h-4 w-4 group-hover:animate-bounce" /> Unggah Sekarang
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmationModal
                open={isDeleteDocOpen}
                onClose={() => setIsDeleteDocOpen(false)}
                onConfirm={confirmDeleteDoc}
                title="Hapus Dokumen Audit?"
                description="Tindakan ini bersifat permanen. File dokumen akan dihapus secara fisik dari server dan riwayat audit akan diperbarui."
                confirmText="Hapus Dokumen"
                processing={processing}
            />
            <ConfirmationModal
                open={isDeleteVendorOpen}
                onClose={() => setIsDeleteVendorOpen(false)}
                onConfirm={() => {
                    setIsDeleteVendorOpen(false);
                    router.delete(route('admin.vendors.destroy', vendor.id), {
                        onSuccess: () => {
                            showToast('Vendor berhasil dihapus', 'success');
                            router.get(route('admin.vendors'));
                        }
                    });
                }}
                title="Hapus Profil Vendor?"
                description={`Apakah Anda yakin ingin menghapus ${vendor?.name}? Tindakan ini akan menghapus seluruh profil dan dokumen legalitas yang terkait secara permanen.`}
                confirmText="Hapus Permanen"
            />
        </ManagementForm>
    );
}
