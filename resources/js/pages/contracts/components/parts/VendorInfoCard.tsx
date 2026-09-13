import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Contract } from '@/pages/contracts/types';
import { Building2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import React, { useState } from 'react';

export function VendorInfoCard({ selected, isTabView = false }: { selected: Contract; isTabView?: boolean }) {
    const [minimized, setMinimized] = useState(false);
    const vendor = (selected as any)?.vendor || {};
    const detail = (vendor?.vendor_detail || vendor?.detail || {}) as Record<string, any>;
    const tax = (detail.tax || {}) as Record<string, any>;
    const legality = (detail.legality || {}) as Record<string, any>;
    const bankList = (Array.isArray(detail.bank) ? detail.bank : []) as Record<string, any>[];
    const paymentMethods = (Array.isArray(detail.paymentMethod) ? detail.paymentMethod : []) as Record<string, any>[];
    const businessFields = (Array.isArray(detail.businessFields) ? detail.businessFields : []) as Record<string, any>[];

    const vendorName = vendor?.name || vendor?.vendor_name || detail?.name || selected.metadata?.meta_p2_entity || 'Nama Vendor Tidak Tersedia';
    const picName = vendor?.pic_name || detail?.pic || selected.metadata?.meta_p2_signer || '—';
    const picPosition = vendor?.pic_position || detail?.pic_position || detail?.jobTitle || selected.metadata?.meta_p2_signer_position || '—';
    const address = vendor?.address || detail?.address || selected.metadata?.meta_p2_alamat || '—';
    const vendorCode = vendor?.vendor_code || detail?.registrationNumber || '-';

    const renderDocRow = (label: string, value: any, isFile = false) => {
        let display: React.ReactNode = '-';
        const hasValue = value !== null && value !== undefined && value !== '';

        if (hasValue) {
            if (typeof value === 'boolean') {
                display = value ? 'Ya' : 'Tidak';
            } else if (Array.isArray(value)) {
                display = value.length > 0 ? value.join(', ') : '-';
            } else if (isFile || (typeof value === 'string' && (/\.(pdf|png|jpe?g|webp|gif|svg|docx?|xlsx?|pptx?|zip|rar)$/i.test(value) || value.includes('__')))) {
                const valStr = String(value).trim();
                display = (
                    <button
                        type="button"
                        onClick={() => {
                            const fileUrl = valStr.startsWith('http') || valStr.startsWith('/')
                                ? valStr
                                : `/admin/core/vendors/file-download?fileName=${encodeURIComponent(valStr)}`;
                            window.open(fileUrl, '_blank');
                        }}
                        className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline hover:no-underline transition-all cursor-pointer text-left"
                        title="Klik untuk membuka/preview berkas"
                    >
                        <span className="break-all">{valStr.split('/').pop()?.split('__').pop() || valStr}</span>
                        <ExternalLink size={12} className="shrink-0" />
                    </button>
                );
            } else {
                display = String(value);
            }
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-border/50 text-xs font-sans">
                <span className="text-muted-foreground font-medium">{label}</span>
                <span className="sm:col-span-2 text-foreground break-words">{display}</span>
            </div>
        );
    };

    const fullDocumentContent = (
        <div className="p-6 space-y-6">
            {/* Section 1: Informasi Umum */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1">
                    I. Informasi Umum Vendor
                </h3>
                <div>
                    {renderDocRow('Nama Vendor / Perusahaan', vendorName)}
                    {renderDocRow('Kode Vendor / No. Registrasi', vendorCode)}
                    {renderDocRow('Bentuk Badan Usaha', detail.vendorType)}
                    {renderDocRow('Status Usaha', detail.businessStatus)}
                    {renderDocRow('Status Kepemilikan', detail.ownership)}
                    {renderDocRow('Sektor Bisnis', detail.businessSector)}
                    {renderDocRow('Kategori Vendor', detail.vendorCategory)}
                    {renderDocRow('Website Resmi', detail.website)}
                </div>
            </div>

            {/* Section 2: Alamat & Domisili */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1">
                    II. Alamat & Domisili Kantor
                </h3>
                <div>
                    {renderDocRow('Alamat Kantor', address)}
                    {renderDocRow('Provinsi', detail.province)}
                    {renderDocRow('Kota / Kabupaten', detail.city)}
                    {renderDocRow('Kecamatan', detail.district)}
                    {renderDocRow('Kelurahan', detail.subDistrict)}
                    {renderDocRow('Kode Pos', detail.postalCode)}
                </div>
            </div>

            {/* Section 3: Kontak & PIC */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1">
                    III. Informasi Kontak & Person in Charge (PIC)
                </h3>
                <div>
                    {renderDocRow('Email Perusahaan', detail.companyEmail)}
                    {renderDocRow('No. Telepon Perusahaan', detail.companyPhone)}
                    {renderDocRow('Fax Perusahaan', detail.companyFax)}
                    {renderDocRow('Email Bagian Keuangan', detail.financeEmail)}
                    {renderDocRow('Email Bagian Perpajakan', detail.taxEmail)}
                    {renderDocRow('Nama PIC', detail.pic || picName)}
                    {renderDocRow('Jabatan PIC', picPosition)}
                    {renderDocRow('Email PIC', detail.picemail)}
                    {renderDocRow('No. HP / Telepon PIC', detail.picphone)}
                </div>
            </div>

            {/* Section 4: Perpajakan */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1">
                    IV. Data Perpajakan
                </h3>
                <div>
                    {renderDocRow('Status NPWP', tax.typeNpwp)}
                    {renderDocRow('Nomor NPWP', tax.npwp)}
                    {renderDocRow('Status PKP', tax.typePkp)}
                    {renderDocRow('Nomor PKP', tax.pkp)}
                    {renderDocRow('Kategori BKP', tax.typeBkp)}
                    {renderDocRow('Tarif PPN', tax.ppn ? `${tax.ppn}%` : null)}
                    {renderDocRow('Deskripsi BKP', tax.bkpDesc)}
                    {renderDocRow('Deskripsi JKP', tax.jkpDesc)}
                    {renderDocRow('Organisasi', tax.isOrganization)}
                    {renderDocRow('SIUJK', tax.isSiujk)}
                    {renderDocRow('Nomor PP23', tax.pp23number)}
                    {renderDocRow('Masa Berlaku PP23', tax.pp23expiredDate)}
                </div>
            </div>

            {/* Section 5: Bidang Usaha & Bank */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1">
                        V. Bidang Usaha
                    </h3>
                    <div className="space-y-2 font-sans">
                        <p className="text-xs font-medium text-muted-foreground">Lokal:</p>
                        <ul className="list-disc list-inside text-xs text-foreground space-y-1">
                            {businessFields.length > 0 ? businessFields.map((bf, idx) => (
                                <li key={idx}>{bf.businessField}</li>
                            )) : <li>-</li>}
                        </ul>
                        {detail.businessFieldsForeign && (
                            <div className="pt-2 border-t border-border">
                                <p className="text-xs font-medium text-muted-foreground">Asing:</p>
                                <p className="text-xs text-foreground">{detail.businessFieldsForeign}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1">
                        VI. Perbankan & Pembayaran
                    </h3>
                    <div className="space-y-2 font-sans">
                        <div>
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Rekening Bank</p>
                            {bankList.length > 0 ? bankList.map((b, idx) => (
                                <div key={idx} className="text-xs border-b border-border/60 py-1 last:border-none">
                                    <p className="font-semibold text-foreground">{b.bankName}</p>
                                    <p className="text-muted-foreground">No. Rek: <span className="font-mono font-semibold text-foreground">{b.accountNumber}</span> a/n {b.accountName}</p>
                                </div>
                            )) : <p className="text-xs text-muted-foreground">-</p>}
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Metode Pembayaran</p>
                            {paymentMethods.length > 0 ? paymentMethods.map((p, idx) => (
                                <p key={idx} className="text-xs text-foreground">
                                    TOP: <strong>{p.top ?? '-'} hari</strong> | Full Payment: <strong>{p.fullPayment ?? '-'}%</strong>
                                </p>
                            )) : <p className="text-xs text-muted-foreground">-</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 6: Legalitas & Perizinan */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1">
                    VII. Perizinan Legalitas
                </h3>
                <div>
                    {renderDocRow('Nomor Induk Berusaha (NIB)', legality.nib)}
                    {renderDocRow('Tgl Kadaluarsa NIB', legality.nibexpiredDate)}
                    {renderDocRow('Izin Usaha (Business Permit)', legality.businessPermit)}
                    {renderDocRow('SIUP', legality.siup)}
                    {renderDocRow('Tgl Kadaluarsa SIUP', legality.siupexpiredDate)}
                    {renderDocRow('TDP', legality.tdp)}
                    {renderDocRow('Tgl Kadaluarsa TDP', legality.tdpexpiredDate)}
                    {renderDocRow('Penandatangan Resmi', legality.signing)}
                    {renderDocRow('Jabatan Penandatangan', legality.jobTitle)}
                    {renderDocRow('Akta Pendirian', legality.memorandumOfAssociation)}
                    {renderDocRow('Surat Keputusan Menkumham', legality.decissionLetterMenkumham)}
                </div>
            </div>

            {/* Section 7: Berkas & Lampiran Dokumen */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1">
                    VIII. Berkas & Lampiran Dokumen
                </h3>
                <div>
                    {renderDocRow('File KTP (ID Card File)', detail.idCardFile, true)}
                    {renderDocRow('File Master Agreement', detail.masterAgreementAttachment, true)}
                    {renderDocRow('File Profile Perusahaan', detail.companyProfileAttachment, true)}
                    {renderDocRow('File Single Vendor', detail.singleVendorFile, true)}
                    {renderDocRow('File Compliance', detail.complianceFile, true)}
                    {renderDocRow('Lampiran NIB', legality.nibattachment, true)}
                    {renderDocRow('Lampiran Izin Usaha', legality.businessPermitAttachment, true)}
                    {renderDocRow('Lampiran SIUP', legality.siupattachment, true)}
                    {renderDocRow('Lampiran TDP', legality.tdpattachment, true)}
                    {renderDocRow('Lampiran Akta Pendirian', legality.memorandumOfAssociationAttachment, true)}
                    {renderDocRow('Lampiran SK Menkumham', legality.decissionLetterMenkumhamAttachment, true)}
                    {renderDocRow('Lampiran Akta Perubahan', legality.memorandumOfAssociationChangingAttachment, true)}
                    {renderDocRow('Lampiran SK Menkumham Perubahan', legality.decissionLetterMenkumhamChangingAttachment, true)}
                    {renderDocRow('Lampiran Spesimen Tanda Tangan', legality.signingAttachment, true)}
                    {renderDocRow('Lampiran Pendaftaran Perusahaan', legality.companyRegistrationAttachment, true)}
                    {renderDocRow('Lampiran Surat Domisili', legality.domicileAttachment, true)}
                    {renderDocRow('Lampiran Lisensi Usaha', legality.businessLicenceFile, true)}
                    {renderDocRow('Lampiran BKPM', legality.investmentCoorBoardFile, true)}
                    {renderDocRow('Lampiran Surat Keagenan', legality.agencyLetterFile, true)}
                    {renderDocRow('Lampiran Dokumen Lainnya', legality.otherAttachment, true)}
                    {renderDocRow('Lampiran NPWP', tax.npwpfile, true)}
                    {renderDocRow('Lampiran SK PKP', tax.skpkpfile, true)}
                    {renderDocRow('Lampiran JKP', tax.jkpfile, true)}
                    {renderDocRow('Lampiran PP23', tax.pp23attachment, true)}
                </div>
            </div>
        </div>
    );

    if (isTabView) {
        return (
            <div className="flex flex-col flex-1 p-3 lg:p-4 gap-3 h-full min-h-0">
                <div className="bg-primary text-primary-foreground flex h-9.5 min-h-[38px] max-h-[38px] shrink-0 items-center justify-between px-4 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-tight text-primary-foreground">
                        <Building2 size={15} className="text-primary-foreground/90" /> Detail Profil & Dokumen Legalitas Vendor
                    </div>
                    {vendor?.id && (
                        <a
                            href={`/admin/core/vendors/${vendor.id}/document`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 px-2.5 py-1 text-[11px] font-medium text-white transition-all active:scale-95 cursor-pointer"
                            title="Buka di Halaman Baru"
                        >
                            <span>Buka di Tab Baru</span>
                            <ExternalLink size={13} />
                        </a>
                    )}
                </div>
                <Card className="flex-1 overflow-y-auto custom-scrollbar border-border/80">
                    {fullDocumentContent}
                </Card>
            </div>
        );
    }

    return (
        <Card className="border-border/80 shadow-xs">
            <CardHeader className="p-3 bg-primary text-primary-foreground flex flex-row items-center justify-between rounded-t-lg space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-tight text-primary-foreground flex items-center gap-2">
                    <Building2 size={15} className="text-primary-foreground/90" /> Detail Profil & Legalitas Vendor
                </CardTitle>
                <div className="flex items-center gap-1.5">
                    {vendor?.id && (
                        <a
                            href={`/admin/core/vendors/${vendor.id}/document`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/15 hover:bg-white/25 text-white border border-white/20 h-6 px-2 flex items-center gap-1 rounded-md text-[10px] font-medium transition-all active:scale-95 cursor-pointer"
                            title="Buka di Tab Baru"
                        >
                            <span>Dokumen</span>
                            <ExternalLink size={11} />
                        </a>
                    )}
                    <button
                        type="button"
                        onClick={() => setMinimized(!minimized)}
                        className="bg-white/15 hover:bg-white/25 text-white border border-white/20 h-6 w-6 flex items-center justify-center rounded-md transition-all active:scale-95 cursor-pointer"
                    >
                        {minimized ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                    </button>
                </div>
            </CardHeader>

            {!minimized && (
                <CardContent className="p-0 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {fullDocumentContent}
                </CardContent>
            )}
        </Card>
    );
}
