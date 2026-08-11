import { Contract } from '@/pages/contracts/types';

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
    { key: 'meta_vp_legal', label: 'VP Legal / Management', width: '1/3', type: 'signature_box' },
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

    meta_p2_entity: { label: 'Nama Pihak II (Vendor)', group: 'Para Pihak' },
    meta_p2_signer: { label: 'Penandatangan Pihak II', group: 'Para Pihak' },
    meta_p2_signer_position: { label: 'Jabatan Penandatangan Pihak II', group: 'Para Pihak' },
    meta_p2_alamat: { label: 'Alamat Pihak II', group: 'Para Pihak' },

    meta_nilai_transaksi: { label: 'Harga / Nilai Transaksi', group: 'Detail Kontrak' },
    meta_masa_berlaku: { label: 'Masa Berlaku', group: 'Detail Kontrak' },
    meta_lokasi: { label: 'Lokasi Area', group: 'Detail Kontrak' },
    meta_mekanisme_pembayaran: { label: 'Mekanisme Bayar', group: 'Detail Kontrak' },
    meta_ringkasan_klausul: { label: 'Ringkasan Klausul', group: 'Detail Kontrak' },
    meta_ruang_lingkup: { label: 'Ruang Lingkup', group: 'Detail Kontrak' },
    meta_lampiran: { label: 'Daftar Lampiran', group: 'Detail Kontrak' },
    meta_deskripsi: { label: 'Deskripsi / Keterangan', group: 'Detail Kontrak' },

    meta_pic: { label: 'PIC', group: 'Tanda Tangan & Persetujuan' },
    meta_vp_legal: { label: 'VP Legal / Management', group: 'Tanda Tangan & Persetujuan' },
    meta_manager_legal: { label: 'Manager Legal', group: 'Tanda Tangan & Persetujuan' },
    meta_tax_required: { label: 'Status Pajak', group: 'Tanda Tangan & Persetujuan' },
};

export const getAutofillValue = (field: any, contract: Contract, docType?: 'f1' | 'f2' | 'contract', users: any[] = []) => {
    const name = field.name?.toLowerCase();
    if (!name) return null;

    const vendor = (contract as any)?.vendor;
    const typeObj = (contract as any)?.contract_type;

    const resolvers: Record<string, () => any> = {
        meta_ruang_lingkup: () => {
            if (docType !== 'f2') return null;
            const dateStr = new Date().toLocaleDateString('en-CA');
            return `${contract.contract_no || ''}/${dateStr}/${contract.p1_signer || (contract as any).initiator?.name || ''}`;
        },
        meta_nomor: () => contract.form_no || '',
        meta_no_kontrak: () => contract.contract_no || contract.form_no || '',
        meta_judul_kontrak: () => contract.title || '',
        meta_tipe_perjanjian: () => typeObj?.name || (typeof typeObj === 'string' ? typeObj : ''),
        meta_sub_topik: () => (contract as any).kop_sub_topik || '',
        meta_lampiran: () => {
            const docs = vendor?.documents || [];
            if (!docs.length) return '';
            const docLabels: Record<string, string> = {
                'NIB': 'Nomor Induk Berusaha (NIB)',
                'SIUP': 'Surat Izin Usaha Perdagangan (SIUP)',
                'NPWP': 'Nomor Pokok Wajib Pajak (NPWP)',
                'Akta Pendirian': 'Akta Pendirian Perusahaan',
                'KTP Direktur': 'KTP Direktur / PIC',
                'SPPKP': 'Surat Pengukuhan Pengusaha Kena Pajak (SPPKP)',
            };
            const getDocLabel = (d: any) => docLabels[d.document_type] || d.document_type || d.document_name || d.name || 'Dokumen';
            return docs.length > 3
                ? docs.slice(0, 3).map((d: any, i: number) => `${i + 1}. ${getDocLabel(d)}`).join(', ') + `, dan +${docs.length - 3} lainnya`
                : docs.map((d: any, i: number) => `${i + 1}. ${getDocLabel(d)}`).join(', ');
        },
        meta_tgl_dibuat: () => {
            let dateObj = new Date();
            if (contract.created_at) {
                const parsed = new Date(contract.created_at);
                if (!isNaN(parsed.getTime())) dateObj = parsed;
            }
            const dateStr = dateObj.toLocaleDateString('en-CA');
            const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            return (field.type === 'date' || field.options?.value_type === 'date') ? dateStr : `${dateStr} ${timeStr}`;
        },
        meta_masa_berlaku: () => (contract.contract_date && contract.end_date) ? `${contract.contract_date.split(' ')[0]} s/d ${contract.end_date.split(' ')[0]}` : '',
        meta_p1_entity: () => 'PT. LENTERA TEKNOLOGI',
        meta_p1_signer: () => contract.p1_signer || (contract as any).initiator?.name || '',
        meta_p1_signer_position: () => contract.p1_signer_position || (contract as any).initiator?.role || '',
        meta_p1_alamat: () => 'The Manhattan Square Mid Tower Lt. 12, Jl. TB Simatupang No.1, Jakarta Selatan',
        meta_p2_entity: () => vendor?.name || '',
        meta_p2_signer: () => vendor?.pic_name || '',
        meta_p2_signer_position: () => vendor?.pic_position || '',
        meta_p2_alamat: () => vendor?.address || '',
        meta_lokasi: () => (contract as any).location || '',
        meta_nilai_transaksi: () => contract.metadata?.meta_harga || (contract as any).amount || '',
        meta_harga: () => contract.metadata?.meta_harga || (contract as any).amount || '',
        meta_mekanisme_pembayaran: () => (contract as any).payment_terms || '',
        meta_deskripsi: () => contract.description || '',
        meta_manager_legal: () => (contract.approvals || []).find((a) => a.role === 'CEO')?.approver?.name || '',
        meta_vp_legal: () => (contract.approvals || []).find((a) => a.role === 'VP')?.approver?.name || '',
        meta_tax_required: () => contract.metadata?.tax_required ? 'Ya' : 'Tidak',
    };

    if (resolvers[name]) {
        return resolvers[name]();
    }

    // Fallback to direct metadata match
    if (contract.metadata && (contract.metadata as any)[field.name] !== undefined) {
        const val = (contract.metadata as any)[field.name];
        return val === null ? '' : String(val);
    }

    return null;
};
