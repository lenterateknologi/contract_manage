import { Contract } from '@/pages/contracts/types';
import { cleanSingleLineText, formatDateWithOptionalTime, formatLampiranList, formatRuangLingkup } from '@/pages/contracts/utils';

// ── F2 important field keys (from F1 data) ──────────────────────────
// These are the F1 field names (snake_case) that should appear in the F2 summary.
export const F2_IMPORTANT_FIELDS: { key: string; label: string; width: string; type?: string }[] = [
    { key: 'contract_no', label: 'No. Kontrak (F2)', width: '1/2' },
    { key: 'meta_no_kontrak', label: 'No. Kontrak (Draft)', width: '1/2' },
    { key: 'meta_judul_kontrak', label: 'Judul Perjanjian', width: '1/1' },
    { key: 'meta_tipe_perjanjian', label: 'Tipe Perjanjian', width: '1/2' },
    { key: 'meta_tgl_dibuat', label: 'Tanggal', width: '1/2' },
    { key: 'meta_p1_entity', label: 'Pihak I (PT.)', width: '1/2' },
    { key: 'meta_p2_entity', label: 'Pihak II (PT.)', width: '1/2' },
    { key: 'meta_p1_signer_position', label: 'Penandatangan Pihak I', width: '1/2' },
    { key: 'meta_p2_signer_position', label: 'Penandatangan Pihak II', width: '1/2' },
    { key: 'meta_ringkasan_klausul', label: 'Ringkasan Klausul', width: '1/1' },
    { key: 'meta_masa_berlaku', label: 'Masa Berlaku', width: '1/2' },
    { key: 'meta_lokasi', label: 'Lokasi Area', width: '1/1' },
    { key: 'meta_nilai_transaksi', label: 'Harga / Nilai', width: '1/2' },
    { key: 'meta_mekanisme_pembayaran', label: 'Mekanisme Bayar', width: '1/2' },
    // Signature boxes
    { key: 'meta_pic', label: 'PIC', width: '1/3', type: 'signature_box' },
];

