/**
 * Centralized API Entrypoint
 * Export all modules, endpoints, and client utilities.
 */

export * from './client';
export * from './endpoints';
export * from './modules/auth.api';
export * from './modules/contracts.api';
export * from './modules/approvals.api';
export * from './modules/subresources.api';
export * from './modules/notifications.api';
export * from './modules/discussions.api';
export * from './modules/workflows.api';
export * from './modules/form-templates.api';
export * from './modules/reports.api';

// Unified composite API instance for convenience
import { authApi } from './modules/auth.api';
import { contractsApi } from './modules/contracts.api';
import { approvalsApi } from './modules/approvals.api';
import { subresourcesApi } from './modules/subresources.api';
import { notificationsApi } from './modules/notifications.api';
import { discussionsApi } from './modules/discussions.api';
import { workflowsApi } from './modules/workflows.api';
import { formTemplatesApi } from './modules/form-templates.api';
import { reportsApi } from './modules/reports.api';

export const api = {
    auth: authApi,
    contracts: contractsApi,
    approvals: approvalsApi,
    subresources: subresourcesApi,
    notifications: notificationsApi,
    discussions: discussionsApi,
    workflows: workflowsApi,
    formTemplates: formTemplatesApi,
    reports: reportsApi,
};

export default api;
