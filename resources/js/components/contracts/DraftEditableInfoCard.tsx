import { Avatar } from '@/components/contracts/ui';
import { Modal } from '@/components/ui/overlays/Modal';
import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { Contract, ContractType } from '@/types/contracts';
import { Check, ChevronDown, ChevronUp, Info, Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

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
    const [taxRequired, setTaxRequired] = useState<boolean>(() => !!selected.metadata?.tax_required);

    useEffect(() => {
        setTaxRequired(!!selected.metadata?.tax_required);
    }, [selected.metadata?.tax_required]);

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
    }, [title, description, typeId, vendorId, submissionTypeId, transactionType, kopSubTopik, crownNo, isDraft, onUpdate]);

    const inputCls =
        'w-full bg-black/[0.03] dark:bg-white/[0.05] border border-border/50 rounded-lg px-3 py-1.5 text-sm text-foreground dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 transition-all shadow-sm';

    const f2Version = selected.versions?.filter((x) => x.document_type === 'f2').sort((a, b) => b.version_no - a.version_no)[0];

    const filterTypeId = isDraft ? typeId : selected.contract_type_id ? String(selected.contract_type_id) : '';
    const tpl = formTemplates.find(
        (ft) => ft.document_type === 'f1' && (ft.contract_type_id === filterTypeId || ft.contract_type_name === selected.contract_type),
    );

    return (
        <div className="bg-card text-foreground border-border overflow-hidden rounded-xl border shadow-sm">
            <div className="bg-primary flex h-12 items-center justify-between px-4 dark:bg-white border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2 font-semibold text-white text-sm dark:text-black">
                    <Info size={16} className="text-white/70 dark:text-black/70" /> Informasi Kontrak
                    {isDraft && <span className="bg-white/20 text-white dark:bg-black/10 dark:text-black rounded-full px-2 py-0.5 text-xs font-semibold">Editable</span>}
                </div>
                <div className="flex items-center gap-2">
                    {isDraft && (
                        <div className="flex items-center gap-2 px-2">
                            {localSaving ? (
                                <>
                                    <Loader2 size={12} className="text-white/70 dark:text-black/60 animate-spin" />
                                    <span className="text-white/70 dark:text-black/60 text-xs">Menyimpan...</span>
                                </>
                            ) : hasChanges ? (
                                <>
                                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                                    <span className="text-white/70 dark:text-black/60 text-xs">Berubah</span>
                                </>
                            ) : (
                                <>
                                    <Check size={12} className="text-emerald-300 dark:text-emerald-600" />
                                    <span className="text-white/70 dark:text-black/60 text-xs">Tersimpan</span>
                                </>
                            )}
                        </div>
                    )}
                    <button
                        onClick={() => setMinimized(!minimized)}
                        className="text-white/70 hover:text-white dark:text-black/60 dark:hover:text-black transition-all active:scale-95"
                    >
                        {minimized ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                </div>
            </div>
            {!minimized && (
                <div className="grid grid-cols-1 gap-4 p-4">
                    <div>
                        <div className="text-muted-foreground mb-1 text-xs font-semibold">No. Pengajuan</div>
                        <span className="bg-muted text-foreground inline-block rounded px-3 py-1.5 font-mono text-sm font-bold shadow-sm">
                            {selected.contract_no}
                        </span>
                    </div>

                    {isDraft ? (
                        <div className="col-span-full">
                            <div className="text-muted-foreground mb-1 text-xs font-semibold">Judul Kontrak</div>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Nama kontrak..."
                                className={inputCls + ' text-sm font-medium'}
                            />
                        </div>
                    ) : null}

                    <div className="flex flex-col gap-4">
                        <div>
                            <div className="text-muted-foreground mb-1 text-xs font-semibold">No. Kontrak</div>
                            {isDraft ? (
                                <input
                                    value={crownNo}
                                    onChange={(e) => setCrownNo(e.target.value)}
                                    placeholder="CROWN-XXX..."
                                    className={inputCls + ' font-mono text-sm font-bold'}
                                />
                            ) : (
                                <span className="bg-muted text-foreground inline-block rounded px-3 py-1.5 font-mono text-sm font-bold shadow-sm">
                                    {selected.crown_no || '—'}
                                </span>
                            )}
                        </div>

                        <div>
                            <div className="text-muted-foreground mb-1 text-xs font-semibold">Sifat Kontrak</div>
                            {isDraft ? (
                                <select value={transactionType} onChange={(e) => setTransactionType(e.target.value)} className={inputCls}>
                                    <option value="Perjanjian Baru">Perjanjian Baru</option>
                                    <option value="Perpanjangan">Perpanjangan</option>
                                    <option value="Addendum">Addendum</option>
                                    <option value="Amandemen">Amandemen</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            ) : (
                                <span className="text-foreground text-sm font-semibold">{selected.transaction_type || '—'}</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="text-muted-foreground mb-1 text-xs font-semibold">Jenis Kontrak</div>
                        {isDraft ? (
                            <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className={inputCls}>
                                <option value="">Pilih Tipe</option>
                                {Array.isArray(types) &&
                                    types.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                            </select>
                        ) : (
                            <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
                                {selected.contract_type}
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="text-muted-foreground mb-1 text-xs font-semibold">Perjanjian</div>
                        {isDraft ? (
                            <select value={submissionTypeId} onChange={(e) => setSubmissionTypeId(e.target.value)} className={inputCls}>
                                <option value="">Pilih Tipe</option>
                                {Array.isArray(submissionTypes) &&
                                    submissionTypes.map((st) => (
                                        <option key={st.id} value={st.id}>
                                            {st.name}
                                        </option>
                                    ))}
                            </select>
                        ) : (
                            <span className="text-foreground text-sm font-medium">{selected.submission_type || '—'}</span>
                        )}
                    </div>

                    <div>
                        <div className="text-muted-foreground mb-1 text-xs font-semibold">Pihak Kedua (Vendor)</div>
                        {isDraft ? (
                            <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className={inputCls}>
                                <option value="">Pilih Vendor</option>
                                {Array.isArray(vendors) &&
                                    vendors.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.name}
                                        </option>
                                    ))}
                            </select>
                        ) : (
                            <span className="bg-muted text-foreground rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
                                {(selected as any).vendor?.name || '-'}
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="text-muted-foreground mb-1 text-xs font-semibold">Dibuat Oleh</div>
                        <div className="flex items-center gap-1.5">
                            <Avatar user={selected.creator} size="sm" />
                            <span className="text-foreground text-sm font-medium">{selected.creator?.name}</span>
                        </div>
                    </div>

                    <div>
                        <div className="text-muted-foreground mb-1 text-xs font-semibold">Tgl Dibuat</div>
                        <span className="text-foreground text-sm font-medium">{selected.created_at}</span>
                    </div>

                    {selected.workflow_step && (
                        <div className="border-border col-span-full border-t pt-4">
                            <div className="text-muted-foreground mb-2 text-xs font-semibold">Posisi Kontrak Saat Ini (Workflow)</div>
                            <div className="animate-in fade-in flex items-center gap-2 rounded-xl border border-amber-200/50 bg-amber-50 p-3 shadow-sm dark:border-amber-800/30 dark:bg-amber-950/20">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                                    <i className="fa-solid fa-clock animate-pulse text-sm" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                        Sedang Di: {selected.workflow_step.description}
                                    </span>
                                    <span className="text-xs font-semibold text-amber-600/70 dark:text-amber-400/70">
                                        Peran: {selected.workflow_step.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {isDraft ? (
                        <div className="border-border col-span-full mt-2 border-t pt-4">
                            <div className="bg-muted/40 border-border mb-4 rounded-lg border p-2.5">
                                <label className="flex cursor-pointer items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-foreground text-sm font-bold">Ada Pajak</span>
                                        <span className="text-muted-foreground mt-0.5 text-xs font-medium">
                                            Aktifkan jika kontrak dikenakan pajak
                                        </span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={taxRequired}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            setTaxRequired(isChecked);
                                            onUpdate({ metadata: { ...selected.metadata, tax_required: isChecked } });
                                        }}
                                        className="accent-primary h-4 w-4 cursor-pointer"
                                    />
                                </label>
                            </div>

                            <div className="mb-2.5 flex items-center justify-between border-b border-border/40 pb-2">
                                <span className="text-foreground text-xs font-bold">Pilih Approver Manajemen</span>
                                <button
                                    type="button"
                                    onClick={() => setIsAddApproverOpen(true)}
                                    className="bg-primary/10 text-primary dark:bg-white/10 dark:text-white flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all hover:bg-primary/20 dark:hover:bg-white/20 active:scale-95 shadow-sm"
                                >
                                    <Plus size={14} /> Tambah
                                </button>
                            </div>

                            <div className="space-y-2">
                                {selected.metadata?.custom_management_users && selected.metadata.custom_management_users.length > 0 ? (
                                    selected.metadata.custom_management_users.map((userId: string, idx: number) => {
                                        const approval = selected.approvals?.find((a) => a.user_id === userId);
                                        const userObj = allUsers.find((u) => u.id === userId);
                                        return (
                                            <div
                                                key={idx}
                                                className="bg-muted/40 border-border animate-in fade-in flex items-center justify-between rounded-lg border p-2.5 shadow-sm"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-foreground text-sm font-bold">
                                                        {userObj ? userObj.name : approval ? approval.approver_name : `User ID: ${userId}`}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs font-medium">
                                                        {userObj
                                                            ? `${userObj.department?.name || userObj.department_name || ''} • ${userObj.role}`
                                                            : approval
                                                              ? approval.role
                                                              : 'COO/VP/Deputy'}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const currentUsers = selected.metadata?.custom_management_users || [];
                                                        const newUsers = currentUsers.filter((id: string) => id !== userId);
                                                        onUpdate({ metadata: { ...selected.metadata, custom_management_users: newUsers } });
                                                    }}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all active:scale-95"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="border border-dashed border-border/60 rounded-xl p-4 text-center bg-muted/20">
                                        <p className="text-muted-foreground text-xs font-medium">
                                            Belum ada approver tambahan yang ditambahkan.
                                        </p>
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
                                            className="bg-card border-border focus:ring-primary text-foreground h-10 w-full appearance-none rounded-lg border px-3 text-sm font-medium transition-all outline-none focus:ring-1"
                                        />
                                    </div>

                                    <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                                        {allUsers
                                            .filter((u) => u.role !== 'Vendor' && u.role?.toLowerCase() !== 'staff')
                                            .filter(
                                                (u) =>
                                                    !searchQuery ||
                                                    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    u.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    u.department?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
                                            )
                                            .map((u: any) => {
                                                const isSelected = localSelectedUsers.includes(u.id);
                                                return (
                                                    <label
                                                        key={u.id}
                                                        className={cn(
                                                            'hover:bg-muted/30 flex cursor-pointer items-center justify-between rounded-lg border p-2.5 transition-all',
                                                            isSelected ? 'bg-primary/5 border-primary' : 'border-border bg-card',
                                                        )}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-foreground text-sm font-semibold">{u.name}</span>
                                                            <span className="text-muted-foreground text-xs">
                                                                {u.department?.name
                                                                    ? `${u.department.name} • `
                                                                    : u.department_name
                                                                      ? `${u.department_name} • `
                                                                      : ''}
                                                                {u.role}
                                                            </span>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => {
                                                                if (isSelected) {
                                                                    setLocalSelectedUsers(localSelectedUsers.filter((id) => id !== u.id));
                                                                } else {
                                                                    if (localSelectedUsers.length >= 3) {
                                                                        alert('Maksimal 3 orang approver tambahan.');
                                                                        return;
                                                                    }
                                                                    setLocalSelectedUsers([...localSelectedUsers, u.id]);
                                                                }
                                                            }}
                                                            className="accent-primary h-4 w-4 cursor-pointer"
                                                        />
                                                    </label>
                                                );
                                            })}
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddApproverOpen(false)}
                                            className="text-muted-foreground hover:text-foreground h-9 px-4 text-xs font-bold"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onUpdate({ metadata: { ...selected.metadata, custom_management_users: localSelectedUsers } });
                                                setIsAddApproverOpen(false);
                                            }}
                                            className="bg-primary h-9 rounded-lg px-5 text-xs font-semibold text-white shadow transition-all hover:opacity-90 active:scale-95"
                                        >
                                            Simpan
                                        </button>
                                    </div>
                                </div>
                            </Modal>
                        </div>
                    ) : (
                        selected.metadata?.custom_management_users &&
                        Array.isArray(selected.metadata.custom_management_users) &&
                        selected.metadata.custom_management_users.length > 0 && (
                            <div className="border-border col-span-full mt-2 border-t pt-4">
                                <div className="text-muted-foreground mb-3 text-xs font-semibold">Disetujui</div>
                                <div className="bg-muted/40 border-border animate-in fade-in space-y-2 rounded-xl border p-3">
                                    {selected.metadata.custom_management_users.map((userId: string, idx: number) => {
                                        const approval = selected.approvals?.find((a) => a.user_id === userId);
                                        const userObj = allUsers.find((u) => u.id === userId);
                                        return (
                                            <div
                                                key={idx}
                                                className="bg-card border-border flex items-center justify-between rounded-lg border p-2.5"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-foreground text-sm font-bold">
                                                        {userObj ? userObj.name : approval ? approval.approver_name : `User ID: ${userId}`}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs font-medium">
                                                        {userObj
                                                            ? `${userObj.department?.name || userObj.department_name || ''} • ${userObj.role}`
                                                            : approval
                                                              ? approval.role
                                                              : 'COO/VP/Deputy'}
                                                    </span>
                                                </div>
                                                <span
                                                    className={cn(
                                                        'rounded px-2 py-0.5 text-xs font-semibold',
                                                        approval?.status === 'approved'
                                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                                                            : approval?.status === 'rejected'
                                                              ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                                                              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400',
                                                    )}
                                                >
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
