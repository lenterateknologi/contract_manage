import React, { FormEvent, useRef, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, ShieldCheck, Trash2, UploadCloud, Save, ChevronLeft } from 'lucide-react';
import { useToast } from '@/components/contracts/Toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ManagementForm, FormSection, FormDangerZone } from '@/components/admin/ManagementForm';

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
            onError: () => showToast('Gagal Simpan', 'danger')
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
            forceFormData: true, preserveScroll: true,
            onSuccess: () => {
                setIsUploadModalOpen(false); docForm.reset();
                showToast('Terunggah', 'success');
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        });
    };

    const confirmDeleteDoc = () => {
        if (!vendor || !docToDelete) return;
        router.delete(route('admin.vendors.documents.destroy', { vendor: vendor.id, document: docToDelete }), {
            preserveScroll: true,
            onSuccess: () => { setIsDeleteDocOpen(false); setDocToDelete(null); showToast('Dihapus', 'success'); }
        });
    };

    const docCats = [
        { l: 'Legalitas Utama', it: ['NPWP','NIB','SIUP','TDP','SPPKP','SK_KEMENKUMHAM'] },
        { l: 'Dokumen Notaril', it: ['AKTA_PENDIRIAN','AKTA_PERUBAHAN'] },
        { l: 'Lainnya', it: ['REKENING_KORAN','COMPANY_PROFILE','KTP_DIREKTUR','OTHER'] }
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
            <Head title={isEdit ? `Vendor: ${vendor.name}` : "Registrasi Vendor"} />

            <div className="space-y-12">
                {/* Unified Identitas & Status Section */}
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
                    <div className="lg:col-span-8 space-y-10">
                        {/* Section 1: Identitas Dasar */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-600 uppercase">Identitas Entitas</h3>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox id="v-ind" checked={data.is_individual} onCheckedChange={(c)=>setData('is_individual',!!c)} className="w-3.5 h-3.5 rounded-none border-slate-400" />
                                        <Label htmlFor="v-ind" className="text-[9px] font-black uppercase cursor-pointer text-slate-500">INDIVIDU / PERORANGAN</Label>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">Internal Vendor Code</Label>
                                    <Input value={data.code} onChange={(e)=>setData('code',e.target.value)} placeholder="AUTO-GENERATE" className="h-10 rounded-none border-slate-200 bg-slate-50/30 px-4 text-xs font-black tracking-tight uppercase focus-visible:ring-0 focus-visible:border-black transition-colors" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">Kategori Operasional</Label>
                                    <Select value={data.category} onValueChange={(v)=>setData('category',v)}>
                                        <SelectTrigger className="h-10 rounded-none border-slate-200 px-4 text-xs font-black uppercase tracking-tight focus:ring-0">
                                            <SelectValue placeholder="PILIH KATEGORI..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-none border-black">
                                            {['Supplier','Consultant','Contractor','Maintenance','IT Services','Logistics'].map(c=><SelectItem key={c} value={c.toUpperCase()} className="text-[11px] font-bold uppercase">{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <Label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">Nama Resmi Entitas / Perusahaan</Label>
                                    <div className="flex">
                                        <div className="flex h-10 items-center justify-center bg-black px-4 text-[10px] font-black text-white uppercase tracking-widest border-y border-l border-black shrink-0">
                                            {data.company_type || 'PT/CV'}
                                        </div>
                                        <Input value={data.name} onChange={(e)=>setData('name',e.target.value)} className="h-10 rounded-none border-slate-200 px-4 text-xs font-black tracking-tight uppercase focus-visible:ring-0 focus-visible:border-black transition-colors w-full" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">Alamat Email Korespondensi</Label>
                                    <Input value={data.email} onChange={(e)=>setData('email',e.target.value)} className="h-10 rounded-none border-slate-200 px-4 text-xs font-medium focus-visible:ring-0 focus-visible:border-black transition-colors" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">Nomor Telepon Kantor</Label>
                                    <Input value={data.phone} onChange={(e)=>setData('phone',e.target.value)} className="h-10 rounded-none border-slate-200 px-4 text-xs font-mono font-bold focus-visible:ring-0 focus-visible:border-black transition-colors" />
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <Label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">Alamat Domisili Sesuai Dokumen</Label>
                                    <Input value={data.address} onChange={(e)=>setData('address',e.target.value)} className="h-10 rounded-none border-slate-200 px-4 text-xs font-medium focus-visible:ring-0 focus-visible:border-black transition-colors" />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Person in Charge */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-600 uppercase border-b border-slate-200 pb-2">Person in Charge / Representatif</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">Nama Lengkap PIC</Label>
                                    <Input value={data.pic_name} onChange={(e)=>setData('pic_name',e.target.value)} className="h-10 rounded-none border-slate-200 px-4 text-xs font-black tracking-tight uppercase" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">Jabatan PIC</Label>
                                    <Input value={data.pic_position} onChange={(e)=>setData('pic_position',e.target.value)} className="h-10 rounded-none border-slate-200 px-4 text-xs font-black tracking-tight uppercase" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Status & Quick Info */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="border border-slate-200 p-6 bg-slate-50/50">
                            <div className="flex items-center gap-2 mb-6">
                                <ShieldCheck size={16} className="text-slate-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Parameter Status</span>
                            </div>
                            
                            <div className="flex items-center gap-3 p-4 border border-slate-200 bg-white mb-6">
                                <Checkbox 
                                    id="v-active" 
                                    checked={data.is_active} 
                                    onCheckedChange={(c)=>setData('is_active',!!c)} 
                                    className="w-5 h-5 rounded-none border-black data-[state=checked]:bg-black data-[state=checked]:text-white" 
                                />
                                <div className="flex flex-col">
                                    <Label htmlFor="v-active" className="text-[11px] font-black cursor-pointer uppercase leading-none mb-1 text-slate-900">VERIFIKASI AKTIF</Label>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">SIAP UNTUK TRANSAKSI KONTRAK</span>
                                </div>
                            </div>

                            <div className="space-y-4 border-t border-slate-200 border-dashed pt-6 mt-6">
                                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    <span>Audit Score</span>
                                    <span className="text-black">{Math.round(((vendor?.documents?.length || 0) / 10) * 100)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 rounded-none overflow-hidden">
                                     <div 
                                        className="h-full bg-black transition-all duration-500" 
                                        style={{ width: `${Math.min(100, ((vendor?.documents?.length || 0) / 10) * 100)}%` }} 
                                    />
                                </div>
                                <p className="text-[8px] font-bold text-slate-400 uppercase leading-relaxed tracking-tight italic">
                                    Kelengkapan dokumen legalitas sangat menentukan skor kualifikasi vendor dalam proses tender dan penunjukan langsung.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Legal & Banking Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 border-t border-slate-100 pt-10">
                    <div className="space-y-8">
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-600 uppercase border-b border-slate-200 pb-2">Informasi Perpajakan & Legal</h3>
                        <div className="space-y-6">
                            <div className="space-y-1.5"><Label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">Nomor Pokok Wajib Pajak (NPWP)</Label><Input value={data.npwp} onChange={(e)=>setData('npwp',e.target.value)} className="h-10 rounded-none border-slate-200 px-4 text-xs font-mono font-bold tracking-widest uppercase" /></div>
                            <div className="space-y-1.5"><Label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">Nomor Induk Berusaha (NIB)</Label><Input value={data.nib} onChange={(e)=>setData('nib',e.target.value)} className="h-10 rounded-none border-slate-200 px-4 text-xs font-mono font-bold tracking-widest uppercase" /></div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1.5"><Label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">SIUP / Izin Usaha</Label><Input value={data.siup} onChange={(e)=>setData('siup',e.target.value)} className="h-10 rounded-none border-slate-200 px-4 text-xs font-black tracking-tight" /></div>
                                <div className="space-y-1.5"><Label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">Direktur Utama</Label><Input value={data.director_name} onChange={(e)=>setData('director_name',e.target.value)} className="h-10 rounded-none border-slate-200 px-4 text-xs font-black tracking-tight uppercase" /></div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-600 uppercase border-b border-slate-200 pb-2">Sistem Pembayaran / Perbankan</h3>
                        <div className="space-y-6">
                            <div className="space-y-1.5"><Label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">Institusi Perbankan</Label><Input value={data.bank_name} onChange={(e)=>setData('bank_name',e.target.value)} className="h-10 rounded-none border-slate-200 px-4 text-xs font-black tracking-tight uppercase" /></div>
                            <div className="space-y-1.5"><Label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">Nomor Rekening Operasional</Label><Input value={data.bank_account_no} onChange={(e)=>setData('bank_account_no',e.target.value)} className="h-10 rounded-none border-slate-200 px-4 text-xs font-mono font-black tracking-[0.15em]" /></div>
                            <div className="space-y-1.5"><Label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">Nama Pemegang Rekening</Label><Input value={data.bank_account_name} onChange={(e)=>setData('bank_account_name',e.target.value)} className="h-10 rounded-none border-slate-200 px-4 text-xs font-black tracking-tight uppercase" /></div>
                        </div>
                    </div>
                </div>

                {/* Documents Audit Section */}
                <div className="space-y-8 pt-10 border-t border-slate-100 pb-24">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-600 uppercase leading-none">Audit Dokumen Compliance</h3>
                    </div>
                    
                    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10", !isEdit && "opacity-25 grayscale pointer-events-none")}>
                        {!isEdit && (
                            <div className="lg:col-span-3 py-16 text-center border-2 border-dashed border-slate-200">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Simpan Profil Vendor Terlebih Dahulu untuk Mengaktifkan Modul Dokumen</p>
                            </div>
                        )}
                        {isEdit && docCats.map(cat => (
                            <div key={cat.l} className="space-y-4">
                                <div className="text-[9px] font-black uppercase text-slate-600 tracking-widest pl-3 border-l-2 border-black">{cat.l}</div>
                                <div className="space-y-1.5">
                                    {cat.it.map(type => {
                                        const doc = vendor?.documents?.find((d:any)=>d.document_type === type);
                                        return (
                                            <div key={type} className={cn(
                                                "flex items-center justify-between p-3.5 border transition-all", 
                                                doc ? "border-slate-300 bg-white" : "border-slate-100 bg-slate-50/50"
                                            )}>
                                                <div className="min-w-0 pr-3">
                                                    <div className="text-[10px] font-black uppercase truncate text-slate-900 leading-tight mb-1">{type.replace(/_/g,' ')}</div>
                                                    <div className="text-[8px] font-black text-slate-400 uppercase truncate font-mono tracking-tighter italic">
                                                        {doc ? doc.document_name : 'Status: Waiting for upload'}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {doc ? (
                                                        <>
                                                            <Button size="icon" variant="ghost" onClick={()=>window.open(doc.file_url,'_blank')} className="h-8 w-8 rounded-none border border-transparent hover:border-black hover:bg-black hover:text-white transition-all">
                                                                <FileText size={14}/>
                                                            </Button>
                                                            <Button size="icon" variant="ghost" onClick={()=>{setDocToDelete(doc.id); setIsDeleteDocOpen(true);}} className="h-8 w-8 rounded-none text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all">
                                                                <Trash2 size={14}/>
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Button size="icon" variant="ghost" onClick={()=>{docForm.setData('document_type',type); setIsUploadModalOpen(true);}} className="h-8 w-8 rounded-none border border-slate-200 hover:bg-black hover:text-white transition-all shadow-sm">
                                                            <UploadCloud size={14}/>
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
                <DialogContent className="rounded-none sm:max-w-[400px] border-2 border-black">
                    <DialogTitle className="text-xs font-black uppercase tracking-widest border-b pb-2 mb-4">Upload Berkas: {docForm.data.document_type.replace(/_/g,' ')}</DialogTitle>
                    <form onSubmit={handleUploadDoc} className="space-y-6">
                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Pilih File (PDF/JPG)</Label><Input type="file" ref={fileInputRef} onChange={(e)=>docForm.setData('document_file',e.target.files?.[0]||null)} required className="rounded-none border-slate-300 text-xs h-10 pt-2" /></div>
                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Masa Berlaku (Opsional)</Label><Input type="date" value={docForm.data.expires_at} onChange={(e)=>docForm.setData('expires_at',e.target.value)} className="rounded-none border-slate-300 h-10 text-xs" /></div>
                        <DialogFooter className="pt-4"><Button type="submit" disabled={docForm.processing} className="w-full rounded-none bg-black text-white text-[11px] font-black uppercase h-10">Unggah Sekarang</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmationModal
                open={isDeleteDocOpen}
                onClose={() => setIsDeleteDocOpen(false)}
                onConfirm={confirmDeleteDoc}
                title="Hapus Dokumen?"
                description="Tindakan ini permanen. Dokumen akan dihapus dari server."
                processing={processing}
            />
        </ManagementForm>
    );
}