export const AUTOFILL_KEY_DEFINITIONS: Record<string, { label: string; group: string }> = {
    meta_nomor: { label: 'Nomor Form', group: 'Header & Nomor' },
    meta_no_kontrak: { label: 'No. Kontrak', group: 'Header & Nomor' },
    meta_judul_kontrak: { label: 'Judul Perjanjian', group: 'Header & Nomor' },
    meta_tipe_perjanjian: { label: 'Tipe Perjanjian', group: 'Header & Nomor' },
    meta_sub_topik: { label: 'Sub Topik', group: 'Header & Nomor' },
    meta_tgl_dibuat: { label: 'Tanggal Dibuat', group: 'Header & Nomor' },

    meta_p1_entity: { label: 'Nama Pihak I (PT)', group: 'Para Pihak' },
    meta_p1_signer: { label: 'Penandatangan Pihak I', group: 'Para Pihak' },
    meta_p1_signer_position: { label: 'Jabatan Penandatangan Pihak I', group: 'Para Pihak' },
    meta_p1_alamat: { label: 'Alamat Pihak I', group: 'Para Pihak' },

    meta_p2_entity: { label: 'Nama Pihak II ', group: 'Para Pihak' },
    meta_p2_signer: { label: 'Penandatangan Pihak II', group: 'Para Pihak' },
    meta_p2_signer_position: { label: 'Jabatan Penandatangan Pihak II', group: 'Para Pihak' },
    meta_p2_alamat: { label: 'Alamat Pihak II / Vendor', group: 'Alamat & Kontak Resmi' },

    meta_nilai_transaksi: { label: 'Harga / Nilai Transaksi', group: 'Detail Kontrak' },
    meta_masa_berlaku: { label: 'Masa Berlaku', group: 'Detail Kontrak' },
    meta_lokasi: { label: 'Lokasi Area', group: 'Detail Kontrak' },
    meta_mekanisme_pembayaran: { label: 'Mekanisme Bayar', group: 'Detail Kontrak' },
    meta_ringkasan_klausul: { label: 'Ringkasan Klausul', group: 'Detail Kontrak' },
    meta_ruang_lingkup: { label: 'Ruang Lingkup', group: 'Detail Kontrak' },
    meta_lampiran: { label: 'Daftar Lampiran', group: 'Detail Kontrak' },
    meta_deskripsi: { label: 'Deskripsi / Keterangan', group: 'Detail Kontrak' },

    meta_pic: { label: 'PIC', group: 'Tanda Tangan & Persetujuan' },
    meta_tax_required: { label: 'Status Pajak', group: 'Tanda Tangan & Persetujuan' },

    // Data Pihak II / Vendor Lengkap (Legalitas, Pajak, Bank, Kontak)
    meta_p2_nib: { label: 'Nomor Induk Berusaha (NIB) Pihak II', group: 'Legalitas & Perizinan Pihak II' },
    meta_p2_nib_expired: { label: 'Tgl Kadaluarsa NIB Pihak II', group: 'Legalitas & Perizinan Pihak II' },
    meta_p2_siup: { label: 'Nomor SIUP Pihak II', group: 'Legalitas & Perizinan Pihak II' },
    meta_p2_siup_expired: { label: 'Tgl Kadaluarsa SIUP Pihak II', group: 'Legalitas & Perizinan Pihak II' },
    meta_p2_tdp: { label: 'Nomor TDP Pihak II', group: 'Legalitas & Perizinan Pihak II' },
    meta_p2_tdp_expired: { label: 'Tgl Kadaluarsa TDP Pihak II', group: 'Legalitas & Perizinan Pihak II' },
    meta_p2_izin_usaha: { label: 'Izin Usaha (Business Permit) Pihak II', group: 'Legalitas & Perizinan Pihak II' },
    meta_p2_akta_pendirian: { label: 'Akta Pendirian Pihak II', group: 'Legalitas & Perizinan Pihak II' },
    meta_p2_sk_menkumham: { label: 'SK Menkumham Pihak II', group: 'Legalitas & Perizinan Pihak II' },
    meta_p2_npwp: { label: 'Nomor NPWP Pihak II', group: 'Perpajakan Pihak II' },
    meta_p2_npwp_status: { label: 'Status NPWP Pihak II', group: 'Perpajakan Pihak II' },
    meta_p2_pkp_status: { label: 'Status PKP Pihak II', group: 'Perpajakan Pihak II' },
    meta_p2_pkp_no: { label: 'Nomor PKP Pihak II', group: 'Perpajakan Pihak II' },
    meta_p2_ppn_tarif: { label: 'Tarif PPN Pihak II', group: 'Perpajakan Pihak II' },
    meta_p2_pp23_no: { label: 'Nomor PP23 Pihak II', group: 'Perpajakan Pihak II' },
    meta_p2_bank_name: { label: 'Nama Bank Pihak II', group: 'Perbankan Pihak II' },
    meta_p2_bank_account_no: { label: 'Nomor Rekening Bank Pihak II', group: 'Perbankan Pihak II' },
    meta_p2_bank_account_name: { label: 'Nama Pemilik Rekening Bank Pihak II', group: 'Perbankan Pihak II' },
    meta_p2_email: { label: 'Email Perusahaan Pihak II', group: 'Alamat & Kontak Resmi' },
    meta_p2_phone: { label: 'Telepon Perusahaan Pihak II', group: 'Alamat & Kontak Resmi' },
    meta_p2_pic_email: { label: 'Email PIC / Penandatangan Pihak II', group: 'Alamat & Kontak Resmi' },
    meta_p2_pic_phone: { label: 'No. HP / Telepon PIC Pihak II', group: 'Alamat & Kontak Resmi' },
    meta_p2_kode: { label: 'Kode / No. Registrasi Pihak II', group: 'Para Pihak' },
    meta_p2_bentuk_badan_usaha: { label: 'Bentuk Badan Usaha Pihak II', group: 'Para Pihak' },
    meta_p2_kota: { label: 'Kota / Domisili Pihak II', group: 'Alamat & Kontak Resmi' },
    meta_p2_provinsi: { label: 'Provinsi Pihak II', group: 'Alamat & Kontak Resmi' },
    meta_p2_kodepos: { label: 'Kode Pos Pihak II', group: 'Alamat & Kontak Resmi' },
};

