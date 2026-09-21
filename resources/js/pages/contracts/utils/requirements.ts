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
    const currentApproval = (contract?.approvals || []).find((a: any) => a.status === 'pending');
    const currentStepId = contract?.workflow_step_id || contract?.workflow_step?.id;
    const currentStepNo = contract?.workflow_step?.step || contract?.current_step_number || (currentApproval?.sequence ?? currentApproval?.step_number);
    const iteration = contract?.workflow_iteration || 1;
    const stepStartTime = currentApproval?.created_at || contract?.workflow_step?.created_at;

    // 1. Check version tagged with step_id or step_number
    const hasVersionMatch = contract?.versions && contract.versions.some((v: any) => {
        if (!types.includes(v.document_type)) return false;
        if (currentStepId && v.workflow_step_id === currentStepId) return true;
        if (currentStepNo !== undefined && v.step_number === currentStepNo) return true;
        if (v.workflow_iteration === iteration && !v.workflow_step_id && !v.step_number) return true;
        if (stepStartTime && v.created_at_raw) {
            return new Date(v.created_at_raw).getTime() >= new Date(stepStartTime).getTime() - 5000;
        }
        return false;
    });
    if (hasVersionMatch) return true;

    // 2. Check form submission tagged with step_id or step_number
    const hasFormMatch = (contract?.form_submissions || contract?.formSubmissions || []).some((fs: any) => {
        if (!types.includes(fs.document_type)) return false;
        if (currentStepId && fs.workflow_step_id === currentStepId) return true;
        if (currentStepNo !== undefined && fs.step_number === currentStepNo) return true;
        if (fs.workflow_iteration === iteration && !fs.workflow_step_id && !fs.step_number) return true;
        return (fs.current_version ?? 0) > 0 || !!fs.id;
    });
    if (hasFormMatch) return true;

    // 3. Step 1 / Initial draft fallback
    if (!currentStepNo || currentStepNo <= 1) {
        if (contract?.versions && contract.versions.some((v: any) => types.includes(v.document_type))) return true;
        if ((contract?.form_submissions || contract?.formSubmissions || []).some((fs: any) => types.includes(fs.document_type))) return true;
    }

    return false;
}

