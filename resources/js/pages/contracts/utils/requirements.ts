export interface RequirementItem {
    id: string;
    label: string;
    isFilled: boolean;
    type: 'field' | 'doc' | 'review' | 'pic';
    targetTab?: 'overview' | 'documents' | 'parties';
    targetSubTab?: string;
}

export interface ContractRequirementsResult {
    items: RequirementItem[];
    allFilled: boolean;
    totalCount: number;
    filledCount: number;
    hasRequirements: boolean;
}

export function checkDocFulfillment(contract: any, type: string): boolean {
    const types = type === 'agreement' ? ['agreement', 'contract'] : [type];
    const iteration = contract?.workflow_iteration || 1;

    // 1. Check version in contract (by iteration or general presence)
    const hasVersionMatch = contract?.versions && contract.versions.some((v: any) => {
        if (!types.includes(v.document_type)) return false;
        if (v.workflow_iteration && v.workflow_iteration === iteration) return true;
        return (v.version_no ?? 0) > 0 || !!v.id || !!v.file_path;
    });
    if (hasVersionMatch) return true;

    // 2. Check form submission in contract (by iteration or general presence)
    const hasFormMatch = (contract?.form_submissions || contract?.formSubmissions || []).some((fs: any) => {
        if (!types.includes(fs.document_type)) return false;
        if (fs.workflow_iteration && fs.workflow_iteration === iteration) return true;
        return (fs.current_version ?? 0) > 0 || !!fs.id || (fs.values && Object.keys(fs.values).length > 0);
    });
    if (hasFormMatch) return true;

    // 3. Fallback direct attributes on contract
    if (type === 'f1' && (contract?.f1_file || contract?.metadata?.f1_file || contract?.metadata?.f1_form_data || (contract?.f1_items && contract.f1_items.length > 0))) return true;
    if (type === 'f2' && (contract?.f2_file || contract?.metadata?.f2_file || contract?.metadata?.f2_form_data)) return true;
    if ((type === 'agreement' || type === 'contract') && (contract?.agreement_file || contract?.metadata?.agreement_file || contract?.metadata?.agreement_content || contract?.agreement_content)) return true;

    return false;
}

export type RequirementResolver = (contract: any, reqReviews: Record<string, any>) => RequirementItem;

