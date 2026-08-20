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
