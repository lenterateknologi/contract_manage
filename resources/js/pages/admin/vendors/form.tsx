import { ManagementForm } from '@/components/admin/ManagementForm';
import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Head, router, useForm } from '@inertiajs/react';
import { FileText, ShieldCheck, Trash2, UploadCloud } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';

export default function VendorForm({ vendor, breadcrumbs }: any) {
    const isEdit = !!vendor;
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Vendor Data Form
    const { data, setData, post, put, processing, isDirty } = useForm({
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

    // Document Upload Form
    const docForm = useForm({
        document_file: null as File | null,
        document_type: '',
        expires_at: '',
    });

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isDeleteDocOpen, setIsDeleteDocOpen] = useState(false);
    const [docToDelete, setDocToDelete] = useState<number | null>(null);

    const handleSave = (e?: FormEvent) => {
        if (e) e.preventDefault();
        const options = {
            onSuccess: () => showToast(`Data Tersimpan`, 'success'),
            onError: () => showToast('Gagal Simpan', 'danger'),
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
                showToast('Terunggah', 'success');
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
                showToast('Dihapus', 'success');
            },
        });
    };

    const docCats = [
        { l: 'Legalitas Utama', it: ['NPWP', 'NIB', 'SIUP', 'TDP', 'SPPKP', 'SK_KEMENKUMHAM'] },
        { l: 'Dokumen Notaril', it: ['AKTA_PENDIRIAN', 'AKTA_PERUBAHAN'] },
        { l: 'Lainnya', it: ['REKENING_KORAN', 'COMPANY_PROFILE', 'KTP_DIREKTUR', 'OTHER'] },
    ];

    return (
        <ManagementForm
            title={isEdit ? 'Profil & Parameter Vendor' : 'Registrasi Vendor Baru'}
            subtitle={isEdit ? 'Kelola parameter entitas dan audit dokumen' : 'Daftarkan mitra operasional baru ke sistem'}
            onClose={() => router.get(route('admin.vendors'))}
            onSave={handleSave}
            processing={processing}
            isDirty={isDirty}
            isEdit={isEdit}
        >
            <Head title={isEdit ? `Vendor: ${vendor.name}` : 'Registrasi Vendor'} />

            <div className="space-y-16">
                {/* Unified Identitas & Status Section */}
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                    <div className="space-y-12 lg:col-span-8">
                        {/* Section 1: Identitas Dasar */}
                        <div className="space-y-8">
                            <div className="ml-1 flex items-center justify-between border-b border-black/[0.05] pb-4 dark:border-white/[0.05]">
                                <h3 className="text-[11px] font-black tracking-[0.2em] text-black uppercase dark:text-white">Identitas Entitas</h3>
                                <div className="flex items-center gap-6">
                                    <div
                                        className="group flex cursor-pointer items-center gap-2.5"
                                        onClick={() => setData('is_individual', !data.is_individual)}
                                    >
                                        <Checkbox
                                            id="v-ind"
                                            checked={data.is_individual}
                                            onCheckedChange={(c) => setData('is_individual', !!c)}
                                            className="h-4 w-4 rounded-md border-black/[0.1] data-[state=checked]:bg-black dark:border-white/[0.1] dark:data-[state=checked]:bg-white"
                                        />
                                        <Label
                                            htmlFor="v-ind"
                                            className="cursor-pointer text-[10px] leading-none font-black tracking-widest text-black/40 uppercase transition-colors group-hover:text-black dark:text-white/40 dark:group-hover:text-white"
                                        >
                                            INDIVIDU / PERORANGAN
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-x-10 gap-y-8 p-1 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label className="ml-1 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                        Internal Vendor Code
                                    </Label>
                                    <Input
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        placeholder="AUTO-GENERATE"
                                        className="h-11 rounded-xl border-black/[0.08] bg-black/[0.03] px-5 font-mono text-[11px] font-black tracking-widest uppercase shadow-sm transition-all focus:border-black focus-visible:ring-0 dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="ml-1 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                        Kategori Operasional
                                    </Label>
                                    <Select value={data.category} onValueChange={(v) => setData('category', v)}>
                                        <SelectTrigger className="h-11 rounded-xl border-black/[0.08] bg-black/[0.03] px-5 text-[11px] font-black tracking-tight uppercase shadow-sm focus:ring-0 dark:border-white/[0.08] dark:bg-white/[0.03]">
                                            <SelectValue placeholder="PILIH KATEGORI..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-black/[0.08] bg-white shadow-2xl dark:border-white/[0.08] dark:bg-black">
                                            {['Supplier', 'Consultant', 'Contractor', 'Maintenance', 'IT Services', 'Logistics'].map((c) => (
                                                <SelectItem
                                                    key={c}
                                                    value={c.toUpperCase()}
                                                    className="py-3 text-[10px] font-black tracking-wider uppercase"
                                                >
                                                    {c}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="ml-1 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                        Nama Resmi Entitas / Perusahaan
                                    </Label>
                                    <div className="flex gap-2">
                                        <div className="flex h-11 shrink-0 items-center justify-center rounded-xl border border-black bg-black px-5 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-black/10 dark:border-white dark:bg-white dark:text-black dark:shadow-white/5">
                                            {data.company_type || 'PT/CV'}
                                        </div>
                                        <Input
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="h-11 w-full rounded-xl border-black/[0.08] bg-black/[0.03] px-5 text-sm font-black tracking-tight uppercase shadow-sm transition-all focus:border-black focus-visible:ring-0 dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="ml-1 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                        Alamat Email Korespondensi
                                    </Label>
                                    <Input
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="h-11 rounded-xl border-black/[0.08] bg-black/[0.03] px-5 text-sm font-bold shadow-sm transition-all focus:border-black focus-visible:ring-0 dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="ml-1 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                        Nomor Telepon Kantor
                                    </Label>
                                    <Input
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="h-11 rounded-xl border-black/[0.08] bg-black/[0.03] px-5 font-mono text-sm font-bold shadow-sm transition-all focus:border-black focus-visible:ring-0 dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="ml-1 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                        Alamat Domisili Sesuai Dokumen
                                    </Label>
                                    <Input
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        className="h-11 rounded-xl border-black/[0.08] bg-black/[0.03] px-5 text-sm font-medium shadow-sm transition-all focus:border-black focus-visible:ring-0 dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Person in Charge */}
                        <div className="space-y-8">
                            <h3 className="ml-1 border-b border-black/[0.05] pb-4 text-[11px] font-black tracking-[0.2em] text-black uppercase dark:border-white/[0.05] dark:text-white">
                                Person in Charge / Representatif
                            </h3>
                            <div className="grid grid-cols-1 gap-x-10 gap-y-8 p-1 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label className="ml-1 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                        Nama Lengkap PIC
                                    </Label>
                                    <Input
                                        value={data.pic_name}
                                        onChange={(e) => setData('pic_name', e.target.value)}
                                        className="h-11 rounded-xl border-black/[0.08] bg-black/[0.03] px-5 text-sm font-black tracking-tight uppercase shadow-sm transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="ml-1 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                        Jabatan PIC
                                    </Label>
                                    <Input
                                        value={data.pic_position}
                                        onChange={(e) => setData('pic_position', e.target.value)}
                                        className="h-11 rounded-xl border-black/[0.08] bg-black/[0.03] px-5 text-sm font-black tracking-tight uppercase shadow-sm transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Status & Quick Info */}
                    <div className="space-y-8 lg:col-span-4">
                        <div className="rounded-2xl border border-black/[0.05] bg-black/[0.02] p-8 shadow-sm dark:border-white/[0.05] dark:bg-white/[0.02]">
                            <div className="mb-8 flex items-center gap-3">
                                <ShieldCheck size={18} className="text-black/20 dark:text-white/20" />
                                <span className="text-[10px] font-black tracking-[0.3em] text-black/30 uppercase dark:text-white/30">
                                    Parameter Status
                                </span>
                            </div>

                            <div className="mb-8 flex items-center gap-4 rounded-xl border border-black/[0.05] bg-white p-4 shadow-sm dark:border-white/[0.05] dark:bg-black/40">
                                <Checkbox
                                    id="v-active"
                                    checked={data.is_active}
                                    onCheckedChange={(c) => setData('is_active', !!c)}
                                    className="h-5 w-5 rounded-lg border-black/[0.1] transition-all data-[state=checked]:bg-black data-[state=checked]:text-white dark:border-white/[0.1] dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-black"
                                />
                                <div className="flex flex-col">
                                    <Label
                                        htmlFor="v-active"
                                        className="mb-1.5 cursor-pointer text-[11px] leading-none font-black tracking-widest text-black uppercase dark:text-white"
                                    >
                                        VERIFIKASI AKTIF
                                    </Label>
                                    <span className="text-[9px] font-bold tracking-[0.1em] text-black/30 uppercase dark:text-white/30">
                                        SIAP UNTUK TRANSAKSI KONTRAK
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8 space-y-6 border-t border-dashed border-black/[0.05] pt-8 dark:border-white/[0.05]">
                                <div className="flex items-center justify-between text-[10px] font-black tracking-[0.2em] text-black/30 uppercase dark:text-white/30">
                                    <span>Audit Score</span>
                                    <span className="text-black dark:text-white">{Math.round(((vendor?.documents?.length || 0) / 10) * 100)}%</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.05]">
                                    <div
                                        className="h-full bg-black shadow-lg transition-all duration-700 ease-out dark:bg-white"
                                        style={{ width: `${Math.min(100, ((vendor?.documents?.length || 0) / 10) * 100)}%` }}
                                    />
                                </div>
                                <p className="border-t border-black/[0.05] pt-4 text-[10px] leading-relaxed font-bold tracking-tight text-black/30 uppercase italic dark:border-white/[0.05] dark:text-white/30">
                                    Kelengkapan dokumen legalitas sangat menentukan skor kualifikasi vendor dalam proses tender dan penunjukan
                                    langsung secara transparan.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Legal & Banking Grid */}
                <div className="grid grid-cols-1 gap-16 border-t border-black/[0.05] pt-12 md:grid-cols-2 dark:border-white/[0.05]">
                    <div className="space-y-10">
                        <h3 className="ml-1 border-b border-black/[0.05] pb-4 text-[11px] font-black tracking-[0.2em] text-black uppercase dark:border-white/[0.05] dark:text-white">
                            Informasi Perpajakan & Legal
                        </h3>
                        <div className="space-y-8 p-1">
                            <div className="space-y-2">
                                <Label className="ml-1 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                    Nomor Pokok Wajib Pajak (NPWP)
                                </Label>
                                <Input
                                    value={data.npwp}
                                    onChange={(e) => setData('npwp', e.target.value)}
                                    className="h-11 rounded-xl border-black/[0.08] bg-black/[0.03] px-5 font-mono text-[11px] font-black tracking-[0.2em] uppercase shadow-sm transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="ml-1 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                    Nomor Induk Berusaha (NIB)
                                </Label>
                                <Input
                                    value={data.nib}
                                    onChange={(e) => setData('nib', e.target.value)}
                                    className="h-11 rounded-xl border-black/[0.08] bg-black/[0.03] px-5 font-mono text-[11px] font-black tracking-[0.2em] uppercase shadow-sm transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-2">
                                    <Label className="ml-1 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                        SIUP / Izin Usaha
                                    </Label>
                                    <Input
                                        value={data.siup}
                                        onChange={(e) => setData('siup', e.target.value)}
                                        className="h-11 rounded-xl border-black/[0.08] bg-black/[0.03] px-5 text-xs font-black tracking-tight shadow-sm transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="ml-1 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                        Direktur Utama
                                    </Label>
                                    <Input
                                        value={data.director_name}
                                        onChange={(e) => setData('director_name', e.target.value)}
                                        className="h-11 rounded-xl border-black/[0.08] bg-black/[0.03] px-5 text-xs font-black tracking-tight uppercase shadow-sm transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-10">
                        <h3 className="ml-1 border-b border-black/[0.05] pb-4 text-[11px] font-black tracking-[0.2em] text-black uppercase dark:border-white/[0.05] dark:text-white">
                            Sistem Pembayaran / Perbankan
                        </h3>
                        <div className="space-y-8 p-1">
                            <div className="space-y-2">
                                <Label className="ml-1 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                    Institusi Perbankan
                                </Label>
                                <Input
                                    value={data.bank_name}
                                    onChange={(e) => setData('bank_name', e.target.value)}
                                    className="h-11 rounded-xl border-black/[0.08] bg-black/[0.03] px-5 text-xs font-black tracking-tight uppercase shadow-sm transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="ml-1 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                    Nomor Rekening Operasional
                                </Label>
                                <Input
                                    value={data.bank_account_no}
                                    onChange={(e) => setData('bank_account_no', e.target.value)}
                                    className="h-11 rounded-xl border-black/[0.08] bg-black/[0.03] px-5 font-mono text-[11px] font-black tracking-[0.2em] shadow-sm transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="ml-1 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                    Nama Pemegang Rekening
                                </Label>
                                <Input
                                    value={data.bank_account_name}
                                    onChange={(e) => setData('bank_account_name', e.target.value)}
                                    className="h-11 rounded-xl border-black/[0.08] bg-black/[0.03] px-5 text-xs font-black tracking-tight uppercase shadow-sm transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Documents Audit Section */}
                <div className="space-y-10 border-t border-black/[0.05] pt-12 pb-32 dark:border-white/[0.05]">
                    <div className="ml-1 flex items-center justify-between border-b border-black/[0.05] pb-4 dark:border-white/[0.05]">
                        <h3 className="text-[11px] leading-none font-black tracking-[0.2em] text-black uppercase dark:text-white">
                            Audit Dokumen Compliance
                        </h3>
                    </div>

                    <div
                        className={cn('grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3', !isEdit && 'pointer-events-none opacity-30 grayscale')}
                    >
                        {!isEdit && (
                            <div className="rounded-2xl border-2 border-dashed border-black/[0.05] bg-black/[0.01] py-24 text-center lg:col-span-3 dark:border-white/[0.05] dark:bg-white/[0.01]">
                                <p className="text-[11px] font-black tracking-[0.3em] text-black/30 uppercase dark:text-white/30">
                                    Simpan Profil Vendor Terlebih Dahulu untuk Mengaktifkan Modul Audit Dokumen
                                </p>
                            </div>
                        )}
                        {isEdit &&
                            docCats.map((cat) => (
                                <div key={cat.l} className="space-y-5">
                                    <div className="ml-1 border-l-4 border-black py-1 pl-4 text-[10px] font-black tracking-[0.2em] text-black uppercase dark:border-white dark:text-white">
                                        {cat.l}
                                    </div>
                                    <div className="space-y-3">
                                        {cat.it.map((type) => {
                                            const doc = vendor?.documents?.find((d: any) => d.document_type === type);
                                            return (
                                                <div
                                                    key={type}
                                                    className={cn(
                                                        'flex items-center justify-between rounded-2xl border p-5 shadow-sm transition-all',
                                                        doc
                                                            ? 'border-black/[0.08] bg-white dark:border-white/[0.08] dark:bg-black/40'
                                                            : 'border-black/[0.03] bg-black/[0.01] dark:border-white/[0.03] dark:bg-white/[0.01]',
                                                    )}
                                                >
                                                    <div className="min-w-0 pr-4">
                                                        <div className="mb-2 truncate text-[10px] leading-tight font-black tracking-tight text-black uppercase dark:text-white">
                                                            {type.replace(/_/g, ' ')}
                                                        </div>
                                                        <div className="truncate font-mono text-[9px] font-bold tracking-tighter text-black/30 uppercase italic dark:text-white/30">
                                                            {doc ? doc.document_name : 'Status: Waiting for upload'}
                                                        </div>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        {doc ? (
                                                            <>
                                                                <Button
                                                                    size="icon"
                                                                    variant="outline"
                                                                    onClick={() => window.open(doc.file_url, '_blank')}
                                                                    className="h-10 w-10 rounded-xl active:scale-95"
                                                                >
                                                                    <FileText size={16} />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                        setDocToDelete(doc.id);
                                                                        setIsDeleteDocOpen(true);
                                                                    }}
                                                                    className="h-10 w-10 rounded-xl text-black/20 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-95 dark:text-white/20 dark:hover:bg-rose-950/20"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <Button
                                                                size="icon"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    docForm.setData('document_type', type);
                                                                    setIsUploadModalOpen(true);
                                                                }}
                                                                className="h-10 w-10 rounded-xl bg-black/[0.03] active:scale-95 dark:bg-white/[0.03]"
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
                </div>
            </div>

            {/* Modals */}
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent className="rounded-2xl border border-black/[0.1] bg-white p-8 shadow-2xl sm:max-w-[450px] dark:border-white/[0.1] dark:bg-black">
                    <DialogTitle className="mb-8 border-b border-black/[0.05] pb-4 text-[12px] font-black tracking-[0.2em] text-black uppercase dark:border-white/[0.05] dark:text-white">
                        Upload Berkas: {docForm.data.document_type.replace(/_/g, ' ')}
                    </DialogTitle>
                    <form onSubmit={handleUploadDoc} className="space-y-8">
                        <div className="space-y-3">
                            <Label className="ml-1 text-[10px] font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                Pilih File (PDF/JPG/PNG)
                            </Label>
                            <Input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => docForm.setData('document_file', e.target.files?.[0] || null)}
                                required
                                className="h-12 rounded-xl border-black/[0.08] bg-black/[0.03] px-4 pt-3 text-xs shadow-sm transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="ml-1 text-[10px] font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                Masa Berlaku (Opsional)
                            </Label>
                            <Input
                                type="date"
                                value={docForm.data.expires_at}
                                onChange={(e) => docForm.setData('expires_at', e.target.value)}
                                className="h-12 rounded-xl border-black/[0.08] bg-black/[0.03] px-4 text-xs shadow-sm transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                            />
                        </div>
                        <DialogFooter className="pt-6">
                            <Button variant="primary" type="submit" disabled={docForm.processing} className="h-12 w-full shadow-xl active:scale-95">
                                <UploadCloud className="mr-2 h-4 w-4" /> Unggah Sekarang
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
        </ManagementForm>
    );
}
