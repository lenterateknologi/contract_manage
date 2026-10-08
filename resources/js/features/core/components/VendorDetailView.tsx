import LucideIcons from '@/lib/lucide-dynamic';
import { ExternalLink } from 'lucide-react';
import React from 'react';

interface VendorDetailViewProps {
    record: any;
}

export function VendorDetailView({ record }: VendorDetailViewProps) {
    const r = record as Record<string, any>;
    const detail = (r?.vendor_detail || {}) as Record<string, any>;
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
            } else if (
                isFile ||
                (typeof value === 'string' &&
                    (/\.(pdf|png|jpe?g|jfif|webp|gif|svg|docx?|xlsx?|pptx?|zip|rar|txt|csv)$/i.test(value) ||
                        value.includes('__')))
            ) {
                const valStr = String(value);
                display = (
                    <button
                        type="button"
                        onClick={() => {
                            const fileUrl =
                                valStr.startsWith('http') || valStr.startsWith('/')
                                    ? valStr
                                    : `/admin/core/vendors/file-download?fileName=${encodeURIComponent(valStr)}`;
                            window.open(fileUrl, '_blank');
                        }}
                        className="inline-flex cursor-pointer items-center gap-1.5 text-left font-semibold text-blue-600 underline transition-all hover:text-blue-800 hover:no-underline dark:text-blue-400 dark:hover:text-blue-300"
                        title="Klik untuk membuka/preview dokumen"
                    >
                        <LucideIcons.FileText className="h-3.5 w-3.5 shrink-0" />
                        <span>{valStr}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                    </button>
                );
            } else {
                display = String(value);
            }
        }

        return (
            <div
                key={label}
                className="grid grid-cols-3 gap-4 border-b border-slate-100 py-2 text-xs last:border-none dark:border-slate-800/60"
            >
                <span className="font-medium text-slate-500 dark:text-slate-400">{label}</span>
                <span className="col-span-2 font-normal break-words text-slate-900 dark:text-slate-100">{display}</span>
            </div>
        );
    };

    return (
        <div className="animate-in fade-in w-full flex-1 [scrollbar-width:none] space-y-8 overflow-y-auto p-6 duration-200 [&::-webkit-scrollbar]:hidden">
            <div className="w-full space-y-8">
                {/* Document Header */}
                <div className="flex flex-col items-start justify-between gap-4 border-b-2 border-slate-900 pb-4 md:flex-row md:items-center dark:border-slate-100">
                    <div>
                        <div className="mb-1 inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-slate-500 uppercase">
                            <LucideIcons.Building2 className="h-4 w-4" /> Profil & Dokumen Legalitas Rekanan
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {r?.vendor_name || detail.name || 'Nama Vendor Tidak Tersedia'}
                        </h2>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Kode Vendor:{' '}
                            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                {r?.vendor_code || detail.registrationNumber || '-'}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Section 1: Profil & Identitas Perusahaan */}
                <div className="space-y-2">
                    <h3 className="border-b border-slate-200 pb-1 text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
                        I. Profil & Identitas Rekanan
                    </h3>
                    <div>
                        {renderDocRow('Nama Resmi', detail.name || r?.vendor_name)}
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

                {/* Section 2: Alamat & Kontak Resmi */}
                <div className="space-y-2">
                    <h3 className="border-b border-slate-200 pb-1 text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
                        II. Alamat & Kontak Resmi
                    </h3>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <h4 className="mb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                                Alamat Utama
                            </h4>
                            {renderDocRow('Alamat', detail.address)}
                            {renderDocRow('Kota', detail.city)}
                            {renderDocRow('Provinsi', detail.region)}
                            {renderDocRow('Negara', detail.country)}
                            {renderDocRow('Kode Pos', detail.postalCode)}
                        </div>
                        <div>
                            <h4 className="mb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                                Alamat Surat Menyurat
                            </h4>
                            {renderDocRow('Alamat Surat', detail.mailingAddress)}
                            {renderDocRow('Kota Surat', detail.mailingCity)}
                            {renderDocRow('Provinsi Surat', detail.mailingRegion)}
                            {renderDocRow('Negara Surat', detail.mailingCountry)}
                            {renderDocRow('Kode Pos Surat', detail.mailingPostalCode)}
                        </div>
                    </div>
                </div>

                {/* Section 3: Kontak & PIC */}
                <div className="space-y-2">
                    <h3 className="border-b border-slate-200 pb-1 text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
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
                    <h3 className="border-b border-slate-200 pb-1 text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
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
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <h3 className="border-b border-slate-200 pb-1 text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
                            V. Bidang Usaha
                        </h3>
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-slate-500">Lokal:</p>
                            <ul className="list-inside list-disc space-y-1 text-xs text-slate-800 dark:text-slate-200">
                                {businessFields.length > 0 ? (
                                    businessFields.map((bf, idx) => <li key={idx}>{bf.businessField}</li>)
                                ) : (
                                    <li>-</li>
                                )}
                            </ul>
                            {detail.businessFieldsForeign && (
                                <div className="border-t border-slate-200 pt-2 dark:border-slate-800">
                                    <p className="text-xs font-medium text-slate-500">Asing:</p>
                                    <p className="text-xs text-slate-800 dark:text-slate-200">
                                        {detail.businessFieldsForeign}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="border-b border-slate-200 pb-1 text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
                            VI. Perbankan & Pembayaran
                        </h3>
                        <div className="space-y-2">
                            <div>
                                <p className="mb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                                    Rekening Bank
                                </p>
                                {bankList.length > 0 ? (
                                    bankList.map((b, idx) => (
                                        <div
                                            key={idx}
                                            className="border-b border-slate-200/60 py-1 text-xs last:border-none dark:border-slate-800/60"
                                        >
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">{b.bankName}</p>
                                            <p className="text-slate-600 dark:text-slate-400">
                                                No. Rek: <span className="font-mono font-semibold">{b.accountNumber}</span>{' '}
                                                a/n {b.accountName}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-500">-</p>
                                )}
                            </div>
                            <div>
                                <p className="mb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                                    Metode Pembayaran
                                </p>
                                {paymentMethods.length > 0 ? (
                                    paymentMethods.map((p, idx) => (
                                        <p key={idx} className="text-xs text-slate-700 dark:text-slate-300">
                                            TOP: <strong>{p.top ?? '-'} hari</strong> | Full Payment:{' '}
                                            <strong>{p.fullPayment ?? '-'}%</strong>
                                        </p>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-500">-</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 6: Legalitas & Berkas */}
                <div className="space-y-2">
                    <h3 className="border-b border-slate-200 pb-1 text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
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

                {/* Section 7: File Lampiran */}
                <div className="space-y-2">
                    <h3 className="border-b border-slate-200 pb-1 text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
                        VIII. Berkas & Lampiran Dokumen
                    </h3>
                    <div>
                        {renderDocRow('File KTP (ID Card File)', detail.idCardFile)}
                        {renderDocRow('File Master Agreement', detail.masterAgreementAttachment)}
                        {renderDocRow('File Profile Perusahaan', detail.companyProfileAttachment)}
                        {renderDocRow('File Single Vendor', detail.singleVendorFile)}
                        {renderDocRow('File Compliance', detail.complianceFile)}
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
                        {renderDocRow('Lampiran NPWP', tax.npwpfile)}
                        {renderDocRow('Lampiran SK PKP', tax.skpkpfile)}
                        {renderDocRow('Lampiran JKP', tax.jkfile)}
                        {renderDocRow('Lampiran PP23', tax.pp23attachment)}
                    </div>
                </div>
            </div>
        </div>
    );
}
export default VendorDetailView;
