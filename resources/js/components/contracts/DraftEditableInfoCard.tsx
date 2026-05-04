import { Avatar } from '@/components/contracts/ui';
import { Contract, ContractType } from '@/types/contracts';
import { Info, Loader2, Check, ChevronUp, ChevronDown, FileText as FileIcon } from 'lucide-react';
import { useEffect, useMemo, useState, useRef } from 'react';
import { ContractReferenceCard } from './ContractReferenceCard';
import { cn } from '@/lib/utils';
import { contractApi } from '@/lib/contract-api';
import { Modal } from '@/components/ui/overlays/Modal';

export interface FormTemplateInfo {
    id: string;
    name: string;
    description: string;
    document_type?: string;
    contract_type_id: string | null;
    contract_type_name: string | null;
    fields_count: number;
}

interface DraftEditableInfoCardProps {
    selected: Contract;
    types: ContractType[];
    submissionTypes: any[];
    vendors: any[];
    formTemplates: FormTemplateInfo[];
    canUpdate: boolean;
    onUpdate: (data: any) => void;
    processing: boolean;
    setPreviewTitle: (v: string) => void;
    setPreviewUrl: (v: string) => void;
    setPreviewHasFile: (v: boolean) => void;
    setPreviewOpen: (v: boolean) => void;
}

