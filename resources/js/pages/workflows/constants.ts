import { CheckCircle2, FileSignature, Settings2, UserCheck, XCircle } from 'lucide-react';

export const AVAILABLE_FIELDS = [
    { value: 'f1', label: 'Sub-dokumen F1 (Permohonan)' },
    { value: 'f2', label: 'Sub-dokumen F2 (Ringkasan)' },
    { value: 'agreement', label: 'Sub-dokumen Perjanjian / Draft' },
];

export const AUTOFILLED_PARAMS = [
    { value: 'received_at', label: 'Isi Waktu diterima' },
    { value: 'assigned_at', label: 'Isi Waktu ditugaskan' },
    { value: 'finished_at', label: 'Isi Waktu diselesaikan' },
    { value: 'closed_at', label: 'Isi Waktu ditutup' },
    { value: 'received_at-null', label: 'Kosongkan Waktu diterima' },
    { value: 'assigned_at-null', label: 'Kosongkan Waktu ditugaskan' },
    { value: 'finished_at-null', label: 'Kosongkan Waktu diselesaikan' },
    { value: 'closed_at-null', label: 'Kosongkan Waktu ditutup' },
    { value: 'renew_number', label: 'Pembuatan nomor baru' },
];

export const MASTER_ACTIONS = [
    { id: 'approve', code: 'approve', name: 'Setujui' },
    { id: 'reject', code: 'reject', name: 'Tolak' },
    { id: 'assign', code: 'assign', name: 'Tugaskan' },
    { id: 'signature', code: 'signature', name: 'Upload Tanda Tangan' },
    { id: 'forward', code: 'forward', name: 'Approval Tambahan' },
];

export const ALL_ROLES = [
    { value: 'initiator', label: 'INISIATOR (PIC / PEMBUAT)' },
    { value: 'pic', label: 'PIC DITUGASKAN' },
    { value: 'legal', label: 'LEGAL STAFF' },
    { value: 'manager_legal', label: 'MANAGER LEGAL' },
    { value: 'vp_legal', label: 'VP LEGAL / MANAGEMENT' },
    { value: 'vendor', label: 'VENDOR / PIHAK LUAR' },
];

export const APPROVER_TYPE_STYLES: Record<string, string> = {
    initiator: 'border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-800/50 dark:bg-blue-950/30 dark:text-blue-400',
    assigned_pic: 'border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-800/50 dark:bg-indigo-950/30 dark:text-indigo-400',
    user: 'border-teal-100 bg-teal-50 text-teal-600 dark:border-teal-800/50 dark:bg-teal-950/30 dark:text-teal-400',
    role: 'border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-400',
};

export const TRANSITION_OPTIONS = [
    { value: 'sequential', label: 'Langkah + 1 (Default)' },
    { value: 'stay', label: 'Tetap di Langkah Saat Ini (Stay)' },
    { value: 'back', label: 'Langkah - 1 (Back)' },
    { value: 'initial_step', label: 'Langkah awal' },
    { value: 'absolute', label: 'Langkah Spesifik Alur Kerja Ini' },
    { value: 'cross_workflow', label: 'Langkah ke Workflow N & Step N' },
];

export const ACTION_THEMES: Record<string, { color: string; icon: any; actionType: string }> = {
    approve: { color: 'bg-emerald-600 hover:bg-emerald-700', icon: CheckCircle2, actionType: 'approve' },
    reject: { color: 'bg-rose-500 hover:bg-rose-600', icon: XCircle, actionType: 'reject' },
    assign_pic: { color: 'bg-blue-600 hover:bg-blue-700', icon: UserCheck, actionType: 'assign_pic' },
    assign: { color: 'bg-blue-600 hover:bg-blue-700', icon: UserCheck, actionType: 'assign_pic' },
    sign: { color: 'bg-amber-600 hover:bg-amber-700', icon: FileSignature, actionType: 'sign' },
    forward: { color: 'bg-indigo-500 hover:bg-indigo-600', icon: UserCheck, actionType: 'forward' },
};

export function getActionTheme(code: string) {
    const cleanCode = code.toLowerCase();
    if (cleanCode === 'approve') return ACTION_THEMES.approve;
    if (cleanCode === 'reject') return ACTION_THEMES.reject;
    if (cleanCode === 'assign_pic' || cleanCode === 'assign') return ACTION_THEMES.assign;
    if (cleanCode.includes('sign') || cleanCode.includes('tangan') || cleanCode.includes('paraf')) return ACTION_THEMES.sign;
    if (cleanCode === 'forward' || cleanCode === 'add_adhoc') return ACTION_THEMES.forward;

    return {
        color: 'bg-slate-600 hover:bg-slate-700',
        icon: Settings2,
        actionType: cleanCode,
    };
}