export function resolveContractRequirements(contract: any, activeAction?: any): ContractRequirementsResult {
    if (!contract) {
        return { items: [], allFilled: true, totalCount: 0, filledCount: 0, hasRequirements: false };
    }

    let stepMeta = contract?.workflow_step?.meta;
    if (!stepMeta && contract?.workflow?.steps) {
        const currentStepSeq = contract?.current_step || contract?.workflow_step?.step || 1;
        const matchedStep = contract.workflow.steps.find((s: any) => s.step === currentStepSeq || s.id === contract?.workflow_step_id);
        if (matchedStep) stepMeta = matchedStep.meta;
    }
    stepMeta = stepMeta || {};

    const metaRequiredList: string[] = [];
    if (stepMeta.require_pic) metaRequiredList.push('pic');
    if (stepMeta.require_f1) metaRequiredList.push('f1');
    if (stepMeta.require_f2) metaRequiredList.push('f2');
    if (stepMeta.require_agreement) metaRequiredList.push('agreement');
    if (stepMeta.require_title) metaRequiredList.push('title');
    if (stepMeta.require_vendor) metaRequiredList.push('vendor');
    if (stepMeta.require_category) metaRequiredList.push('category');
    if (stepMeta.require_f2_contract_no) metaRequiredList.push('contract_no');
    if (stepMeta.require_tax_toggle) metaRequiredList.push('tax_toggle');
    if (stepMeta.require_price) metaRequiredList.push('price');
    if (stepMeta.require_period) metaRequiredList.push('period');

    let actionRequiredList: string[] = [];
    if (activeAction?.required_fields && Array.isArray(activeAction.required_fields)) {
        actionRequiredList = activeAction.required_fields;
    } else {
        const stepActions = contract?.workflow_step?.actions || [];
        const approveAction = stepActions.find((a: any) => a.action_code === 'approve') || stepActions[0];
        if (approveAction?.required_fields && Array.isArray(approveAction.required_fields)) {
            actionRequiredList = approveAction.required_fields;
        }
    }

    // Gated from the outside: combining step-level meta requirements and action required_fields
    const requiredFields = Array.from(new Set([...metaRequiredList, ...actionRequiredList]));

    const items: RequirementItem[] = [];

    // 1. PIC
    if (requiredFields.includes('pic') || requiredFields.includes('assigned_pic')) {
        const isFilled = !!(
            contract.assigned_pic_id ||
            contract.metadata?.assigned_pic_id ||
            contract.assigned_pic ||
            contract.assignedPic
        );
        items.push({
            id: 'pic',
            label: 'Data PIC (Penanggung Jawab)',
            isFilled,
            type: 'pic',
            targetTab: 'overview',
        });
    }

    // 2. F1
    if (requiredFields.includes('f1')) {
        const isFilled = checkDocFulfillment(contract, 'f1') || !!(
            contract.f1_file ||
            contract.metadata?.f1_file ||
            contract.metadata?.f1_form_data ||
            (contract.f1_items && contract.f1_items.length > 0)
        );
        items.push({
            id: 'f1',
            label: 'Sub-dokumen F1 (Permohonan)',
            isFilled,
            type: 'doc',
            targetTab: 'documents',
            targetSubTab: 'f1',
        });
    }

    // 3. F2
    if (requiredFields.includes('f2')) {
        const isFilled = checkDocFulfillment(contract, 'f2') || !!(
            contract.f2_file ||
            contract.metadata?.f2_file ||
            contract.metadata?.f2_form_data
        );
        items.push({
            id: 'f2',
            label: 'Sub-dokumen F2 (Ringkasan)',
            isFilled,
            type: 'doc',
            targetTab: 'documents',
            targetSubTab: 'f2',
        });
    }

    // 4. Agreement / Draft
    if (requiredFields.includes('agreement')) {
        const isFilled = checkDocFulfillment(contract, 'agreement') || !!(
            contract.agreement_file ||
            contract.metadata?.agreement_file ||
            contract.metadata?.agreement_content ||
            contract.agreement_content
        );
        items.push({
            id: 'agreement',
            label: 'Sub-dokumen Draft Perjanjian',
            isFilled,
            type: 'doc',
            targetTab: 'documents',
            targetSubTab: 'agreement',
        });
    }

    // 5. Fields
    if (requiredFields.includes('title')) {
        items.push({
            id: 'title',
            label: 'Judul Kontrak',
            isFilled: !!(contract.title && contract.title.trim().length > 0),
            type: 'field',
            targetTab: 'overview',
        });
    }
    if (requiredFields.includes('vendor')) {
        items.push({
            id: 'vendor',
            label: 'Pihak Kedua (Vendor)',
            isFilled: !!(contract.vendor_id || contract.vendor?.id),
            type: 'field',
            targetTab: 'overview',
        });
    }
    if (requiredFields.includes('category')) {
        items.push({
            id: 'category',
            label: 'Kategori Kontrak',
            isFilled: !!(contract.contract_type_id || contract.contract_type),
            type: 'field',
            targetTab: 'overview',
        });
    }
    if (requiredFields.includes('contract_no') || requiredFields.includes('f2_contract_no')) {
        items.push({
            id: 'contract_no',
            label: 'No. Kontrak (F2)',
            isFilled: !!(contract.contract_no && contract.contract_no.trim().length > 0),
            type: 'field',
            targetTab: 'overview',
        });
    }
    if (requiredFields.includes('tax_toggle') || requiredFields.includes('tax')) {
        items.push({
            id: 'tax_toggle',
            label: 'Penentuan Pajak',
            isFilled: contract.tax_required !== undefined && contract.tax_required !== null || contract.metadata?.tax_required !== undefined,
            type: 'field',
            targetTab: 'overview',
        });
    }
    if (requiredFields.includes('price')) {
        items.push({
            id: 'price',
            label: 'Nilai / Harga Kontrak',
            isFilled: contract.price !== undefined && contract.price !== null && contract.price !== '',
            type: 'field',
            targetTab: 'overview',
        });
    }
    if (requiredFields.includes('period')) {
        items.push({
            id: 'period',
            label: 'Masa Berlaku Kontrak',
            isFilled: !!((contract.contract_date || contract.start_date) && contract.end_date),
            type: 'field',
            targetTab: 'overview',
        });
    }

    // 6. Document Reviews
    const reqStepKey = contract?.workflow_step_id ? `step_${contract.workflow_step_id}` : 'general';
    const reqReviews = (contract?.doc_reviews?.[reqStepKey] || contract?.metadata?.doc_reviews?.[reqStepKey] || contract?.metadata?.[`doc_reviews_${reqStepKey}`] || {}) as Record<string, any>;

    if (requiredFields.includes('review_f1')) {
        items.push({
            id: 'review_f1',
            label: 'Tinjau F1 (Permohonan)',
            isFilled: !!reqReviews.f1?.reviewed,
            type: 'review',
            targetTab: 'documents',
            targetSubTab: 'f1',
        });
    }
    if (requiredFields.includes('review_f2')) {
        items.push({
            id: 'review_f2',
            label: 'Tinjau F2 (Ringkasan)',
            isFilled: !!reqReviews.f2?.reviewed,
            type: 'review',
            targetTab: 'documents',
            targetSubTab: 'f2',
        });
    }
    if (requiredFields.includes('review_agreement')) {
        items.push({
            id: 'review_agreement',
            label: 'Tinjau Draft Perjanjian',
            isFilled: !!reqReviews.agreement?.reviewed,
            type: 'review',
            targetTab: 'documents',
            targetSubTab: 'agreement',
        });
    }
    if (requiredFields.includes('review_all_docs')) {
        const meta = contract?.workflow_step?.meta || {};
        const hasF1 = meta.show_tab_f1 !== false && ((contract as any)?.f1_mode || 'upload') !== 'none';
        const hasF2 = meta.show_tab_f2 !== false && ((contract as any)?.f2_mode || 'upload') !== 'none';
        const hasAgreement = meta.show_tab_agreement !== false && ((contract as any)?.contract_mode || 'upload') !== 'none';

        const allReviewed = (!hasF1 || !!reqReviews.f1?.reviewed) &&
                            (!hasF2 || !!reqReviews.f2?.reviewed) &&
                            (!hasAgreement || !!reqReviews.agreement?.reviewed);

        items.push({
            id: 'review_all_docs',
            label: 'Tinjau Semua Dokumen Aktif',
            isFilled: allReviewed,
            type: 'review',
            targetTab: 'documents',
        });
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
