import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Contract } from '@/features/Contracts/types';
import { Building2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import React, { useState } from 'react';

export function VendorInfoCard({ selected, isTabView = false }: { selected: Contract; isTabView?: boolean }) {
    const [minimized, setMinimized] = useState(false);
    const secondParty = (selected as any)?.vendor || {};
    const initUser = selected.initiator || selected.creator;
    const isInternalParty =
        !selected.vendor_id &&
        !selected.vendor?.id &&
        (selected.metadata?.second_party_id === 'internal' ||
            selected.metadata?.p2_vendor_id === 'internal' ||
            selected.p2_entity === initUser?.company?.name ||
            selected.p2_entity === initUser?.company_name);

    const detail = (secondParty?.vendor_detail || secondParty?.detail || {}) as Record<string, any>;
    const tax = (detail.tax || {}) as Record<string, any>;
    const legality = (detail.legality || {}) as Record<string, any>;
    const bankList = (Array.isArray(detail.bank) ? detail.bank : []) as Record<string, any>[];
    const paymentMethods = (Array.isArray(detail.paymentMethod) ? detail.paymentMethod : []) as Record<string, any>[];
    const businessFields = (Array.isArray(detail.businessFields) ? detail.businessFields : []) as Record<string, any>[];

    const partyName =
        secondParty?.name ||
        secondParty?.vendor_name ||
        detail?.name ||
        selected.metadata?.meta_p2_entity ||
        selected.p2_entity ||
        (isInternalParty
            ? initUser?.company?.name || initUser?.company_name || 'PT. Lentera Teknologi (Internal)'
            : 'Nama Pihak Kedua Tidak Tersedia');
    const picName =
        secondParty?.pic_name ||
        detail?.pic ||
        selected.metadata?.meta_p2_signer ||
        selected.p2_signer ||
        (isInternalParty ? initUser?.name || '—' : '—');
    const picPosition =
        secondParty?.pic_position ||
        detail?.pic_position ||
        detail?.jobTitle ||
        selected.metadata?.meta_p2_signer_position ||
        selected.p2_signer_position ||
        (isInternalParty ? initUser?.jobtitle_name || initUser?.role_name || 'Direktur' : '—');
    const address =
        secondParty?.address ||
        detail?.address ||
        selected.metadata?.meta_p2_alamat ||
        selected.p2_address ||
        (isInternalParty
            ? initUser?.company?.address || initUser?.address || 'The Manhattan Square Mid Tower Lt. 12, Jl. TB Simatupang No.1, Jakarta Selatan'
            : '—');
    const partyCode =
        secondParty?.vendor_code || detail?.registrationNumber || (isInternalParty ? initUser?.employee_id || initUser?.nip || 'INTERNAL' : '-');

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
                const valStr = String(value).trim();
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
            <div className="border-border/50 grid grid-cols-1 gap-2 border-b py-2 font-sans text-xs sm:grid-cols-3">
                <span className="text-muted-foreground font-medium">{label}</span>
                <span className="text-foreground break-words sm:col-span-2">{display}</span>
            </div>
        );
    };

    const fullDocumentContent = (
        <div className="space-y-6 p-6">
            {/* Section 1: Informasi Umum */}
            <div className="space-y-2">
                <h3 className="text-foreground border-border border-b pb-1 text-xs font-bold tracking-wider uppercase">
                    I. Informasi Umum Pihak Kedua
                </h3>
                <div>
                    {renderDocRow('Nama Pihak Kedua / Perusahaan', partyName)}
                    {renderDocRow('Kode / No. Registrasi', partyCode)}
                    {renderDocRow('Bentuk Badan Usaha', detail.vendorType)}
                    {renderDocRow('Status Usaha', detail.businessStatus)}
                    {renderDocRow('Status Kepemilikan', detail.ownership)}
                    {renderDocRow('Sektor Bisnis', detail.businessSector)}
                    {renderDocRow('Kategori Pihak Kedua', detail.vendorCategory)}
                    {renderDocRow('Website Resmi', detail.website)}
                </div>
            </div>

            {/* Section 2: Alamat & Domisili */}
            <div className="space-y-2">
                <h3 className="text-foreground border-border border-b pb-1 text-xs font-bold tracking-wider uppercase">
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

            {/* Section 3: Kontak & Penandatangan / PIC */}
            <div className="space-y-2">
                <h3 className="text-foreground border-border border-b pb-1 text-xs font-bold tracking-wider uppercase">
                    III. Informasi Kontak & Penandatangan Pihak Kedua
                </h3>
                <div>
                    {renderDocRow('Email Perusahaan', detail.companyEmail)}
                    {renderDocRow('No. Telepon Perusahaan', detail.companyPhone)}
                    {renderDocRow('Fax Perusahaan', detail.companyFax)}
                    {renderDocRow('Email Bagian Keuangan', detail.financeEmail)}
                    {renderDocRow('Email Bagian Perpajakan', detail.taxEmail)}
                    {renderDocRow('Nama Penandatangan / PIC', detail.pic || picName)}
                    {renderDocRow('Jabatan Penandatangan', picPosition)}
                    {renderDocRow('Email Penandatangan / PIC', detail.picemail)}
                    {renderDocRow('No. HP / Telepon PIC', detail.picphone)}
                </div>
            </div>

            {/* Section 4: Perpajakan */}
            <div className="space-y-2">
                <h3 className="text-foreground border-border border-b pb-1 text-xs font-bold tracking-wider uppercase">IV. Data Perpajakan</h3>
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
                    <h3 className="text-foreground border-border border-b pb-1 text-xs font-bold tracking-wider uppercase">V. Bidang Usaha</h3>
                    <div className="space-y-2 font-sans">
                        <p className="text-muted-foreground text-xs font-medium">Lokal:</p>
                        <ul className="text-foreground list-inside list-disc space-y-1 text-xs">
                            {businessFields.length > 0 ? businessFields.map((bf, idx) => <li key={idx}>{bf.businessField}</li>) : <li>-</li>}
                        </ul>
                        {detail.businessFieldsForeign && (
                            <div className="border-border border-t pt-2">
                                <p className="text-muted-foreground text-xs font-medium">Asing:</p>
                                <p className="text-foreground text-xs">{detail.businessFieldsForeign}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-foreground border-border border-b pb-1 text-xs font-bold tracking-wider uppercase">
                        VI. Perbankan & Pembayaran
                    </h3>
                    <div className="space-y-2 font-sans">
                        <div>
                            <p className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-wider uppercase">Rekening Bank</p>
                            {bankList.length > 0 ? (
                                bankList.map((b, idx) => (
                                    <div key={idx} className="border-border/60 border-b py-1 text-xs last:border-none">
                                        <p className="text-foreground font-semibold">{b.bankName}</p>
                                        <p className="text-muted-foreground">
                                            No. Rek: <span className="text-foreground font-mono font-semibold">{b.accountNumber}</span> a/n{' '}
                                            {b.accountName}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground text-xs">-</p>
                            )}
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-wider uppercase">Metode Pembayaran</p>
                            {paymentMethods.length > 0 ? (
                                paymentMethods.map((p, idx) => (
                                    <p key={idx} className="text-foreground text-xs">
                                        TOP: <strong>{p.top ?? '-'} hari</strong> | Full Payment: <strong>{p.fullPayment ?? '-'}%</strong>
                                    </p>
                                ))
                            ) : (
                                <p className="text-muted-foreground text-xs">-</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 6: Legalitas & Perizinan */}
            <div className="space-y-2">
                <h3 className="text-foreground border-border border-b pb-1 text-xs font-bold tracking-wider uppercase">VII. Perizinan Legalitas</h3>
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
                <h3 className="text-foreground border-border border-b pb-1 text-xs font-bold tracking-wider uppercase">
                    VIII. Berkas & Lampiran Dokumen
                </h3>
                <div>
                    {renderDocRow('File KTP (ID Card File)', detail.idCardFile, true)}
                    {renderDocRow('File Master Agreement', detail.masterAgreementAttachment, true)}
                    {renderDocRow('File Profile Perusahaan', detail.companyProfileAttachment, true)}
                    {renderDocRow('File Dokumen Tunggal', detail.singleVendorFile, true)}
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
            <div className="flex h-full min-h-0 flex-1 flex-col gap-3 p-3 lg:p-4">
                <div className="bg-primary text-primary-foreground flex h-9.5 max-h-[38px] min-h-[38px] shrink-0 items-center justify-between rounded-xl px-4 shadow-xs">
                    <div className="text-primary-foreground flex items-center gap-2 text-xs font-semibold tracking-tight uppercase">
                        <Building2 size={15} className="text-primary-foreground/90" /> Detail Profil & Dokumen Legalitas Pihak Kedua
                    </div>
                    {secondParty?.id && (
                        <a
                            href={`/admin/core/vendors/${secondParty.id}/document`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/20 bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white transition-all hover:bg-white/25 active:scale-95"
                            title="Buka di Halaman Baru"
                        >
                            <span>Buka di Tab Baru</span>
                            <ExternalLink size={13} />
                        </a>
                    )}
                </div>
                <Card className="custom-scrollbar border-border/80 flex-1 overflow-y-auto">{fullDocumentContent}</Card>
            </div>
        );
    }

    return (
        <Card className="border-border/80 shadow-xs">
            <CardHeader className="bg-primary text-primary-foreground flex flex-row items-center justify-between space-y-0 rounded-t-lg p-3">
                <CardTitle className="text-primary-foreground flex items-center gap-2 text-xs font-semibold tracking-tight uppercase">
                    <Building2 size={15} className="text-primary-foreground/90" /> Detail Profil & Legalitas Pihak Kedua
                </CardTitle>
                <div className="flex items-center gap-1.5">
                    {secondParty?.id && (
                        <a
                            href={`/admin/core/vendors/${secondParty.id}/document`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-6 cursor-pointer items-center gap-1 rounded-md border border-white/20 bg-white/15 px-2 text-[10px] font-medium text-white transition-all hover:bg-white/25 active:scale-95"
                            title="Buka di Tab Baru"
                        >
                            <span>Dokumen</span>
                            <ExternalLink size={11} />
                        </a>
                    )}
                    <button
                        type="button"
                        onClick={() => setMinimized(!minimized)}
                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-white/20 bg-white/15 text-white transition-all hover:bg-white/25 active:scale-95"
                    >
                        {minimized ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                    </button>
                </div>
            </CardHeader>

            {!minimized && <CardContent className="custom-scrollbar max-h-[500px] overflow-y-auto p-0">{fullDocumentContent}</CardContent>}
        </Card>
    );
}