const REQUIREMENT_RESOLVERS: Record<string, RequirementResolver> = {
    pic: (c) => ({
        id: 'pic',
        label: 'Data PIC (Penanggung Jawab)',
        isFilled: !!(c.assigned_pic_id || c.metadata?.assigned_pic_id || c.assigned_pic || c.assignedPic),
        type: 'pic',
        targetTab: 'overview',
    }),
    assigned_pic: (c) => REQUIREMENT_RESOLVERS.pic(c, {}),

    f1: (c) => ({
        id: 'f1',
        label: 'Sub-dokumen F1 (Permohonan)',
        isFilled: checkDocFulfillment(c, 'f1') || !!(c.f1_file || c.metadata?.f1_file || c.metadata?.f1_form_data || (c.f1_items && c.f1_items.length > 0)),
        type: 'doc',
        targetTab: 'documents',
        targetSubTab: 'f1',
    }),

    f2: (c) => ({
        id: 'f2',
        label: 'Sub-dokumen F2 (Ringkasan)',
        isFilled: checkDocFulfillment(c, 'f2') || !!(c.f2_file || c.metadata?.f2_file || c.metadata?.f2_form_data),
        type: 'doc',
        targetTab: 'documents',
        targetSubTab: 'f2',
    }),

    agreement: (c) => ({
        id: 'agreement',
        label: 'Sub-dokumen Draft Perjanjian',
        isFilled: checkDocFulfillment(c, 'agreement') || !!(c.agreement_file || c.metadata?.agreement_file || c.metadata?.agreement_content || c.agreement_content),
        type: 'doc',
        targetTab: 'documents',
        targetSubTab: 'agreement',
    }),

    title: (c) => ({
        id: 'title',
        label: 'Judul Kontrak',
        isFilled: !!(c.title && c.title.trim().length > 0),
        type: 'field',
        targetTab: 'overview',
    }),

    first_party: (c) => ({
        id: 'first_party',
        label: 'Pihak Pertama',
        isFilled: !!(c.company_id || c.first_party_id || c.p1_entity || c.metadata?.first_party_id || c.metadata?.meta_p1_entity || c.initiator?.company?.name || c.initiator?.company_name),
        type: 'field',
        targetTab: 'overview',
    }),
    p1: (c) => REQUIREMENT_RESOLVERS.first_party(c, {}),

    vendor: (c) => ({
        id: 'vendor',
        label: 'Pihak Kedua (Vendor)',
        isFilled: !!(c.vendor_id || c.vendor?.id || c.p2_entity || c.metadata?.second_party_id || c.metadata?.meta_p2_entity),
        type: 'field',
        targetTab: 'overview',
    }),

    category: (c) => ({
        id: 'category',
        label: 'Kategori Kontrak',
        isFilled: !!(c.contract_type_id || c.contract_type),
        type: 'field',
        targetTab: 'overview',
    }),

    contract_no: (c) => ({
        id: 'contract_no',
        label: 'No. Kontrak (F2)',
        isFilled: !!(c.contract_no && c.contract_no.trim().length > 0),
        type: 'field',
        targetTab: 'overview',
    }),
    f2_contract_no: (c) => REQUIREMENT_RESOLVERS.contract_no(c, {}),

    tax_toggle: (c) => ({
        id: 'tax_toggle',
        label: 'Penentuan Pajak',
        isFilled: (c.tax_required !== undefined && c.tax_required !== null) || c.metadata?.tax_required !== undefined,
        type: 'field',
        targetTab: 'overview',
    }),
    tax: (c) => REQUIREMENT_RESOLVERS.tax_toggle(c, {}),

    price: (c) => ({
        id: 'price',
        label: 'Nilai / Harga Kontrak',
        isFilled: c.price !== undefined && c.price !== null && c.price !== '',
        type: 'field',
        targetTab: 'overview',
    }),

    period: (c) => ({
        id: 'period',
        label: 'Masa Berlaku Kontrak',
        isFilled: !!((c.contract_date || c.start_date) && c.end_date),
        type: 'field',
        targetTab: 'overview',
    }),

    review_f1: (_, reqReviews) => ({
        id: 'review_f1',
        label: 'Tinjau F1 (Permohonan)',
        isFilled: !!reqReviews.f1?.reviewed,
        type: 'review',
        targetTab: 'documents',
        targetSubTab: 'f1',
    }),

    review_f2: (_, reqReviews) => ({
        id: 'review_f2',
        label: 'Tinjau F2 (Ringkasan)',
        isFilled: !!reqReviews.f2?.reviewed,
        type: 'review',
        targetTab: 'documents',
        targetSubTab: 'f2',
    }),

    review_agreement: (_, reqReviews) => ({
        id: 'review_agreement',
        label: 'Tinjau Draft Perjanjian',
        isFilled: !!reqReviews.agreement?.reviewed,
        type: 'review',
        targetTab: 'documents',
        targetSubTab: 'agreement',
    }),

    review_all_docs: (c, reqReviews) => {
        const meta = c?.workflow_step?.meta || {};
        const hasF1 = meta.show_tab_f1 !== false && (c?.f1_mode || 'upload') !== 'none';
        const hasF2 = meta.show_tab_f2 !== false && (c?.f2_mode || 'upload') !== 'none';
        const hasAgreement = meta.show_tab_agreement !== false && (c?.contract_mode || 'upload') !== 'none';

        const allReviewed = (!hasF1 || !!reqReviews.f1?.reviewed) &&
                            (!hasF2 || !!reqReviews.f2?.reviewed) &&
                            (!hasAgreement || !!reqReviews.agreement?.reviewed);

        return {
            id: 'review_all_docs',
            label: 'Tinjau Semua Dokumen Aktif',
            isFilled: allReviewed,
            type: 'review',
            targetTab: 'documents',
        };
    },
};