export function DraftEditableInfoCard({
    selected,
    types,
    submissionTypes = [],
    vendors = [],
    formTemplates,
    canUpdate,
    onUpdate,
    processing,
    setPreviewTitle,
    setPreviewUrl,
    setPreviewHasFile,
    setPreviewOpen,
}: DraftEditableInfoCardProps) {
    const isDraft = selected.allow_info_edit && canUpdate;
    const [title, setTitle] = useState(selected.title);
    const [description, setDescription] = useState(selected.description || '');
    const [typeId, setTypeId] = useState(() => {
        const t = types.find((x) => x.name === selected.contract_type);
        return t ? String(t.id) : '';
    });
    const [vendorId, setVendorId] = useState(selected.vendor_id || '');
    const [submissionTypeId, setSubmissionTypeId] = useState(selected.submission_type_id || '');
    const [transactionType, setTransactionType] = useState(selected.transaction_type || 'Perjanjian Baru');
    const [kopSubTopik, setKopSubTopik] = useState((selected as any).kop_sub_topik || '');
    const [crownNo, setCrownNo] = useState(selected.crown_no || '');
    const [minimized, setMinimized] = useState(false);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddApproverOpen, setIsAddApproverOpen] = useState(false);
    const [localSelectedUsers, setLocalSelectedUsers] = useState<string[]>([]);

    useEffect(() => {
        if (isAddApproverOpen) {
            setLocalSelectedUsers(selected.metadata?.custom_management_users || []);
        }
    }, [isAddApproverOpen, selected.metadata?.custom_management_users]);

    useEffect(() => {
        contractApi.getUsers().then(setAllUsers).catch(console.error);
    }, []);

    useEffect(() => {
        setTitle(selected.title);
        setDescription(selected.description || '');
        const t = types.find((x) => x.name === selected.contract_type);
        setTypeId(t ? String(t.id) : '');
        setVendorId(selected.vendor_id || '');
        setSubmissionTypeId(selected.submission_type_id || '');
        setTransactionType(selected.transaction_type || 'Perjanjian Baru');
        setKopSubTopik((selected as any).kop_sub_topik || '');
        setCrownNo(selected.crown_no || '');
    }, [
        selected.id,
        selected.title,
        selected.description,
        selected.contract_type,
        selected.vendor_id,
        selected.submission_type_id,
        selected.transaction_type,
        selected.crown_no,
        (selected as any).kop_sub_topik,
        types,
    ]);

    const autoSaveTimerRef = useRef<any>(null);
    const [localSaving, setLocalSaving] = useState(false);

    const hasChanges = useMemo(() => {
        const origType = types.find((x) => x.name === selected.contract_type);
        const origTypeId = origType ? String(origType.id) : '';
        return (
            title !== selected.title ||
            description !== (selected.description || '') ||
            typeId !== origTypeId ||
            vendorId !== (selected.vendor_id || '') ||
            submissionTypeId !== (selected.submission_type_id || '') ||
            transactionType !== (selected.transaction_type || 'Perjanjian Baru') ||
            crownNo !== (selected.crown_no || '') ||
            kopSubTopik !== ((selected as any).kop_sub_topik || '')
        );
    }, [title, description, typeId, vendorId, submissionTypeId, transactionType, crownNo, kopSubTopik, selected, types]);

    // Debounced Auto-Save for Contract Metadata
    useEffect(() => {
        if (!isDraft) return;

        if (hasChanges && title.trim()) {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = setTimeout(async () => {
                setLocalSaving(true);
                try {
                    await onUpdate({
                        title,
                        description,
                        contract_type_id: typeId || undefined,
                        vendor_id: vendorId || undefined,
                        submission_type_id: submissionTypeId || undefined,
                        transaction_type: transactionType,
                        kop_sub_topik: kopSubTopik,
                        crown_no: crownNo,
                    });
                } finally {
                    setLocalSaving(false);
                }
            }, 3000); // 3 second debounce
        }

        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, [
        title,
        description,
        typeId,
        vendorId,
        submissionTypeId,
        transactionType,
        kopSubTopik,
        crownNo,
        isDraft,
        onUpdate,
    ]);

    const inputCls =
        'w-full bg-black/[0.03] dark:bg-white/[0.03] rounded-lg px-3 py-1.5 text-sm text-black dark:text-white outline-none focus:bg-white dark:focus:bg-sidebar transition-all shadow-sm';

    const f2Version = selected.versions?.filter((x) => x.document_type === 'f2').sort((a, b) => b.version_no - a.version_no)[0];

    const filterTypeId = isDraft ? typeId : selected.contract_type_id ? String(selected.contract_type_id) : '';
    const tpl = formTemplates.find(
        (ft) => ft.document_type === 'f1' && (ft.contract_type_id === filterTypeId || ft.contract_type_name === selected.contract_type),
    );

    return (
        <div className="bg-card text-foreground overflow-hidden rounded-xl border border-border shadow-sm">
            <div className="flex h-12 items-center justify-between bg-muted/40 px-4 border-b border-border">
                <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                    <Info size={16} className="text-primary" /> Informasi Kontrak
                    {isDraft && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            Editable
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {isDraft && (
                        <div className="flex items-center gap-2 px-2">
                            {localSaving ? (
                                <>
                                    <Loader2 size={12} className="animate-spin text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Menyimpan...</span>
                                </>
                            ) : hasChanges ? (
                                <>
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    <span className="text-xs text-muted-foreground">Berubah</span>
                                </>
                            ) : (
                                <>
                                    <Check size={12} className="text-emerald-500" />
                                    <span className="text-xs text-muted-foreground">Tersimpan</span>
                                </>
                            )}
                        </div>
                    )}
                    <button
                        onClick={() => setMinimized(!minimized)}
                        className="text-muted-foreground hover:text-foreground transition-all active:scale-95"
                    >
                        {minimized ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                </div>
            </div>
            {!minimized && (
                <div className="p-4 grid grid-cols-1 gap-4">
                    <div>
                        <div className="text-muted-foreground font-semibold text-xs mb-1">
                            No. Pengajuan
                        </div>
                        <span className="rounded bg-muted px-3 py-1.5 font-mono font-bold text-foreground inline-block shadow-sm text-sm">
                            {selected.contract_no}
                        </span>
                    </div>

                    {isDraft ? (
                        <div className="col-span-full">
                            <div className="text-muted-foreground font-semibold text-xs mb-1">
                                Judul Kontrak
                            </div>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Nama kontrak..."
                                className={inputCls + ' font-medium text-sm'}
                            />
                        </div>
                    ) : null}

                    <div className="flex flex-col gap-4">
                        <div>
                            <div className="text-muted-foreground font-semibold text-xs mb-1">
                                No. Kontrak
                            </div>
                            {isDraft ? (
                                <input
                                    value={crownNo}
                                    onChange={(e) => setCrownNo(e.target.value)}
                                    placeholder="CROWN-XXX..."
                                    className={inputCls + ' font-mono font-bold text-sm'}
                                />
                            ) : (
                                <span className="rounded bg-muted px-3 py-1.5 font-mono font-bold text-foreground inline-block shadow-sm text-sm">
                                    {selected.crown_no || '—'}
                                </span>
                            )}
                        </div>

                        <div>
                            <div className="text-muted-foreground font-semibold text-xs mb-1">
                                Sifat Kontrak
                            </div>
                            {isDraft ? (
                                <select value={transactionType} onChange={(e) => setTransactionType(e.target.value)} className={inputCls}>
                                    <option value="Perjanjian Baru">Perjanjian Baru</option>
                                    <option value="Perpanjangan">Perpanjangan</option>
                                    <option value="Addendum">Addendum</option>
                                    <option value="Amandemen">Amandemen</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            ) : (
                                <span className="text-sm font-semibold text-foreground">
                                    {selected.transaction_type || '—'}
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="text-muted-foreground font-semibold text-xs mb-1">
                            Jenis Kontrak
                        </div>
                        {isDraft ? (
                            <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className={inputCls}>
                                <option value="">Pilih Tipe</option>
                                {Array.isArray(types) && types.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                                {selected.contract_type}
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="text-muted-foreground font-semibold text-xs mb-1">
                            Perjanjian
                        </div>
                        {isDraft ? (
                            <select value={submissionTypeId} onChange={(e) => setSubmissionTypeId(e.target.value)} className={inputCls}>
                                <option value="">Pilih Tipe</option>
                                {Array.isArray(submissionTypes) && submissionTypes.map((st) => (
                                    <option key={st.id} value={st.id}>
                                        {st.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <span className="text-foreground font-medium text-sm">{selected.submission_type || '—'}</span>
                        )}
                    </div>

                    <div>
                        <div className="text-muted-foreground font-semibold text-xs mb-1">
                            Pihak Kedua (Vendor)
                        </div>
                        {isDraft ? (
                            <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className={inputCls}>
                                <option value="">Pilih Vendor</option>
                                {Array.isArray(vendors) && vendors.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {v.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                                {(selected as any).vendor?.name || '-'}
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="text-muted-foreground font-semibold text-xs mb-1">
                            Dibuat Oleh
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Avatar user={selected.creator} size="sm" />
                            <span className="text-foreground font-medium text-sm">{selected.creator?.name}</span>
                        </div>
                    </div>

                    <div>
                        <div className="text-muted-foreground font-semibold text-xs mb-1">
                            Tgl Dibuat
                        </div>
                        <span className="text-foreground font-medium text-sm">{selected.created_at}</span>
                    </div>

                    {selected.workflow_step && (
                        <div className="col-span-full border-t border-border pt-4">
                            <div className="mb-2 text-xs font-semibold text-muted-foreground">
                                Posisi Kontrak Saat Ini (Workflow)
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 rounded-xl shadow-sm animate-in fade-in">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                    <i className="fa-solid fa-clock animate-pulse text-sm" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                        Sedang Di: {selected.workflow_step.description}
                                    </span>
                                    <span className="text-xs text-amber-600/70 dark:text-amber-400/70 font-semibold">
                                        Peran: {selected.workflow_step.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {isDraft ? (
                        <div className="col-span-full border-t border-border pt-4 mt-2">
                            <div className="mb-4 p-3.5 bg-muted/30 border border-border rounded-xl">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-foreground">Review Kepatuhan Pajak</span>
                                        <span className="text-xs text-muted-foreground mt-0.5">Sertakan departemen pajak dalam alur persetujuan</span>
                                    </div>
                                    <input 
                                        type="checkbox"
                                        checked={!!selected.metadata?.tax_required}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            onUpdate({ metadata: { ...selected.metadata, tax_required: isChecked } });
                                        }}
                                        className="w-4 h-4 accent-primary cursor-pointer"
                                    />
                                </label>
                            </div>

                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold text-muted-foreground">
                                    Disetujui
                                </span>
                                <button 
                                    type="button"
                                    onClick={() => setIsAddApproverOpen(true)}
                                    className="text-xs font-bold text-primary hover:text-primary-hover transition-colors flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg"
                                >
                                    + tambah
                                </button>
                            </div>

                            <div className="space-y-2">
                                {selected.metadata?.custom_management_users && selected.metadata.custom_management_users.length > 0 ? (
                                    selected.metadata.custom_management_users.map((userId: string, idx: number) => {
                                        const approval = selected.approvals?.find(a => a.user_id === userId);
                                        const userObj = allUsers.find(u => u.id === userId);
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border animate-in fade-in">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-foreground">
                                                        {userObj ? userObj.name : approval ? approval.approver_name : `User ID: ${userId}`}
                                                    </span>
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        {userObj ? `${userObj.department?.name || userObj.department_name || ''} • ${userObj.role}` : approval ? approval.role : 'COO/VP/Deputy'}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const currentUsers = selected.metadata?.custom_management_users || [];
                                                        const newUsers = currentUsers.filter((id: string) => id !== userId);
                                                        onUpdate({ metadata: { ...selected.metadata, custom_management_users: newUsers } });
                                                    }}
                                                    className="text-red-500 hover:text-red-600 p-1 transition-colors"
                                                >
                                                    <i className="fa-solid fa-trash-can text-xs" />
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-3 text-center text-xs text-muted-foreground italic">
                                        Belum ada approver tambahan yang ditambahkan.
                                    </div>
                                )}
                            </div>

                            {/* Modal to add custom management approvers */}
                            <Modal
                                isOpen={isAddApproverOpen}
                                onClose={() => setIsAddApproverOpen(false)}
                                title="Tambah Approver Manajemen"
                                description="Pilih hingga maksimal 3 orang sebagai approver tambahan untuk persetujuan manajemen."
                                maxWidth="md"
                            >
                                <div className="space-y-4">
                                    {/* Search Input */}
                                    <div className="relative">
                                        <input 
                                            type="text"
                                            placeholder="Cari nama, departemen, atau peran..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-card border border-border h-10 px-3 text-sm font-medium rounded-lg appearance-none focus:ring-1 focus:ring-primary transition-all outline-none text-foreground"
                                        />
                                    </div>

                                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                        {allUsers
                                            .filter(u => u.role !== 'Vendor' && u.role?.toLowerCase() !== 'staff')
                                            .filter(u => !searchQuery || u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.role?.toLowerCase().includes(searchQuery.toLowerCase()) || u.department?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map((u: any) => {
                                                const isSelected = localSelectedUsers.includes(u.id);
                                                return (
                                                    <label 
                                                        key={u.id}
                                                        className={cn(
                                                            "flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all hover:bg-muted/30",
                                                            isSelected 
                                                                ? "bg-primary/5 border-primary" 
                                                                : "border-border bg-card"
                                                        )}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-semibold text-foreground">{u.name}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {u.department?.name ? `${u.department.name} • ` : u.department_name ? `${u.department_name} • ` : ''}{u.role}
                                                            </span>
                                                        </div>
                                                        <input 
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => {
                                                                if (isSelected) {
                                                                    setLocalSelectedUsers(localSelectedUsers.filter(id => id !== u.id));
                                                                } else {
                                                                    if (localSelectedUsers.length >= 3) {
                                                                        alert('Maksimal 3 orang approver tambahan.');
                                                                        return;
                                                                    }
                                                                    setLocalSelectedUsers([...localSelectedUsers, u.id]);
                                                                }
                                                            }}
                                                            className="w-4 h-4 accent-primary cursor-pointer"
                                                        />
                                                    </label>
                                                );
                                            })}
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddApproverOpen(false)}
                                            className="px-4 h-9 text-xs font-bold text-muted-foreground hover:text-foreground"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onUpdate({ metadata: { ...selected.metadata, custom_management_users: localSelectedUsers } });
                                                setIsAddApproverOpen(false);
                                            }}
                                            className="px-5 h-9 bg-primary text-white text-xs font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow"
                                        >
                                            Simpan
                                        </button>
                                    </div>
                                </div>
                            </Modal>
                        </div>
                    ) : (
                        selected.metadata?.custom_management_users && Array.isArray(selected.metadata.custom_management_users) && selected.metadata.custom_management_users.length > 0 && (
                            <div className="col-span-full border-t border-border pt-4 mt-2">
                                <div className="mb-3 text-xs font-semibold text-muted-foreground">
                                    Disetujui
                                </div>
                                <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-2 animate-in fade-in">
                                    {selected.metadata.custom_management_users.map((userId: string, idx: number) => {
                                        const approval = selected.approvals?.find(a => a.user_id === userId);
                                        const userObj = allUsers.find(u => u.id === userId);
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-foreground">
                                                        {userObj ? userObj.name : approval ? approval.approver_name : `User ID: ${userId}`}
                                                    </span>
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        {userObj ? `${userObj.department?.name || userObj.department_name || ''} • ${userObj.role}` : approval ? approval.role : 'COO/VP/Deputy'}
                                                    </span>
                                                </div>
                                                <span className={cn(
                                                    "text-xs font-semibold px-2 py-0.5 rounded",
                                                    approval?.status === 'approved' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400" :
                                                    approval?.status === 'rejected' ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400" :
                                                    "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                                                )}>
                                                    {approval ? approval.status : 'pending'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