export const BUILTIN_STEP_TEMPLATES = [
    {
        id: 'template_atasan_approval',
        name: 'Persetujuan Atasan Langsung',
        category: 'Persetujuan',
        description: 'Tahap verifikasi dan persetujuan dari atasan langsung inisiator sebelum diajukan ke unit terkait.',
        step_data: {
            description: 'Persetujuan Atasan Langsung',
            approver_type: 'initiator',
            approver_config: {
                custom: ['atasan'],
                roles: [],
                departments: [],
                users: [],
                is_default: false,
            },
            actions: [
                {
                    action_code: 'approve',
                    name: 'Setujui Pengajuan',
                    transition_type: 'sequential',
                    is_active: true,
                },
                {
                    action_code: 'reject',
                    name: 'Tolak / Minta Revisi',
                    transition_type: 'back',
                    is_active: true,
                },
            ],
            meta: {
                target_status: 'IN_REVIEW',
            },
        },
    },
    {
        id: 'template_legal_review',
        name: 'Penelaahan & Verifikasi Legal',
        category: 'Legal',
        description: 'Pemeriksaan kepatuhan hukum, syarat & ketentuan, serta klausul perjanjian oleh tim Legal.',
        step_data: {
            description: 'Penelaahan Dokumen oleh Tim Legal',
            approver_type: 'role',
            approver_config: {
                custom: [],
                roles: ['legal', 'manager_legal'],
                departments: [],
                users: [],
                is_default: false,
            },
            role: ['legal', 'manager_legal'],
            actions: [
                {
                    action_code: 'approve',
                    name: 'Setujui Legalitas Draft',
                    transition_type: 'sequential',
                    is_active: true,
                },
                {
                    action_code: 'reject',
                    name: 'Kembalikan untuk Perbaikan',
                    transition_type: 'back',
                    is_active: true,
                },
                {
                    action_code: 'assign',
                    name: 'Tugaskan ke Legal Staff Spesifik',
                    transition_type: 'stay',
                    is_active: true,
                },
            ],
            meta: {
                target_status: 'LEGAL_REVIEW',
            },
        },
    },
    {
        id: 'template_pic_assignment',
        name: 'Penugasan PIC Penanggung Jawab',
        category: 'Penugasan',
        description: 'Tahap penunjukan PIC atau penanggung jawab kontrak untuk mengawal proses hingga selesai.',
        step_data: {
            description: 'Penugasan PIC Penanggung Jawab',
            approver_type: 'role',
            approver_config: {
                custom: [],
                roles: ['manager_legal', 'vp_legal'],
                departments: [],
                users: [],
                is_default: false,
            },
            role: ['manager_legal', 'vp_legal'],
            actions: [
                {
                    action_code: 'assign',
                    name: 'Tugaskan PIC',
                    transition_type: 'sequential',
                    is_active: true,
                },
            ],
            meta: {
                target_status: 'ASSIGNED',
            },
        },
    },
    {
        id: 'template_finance_review',
        name: 'Verifikasi Finansial & Anggaran',
        category: 'Keuangan',
        description: 'Pemeriksaan kelayakan anggaran, nilai transaksi, dan termin pembayaran oleh Keuangan.',
        step_data: {
            description: 'Verifikasi Finansial & Anggaran',
            approver_type: 'role',
            approver_config: {
                custom: [],
                roles: ['finance', 'billing', 'accounting'],
                departments: [],
                users: [],
                is_default: false,
            },
            role: ['finance', 'billing', 'accounting'],
            actions: [
                {
                    action_code: 'approve',
                    name: 'Setujui Aspek Keuangan',
                    transition_type: 'sequential',
                    is_active: true,
                },
                {
                    action_code: 'reject',
                    name: 'Tolak / Revisi Anggaran',
                    transition_type: 'back',
                    is_active: true,
                },
            ],
            meta: {
                target_status: 'FINANCE_REVIEW',
            },
        },
    },
    {
        id: 'template_director_signing',
        name: 'Penandatanganan Direksi / Signer',
        category: 'Tanda Tangan',
        description: 'Tahap final penandatanganan dokumen kontrak oleh Direksi atau pihak berwenang.',
        step_data: {
            description: 'Penandatanganan oleh Direksi / Authorized Signer',
            approver_type: 'role',
            approver_config: {
                custom: [],
                roles: ['director', 'vp_legal'],
                departments: [],
                users: [],
                is_default: false,
            },
            role: ['director', 'vp_legal'],
            actions: [
                {
                    action_code: 'signature',
                    name: 'Tanda Tangani & Upload Dokumen',
                    transition_type: 'sequential',
                    is_active: true,
                },
                {
                    action_code: 'reject',
                    name: 'Tolak Penandatanganan',
                    transition_type: 'back',
                    is_active: true,
                },
            ],
            meta: {
                target_status: 'SIGNING',
            },
        },
    },
];
