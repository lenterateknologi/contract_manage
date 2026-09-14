import { Contract, ContractType } from '@/pages/contracts/types';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ContractInfoForm } from './ContractInfoForm';

// Re-export for backward compatibility
export { RequesterInfoCard } from './RequesterInfoCard';
export { VendorInfoCard } from './VendorInfoCard';

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
    const [vendorId, setVendorId] = useState(selected.vendor_id || '');
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
        setVendorId(selected.vendor_id || '');
        setSubmissionTypeId(selected.submission_type_id || '');
        setKopSubTopik((selected as any).kop_sub_topik || '');
        setContractNo(selected.contract_no || '');
        setContractDate(selected.contract_date ? String(selected.contract_date).split('T')[0].split(' ')[0] : '');
        setEndDate(selected.end_date ? String(selected.end_date).split('T')[0].split(' ')[0] : '');
        const p = selected.metadata?.meta_harga ?? selected.metadata?.f2_price ?? selected.meta?.f2_price;
        setPrice(p !== undefined && p !== null ? String(p) : '');
    }, [selected, types]);

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
            vendorId: selected.vendor_id || '',
            submissionTypeId: selected.submission_type_id || '',
            kopSubTopik: (selected as any).kop_sub_topik || '',
            contractNo: selected.contract_no || '',
            contractDate: selected.contract_date ? String(selected.contract_date).split('T')[0].split(' ')[0] : '',
            endDate: selected.end_date ? String(selected.end_date).split('T')[0].split(' ')[0] : '',
            price: p !== undefined && p !== null ? String(p) : '',
            taxRequired: resolveTaxBool(selected),
        };
    }, [selected, types]);

    const hasChanges = useMemo(() => {
        return (
            title !== originalState.title ||
            description !== originalState.description ||
            typeId !== originalState.typeId ||
            vendorId !== originalState.vendorId ||
            submissionTypeId !== originalState.submissionTypeId ||
            kopSubTopik !== originalState.kopSubTopik ||
            contractNo !== originalState.contractNo ||
            contractDate !== originalState.contractDate ||
            endDate !== originalState.endDate ||
            price !== originalState.price ||
            taxRequired !== originalState.taxRequired
        );
    }, [title, description, typeId, vendorId, submissionTypeId, kopSubTopik, contractNo, contractDate, endDate, price, taxRequired, originalState]);

    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdate({
                title,
                description,
                contract_type_id: typeId || null,
                vendor_id: vendorId || null,
                submission_type_id: submissionTypeId || null,
                kop_sub_topik: kopSubTopik || null,
                contract_no: contractNo || null,
                contract_date: contractDate || null,
                end_date: endDate || null,
                price: price || null,
                tax_required: taxRequired,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setTitle(originalState.title);
        setDescription(originalState.description);
        setTypeId(originalState.typeId);
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

    return (
        <div className="flex flex-col gap-4 relative">
            {/* Card 1: Informasi Kontrak */}
            <div className="flex flex-col gap-3">
                <div className="bg-primary text-primary-foreground shrink-0 flex h-9.5 min-h-[38px] max-h-[38px] items-center justify-between px-4 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-tight text-primary-foreground">
                        <Info size={15} className="text-primary-foreground/90" /> Informasi Kontrak
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
                            vendorId={vendorId}
                            setVendorId={setVendorId}
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
        </div>
    );
}
