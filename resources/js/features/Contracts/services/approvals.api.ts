import { Contract } from '@/features/Contracts/types';
import { apiClient, unwrapResponse } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';

export const approvalsApi = {
    /**
     * Send contract for approval workflow
     */
    send: (id: string, data?: { workflow_id?: string; custom_steps?: any[] }): Promise<Contract> =>
        unwrapResponse(apiClient.post(API_ENDPOINTS.APPROVALS.SEND(id), data)),

    /**
     * Assign PIC to contract
     */
    assignPic: (
        id: string,
        assignedPicId: string,
        note?: string,
        attachments?: File | File[],
        actionCode?: string,
        actionId?: string,
    ): Promise<Contract> => {
        const fd = new FormData();
        fd.append('assigned_pic_id', assignedPicId);
        if (note) fd.append('note', note);
        if (actionCode) fd.append('action_code', actionCode);
        if (actionId) fd.append('action_id', actionId);
        if (attachments) {
            if (Array.isArray(attachments)) {
                attachments.forEach((f) => fd.append('attachments[]', f));
            } else {
                fd.append('attachment', attachments);
            }
        }
        return unwrapResponse(apiClient.post(API_ENDPOINTS.APPROVALS.ASSIGN_PIC(id), fd));
    },

    /**
     * Approve contract step
     */
    approve: (
        id: string,
        note: string,
        attachment?: File | File[],
        assignedPicId?: string,
        executionOrder?: string,
        actionCode?: string,
        isFinal?: boolean,
        targetStepId?: string,
        actionId?: string,
    ): Promise<Contract> => {
        const fd = new FormData();
        fd.append('note', note);
        if (attachment) {
            if (Array.isArray(attachment)) {
                attachment.forEach((f) => fd.append('attachments[]', f));
            } else {
                fd.append('attachment', attachment);
            }
        }
        if (assignedPicId) fd.append('assigned_pic_id', assignedPicId);
        if (executionOrder) fd.append('execution_order', executionOrder);
        if (actionCode) fd.append('action_code', actionCode);
        if (actionId) fd.append('action_id', actionId);
        if (isFinal) fd.append('is_final', '1');
        if (targetStepId) fd.append('target_step_id', targetStepId);
        return unwrapResponse(apiClient.post(API_ENDPOINTS.APPROVALS.APPROVE(id), fd));
    },

    /**
     * Reject or request revision for contract
     */
    reject: (id: string, reason: string, attachment?: File | File[], actionId?: string): Promise<Contract> => {
        const fd = new FormData();
        fd.append('reason', reason);
        if (attachment) {
            if (Array.isArray(attachment)) {
                attachment.forEach((f) => fd.append('attachments[]', f));
            } else {
                fd.append('attachment', attachment);
            }
        }
        if (actionId) fd.append('action_id', actionId);
        return unwrapResponse(apiClient.post(API_ENDPOINTS.APPROVALS.REJECT(id), fd));
    },

    /**
     * Bulk approve multiple contracts
     */
    bulkApprove: (ids: string[], note?: string): Promise<any> => unwrapResponse(apiClient.post(API_ENDPOINTS.APPROVALS.BULK_APPROVE, { ids, note })),

    /**
     * Add adhoc approver participants
     */
    addAdhocApprover: (
        id: string,
        userIds: string | string[],
        note?: string,
        isSequential: boolean = false,
        targetStepId?: string,
        role?: string,
        approvalRule: string = 'all',
        minApprovals?: number,
        attachments?: File | File[],
        actionId?: string,
        actionCode?: string,
    ): Promise<Contract> => {
        const uids = Array.isArray(userIds) ? userIds : [userIds];
        const fd = new FormData();
        uids.forEach((uid) => fd.append('user_ids[]', uid));
        if (note) fd.append('note', note);
        if (isSequential) fd.append('is_sequential', '1');
        if (targetStepId) fd.append('target_step_id', targetStepId);
        if (role) fd.append('role', role);
        if (approvalRule) fd.append('approval_rule', approvalRule);
        if (minApprovals) fd.append('min_approvals', String(minApprovals));
        if (actionId) fd.append('action_id', actionId);
        if (actionCode) fd.append('action_code', actionCode);
        if (attachments) {
            if (Array.isArray(attachments)) {
                attachments.forEach((f) => fd.append('attachments[]', f));
            } else {
                fd.append('attachment', attachments);
            }
        }
        return unwrapResponse(apiClient.post(API_ENDPOINTS.APPROVALS.ADD_ADHOC(id), fd));
    },

    /**
     * Remove adhoc approver
     */
    removeAdhocApprover: (id: string, approvalId: string): Promise<Contract> =>
        unwrapResponse(apiClient.delete(API_ENDPOINTS.APPROVALS.REMOVE_ADHOC(id, approvalId))),

    /**
     * Submit staged adhoc approvers
     */
    submitAdhocApprovers: (id: string): Promise<Contract> => unwrapResponse(apiClient.post(API_ENDPOINTS.APPROVALS.SUBMIT_ADHOC(id))),

    /**
     * Get contract approval timeline
     */
    getTimeline: (id: string, params?: { page?: number; per_page?: number }): Promise<any> =>
        unwrapResponse(apiClient.get(API_ENDPOINTS.APPROVALS.TIMELINE(id), { params })),

    /**
     * Get contract workflow details
     */
    getWorkflow: (id: string): Promise<any> => unwrapResponse(apiClient.get(API_ENDPOINTS.APPROVALS.WORKFLOW(id))),

    /**
     * Get current workflow step details
     */
    getCurrentStep: (id: string): Promise<any> => unwrapResponse(apiClient.get(API_ENDPOINTS.APPROVALS.CURRENT_STEP(id))),
};
