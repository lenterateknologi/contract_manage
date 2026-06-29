import { FormSection, ManagementForm } from '@/pages/admin/components/ManagementForm';
import { Button } from '@/components/ui/buttons/Button';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { useToast } from '@/components/ui/feedback/Toast';
import { CompactInput } from '@/components/ui/inputs/CompactInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import { ConfirmationModal } from '@/components/ui/dialogs/ConfirmationModal';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Building2,
    CheckCircle2,
    Clock,
    CreditCard,
    ExternalLink,
    Gavel,
    Globe,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    Trash2,
    Truck,
    UploadCloud,
    UserCheck,
} from 'lucide-react';
import { FormEvent, useMemo, useRef, useState } from 'react';

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
            onSuccess: () => showToast(`Data vendor berhasil disimpan`, 'success'),
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
        if (!docToDelete || !vendor) return;
        router.delete(route('admin.vendors.documents.destroy', { vendor: vendor.id, document: docToDelete }), {
            onSuccess: () => {
                setIsDeleteDocOpen(false);
                setDocToDelete(null);
                showToast('Dokumen telah dihapus', 'success');
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

        return [
            { label: 'Legalitas Utama', types: ['NPWP', 'NIB', 'SIUP', 'TDP', 'SPPKP', 'SK_KEMENKUMHAM'] },
            { label: 'Dokumen Notaril', types: ['AKTA_PENDIRIAN', 'AKTA_PERUBAHAN'] },
            { label: 'Pendukung & Bank', types: ['REKENING_KORAN', 'COMPANY_PROFILE', 'KTP_DIREKTUR', 'OTHER'] },
        ];
    }, [data.company_type]);

    const auditScore = useMemo(() => {
        if (!vendor?.documents) return 0;
        const requiredTypes = docCats.flatMap((cat) => cat.types);
        const uploadedRequired = vendor.documents.filter((d: any) => requiredTypes.includes(d.document_type)).length;
        return Math.min(100, Math.round((uploadedRequired / requiredTypes.length) * 100));
    }, [vendor, docCats]);

    return (
        <ManagementForm
            title={isEdit ? 'Profil Strategis Vendor' : 'Registrasi Vendor Baru'}
            subtitle={
                isEdit
                    ? `Mengelola parameter operasional dan audit kepatuhan untuk ${vendor.name}`
                    : 'Mendaftarkan mitra bisnis baru ke dalam ekosistem perusahaan'
            }
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
                                className="h-9 rounded-xl border border-rose-500/10 px-4 text-xs font-semibold text-rose-500 transition-all hover:bg-rose-500 hover:text-white active:scale-95"
                            >
                                <Trash2 size={14} className="mr-2" /> Hapus Vendor
                            </Button>
                        )}
                        <div className="bg-primary/5 border-primary/10 flex items-center gap-4 rounded-2xl border px-4 py-2 dark:border-white/10 dark:bg-white/5">
                            <div className="flex flex-col items-end">
                                <span className="text-primary/40 mb-1 text-[10px] leading-none font-semibold tracking-widest uppercase dark:text-white/40">
                                    Kepatuhan Audit
                                </span>
                                <span
                                    className={cn(
                                        'text-xs font-semibold tracking-tight uppercase',
                                        auditScore >= 80 ? 'text-emerald-500' : auditScore >= 50 ? 'text-amber-500' : 'text-rose-500',
                                    )}
                                >
                                    {auditScore}% AMAN
                                </span>
                            </div>
                            <div className="bg-primary/10 h-8 w-[1px] dark:bg-white/10" />
                            <div className="flex items-center gap-2">
                                <div className={cn('h-1.5 w-1.5 animate-pulse rounded-full', data.is_active ? 'bg-emerald-500' : 'bg-rose-500')} />
                                <span className="text-primary text-[10px] font-semibold tracking-widest uppercase dark:text-white">
                                    {data.is_active ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </div>
                        </div>
                    </div>
                )
            }
        >
            <Head title={isEdit ? `Vendor: ${vendor.name}` : 'Registrasi Vendor'} />

            <div className="animate-in fade-in grid w-full grid-cols-1 gap-16 duration-300 select-none lg:grid-cols-2">
                {/* Side 1: Business Identity & PIC */}
                <div className="space-y-12">
                    {/* Section 1: Profil Perusahaan */}
                    <FormSection title="Identitas Resmi Entitas" subtitle="Data legal formal yang terdaftar pada sistem pemerintahan">
                        <div className="grid grid-cols-1 gap-y-10">
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                                <div className="space-y-2.5">
                                    <label className="text-primary/60 flex items-center gap-2 text-[10px] font-semibold tracking-widest uppercase dark:text-white/60">
                                        Bentuk
                                    </label>
                                    <Select value={data.company_type} onValueChange={(v: string) => setData('company_type', String(v))}>
                                        <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-11 rounded-xl text-xs font-bold shadow-sm ring-1 ring-black/[0.03] transition-all">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-primary/10 rounded-xl bg-white shadow-2xl dark:bg-black">
                                            <SelectItem value="PT" className="py-2.5 text-xs font-bold text-black uppercase dark:text-white">
                                                PT
                                            </SelectItem>
                                            <SelectItem value="CV" className="py-2.5 text-xs font-bold text-black uppercase dark:text-white">
                                                CV
                                            </SelectItem>
                                            <SelectItem value="FIRMA" className="py-2.5 text-xs font-bold text-black uppercase dark:text-white">
                                                FIRMA
                                            </SelectItem>
                                            <SelectItem value="PERSERO" className="py-2.5 text-xs font-bold text-black uppercase dark:text-white">
                                                PERSERO
                                            </SelectItem>
                                            <SelectItem value="INDIVIDU" className="py-2.5 text-xs font-bold text-black uppercase dark:text-white">
                                                INDIVIDU
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="md:col-span-2">
                                    <CompactInput
                                        label="Nama Resmi Perusahaan"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="CONTOH: ADHI KARYA (PERSERO) TBK"
                                        error={errors.name}
                                        icon={Building2}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                <CompactInput
                                    label="Internal Vendor Code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    placeholder="DIBUAT OTOMATIS"
                                    error={errors.code}
                                    icon={Truck}
                                />
                                <div className="space-y-2.5">
                                    <label className="text-primary/60 flex items-center gap-2 text-[10px] font-semibold tracking-widest uppercase dark:text-white/60">
                                        Kategori Bisnis
                                    </label>
                                    <Select value={data.category} onValueChange={(v: string) => setData('category', String(v))}>
                                        <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-11 rounded-xl text-xs font-bold shadow-sm ring-1 ring-black/[0.03] transition-all">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-primary/10 rounded-xl bg-white shadow-2xl dark:bg-black">
                                            <SelectItem value="SUPPLIER" className="py-2.5 text-xs font-bold text-black uppercase dark:text-white">
                                                Supplier / Pemasok
                                            </SelectItem>
                                            <SelectItem value="CONSULTANT" className="py-2.5 text-xs font-bold text-black uppercase dark:text-white">
                                                Konsultan / Jasa Professional
                                            </SelectItem>
                                            <SelectItem value="CONTRACTOR" className="py-2.5 text-xs font-bold text-black uppercase dark:text-white">
                                                Kontraktor / Konstruksi
                                            </SelectItem>
                                            <SelectItem value="MAINTENANCE" className="py-2.5 text-xs font-bold text-black uppercase dark:text-white">
                                                Maintenance / Pemeliharaan
                                            </SelectItem>
                                            <SelectItem value="IT SERVICES" className="py-2.5 text-xs font-bold text-black uppercase dark:text-white">
                                                IT Services
                                            </SelectItem>
                                            <SelectItem value="LOGISTICS" className="py-2.5 text-xs font-bold text-black uppercase dark:text-white">
                                                Logistik & Transportasi
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    {/* Section 2: Kontak & Alamat */}
                    <FormSection title="Titik Kontak & Domisili" subtitle="Informasi korespondensi dan alamat operasional">
                        <div className="grid grid-cols-1 gap-y-10">
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                <CompactInput
                                    label="Email Korespondensi"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    icon={Mail}
                                    placeholder="vendor@perusahaan.com"
                                    error={errors.email}
                                />
                                <CompactInput
                                    label="Telepon Kantor"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    icon={Phone}
                                    placeholder="+62 ..."
                                    error={errors.phone}
                                />
                            </div>
                            <CompactInput
                                label="Alamat Domisili Sesuai NPWP"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                icon={MapPin}
                                placeholder="Jl. Sudirman No. 123, Jakarta Selatan..."
                                error={errors.address}
                            />
                            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
                                <CompactInput
                                    label="Situs Web Perusahaan"
                                    value={data.website}
                                    onChange={(e) => setData('website', e.target.value)}
                                    icon={Globe}
                                    placeholder="https://..."
                                    error={errors.website}
                                />
                                <div className="bg-primary/5 border-primary/10 flex items-center gap-3 rounded-2xl border p-5 backdrop-blur-sm transition-all duration-200">
                                    <Checkbox
                                        id="is_individual"
                                        checked={data.is_individual}
                                        onCheckedChange={(c) => setData('is_individual', !!c)}
                                        className="h-6 w-6 rounded-lg"
                                    />
                                    <label
                                        htmlFor="is_individual"
                                        className="text-primary cursor-pointer text-[10px] font-bold  uppercase"
                                    >
                                        Registrasi Sebagai Perorangan
                                    </label>
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    {/* Section 3: PIC */}
                    <FormSection title="Representatif (PIC)" subtitle="Penanggung jawab komunikasi operasional">
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                            <CompactInput
                                label="Nama Lengkap PIC"
                                value={data.pic_name}
                                onChange={(e) => setData('pic_name', e.target.value)}
                                icon={UserCheck}
                                placeholder="NAMA LENGKAP"
                            />
                            <CompactInput
                                label="Jabatan PIC"
                                value={data.pic_position}
                                onChange={(e) => setData('pic_position', e.target.value)}
                                placeholder="CONTOH: SALES MANAGER"
                            />
                        </div>
                    </FormSection>
                </div>

                {/* Side 2: Compliance & Legal Finance */}
                <div className="space-y-12">
                    {/* Section 4: Perpajakan & Bank */}
                    <FormSection title="Legalitas Keuangan" subtitle="Nomor identitas pajak dan data perbankan">
                        <div className="grid grid-cols-1 gap-y-10">
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                <CompactInput
                                    label="NPWP (Pajak)"
                                    value={data.npwp}
                                    onChange={(e) => setData('npwp', e.target.value)}
                                    icon={Gavel}
                                    placeholder="00.000.000.0-000.000"
                                />
                                <CompactInput
                                    label="NIB (Nomer Induk Berusaha)"
                                    value={data.nib}
                                    onChange={(e) => setData('nib', e.target.value)}
                                    placeholder="NOMOR NIB RESMI"
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-8 border-t border-black/[0.03] pt-10 md:grid-cols-3 dark:border-white/[0.03]">
                                <CompactInput
                                    label="Institusi Bank"
                                    value={data.bank_name}
                                    onChange={(e) => setData('bank_name', e.target.value)}
                                    icon={CreditCard}
                                    placeholder="MANDIRI / BCA"
                                />
                                <CompactInput
                                    label="Nomor Rekening"
                                    value={data.bank_account_no}
                                    onChange={(e) => setData('bank_account_no', e.target.value)}
                                    placeholder="NOMOR REKENING"
                                />
                                <CompactInput
                                    label="Atas Nama Rekening"
                                    value={data.bank_account_name}
                                    onChange={(e) => setData('bank_account_name', e.target.value)}
                                    placeholder="NAMA PEMEGANG"
                                />
                            </div>
                        </div>
                    </FormSection>

                    {/* Section: Documents */}
                    <FormSection
                        title="Dokumen Kepatuhan"
                        subtitle="Arsip digital bukti legalitas perusahaan"
                        headerAction={
                            isEdit && (
                                <div className="flex items-center gap-2">
                                    <span className="bg-primary/10 text-primary rounded-lg px-2.5 py-1 text-[10px] leading-none font-semibold tracking-widest uppercase dark:bg-white/10 dark:text-white">
                                        {vendor?.documents?.length || 0} / {docCats.flatMap((c) => c.types).length} Berkas
                                    </span>
                                </div>
                            )
                        }
                    >
                        {!isEdit ? (
                            <div className="border-primary/10 bg-primary/[0.01] rounded-3xl border-2 border-dashed p-12 text-center dark:border-white/10 dark:bg-white/[0.01]">
                                <Clock className="text-primary/20 mx-auto mb-4 dark:text-white/20" size={40} strokeWidth={1} />
                                <p className="text-primary/40 text-[11px] leading-relaxed font-semibold tracking-widest uppercase dark:text-white/40">
                                    SIMPAN PROFIL UNTUK
                                    <br />
                                    MENGAKTIFKAN MODUL AUDIT
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-8">
                                {docCats.map((cat) => (
                                    <div key={cat.label} className="space-y-4">
                                        <div className="text-primary/40 px-2 text-[10px] font-semibold tracking-widest uppercase dark:text-white/40">
                                            {cat.label}
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            {cat.types.map((type) => {
                                                const doc = vendor.documents?.find((d: any) => d.document_type === type);
                                                return (
                                                    <div
                                                        key={type}
                                                        className={cn(
                                                            'group flex items-center justify-between rounded-2xl border p-4 transition-all duration-300',
                                                            doc
                                                                ? 'border-primary/10 bg-white shadow-sm dark:bg-white/[0.02]'
                                                                : 'bg-primary/[0.01] border-primary/10 border-dashed dark:bg-white/[0.01]',
                                                        )}
                                                    >
                                                        <div className="min-w-0">
                                                            <div className="text-primary truncate text-[11px] font-semibold tracking-tight uppercase dark:text-white">
                                                                {type.replace(/_/g, ' ')}
                                                            </div>
                                                            <div className="mt-1 flex items-center gap-1.5">
                                                                {doc ? (
                                                                    <CheckCircle2 size={10} className="text-emerald-500" />
                                                                ) : (
                                                                    <Clock size={10} className="text-primary/20" />
                                                                )}
                                                                <span className="text-primary/40 text-[10px] font-bold tracking-tighter uppercase">
                                                                    {doc ? 'Verified' : 'Pending'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                            {doc ? (
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="hover:bg-primary/5 h-8 w-8 rounded-xl"
                                                                    onClick={() => window.open(doc.file_url, '_blank')}
                                                                >
                                                                    <ExternalLink size={14} className="text-primary" />
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="text-primary hover:bg-primary/10 h-8 w-8 rounded-xl"
                                                                    onClick={() => {
                                                                        docForm.setData('document_type', type);
                                                                        setIsUploadModalOpen(true);
                                                                    }}
                                                                >
                                                                    <UploadCloud size={16} />
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
                    </FormSection>

                    {/* Status & Control Block */}
                    <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
                        <div
                            onClick={() => setData('is_active', !data.is_active)}
                            className="bg-success/5 border-success/20 group hover:bg-success/10 flex cursor-pointer items-center gap-4 rounded-2xl border p-6 shadow-sm backdrop-blur-sm transition-all duration-200 select-none"
                        >
                            <Checkbox
                                id="is_active"
                                checked={!!data.is_active}
                                onCheckedChange={() => { }}
                                className="border-success/30 data-[state=checked]:bg-success h-6 w-6 rounded-lg"
                            />
                            <div className="flex flex-col">
                                <span className="text-success text-sm font-semibold tracking-tight uppercase">Status Terverifikasi</span>
                                <span className="text-success/60 mt-1 text-[10px] leading-tight font-semibold tracking-widest uppercase">
                                    Aktif dalam ekosistem rekanan
                                </span>
                            </div>
                        </div>

                        <div className="animate-in fade-in flex gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 backdrop-blur-sm duration-300 dark:bg-amber-500/10">
                            <ShieldCheck size={24} className="mt-0.5 shrink-0 text-amber-500" />
                            <p className="text-[10px] leading-relaxed font-bold tracking-tight text-amber-700/80 uppercase">
                                Perubahan data legalitas vendor berdampak langsung pada validitas kontrak. Pastikan audit dokumen dilakukan secara
                                berkala.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent className="border-primary/10 rounded-2xl border bg-white p-8 shadow-2xl sm:max-w-[450px] dark:border-white/10 dark:bg-black">
                    <DialogTitle className="border-primary/5 text-primary mb-8 flex items-center gap-3 border-b pb-4 text-sm font-bold uppercase dark:border-white/5 dark:text-white">
                        <UploadCloud size={18} /> Unggah Berkas Kepatuhan
                    </DialogTitle>
                    <form onSubmit={handleUploadDoc} className="space-y-8">
                        <div className="space-y-4">
                            <div className="bg-primary/[0.03] border-primary/10 rounded-xl border p-4 dark:border-white/10 dark:bg-white/[0.03]">
                                <span className="text-primary/40 mb-1 block text-xs font-semibold uppercase dark:text-white/40">Tipe Dokumen</span>
                                <span className="text-primary text-xs font-bold uppercase dark:text-white">
                                    {docForm.data.document_type.replace(/_/g, ' ')}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <label className="text-primary/40 ml-1 text-xs font-semibold uppercase dark:text-white/40">
                                    Pilih Berkas (PDF/JPG/PNG)
                                </label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) => docForm.setData('document_file', e.target.files?.[0] || null)}
                                    required
                                    className="text-primary/60 file:bg-primary w-full cursor-pointer text-xs file:mr-4 file:rounded-xl file:border-0 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white file:uppercase dark:text-white/60 dark:file:bg-white dark:file:text-black"
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
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={docForm.processing}
                                className="group h-12 w-full shadow-xl active:scale-95"
                            >
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
                        },
                    });
                }}
                title="Hapus Profil Vendor?"
                description={`Apakah Anda yakin ingin menghapus ${vendor?.name}? Tindakan ini akan menghapus seluruh profil dan dokumen legalitas yang terkait secara permanen.`}
                confirmText="Hapus Permanen"
            />
        </ManagementForm>
    );
}
