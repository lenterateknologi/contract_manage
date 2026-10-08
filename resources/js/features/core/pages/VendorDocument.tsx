import { Head } from '@inertiajs/react';
import { ArrowLeft, Building2, ExternalLink, FileText } from 'lucide-react';
import React from 'react';

interface VendorDocumentProps {
    vendor: Record<string, any>;
}

export default function VendorDocument({ vendor }: Readonly<VendorDocumentProps>) {
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
            } else if (
                isFile ||
                (typeof value === 'string' &&
                    (/\.(pdf|png|jpe?g|jfif|webp|gif|svg|docx?|xlsx?|pptx?|zip|rar|txt|csv)$/i.test(value) || value.includes('__')))
            ) {
                const valStr = String(value);
                const fileUrl =
                    valStr.startsWith('http') || valStr.startsWith('/')
                        ? valStr
                        : `/admin/core/vendors/file-download?fileName=${encodeURIComponent(valStr)}`;
                display = (
                    <button
                        type="button"
                        onClick={() => window.open(fileUrl, '_blank')}
                        className="inline-flex cursor-pointer items-center gap-1.5 text-left font-semibold text-blue-600 underline transition-all hover:text-blue-800 hover:no-underline dark:text-blue-400 dark:hover:text-blue-300"
                        title="Klik untuk membuka/preview dokumen"
                    >
                        <FileText className="h-3.5 w-3.5 shrink-0" />
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
                className="grid grid-cols-3 gap-4 border-b border-slate-200/80 py-2.5 font-sans text-xs last:border-none dark:border-slate-800/80"
            >
                <span className="font-semibold text-slate-500 dark:text-slate-400">{label}</span>
                <span className="col-span-2 font-normal break-words text-slate-900 dark:text-slate-100">{display}</span>
            </div>
        );
    };

    const sections = [
        {
            title: 'I. Profil & Identitas Rekanan',
            rows: [
                ['Nama Resmi', detail.name || r.vendor_name],
                ['Tipe Bentuk Usaha', detail.businessTypeName],
                ['Nama Cabang', detail.branchName],
                ['Nomor Registrasi', detail.registrationNumber],
                ['Nomor Perjanjian', detail.agreementNumber],
                ['Tanggal Perjanjian', detail.agreementDate],
                ['Tanggal Disetujui', detail.approvedDate],
                ['Total Karyawan', detail.totalEmployees],
                ['Cakupan Wilayah (Coverage Area)', detail.coverageArea],
                ['Compliance Level', detail.complianceLevel],
                ['Integrity Pact', detail.integrityPact],
                ['Master Agreement', detail.masterAgreement],
                ['Single Vendor', detail.isSingleVendor],
            ],
        },
        {
            title: 'III. Informasi Kontak & Person in Charge (PIC)',
            rows: [
                ['Email Perusahaan', detail.companyEmail],
                ['No. Telepon Perusahaan', detail.companyPhone],
                ['Fax Perusahaan', detail.companyFax],
                ['Email Bagian Keuangan', detail.financeEmail],
                ['Email Bagian Perpajakan', detail.taxEmail],
                ['Nama PIC', detail.pic],
                ['Email PIC', detail.picemail],
                ['No. HP / Telepon PIC', detail.picphone],
            ],
        },
        {
            title: 'IV. Data Perpajakan',
            rows: [
                ['Status NPWP', tax.typeNpwp],
                ['Nomor NPWP', tax.npwp],
                ['Status PKP', tax.typePkp],
                ['Nomor PKP', tax.pkp],
                ['Kategori BKP', tax.typeBkp],
                ['Tarif PPN', tax.ppn ? `${tax.ppn}%` : null],
                ['Deskripsi BKP', tax.bkpDesc],
                ['Deskripsi JKP', tax.jkpDesc],
                ['Organisasi', tax.isOrganization],
                ['SIUJK', tax.isSiujk],
                ['Nomor PP23', tax.pp23number],
                ['Masa Berlaku PP23', tax.pp23expiredDate],
            ],
        },
        {
            title: 'VII. Perizinan Legalitas',
            rows: [
                ['Nomor Induk Berusaha (NIB)', legality.nib],
                ['Tgl Kadaluarsa NIB', legality.nibexpiredDate],
                ['Izin Usaha (Business Permit)', legality.businessPermit],
                ['SIUP', legality.siup],
                ['Tgl Kadaluarsa SIUP', legality.siupexpiredDate],
                ['TDP', legality.tdp],
                ['Tgl Kadaluarsa TDP', legality.tdpexpiredDate],
                ['Penandatangan Resmi', legality.signing],
                ['Jabatan Penandatangan', legality.jobTitle],
                ['Akta Pendirian', legality.memorandumOfAssociation],
                ['Surat Keputusan Menkumham', legality.decissionLetterMenkumham],
            ],
        },
        {
            title: 'VIII. Berkas & Lampiran Dokumen',
            rows: [
                ['File KTP (ID Card File)', detail.idCardFile],
                ['File Master Agreement', detail.masterAgreementAttachment],
                ['File Profile Perusahaan', detail.companyProfileAttachment],
                ['File Single Vendor', detail.singleVendorFile],
                ['File Compliance', detail.complianceFile],
                ['Lampiran NIB', legality.nibattachment],
                ['Lampiran Izin Usaha', legality.businessPermitAttachment],
                ['Lampiran SIUP', legality.siupattachment],
                ['Lampiran TDP', legality.tdpattachment],
                ['Lampiran Akta Pendirian', legality.memorandumOfAssociationAttachment],
                ['Lampiran SK Menkumham', legality.decissionLetterMenkumhamAttachment],
                ['Lampiran Akta Perubahan', legality.memorandumOfAssociationChangingAttachment],
                ['Lampiran SK Menkumham Perubahan', legality.decissionLetterMenkumhamChangingAttachment],
                ['Lampiran Spesimen Tanda Tangan', legality.signingAttachment],
                ['Lampiran Pendaftaran Perusahaan', legality.companyRegistrationAttachment],
                ['Lampiran Surat Domisili', legality.domicileAttachment],
                ['Lampiran Lisensi Usaha', legality.businessLicenceFile],
                ['Lampiran BKPM', legality.investmentCoorBoardFile],
                ['Lampiran Surat Keagenan', legality.agencyLetterFile],
                ['Lampiran Dokumen Lainnya', legality.otherAttachment],
                ['Lampiran NPWP', tax.npwpfile],
                ['Lampiran SK PKP', tax.skpkpfile],
                ['Lampiran JKP', tax.jkpfile],
                ['Lampiran PP23', tax.pp23attachment],
            ],
        },
    ];

    return (
        <>
            <Head title={`Dokumen Vendor - ${r.vendor_name || detail.name || 'Vendor'}`} />

            <div className="flex min-h-screen w-full flex-col items-center bg-slate-100 p-4 md:p-8 dark:bg-zinc-950">
                {/* Header Action Bar */}
                <div className="no-print mb-4 flex w-full max-w-4xl items-center justify-between px-1">
                    <button
                        type="button"
                        onClick={() => window.close()}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-200 dark:hover:bg-zinc-800"
                    >
                        <ArrowLeft size={14} />
                        <span>Tutup Halaman</span>
                    </button>
                    <div className="text-xs font-medium text-slate-500">Dokumen Resmi Profil Vendor</div>
                </div>

                {/* Flat Paper View Container */}
                <div className="w-full max-w-4xl space-y-8 border border-slate-200 bg-white p-8 text-slate-900 md:p-12 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-100">
                    {/* Document Header / Kop Resmi */}
                    <div className="border-b-2 border-slate-900 pb-5 dark:border-slate-100">
                        <div className="mb-1 inline-flex items-center gap-2 font-sans text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                            <Building2 className="text-primary h-4 w-4" /> Dokumen Rekanan Master (Vendor Profile)
                        </div>
                        <h2 className="font-sans text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {r.vendor_name || detail.name || 'Nama Vendor Tidak Tersedia'}
                        </h2>
                        <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                            KODE VENDOR:{' '}
                            <strong className="text-slate-800 dark:text-slate-200">{r.vendor_code || detail.registrationNumber || '-'}</strong>
                        </p>
                    </div>

                    {/* Section 1 */}
                    <div className="space-y-2">
                        <h3 className="border-b border-slate-200 pb-1 font-sans text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
                            {sections[0].title}
                        </h3>
                        <div>{sections[0].rows.map(([label, val]) => renderDocRow(label, val))}</div>
                    </div>

                    {/* Section 2: Alamat & Lokasi Operasional */}
                    <div className="space-y-2">
                        <h3 className="border-b border-slate-200 pb-1 font-sans text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
                            II. Alamat & Kontak Resmi
                        </h3>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <h4 className="mb-1 font-sans text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Alamat Utama</h4>
                                {renderDocRow('Alamat', detail.address)}
                                {renderDocRow('Kota', detail.city)}
                                {renderDocRow('Provinsi', detail.region)}
                                {renderDocRow('Negara', detail.country)}
                                {renderDocRow('Kode Pos', detail.postalCode)}
                            </div>
                            <div>
                                <h4 className="mb-1 font-sans text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
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

                    {/* Section 3 & 4 */}
                    {sections.slice(1, 3).map((sec) => (
                        <div key={sec.title} className="space-y-2">
                            <h3 className="border-b border-slate-200 pb-1 font-sans text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
                                {sec.title}
                            </h3>
                            <div>{sec.rows.map(([label, val]) => renderDocRow(label, val))}</div>
                        </div>
                    ))}

                    {/* Section 5: Bidang Usaha & Bank */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <h3 className="border-b border-slate-200 pb-1 font-sans text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
                                V. Bidang Usaha
                            </h3>
                            <div className="space-y-2 font-sans">
                                <p className="text-xs font-medium text-slate-500">Lokal:</p>
                                <ul className="list-inside list-disc space-y-1 text-xs text-slate-800 dark:text-slate-200">
                                    {businessFields.length > 0 ? businessFields.map((bf, idx) => <li key={idx}>{bf.businessField}</li>) : <li>-</li>}
                                </ul>
                                {detail.businessFieldsForeign && (
                                    <div className="border-t border-slate-200 pt-2 dark:border-slate-800">
                                        <p className="text-xs font-medium text-slate-500">Asing:</p>
                                        <p className="text-xs text-slate-800 dark:text-slate-200">{detail.businessFieldsForeign}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="border-b border-slate-200 pb-1 font-sans text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
                                VI. Perbankan & Pembayaran
                            </h3>
                            <div className="space-y-2 font-sans">
                                <div>
                                    <p className="mb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Rekening Bank</p>
                                    {bankList.length > 0 ? (
                                        bankList.map((b, idx) => (
                                            <div
                                                key={idx}
                                                className="border-b border-slate-200/60 py-1 text-xs last:border-none dark:border-slate-800/60"
                                            >
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">{b.bankName}</p>
                                                <p className="text-slate-600 dark:text-slate-400">
                                                    No. Rek: <span className="font-mono font-semibold">{b.accountNumber}</span> a/n {b.accountName}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-500">-</p>
                                    )}
                                </div>
                                <div>
                                    <p className="mb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Metode Pembayaran</p>
                                    {paymentMethods.length > 0 ? (
                                        paymentMethods.map((p, idx) => (
                                            <p key={idx} className="text-xs text-slate-700 dark:text-slate-300">
                                                TOP: <strong>{p.top ?? '-'} hari</strong> | Full Payment: <strong>{p.fullPayment ?? '-'}%</strong>
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-500">-</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 6 & 7 */}
                    {sections.slice(3).map((sec) => (
                        <div key={sec.title} className="space-y-2">
                            <h3 className="border-b border-slate-200 pb-1 font-sans text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
                                {sec.title}
                            </h3>
                            <div>{sec.rows.map(([label, val]) => renderDocRow(label, val))}</div>
                        </div>
                    ))}

                    {/* Document Footer */}
                    <div className="flex items-center justify-between border-t border-slate-200 pt-4 font-sans text-[11px] text-slate-400 dark:border-slate-800">
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
