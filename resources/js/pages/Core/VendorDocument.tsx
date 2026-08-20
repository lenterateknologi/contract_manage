import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Building2, FileText, ExternalLink } from 'lucide-react';

interface VendorDocumentProps {
    vendor: Record<string, any>;
}

export default function VendorDocument({ vendor }: VendorDocumentProps) {
    const r = vendor || {};
    const detail = (r.vendor_detail || {}) as Record<string, any>;
    const tax = (detail.tax || {}) as Record<string, any>;
    const legality = (detail.legality || {}) as Record<string, any>;
    const bankList = (Array.isArray(detail.bank) ? detail.bank : []) as Record<string, any>[];
    const paymentMethods = (Array.isArray(detail.paymentMethod) ? detail.paymentMethod : []) as Record<string, any>[];
    const businessFields = (Array.isArray(detail.businessFields) ? detail.businessFields : []) as Record<string, any>[];

    const renderDocRow = (label: string, value: any, isFile = false) => {
        let display: React.ReactNode = '-';
        const hasValue = value !== null && value !== undefined && value !== '';

        if (hasValue) {
            if (typeof value === 'boolean') {
                display = value ? 'Ya' : 'Tidak';
            } else if (Array.isArray(value)) {
                display = value.length > 0 ? value.join(', ') : '-';
            } else if (isFile || (typeof value === 'string' && (value.includes('.pdf') || value.includes('.doc') || value.includes('.png') || value.includes('.jpg') || value.includes('.jpeg')))) {
                const valStr = String(value);
                display = (
                    <button
                        type="button"
                        onClick={() => {
                            const fileUrl = valStr.startsWith('http') || valStr.startsWith('/') 
                                ? valStr 
                                : `/storage/${valStr}`;
                            window.open(fileUrl, '_blank');
                        }}
                        className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline hover:no-underline transition-all cursor-pointer text-left"
                        title="Klik untuk membuka/preview dokumen"
                    >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>{valStr}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                    </button>
                );
            } else {
                display = String(value);
            }
        }

        return (
            <div key={label} className="py-2.5 grid grid-cols-3 gap-4 border-b border-slate-200/80 dark:border-slate-800/80 last:border-none text-xs font-sans">
                <span className="font-semibold text-slate-500 dark:text-slate-400">{label}</span>
                <span className="col-span-2 font-normal text-slate-900 dark:text-slate-100 break-words">{display}</span>
            </div>
        );
    };

    return (
        <>
            <Head title={`Dokumen Vendor - ${r.vendor_name || detail.name || 'Vendor'}`} />

            <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 p-4 md:p-8 flex flex-col items-center w-full">
                {/* Header Action Bar */}
                <div className="w-full max-w-4xl mb-4 flex items-center justify-between no-print px-1">
                    <button
                        type="button"
                        onClick={() => window.close()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                        <ArrowLeft size={14} />
                        <span>Tutup Halaman</span>
                    </button>
                    <div className="text-xs font-medium text-slate-500">
                        Dokumen Resmi Profil Vendor
                    </div>
                </div>

                {/* Flat Paper View Container */}
                <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 md:p-12 space-y-8 text-slate-900 dark:text-slate-100">
                    
                    {/* Document Header / Kop Resmi */}
                    <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-5">
                        <div className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-sans">
                            <Building2 className="w-4 h-4 text-primary" /> Dokumen Rekanan Master (Vendor Profile)
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-sans">
                            {r.vendor_name || detail.name || 'Nama Vendor Tidak Tersedia'}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                            KODE VENDOR: <strong className="text-slate-800 dark:text-slate-200">{r.vendor_code || detail.registrationNumber || '-'}</strong>
                        </p>
                    </div>

                    {/* Section 1: Profil & Identitas Perusahaan */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1 font-sans">
                            I. Profil & Identitas Rekanan
                        </h3>
                        <div>
                            {renderDocRow('Nama Resmi', detail.name || r.vendor_name)}
                            {renderDocRow('Tipe Bentuk Usaha', detail.businessTypeName)}
                            {renderDocRow('Nama Cabang', detail.branchName)}
                            {renderDocRow('Nomor Registrasi', detail.registrationNumber)}
                            {renderDocRow('Nomor Perjanjian', detail.agreementNumber)}
                            {renderDocRow('Tanggal Perjanjian', detail.agreementDate)}
                            {renderDocRow('Tanggal Disetujui', detail.approvedDate)}
                            {renderDocRow('Total Karyawan', detail.totalEmployees)}
                            {renderDocRow('Cakupan Wilayah (Coverage Area)', detail.coverageArea)}
                            {renderDocRow('Compliance Level', detail.complianceLevel)}
                            {renderDocRow('Integrity Pact', detail.integrityPact)}
                            {renderDocRow('Master Agreement', detail.masterAgreement)}
                            {renderDocRow('Single Vendor', detail.isSingleVendor)}
                        </div>
                    </div>

                    {/* Section 2: Alamat & Lokasi Operasional */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1 font-sans">
                            II. Alamat & Kontak Resmi
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-sans">Alamat Utama</h4>
                                {renderDocRow('Alamat', detail.address)}
                                {renderDocRow('Kota', detail.city)}
                                {renderDocRow('Provinsi', detail.region)}
                                {renderDocRow('Negara', detail.country)}
                                {renderDocRow('Kode Pos', detail.postalCode)}
                            </div>
                            <div>
                                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-sans">Alamat Surat Menyurat</h4>
                                {renderDocRow('Alamat Surat', detail.mailingAddress)}
                                {renderDocRow('Kota Surat', detail.mailingCity)}
                                {renderDocRow('Provinsi Surat', detail.mailingRegion)}
                                {renderDocRow('Negara Surat', detail.mailingCountry)}
                                {renderDocRow('Kode Pos Surat', detail.mailingPostalCode)}
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Kontak & Penanggung Jawab (PIC) */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1 font-sans">
                            III. Informasi Kontak & Person in Charge (PIC)
                        </h3>
                        <div>
                            {renderDocRow('Email Perusahaan', detail.companyEmail)}
                            {renderDocRow('No. Telepon Perusahaan', detail.companyPhone)}
                            {renderDocRow('Fax Perusahaan', detail.companyFax)}
                            {renderDocRow('Email Bagian Keuangan', detail.financeEmail)}
                            {renderDocRow('Email Bagian Perpajakan', detail.taxEmail)}
                            {renderDocRow('Nama PIC', detail.pic)}
                            {renderDocRow('Email PIC', detail.picemail)}
                            {renderDocRow('No. HP / Telepon PIC', detail.picphone)}
                        </div>
                    </div>

                    {/* Section 4: Perpajakan */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1 font-sans">
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
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1 font-sans">
                                V. Bidang Usaha
                            </h3>
                            <div className="space-y-2 font-sans">
                                <p className="text-xs font-medium text-slate-500">Lokal:</p>
                                <ul className="list-disc list-inside text-xs text-slate-800 dark:text-slate-200 space-y-1">
                                    {businessFields.length > 0 ? businessFields.map((bf, idx) => (
                                        <li key={idx}>{bf.businessField}</li>
                                    )) : <li>-</li>}
                                </ul>
                                {detail.businessFieldsForeign && (
                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                                        <p className="text-xs font-medium text-slate-500">Asing:</p>
                                        <p className="text-xs text-slate-800 dark:text-slate-200">{detail.businessFieldsForeign}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1 font-sans">
                                VI. Perbankan & Pembayaran
                            </h3>
                            <div className="space-y-2 font-sans">
                                <div>
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Rekening Bank</p>
                                    {bankList.length > 0 ? bankList.map((b, idx) => (
                                        <div key={idx} className="text-xs border-b border-slate-200/60 dark:border-slate-800/60 py-1 last:border-none">
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">{b.bankName}</p>
                                            <p className="text-slate-600 dark:text-slate-400">No. Rek: <span className="font-mono font-semibold">{b.accountNumber}</span> a/n {b.accountName}</p>
                                        </div>
                                    )) : <p className="text-xs text-slate-500">-</p>}
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Metode Pembayaran</p>
                                    {paymentMethods.length > 0 ? paymentMethods.map((p, idx) => (
                                        <p key={idx} className="text-xs text-slate-700 dark:text-slate-300">
                                            TOP: <strong>{p.top ?? '-'} hari</strong> | Full Payment: <strong>{p.fullPayment ?? '-'}%</strong>
                                        </p>
                                    )) : <p className="text-xs text-slate-500">-</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 6: Legalitas & Berkas */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1 font-sans">
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

                    {/* Section 7: File Lampiran & Berkas Dokumen */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1 font-sans">
                            VIII. Berkas & Lampiran Dokumen
                        </h3>
                        <div>
                            {/* Lampiran Umum */}
                            {renderDocRow('File KTP (ID Card File)', detail.idCardFile)}
                            {renderDocRow('File Master Agreement', detail.masterAgreementAttachment)}
                            {renderDocRow('File Profile Perusahaan', detail.companyProfileAttachment)}
                            {renderDocRow('File Single Vendor', detail.singleVendorFile)}
                            {renderDocRow('File Compliance', detail.complianceFile)}
                            
                            {/* Lampiran Legalitas */}
                            {renderDocRow('Lampiran NIB', legality.nibattachment)}
                            {renderDocRow('Lampiran Izin Usaha', legality.businessPermitAttachment)}
                            {renderDocRow('Lampiran SIUP', legality.siupattachment)}
                            {renderDocRow('Lampiran TDP', legality.tdpattachment)}
                            {renderDocRow('Lampiran Akta Pendirian', legality.memorandumOfAssociationAttachment)}
                            {renderDocRow('Lampiran SK Menkumham', legality.decissionLetterMenkumhamAttachment)}
                            {renderDocRow('Lampiran Akta Perubahan', legality.memorandumOfAssociationChangingAttachment)}
                            {renderDocRow('Lampiran SK Menkumham Perubahan', legality.decissionLetterMenkumhamChangingAttachment)}
                            {renderDocRow('Lampiran Spesimen Tanda Tangan', legality.signingAttachment)}
                            {renderDocRow('Lampiran Pendaftaran Perusahaan', legality.companyRegistrationAttachment)}
                            {renderDocRow('Lampiran Surat Domisili', legality.domicileAttachment)}
                            {renderDocRow('Lampiran Lisensi Usaha', legality.businessLicenceFile)}
                            {renderDocRow('Lampiran BKPM', legality.investmentCoorBoardFile)}
                            {renderDocRow('Lampiran Surat Keagenan', legality.agencyLetterFile)}
                            {renderDocRow('Lampiran Dokumen Lainnya', legality.otherAttachment)}

                            {/* Lampiran Pajak */}
                            {renderDocRow('Lampiran NPWP', tax.npwpfile)}
                            {renderDocRow('Lampiran SK PKP', tax.skpkpfile)}
                            {renderDocRow('Lampiran JKP', tax.jkpfile)}
                            {renderDocRow('Lampiran PP23', tax.pp23attachment)}
                        </div>
                    </div>

                    {/* Document Footer */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-400 font-sans">
                        <span>Dicetak dari Sistem Manajemen Kontrak</span>
                        <span>Master Data Synchronized from COMA</span>
                    </div>

                </div>
            </div>
        </>
    );
}

// ponytail: dedicated page layout for standalone vendor document preview without admin sidebar
VendorDocument.layout = (page: React.ReactNode) => <>{page}</>;
