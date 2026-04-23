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
            title={isEdit ? 'Profil Vendor' : 'Registrasi Vendor'}
            onClose={() => router.get(route('admin.vendors'))}
            onSave={handleSave}
            processing={processing}
            isDirty={isDirty}
            isEdit={isEdit}
        >
            <Head title={isEdit ? `Edit: ${vendor.name}` : "Vendor Baru"} />

            <div className="space-y-10">
                {/* Main Data & Status */}
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
                    <div className="lg:col-span-8">
                        <FormSection 
                            title="Identitas Entitas"
                            headerAction={
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox id="v-ind" checked={data.is_individual} onCheckedChange={(c)=>setData('is_individual',!!c)} className="w-3.5 h-3.5 rounded-none border-slate-400" />
                                    <Label htmlFor="v-ind" className="text-[10px] font-black uppercase cursor-pointer">Perorangan</Label>
                                </div>
                            }
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">Kode Vendor</Label><Input value={data.code} onChange={(e)=>setData('code',e.target.value)} className="h-9 text-[12px] border-slate-200 rounded-none bg-slate-50/20" /></div>
                                <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">Kategori</Label>
                                    <Select value={data.category} onValueChange={(v)=>setData('category',v)}>
                                        <SelectTrigger className="h-9 text-[12px] border-slate-200 rounded-none"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-none">{['Supplier','Consultant','Contractor','Maintenance'].map(c=><SelectItem key={c} value={c} className="text-[12px]">{c}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="md:col-span-2 space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">Nama Lengkap / Perusahaan</Label><Input value={data.name} onChange={(e)=>setData('name',e.target.value)} className="h-9 text-[12px] border-slate-200 rounded-none" /></div>
                                <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</Label><Input value={data.email} onChange={(e)=>setData('email',e.target.value)} className="h-9 text-[12px] border-slate-200 rounded-none" /></div>
                                <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">Telepon Kantor</Label><Input value={data.phone} onChange={(e)=>setData('phone',e.target.value)} className="h-9 text-[12px] border-slate-200 rounded-none" /></div>
                                <div className="md:col-span-2 space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">Alamat Domisili Lengkap</Label><Input value={data.address} onChange={(e)=>setData('address',e.target.value)} className="h-9 text-[12px] border-slate-200 rounded-none" /></div>
                                <div className="space-y-1 pt-4 md:pt-0"><Label className="text-[10px] font-black uppercase text-slate-900 border-l-2 border-black pl-2">Nama PIC</Label><Input value={data.pic_name} onChange={(e)=>setData('pic_name',e.target.value)} className="h-8 text-[12px] border-slate-300 rounded-none mt-1" /></div>
                                <div className="space-y-1 pt-4 md:pt-0"><Label className="text-[10px] font-black uppercase text-slate-900 border-l-2 border-black pl-2">Jabatan PIC</Label><Input value={data.pic_position} onChange={(e)=>setData('pic_position',e.target.value)} className="h-8 text-[12px] border-slate-300 rounded-none mt-1" /></div>
                            </div>
                        </FormSection>
                    </div>

                    <div className="lg:col-span-4 h-fit">
                        <FormDangerZone 
                            title="Master Status"
                            description="Status Aktif di Sistem Kontrak"
                        >
                            <div className="flex items-center gap-2.5">
                                <Checkbox id="v-active" checked={data.is_active} onCheckedChange={(c)=>setData('is_active',!!c)} className="w-5 h-5 rounded-none border-black data-[state=checked]:bg-black data-[state=checked]:text-white" />
                                <Label htmlFor="v-active" className="text-[11px] font-black cursor-pointer uppercase">VENDOR AKTIF</Label>
                            </div>
                        </FormDangerZone>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <FormSection title="Informasi Legalitas">
                        <div className="space-y-5">
                            <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">NPWP</Label><Input value={data.npwp} onChange={(e)=>setData('npwp',e.target.value)} className="h-9 text-[12px] border-slate-200 rounded-none font-mono" /></div>
                            <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">NIB</Label><Input value={data.nib} onChange={(e)=>setData('nib',e.target.value)} className="h-9 text-[12px] border-slate-200 rounded-none font-mono" /></div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">SIUP</Label><Input value={data.siup} onChange={(e)=>setData('siup',e.target.value)} className="h-9 text-[12px] border-slate-200 rounded-none" /></div>
                                <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">Direktur Utama</Label><Input value={data.director_name} onChange={(e)=>setData('director_name',e.target.value)} className="h-9 text-[12px] border-slate-200 rounded-none" /></div>
                            </div>
                        </div>
                    </FormSection>
                    <FormSection title="Detail Perbankan">
                        <div className="space-y-5">
                            <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">Nama Bank</Label><Input value={data.bank_name} onChange={(e)=>setData('bank_name',e.target.value)} className="h-9 text-[12px] border-slate-200 rounded-none" /></div>
                            <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">Nomor Rekening</Label><Input value={data.bank_account_no} onChange={(e)=>setData('bank_account_no',e.target.value)} className="h-9 text-[12px] border-slate-200 rounded-none font-mono" /></div>
                            <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-400 uppercase">Atas Nama</Label><Input value={data.bank_account_name} onChange={(e)=>setData('bank_account_name',e.target.value)} className="h-9 text-[12px] border-slate-200 rounded-none" /></div>
                        </div>
                    </FormSection>
                </div>

                <div className="space-y-6 pt-6 border-t border-slate-100 pb-24">
                    <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em]">Dokumen Lampiran Pendukung</h3>
                    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10", !isEdit && "opacity-25 grayscale pointer-events-none")}>
                        {docCats.map(cat => (
                            <div key={cat.l} className="space-y-3">
                                <div className="text-[10px] font-black uppercase text-black bg-slate-100 px-3 py-1.5 border-l-4 border-black">{cat.l}</div>
                                <div className="space-y-1.5">
                                    {cat.it.map(type => {
                                        const doc = vendor?.documents?.find((d:any)=>d.document_type === type);
                                        return (
                                            <div key={type} className={cn("flex items-center justify-between p-3 border", doc ? "border-slate-300 bg-white" : "border-slate-100 bg-slate-50")}>
                                                <div className="min-w-0 pr-2">
                                                    <div className="text-[11px] font-black uppercase truncate text-slate-900 leading-tight">{type.replace(/_/g,' ')}</div>
                                                    <div className="text-[9px] font-bold text-slate-500 uppercase truncate mt-0.5">{doc ? doc.document_name : 'Belum Ada'}</div>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {doc ? (
                                                        <><Button size="icon" variant="ghost" onClick={()=>window.open(doc.file_url,'_blank')} className="h-7 w-7 rounded-none border border-transparent hover:border-slate-200"><FileText size={14}/></Button>
                                                        <Button size="icon" variant="ghost" onClick={()=>{setDocToDelete(doc.id); setIsDeleteDocOpen(true);}} className="h-7 w-7 rounded-none hover:text-red-600"><Trash2 size={14}/></Button></>
                                                    ) : (
                                                        <Button size="icon" variant="ghost" onClick={()=>{docForm.setData('document_type',type); setIsUploadModalOpen(true);}} className="h-7 w-7 rounded-none border border-slate-200 hover:bg-black hover:text-white transition-colors"><UploadCloud size={14}/></Button>
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