export function resolveContractRequirements(contract: any, activeAction?: any): ContractRequirementsResult {
    if (!contract) {
        return { items: [], allFilled: true, totalCount: 0, filledCount: 0, hasRequirements: false };
    }

    const stepMeta = contract?.workflow_step?.meta || {};
    const stepActions = contract?.workflow_step?.actions || [];

    let targetAction: any = null;

    if (activeAction) {
        if (activeAction.required_fields && Array.isArray(activeAction.required_fields)) {
            targetAction = activeAction;
        } else {
            if (activeAction.id) {
                targetAction = stepActions.find((a: any) => String(a.id) === String(activeAction.id));
            }
            if (!targetAction && activeAction.action_code) {
                targetAction = stepActions.find((a: any) => a.action_code === activeAction.action_code);
            }
            if (!targetAction) {
                targetAction = activeAction;
            }
        }
    } else {
        // Default to primary forward action of the step
        targetAction = stepActions.find((a: any) => a.action_code !== 'reject' && a.action_code !== 'rollback') || stepActions[0];
    }

    const actionRequiredList: string[] = Array.isArray(targetAction?.required_fields) ? targetAction.required_fields : [];

    // Legacy step meta requirements: only apply if the action is not a reject action
    const isReject = targetAction?.action_code === 'reject' || targetAction?.action_code === 'rollback';
    const metaRequiredList: string[] = [];
    if (!isReject && stepMeta) {
        if (stepMeta.require_pic) metaRequiredList.push('pic');
        if (stepMeta.require_f1) metaRequiredList.push('f1');
        if (stepMeta.require_f2) metaRequiredList.push('f2');
        if (stepMeta.require_agreement) metaRequiredList.push('agreement');
        if (stepMeta.require_title) metaRequiredList.push('title');
        if (stepMeta.require_first_party) metaRequiredList.push('first_party');
        if (stepMeta.require_vendor) metaRequiredList.push('vendor');
        if (stepMeta.require_category) metaRequiredList.push('category');
        if (stepMeta.require_f2_contract_no) metaRequiredList.push('contract_no');
        if (stepMeta.require_tax_toggle) metaRequiredList.push('tax_toggle');
        if (stepMeta.require_price) metaRequiredList.push('price');
        if (stepMeta.require_period) metaRequiredList.push('period');
    }

    // Combining step-level meta requirements and action required_fields
    const requiredFields = Array.from(new Set([...metaRequiredList, ...actionRequiredList]));

    // Extract doc review context
    const reqStepKey = contract?.workflow_step_id ? `step_${contract.workflow_step_id}` : 'general';
    const reqReviews = (contract?.doc_reviews?.[reqStepKey] || contract?.metadata?.doc_reviews?.[reqStepKey] || contract?.metadata?.[`doc_reviews_${reqStepKey}`] || {}) as Record<string, any>;

    // Resolve requirements declaratively using the Registry Map
    const seenIds = new Set<string>();
    const items: RequirementItem[] = [];

    for (const key of requiredFields) {
        const resolver = REQUIREMENT_RESOLVERS[key];
        if (resolver) {
            const item = resolver(contract, reqReviews);
            if (!seenIds.has(item.id)) {
                seenIds.add(item.id);
                items.push(item);
            }
        }
    }

    const totalCount = items.length;
    const filledCount = items.filter(i => i.isFilled).length;
    const allFilled = totalCount === 0 || filledCount === totalCount;

    return {
        items,
        allFilled,
        totalCount,
        filledCount,
        hasRequirements: totalCount > 0,
    };
}
