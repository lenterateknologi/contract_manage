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

/**
 * Fuzzy matching helper to autofill F1 form fields from general contract data.
 */
export const getAutofillValue = (field: any, contract: Contract, docType?: 'f1' | 'f2' | 'contract', users: any[] = []) => {
    const name = field.name.toLowerCase();

    // Special Case: F2 Ruang Lingkup composite
    if (name === 'meta_ruang_lingkup' && docType === 'f2') {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
        const crownNo = contract.contract_no || '';
        const signer = contract.p1_signer || (contract as any).initiator?.name || '';
        return `${crownNo}/${dateStr}/${signer}`;
    }

    // 1. Identification / Metadata
    if (name === 'meta_nomor') return contract.form_no || '';
    if (name === 'meta_nomor_kontrak' || name === 'meta_no_kontrak' || name === 'meta_no_pengajuan')
        return contract.contract_no || contract.form_no || '';
    if (name === 'meta_judul' || name === 'meta_judul_kontrak' || name === 'meta_nama_kontrak') return contract.title || '';
    if (name === 'meta_topik' || name === 'meta_jenis_kontrak') {
        const type = (contract as any).contract_type;
        return type?.name || (typeof type === 'string' ? type : '');
    }
    if (name === 'meta_sub_topik' || name === 'meta_kop_sub_topik') return (contract as any).kop_sub_topik || '';
    if (name === 'meta_lampiran') {
        const vendor = (contract as any).vendor;
        const docs = vendor?.documents || [];
        if (docs.length === 0) return '';
        
        const docLabels: Record<string, string> = {
            'NIB': 'Nomor Induk Berusaha (NIB)',
            'SIUP': 'Surat Izin Usaha Perdagangan (SIUP)',
            'NPWP': 'Nomor Pokok Wajib Pajak (NPWP)',
            'Akta Pendirian': 'Akta Pendirian Perusahaan',
            'KTP Direktur': 'KTP Direktur / PIC',
            'SPPKP': 'Surat Pengukuhan Pengusaha Kena Pajak (SPPKP)',
        };

        const getDocLabel = (d: any) => docLabels[d.document_type] || d.document_type || d.document_name || d.name || 'Dokumen';

        if (docs.length > 3) {
            return (
                docs
                    .slice(0, 3)
                    .map((d: any, i: number) => `${i + 1}. ${getDocLabel(d)}`)
                    .join(', ') + `, dan +${docs.length - 3} lainnya`
            );
        }
        return docs.map((d: any, i: number) => `${i + 1}. ${getDocLabel(d)}`).join(', ');
    }

    // 2. Dates
    if (name === 'meta_tgl_dibuat' || name === 'tanggal' || name === 'meta_tanggal') {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
        const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const isDateField = field.type === 'date' || field.options?.value_type === 'date';
        return isDateField ? dateStr : `${dateStr} ${timeStr}`;
    }
    if (name === 'meta_masa_berlaku') {
        if (contract.contract_date && contract.end_date) {
            return `${contract.contract_date.split(' ')[0]} s/d ${contract.end_date.split(' ')[0]}`;
        }
        return '';
    }

    // 3. Parties & Metadata
    if (name === 'meta_p1_entity') return 'PT. LENTERA TEKNOLOGI';
    if (name === 'meta_type' || name === 'meta_tipe_perjanjian') return (contract as any).submission_type || '';
    if (name === 'meta_perjanjian') return (contract as any).submission_type || '';
    if (name === 'meta_p1_signer') return contract.p1_signer || (contract as any).initiator?.name || '';
    if (name === 'meta_p1_signer_position') return contract.p1_signer_position || (contract as any).initiator?.role || '';
    if (name === 'meta_p1_alamat') return 'The Manhattan Square Mid Tower Lt. 12, Jl. TB Simatupang No.1, Jakarta Selatan';

    const vendor = (contract as any).vendor;
    if (name === 'meta_p2_entity' || name === 'meta_vendor_name') return vendor?.name || '';
    if (name === 'meta_p2_signer') return vendor?.pic_name || '';
    if (name === 'meta_p2_signer_position') return vendor?.pic_position || '';
    if (name === 'meta_p2_alamat') return vendor?.address || '';

    if (name === 'meta_lokasi') return (contract as any).location || '';
    if (name === 'meta_nilai_transaksi' || name === 'meta_amount') return (contract as any).amount || '';
    if (name === 'meta_mekanisme_pembayaran') return (contract as any).payment_terms || '';
    if (name === 'meta_deskripsi' || name === 'keterangan') return contract.description || '';

    if (name === 'contract_no' || name === 'meta_no_kontrak') return contract.contract_no || contract.form_no || '';

    // 4. Management Approvers for Signature Boxes
    if (name === 'meta_manager_legal') {
        const approvals = contract.approvals || [];
        const ceoApproval = approvals.find((a) => a.role === 'CEO');
        if (ceoApproval) {
            return ceoApproval.approver?.name || ceoApproval.approver_name || ceoApproval.target_approvers || '';
        }
        return '';
    }

    if (name === 'meta_vp_legal') {
        const approvals = contract.approvals || [];
        const vpApproval = approvals.find((a) => a.role === 'VP');
        if (vpApproval) {
            return vpApproval.approver?.name || vpApproval.approver_name || vpApproval.target_approvers || '';
        }
        return '';
    }

    // 5. Tax Requirement
    if (name === 'meta_tax_required' || name === 'meta_pajak') {
        return contract.metadata?.tax_required ? 'Ya' : 'Tidak';
    }

    // Fallback to direct metadata match
    if (contract.metadata && (contract.metadata as any)[field.name] !== undefined) {
        const val = (contract.metadata as any)[field.name];
        return val === null ? '' : String(val);
    }

    return null;
};
