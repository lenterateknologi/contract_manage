<?php

namespace App\Http\Queries\Contract;

use App\Models\Contract;

class ContractDetailQuery
{
    /**
     * Eager loads for contract detail.
     */
    private const WITH = [
        'creator:id,name,role,role_id,department_id,company_id,email',
        'creator.department:id,name',
        'creator.company:id,name,company_group_id,region_id',
        'contractType:id,name',
        'contractTypeParent:id,name',
        'submissionType:id,name',
        'approvals.approver:id,name,role,role_id,department_id,company_id,email',
        'approvals.approver.department:id,name',
        'approvals.workflowStep:id,step,description,step_category,workflow_id',
        'approvals.workflowStep.workflow:id,name,contract_type_id,meta',
        'workflow.steps:id,workflow_id,step,description,approver_type,step_category,meta,filter_department,filter_company_group,filter_region,filter_company',
        'workflowStep:id,workflow_id,step,description,step_category,meta',
        'workflowStep.actions',
        'versions.uploader:id,name,role,role_id,department_id,company_id,email',
        'histories.actor:id,name,role,role_id,department_id,company_id,email',
        'messages.user:id,name,role,role_id,department_id,company_id,email',
        'attachments.uploader:id,name,role,role_id,department_id,company_id,email',
        'formSubmissions:id,contract_id,document_type,form_template_id,current_version,submitted_by,updated_at',
        'formSubmissions.submittedBy:id,name,role,role_id,department_id,company_id,email',
        'vendor:id,name,pic_name,pic_position,address',
        'vendor.documents:id,vendor_id,document_name,document_type',
        'initiator:id,name,role,role_id,department_id,company_id,email',
        'initiator.department:id,name',
        'initiator.company:id,name,company_group_id,region_id',
        'assignedPic:id,name,role,role_id,department_id,company_id,email',
        'assignedPic.department:id,name',
        'assignedBy:id,name,role,role_id,department_id,company_id,email',
        'assignedBy.department:id,name',
        'meta:contract_id,kop_topik,kop_sub_topik,p1_entity,p1_signer,p1_signer_position,p1_address,p2_entity,p2_signer,p2_signer_position,p2_address,f2_scope,f2_price,f2_payment,f2_tenure,f2_location',
    ];

    /**
     * Selected columns for detail query.
     */
    private const SELECT = [
        'id', 'contract_no', 'title', 'description', 'contract_date', 'end_date',
        'contract_type_id', 'transaction_type', 'status', 'current_version',
        'workflow_id', 'workflow_step_id', 'created_by', 'submitted_at',
        'created_at', 'updated_at', 'initiated_by_id', 'vendor_id', 'parent_id',
        'submission_type_id', 'crown_no', 'assigned_pic_id', 'assigned_by_id',
        'contract_type_parent_id', 'metadata',
    ];

    /**
     * Get a contract by ID with all relations.
     */
    public function find(string $id): Contract
    {
        return Contract::query()
            ->select(self::SELECT)
            ->with(self::WITH)
            ->findOrFail($id);
    }
}