export const getAutofillValue = (field: any, contract: Contract, docType?: 'f1' | 'f2' | 'contract', users: any[] = []) => {
    const name = field.name?.toLowerCase();
    if (!name) return null;

    const vendor = (contract as any)?.vendor;
    const typeObj = (contract as any)?.contract_type;

    const resolvers: Record<string, () => any> = {
        meta_ruang_lingkup: () => formatRuangLingkup(contract.contract_no ?? '', contract.p1_signer ?? (contract as any).initiator?.name),
        meta_nomor: () => contract.form_no ?? '',
        meta_no_kontrak: () => contract.contract_no ?? contract.form_no ?? '',
        meta_judul_kontrak: () => contract.title ?? '',
        meta_tipe_perjanjian: () => (typeof typeObj === 'object' ? typeObj?.name : typeObj) ?? '',
        meta_sub_topik: () => (contract as any).kop_sub_topik ?? '',
        meta_lampiran: () => {
            const vendorObj = (contract.vendor as any) || {};
            const vendorDetail = vendorObj.vendor_detail || vendorObj.detail || {};

            const extractAttachments = (obj: any, prefix = ''): any[] => {
                let results: any[] = [];
                if (!obj || typeof obj !== 'object') return results;

                if (Array.isArray(obj)) {
                    obj.forEach((item, idx) => {
                        if (typeof item === 'string' && item.trim()) {
                            results.push({ label: `${prefix} ${idx + 1}`.trim(), file_name: item });
                        } else if (typeof item === 'object' && item !== null) {
                            const fn = item.file_name || item.url || item.path || item.name || '';
                            if (fn) {
                                results.push({
                                    label: item.label || item.type || item.name || `${prefix} ${idx + 1}`.trim(),
                                    file_name: fn,
                                });
                            }
                        }
                    });
                    return results;
                }

                Object.entries(obj).forEach(([key, val]) => {
                    const lowerKey = key.toLowerCase();
                    const isAttachmentKey = lowerKey.includes('attachment') || lowerKey.includes('file');

                    if (isAttachmentKey && typeof val === 'string' && val.trim() && val.trim() !== '-') {
                        const cleanLabel = key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/_/g, ' ')
                            .replace(/attachment/gi, '')
                            .replace(/file/gi, '')
                            .trim()
                            .toUpperCase();

                        results.push({
                            label: cleanLabel || key.toUpperCase(),
                            file_name: val.trim(),
                        });
                    } else if (typeof val === 'object' && val !== null && !Array.isArray(val) && key !== 'businessFields' && key !== 'bank' && key !== 'paymentMethod') {
                        results = results.concat(extractAttachments(val, key.toUpperCase()));
                    } else if (Array.isArray(val) && (lowerKey === 'documents' || lowerKey === 'berkas' || lowerKey === 'files')) {
                        results = results.concat(extractAttachments(val, key.toUpperCase()));
                    }
                });

                return results;
            };

            const vendorDocs = extractAttachments(vendorDetail);
            const contractDocs = (contract.attachments || []).map((a: any) => ({
                label: a.label || a.file_name,
                file_name: a.file_name,
            }));

            const combinedDocs = [...vendorDocs, ...contractDocs];
            return formatLampiranList(combinedDocs);
        },
        meta_tgl_dibuat: () => formatDateWithOptionalTime(contract.created_at, field),
        meta_masa_berlaku: () => {
            if (!contract.contract_date && !contract.end_date) return '';
            const start = contract.contract_date ? String(contract.contract_date).split('T')[0].split(' ')[0] : '';
            const end = contract.end_date ? String(contract.end_date).split('T')[0].split(' ')[0] : '';
            if (start && end) return `${start} s/d ${end}`;
            return start || end;
        },
        meta_p1_entity: () => {
            const initUser = (contract as any)?.initiator || (contract as any)?.creator;
            return contract.p1_entity || initUser?.company_name || initUser?.company?.name || 'PT. LENTERA TEKNOLOGI';
        },
        meta_p1_signer: () => {
            const initUser = (contract as any)?.initiator || (contract as any)?.creator;
            return contract.p1_signer || initUser?.name || '';
        },
        meta_p1_signer_position: () => {
            const initUser = (contract as any)?.initiator || (contract as any)?.creator;
            return contract.p1_signer_position || initUser?.jobtitle_name || initUser?.job_position_name || initUser?.role || initUser?.role_name || '';
        },
        meta_p1_alamat: () => {
            const initUser = (contract as any)?.initiator || (contract as any)?.creator;
            const addr = contract.p1_address || initUser?.company?.address || initUser?.location_name || initUser?.address || 'The Manhattan Square Mid Tower Lt. 12, Jl. TB Simatupang No.1, Jakarta Selatan';
            return cleanSingleLineText(addr);
        },
        meta_p2_entity: () => contract.p2_entity ?? vendor?.name ?? vendor?.vendor_name ?? '',
        meta_p2_signer: () => contract.p2_signer ?? vendor?.pic_name ?? vendor?.pic ?? vendor?.detail?.pic ?? '',
        meta_p2_signer_position: () => contract.p2_signer_position ?? vendor?.pic_position ?? vendor?.detail?.pic_position ?? vendor?.detail?.jobTitle?.[0] ?? '',
        meta_p2_alamat: () => cleanSingleLineText(contract.p2_address ?? vendor?.address ?? vendor?.detail?.address ?? vendor?.detail?.mailingAddress),

        // Vendor / Pihak II Legality Auto-Resolvers
        meta_p2_nib: () => vendor?.detail?.legality?.nib ?? vendor?.nib ?? '',
        meta_p2_nib_expired: () => vendor?.detail?.legality?.nibexpiredDate ?? vendor?.detail?.legality?.nib_expired_date ?? '',
        meta_p2_siup: () => vendor?.detail?.legality?.siup ?? '',
        meta_p2_siup_expired: () => vendor?.detail?.legality?.siupexpiredDate ?? vendor?.detail?.legality?.siup_expired_date ?? '',
        meta_p2_tdp: () => vendor?.detail?.legality?.tdp ?? '',
        meta_p2_tdp_expired: () => vendor?.detail?.legality?.tdpexpiredDate ?? vendor?.detail?.legality?.tdp_expired_date ?? '',
        meta_p2_izin_usaha: () => vendor?.detail?.legality?.businessPermit ?? vendor?.detail?.legality?.businessLicence ?? '',
        meta_p2_akta_pendirian: () => vendor?.detail?.legality?.memorandumOfAssociation ?? '',
        meta_p2_sk_menkumham: () => vendor?.detail?.legality?.decissionLetterMenkumham ?? '',

        // Vendor / Pihak II Tax Auto-Resolvers
        meta_p2_npwp: () => vendor?.detail?.tax?.npwp ?? '',
        meta_p2_npwp_status: () => vendor?.detail?.tax?.typeNpwp ?? '',
        meta_p2_pkp_status: () => vendor?.detail?.tax?.typePkp ?? (vendor?.is_pkp ? 'PKP' : 'NON PKP'),
        meta_p2_pkp_no: () => vendor?.detail?.tax?.pkp ?? '',
        meta_p2_ppn_tarif: () => (vendor?.detail?.tax?.ppn !== null && vendor?.detail?.tax?.ppn !== undefined) ? `${vendor.detail.tax.ppn}%` : '',
        meta_p2_pp23_no: () => vendor?.detail?.tax?.pp23number ?? '',

        // Vendor / Pihak II Bank Auto-Resolvers
        meta_p2_bank_name: () => {
            const bankList = Array.isArray(vendor?.detail?.bank) ? vendor.detail.bank : [];
            const mainBank = bankList.find((b: any) => b.status === 'Main' || b.isMain) || bankList[0] || {};
            return mainBank.bankName ?? mainBank.bank_name ?? '';
        },
        meta_p2_bank_account_no: () => {
            const bankList = Array.isArray(vendor?.detail?.bank) ? vendor.detail.bank : [];
            const mainBank = bankList.find((b: any) => b.status === 'Main' || b.isMain) || bankList[0] || {};
            return mainBank.accountNumber ?? mainBank.account_number ?? '';
        },
        meta_p2_bank_account_name: () => {
            const bankList = Array.isArray(vendor?.detail?.bank) ? vendor.detail.bank : [];
            const mainBank = bankList.find((b: any) => b.status === 'Main' || b.isMain) || bankList[0] || {};
            return mainBank.accountName ?? mainBank.account_name ?? '';
        },

        // Vendor / Pihak II Contact Auto-Resolvers
        meta_p2_email: () => vendor?.detail?.companyEmail ?? vendor?.detail?.email ?? '',
        meta_p2_phone: () => vendor?.detail?.companyPhone ?? vendor?.detail?.phone ?? '',
        meta_p2_pic_email: () => vendor?.detail?.picemail ?? vendor?.detail?.pic_email ?? '',
        meta_p2_pic_phone: () => vendor?.detail?.picphone ?? vendor?.detail?.pic_phone ?? '',
        meta_p2_kode: () => vendor?.code ?? vendor?.vendor_code ?? vendor?.detail?.registrationNumber ?? '',
        meta_p2_bentuk_badan_usaha: () => vendor?.detail?.businessTypeName ?? vendor?.detail?.vendorType ?? '',
        meta_p2_kota: () => vendor?.detail?.city ?? '',
        meta_p2_provinsi: () => vendor?.detail?.province ?? vendor?.detail?.region ?? '',
        meta_p2_kodepos: () => vendor?.detail?.postalCode ?? '',
        meta_lokasi: () => (contract as any).location ?? '',
        meta_nilai_transaksi: () => contract.metadata?.meta_harga ?? (contract as any).amount ?? '',
        meta_harga: () => contract.metadata?.meta_harga ?? (contract as any).amount ?? '',
        harga: () => contract.metadata?.meta_harga ?? (contract as any).amount ?? '',
        f2_price: () => contract.metadata?.meta_harga ?? (contract as any).amount ?? '',
        meta_f2_price: () => contract.metadata?.meta_harga ?? (contract as any).amount ?? '',
        meta_mekanisme_pembayaran: () => (contract as any).payment_terms ?? '',
        meta_tax_required: () => ((contract.metadata?.tax_required as any) === true || (contract.metadata?.tax_required as any) === '1' || (contract.metadata?.tax_required as any) === 1 || (contract.metadata?.tax_required as any) === 'Ya') ? 'Ya' : 'Tidak',
        meta_pajak: () => ((contract.metadata?.tax_required as any) === true || (contract.metadata?.tax_required as any) === '1' || (contract.metadata?.tax_required as any) === 1 || (contract.metadata?.tax_required as any) === 'Ya') ? 'Ya' : 'Tidak',
        pajak: () => ((contract.metadata?.tax_required as any) === true || (contract.metadata?.tax_required as any) === '1' || (contract.metadata?.tax_required as any) === 1 || (contract.metadata?.tax_required as any) === 'Ya') ? 'Ya' : 'Tidak',
        tax_required: () => ((contract.metadata?.tax_required as any) === true || (contract.metadata?.tax_required as any) === '1' || (contract.metadata?.tax_required as any) === 1 || (contract.metadata?.tax_required as any) === 'Ya') ? 'Ya' : 'Tidak',
        field_tanggal_mulai: () => contract.contract_date ? String(contract.contract_date).split('T')[0].split(' ')[0] : '',
        field_tanggal_berakhir: () => contract.end_date ? String(contract.end_date).split('T')[0].split(' ')[0] : '',
        field_tanggal_mulai_pelaksanaan_jasa_18: () => contract.contract_date ? String(contract.contract_date).split('T')[0].split(' ')[0] : '',
        field_tanggal_berakhir_pelaksanaan_jasa_19: () => contract.end_date ? String(contract.end_date).split('T')[0].split(' ')[0] : '',
        field_tanggal_mulai_pelaksanaan_jasa_23: () => contract.contract_date ? String(contract.contract_date).split('T')[0].split(' ')[0] : '',
        field_tanggal_berakhir_pelaksanaan_jasa_24: () => contract.end_date ? String(contract.end_date).split('T')[0].split(' ')[0] : '',
        field_tanggal_mulai_berlaku_20: () => contract.contract_date ? String(contract.contract_date).split('T')[0].split(' ')[0] : '',
        field_tanggal_berakhir_21: () => contract.end_date ? String(contract.end_date).split('T')[0].split(' ')[0] : '',
        field_harga_jasa_23: () => contract.metadata?.meta_harga ?? (contract as any).amount ?? '',
        field_harga_jasa_28: () => contract.metadata?.meta_harga ?? (contract as any).amount ?? '',
        field_pajak_26: () => ((contract.metadata?.tax_required as any) === true || (contract.metadata?.tax_required as any) === '1' || (contract.metadata?.tax_required as any) === 1 || (contract.metadata?.tax_required as any) === 'Ya') ? 'Ya' : 'Tidak',
        field_pajak_31: () => ((contract.metadata?.tax_required as any) === true || (contract.metadata?.tax_required as any) === '1' || (contract.metadata?.tax_required as any) === 1 || (contract.metadata?.tax_required as any) === 'Ya') ? 'Ya' : 'Tidak',
    };

    if (resolvers[name]) {
        return resolvers[name]();
    }

    // Fallback to direct metadata match
    if (contract.metadata && (contract.metadata as any)[field.name] !== undefined) {
        const val = (contract.metadata as any)[field.name];
        if (val === null || val === undefined) return '';
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
            return val.split('T')[0];
        }
        return String(val);
    }

    return null;
};
