import { Contract, ContractType } from '@/pages/contracts/types';
import { ChevronDown, ChevronUp, Info, Tag, GitBranch } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ContractInfoForm } from './ContractInfoForm';
import { TreeSelect } from '@/components/ui/selection/TreeSelect';
import { resolveVendorTaxPkp } from '@/pages/contracts/utils';

// Re-export for backward compatibility
export { RequesterInfoCard } from './RequesterInfoCard';
export { VendorInfoCard } from './VendorInfoCard';
export { PicInfoCard } from './PicInfoCard';
export { AdvancedInfoCard } from './AdvancedInfoCard';

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
    onUpdate: (data: any) => Promise<any> | void;
    processing: boolean;
    setPreviewTitle: (v: string) => void;
    setPreviewUrl: (v: string) => void;
    setPreviewHasFile: (v: boolean) => void;
    setPreviewOpen: (v: boolean) => void;
    meId?: string;
    onStateChange?: (hasChanges: boolean, saving: boolean) => void;
    saveRef?: React.MutableRefObject<(() => Promise<void>) | null>;
    resetRef?: React.MutableRefObject<(() => void) | null>;
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
    meId,
    onStateChange,
    saveRef,
    resetRef,
}: DraftEditableInfoCardProps) {
    const is_readonly =
        selected.allow_info_edit === false ||
        (!selected.can_approve && selected.created_by !== meId && selected.initiated_by_id !== meId);
    const [title, setTitle] = useState(selected.title);
    const [description, setDescription] = useState(selected.description || '');
    const [typeId, setTypeId] = useState(() => {
        if (selected.contract_type_id) return String(selected.contract_type_id);
        const t = types.find((x) => x.name === selected.contract_type);
        return t ? String(t.id) : '';
    });
    const resolveInitialFirstParty = (s: any, vList: any[]) => {
        if (s.metadata?.first_party_id) return String(s.metadata.first_party_id);
        if (s.metadata?.p1_vendor_id) return String(s.metadata.p1_vendor_id);
        if (s.p1_entity && Array.isArray(vList)) {
            const found = vList.find((v) => (v.name && v.name.toLowerCase() === s.p1_entity.toLowerCase()) || (v.vendor_name && v.vendor_name.toLowerCase() === s.p1_entity.toLowerCase()));
            if (found) return String(found.id);
        }
        return 'internal';
    };

    const resolveInitialSecondParty = (s: any, vList: any[]) => {
        if (s.metadata?.second_party_id) return String(s.metadata.second_party_id);
        if (s.metadata?.p2_vendor_id) return String(s.metadata.p2_vendor_id);
        if (s.vendor_id) return String(s.vendor_id);
        if (s.vendor?.id) return String(s.vendor.id);
        if (s.p2_entity && Array.isArray(vList)) {
            const found = vList.find((v) => (v.name && v.name.toLowerCase() === s.p2_entity.toLowerCase()) || (v.vendor_name && v.vendor_name.toLowerCase() === s.p2_entity.toLowerCase()));
            if (found) return String(found.id);
        }
        return '';
    };

    const [firstPartyId, setFirstPartyId] = useState<string>(() => resolveInitialFirstParty(selected, vendors));
    const [vendorId, setVendorId] = useState(() => resolveInitialSecondParty(selected, vendors));
    const [submissionTypeId, setSubmissionTypeId] = useState(selected.submission_type_id || '');
    const [kopSubTopik, setKopSubTopik] = useState((selected as any).kop_sub_topik || '');
    const [contractNo, setContractNo] = useState(selected.contract_no || '');
    const [contractDate, setContractDate] = useState(() => {
        if (!selected.contract_date) return '';
        return String(selected.contract_date).split('T')[0].split(' ')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        if (!selected.end_date) return '';
        return String(selected.end_date).split('T')[0].split(' ')[0];
    });
    const [price, setPrice] = useState(() => {
        const p = selected.metadata?.meta_harga ?? selected.metadata?.f2_price ?? selected.meta?.f2_price;
        return p !== undefined && p !== null ? String(p) : '';
    });
    const [minimized, setMinimized] = useState(false);
    const [workflowMinimized, setWorkflowMinimized] = useState(false);
    const resolveTaxBool = (s: any) => {
        if (s.tax_required !== undefined && s.tax_required !== null) return !!s.tax_required;
        const metaTax = s.metadata?.tax_required ?? s.metadata?.meta_tax_required;
        return metaTax === true || metaTax === '1' || metaTax === 1 || metaTax === 'Ya' || metaTax === 'ya';
    };

    const [taxRequired, setTaxRequired] = useState<boolean>(() => resolveTaxBool(selected));

    useEffect(() => {
        setTaxRequired(resolveTaxBool(selected));
    }, [selected.tax_required, selected.metadata?.tax_required, selected.metadata?.meta_tax_required]);

    useEffect(() => {
        setTitle(selected.title);
        setDescription(selected.description || '');
        const typeVal = selected.contract_type_id
            ? String(selected.contract_type_id)
            : types.find((x) => x.name === selected.contract_type)?.id
                ? String(types.find((x) => x.name === selected.contract_type)?.id)
                : '';
        setTypeId(typeVal);
        setFirstPartyId(resolveInitialFirstParty(selected, vendors));
        setVendorId(resolveInitialSecondParty(selected, vendors));
        setSubmissionTypeId(selected.submission_type_id || '');
        setKopSubTopik((selected as any).kop_sub_topik || '');
        setContractNo(selected.contract_no || '');
        setContractDate(selected.contract_date ? String(selected.contract_date).split('T')[0].split(' ')[0] : '');
        setEndDate(selected.end_date ? String(selected.end_date).split('T')[0].split(' ')[0] : '');
        const p = selected.metadata?.meta_harga ?? selected.metadata?.f2_price ?? selected.meta?.f2_price;
        setPrice(p !== undefined && p !== null ? String(p) : '');
    }, [selected, types, vendors]);

    // When vendor selection changes, auto-set taxRequired based on vendor's PKP status
    const handleVendorChange = (newVendorId: string) => {
        setVendorId(newVendorId);
        if (newVendorId && newVendorId !== 'internal') {
            const foundVendor = vendors.find((v) => String(v.id) === String(newVendorId));
            if (foundVendor) {
                const { isPkp } = resolveVendorTaxPkp(foundVendor);
                setTaxRequired(isPkp);
            }
        }
    };

    const resolvePartyDetails = (partyId: string, role: 'p1' | 'p2') => {
        const initUser = selected.initiator || selected.creator;
        const isInternal = partyId === 'internal' || !partyId;

        if (isInternal) {
            return {
                entity: initUser?.company?.name || initUser?.company_name || 'PT. LENTERA TEKNOLOGI',
                signer: initUser?.name || '',
                signer_position: initUser?.jobtitle_name || initUser?.job_position_name || initUser?.role || initUser?.role_name || 'Direktur',
                address: initUser?.company?.address || initUser?.location_name || initUser?.address || 'The Manhattan Square Mid Tower Lt. 12, Jl. TB Simatupang No.1, Jakarta Selatan',
            };
        }

        const v = vendors.find((item) => String(item.id) === String(partyId));
        if (v) {
            return {
                entity: v.name || v.vendor_name || '',
                signer: v.pic_name || v.pic || v.detail?.pic || '',
                signer_position: v.pic_position || v.detail?.pic_position || v.detail?.jobTitle?.[0] || 'Direktur',
                address: v.address || v.detail?.address || v.detail?.mailingAddress || '',
            };
        }

        return {
            entity: role === 'p1' ? (selected.p1_entity || 'PT. LENTERA TEKNOLOGI') : (selected.p2_entity || ''),
            signer: role === 'p1' ? (selected.p1_signer || '') : (selected.p2_signer || ''),
            signer_position: role === 'p1' ? (selected.p1_signer_position || '') : (selected.p2_signer_position || ''),
            address: role === 'p1' ? (selected.p1_address || '') : (selected.p2_address || ''),
        };
    };

    // Compute category display hierarchy
    const categoryDisplayName = useMemo(() => {
        const targetId = typeId || selected.contract_type_id;
        let item = targetId ? types.find((t) => String(t.id) === String(targetId)) : null;

        if (!item && selected.contract_type) {
            item = types.find((t) => t.name === selected.contract_type) || null;
        }

        if (!item) {
            return selected.contract_type || '—';
        }

        const pathNames = [item.name];
        let current: any = item;

        while (current && current.parent_id && String(current.parent_id) !== String(current.id)) {
            const parent = types.find((t: any) => String(t.id) === String(current.parent_id));
            if (parent && String(parent.id) !== String(current.id)) {
                pathNames.unshift(parent.name);
                current = parent;
            } else {
                break;
            }
        }

        return pathNames.join(' - ');
    }, [typeId, selected.contract_type_id, selected.contract_type, types]);

    // Track pristine state
    const originalState = useMemo(() => {
        const typeVal = selected.contract_type_id
            ? String(selected.contract_type_id)
            : types.find((x) => x.name === selected.contract_type)?.id
                ? String(types.find((x) => x.name === selected.contract_type)?.id)
                : '';
        const p = selected.metadata?.meta_harga ?? selected.metadata?.f2_price ?? selected.meta?.f2_price;
        return {
            title: selected.title,
            description: selected.description || '',
            typeId: typeVal,
            firstPartyId: resolveInitialFirstParty(selected, vendors),
            vendorId: resolveInitialSecondParty(selected, vendors),
            submissionTypeId: selected.submission_type_id || '',
            kopSubTopik: (selected as any).kop_sub_topik || '',
            contractNo: selected.contract_no || '',
            contractDate: selected.contract_date ? String(selected.contract_date).split('T')[0].split(' ')[0] : '',
            endDate: selected.end_date ? String(selected.end_date).split('T')[0].split(' ')[0] : '',
            price: p !== undefined && p !== null ? String(p) : '',
            taxRequired: resolveTaxBool(selected),
        };
    }, [selected, types, vendors]);

    const hasChanges = useMemo(() => {
        return (
            title !== originalState.title ||
            description !== originalState.description ||
            typeId !== originalState.typeId ||
            firstPartyId !== originalState.firstPartyId ||
            vendorId !== originalState.vendorId ||
            submissionTypeId !== originalState.submissionTypeId ||
            kopSubTopik !== originalState.kopSubTopik ||
            contractNo !== originalState.contractNo ||
            contractDate !== originalState.contractDate ||
            endDate !== originalState.endDate ||
            price !== originalState.price ||
            taxRequired !== originalState.taxRequired
        );
    }, [title, description, typeId, firstPartyId, vendorId, submissionTypeId, kopSubTopik, contractNo, contractDate, endDate, price, taxRequired, originalState]);

    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const p1Data = resolvePartyDetails(firstPartyId, 'p1');
            const p2Data = resolvePartyDetails(vendorId, 'p2');

            await onUpdate({
                title,
                description,
                contract_type_id: typeId || null,
                vendor_id: vendorId === 'internal' ? null : (vendorId || null),
                submission_type_id: submissionTypeId || null,
                kop_sub_topik: kopSubTopik || null,
                contract_no: contractNo || null,
                contract_date: contractDate || null,
                end_date: endDate || null,
                price: price || null,
                tax_required: taxRequired,
                p1_entity: p1Data.entity,
                p1_signer: p1Data.signer,
                p1_signer_position: p1Data.signer_position,
                p1_address: p1Data.address,
                p2_entity: p2Data.entity,
                p2_signer: p2Data.signer,
                p2_signer_position: p2Data.signer_position,
                p2_address: p2Data.address,
                metadata: {
                    ...(selected.metadata || {}),
                    first_party_id: firstPartyId,
                    p1_vendor_id: firstPartyId,
                    second_party_id: vendorId || null,
                    p2_vendor_id: vendorId || null,
                },
            });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setTitle(originalState.title);
        setDescription(originalState.description);
        setTypeId(originalState.typeId);
        setFirstPartyId(originalState.firstPartyId);
        setVendorId(originalState.vendorId);
        setSubmissionTypeId(originalState.submissionTypeId);
        setKopSubTopik(originalState.kopSubTopik);
        setContractNo(originalState.contractNo);
        setContractDate(originalState.contractDate);
        setEndDate(originalState.endDate);
        setPrice(originalState.price);
        setTaxRequired(originalState.taxRequired);
    };

    // Expose save and reset to parent via refs
    useEffect(() => {
        if (saveRef) {
            saveRef.current = handleSave;
        }
        if (resetRef) {
            resetRef.current = handleReset;
        }
    });

    useEffect(() => {
        onStateChange?.(hasChanges, saving);
    }, [hasChanges, saving, onStateChange]);

    const inputCls =
        'w-full bg-surface-base border-surface-border rounded-lg px-3 py-2 text-sm font-medium text-text-main outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-xs placeholder:text-text-soft/30';

    const canEditCategory = !is_readonly && selected.allow_category_edit !== false;

    return (
        <div className="flex flex-col gap-4 relative">
            {/* Card 1: Informasi Pengajuan */}
            <div className="flex flex-col gap-3">
                <div className="bg-primary text-primary-foreground shrink-0 flex h-9.5 min-h-[38px] max-h-[38px] items-center justify-between px-4 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-tight text-primary-foreground">
                        <Info size={15} className="text-primary-foreground/90" /> Informasi Pengajuan
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setMinimized(!minimized)}
                            className="bg-white/15 hover:bg-white/25 text-white border border-white/20 h-6 w-6 flex items-center justify-center rounded-md transition-all active:scale-95 cursor-pointer"
                        >
                            {minimized ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                        </button>
                    </div>
                </div>

                {!minimized && (
                    <div className="bg-surface-base text-text-main border border-surface-border rounded-xl shadow-xs p-4 flex flex-col gap-3">
                        <ContractInfoForm
                            is_readonly={is_readonly}
                            title={title}
                            setTitle={setTitle}
                            contractNo={contractNo}
                            setContractNo={setContractNo}
                            contractDate={contractDate}
                            setContractDate={setContractDate}
                            endDate={endDate}
                            setEndDate={setEndDate}
                            price={price}
                            setPrice={setPrice}
                            typeId={typeId}
                            setTypeId={setTypeId}
                            submissionTypeId={submissionTypeId}
                            setSubmissionTypeId={setSubmissionTypeId}
                            firstPartyId={firstPartyId}
                            setFirstPartyId={setFirstPartyId}
                            vendorId={vendorId}
                            setVendorId={handleVendorChange}
                            types={types}
                            submissionTypes={submissionTypes}
                            vendors={vendors}
                            selected={selected}
                            inputCls={inputCls}
                            taxRequired={taxRequired}
                            onTaxRequiredChange={(newVal) => {
                                setTaxRequired(newVal);
                            }}
                            canEditVendor={selected.allow_vendor_edit !== false}
                            canEditCategory={selected.allow_category_edit !== false}
                            canEditPrice={selected.allow_price_edit !== false}
                            canEditPeriod={selected.allow_period_edit !== false}
                            canEditTaxToggle={selected.allow_tax_toggle_edit !== false}
                        />
                    </div>
                )}
            </div>

            {/* Card 2: Kategori & Alur Kerja */}
            <div className="flex flex-col gap-3">
                <div className="bg-primary text-primary-foreground shrink-0 flex h-9.5 min-h-[38px] max-h-[38px] items-center justify-between px-4 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-tight text-primary-foreground">
                        <GitBranch size={15} className="text-primary-foreground/90" /> Kategori & Alur Kerja
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setWorkflowMinimized(!workflowMinimized)}
                            className="bg-white/15 hover:bg-white/25 text-white border border-white/20 h-6 w-6 flex items-center justify-center rounded-md transition-all active:scale-95 cursor-pointer"
                        >
                            {workflowMinimized ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                        </button>
                    </div>
                </div>

                {!workflowMinimized && (
                    <div className="bg-surface-base text-text-main border border-surface-border rounded-xl shadow-xs p-4 flex flex-col gap-3.5">
                        {/* Kategori Dokumen */}
                        {selected.show_category !== false && (
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    <Tag size={12} className="text-muted-foreground/80 shrink-0" />
                                    <span>Kategori Dokumen</span>
                                    {!!(selected.require_category || selected.workflow_step?.meta?.require_category) && (
                                        <span className="text-rose-500 font-black ml-0.5" title="Wajib Diisi">*</span>
                                    )}
                                </div>
                                {canEditCategory ? (
                                    <TreeSelect
                                        value={typeId}
                                        onValueChange={(val) => setTypeId(val)}
                                        items={types}
                                        placeholder="Pilih Kategori"
                                        disableParentSelection={true}
                                        size="sm"
                                    />
                                ) : (
                                    <span className="text-xs font-semibold text-foreground">
                                        {categoryDisplayName}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Alur Kerja (Workflow) */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                <GitBranch size={12} className="text-muted-foreground/80 shrink-0" />
                                <span>Alur Kerja</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold text-xs border border-indigo-200/60 dark:border-indigo-800/40">
                                    {selected.workflow?.name || selected.workflow_step?.workflow?.name || 'Alur Standar'}
                                </span>
                                {selected.workflow_step?.step && (
                                    <span className="text-[10px] text-muted-foreground">
                                        • Tahap {selected.workflow_step.step}: {selected.workflow_step.name || selected.workflow_step.label || 'Berjalan'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
