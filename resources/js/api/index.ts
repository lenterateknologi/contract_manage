/**
 * Centralized API Entrypoint
 * Export all modules, endpoints, and client utilities.
 */

export * from './client';
export * from './endpoints';
export * from './modules/approvals.api';
export * from './modules/auth.api';
export * from './modules/contracts.api';
export * from './modules/discussions.api';
export * from './modules/form-templates.api';
export * from './modules/notifications.api';
export * from './modules/reports.api';
export * from './modules/subresources.api';
export * from './modules/workflows.api';

// Unified composite API instance for convenience
import { approvalsApi } from './modules/approvals.api';
import { authApi } from './modules/auth.api';
import { contractsApi } from './modules/contracts.api';
import { discussionsApi } from './modules/discussions.api';
import { formTemplatesApi } from './modules/form-templates.api';
import { notificationsApi } from './modules/notifications.api';
import { reportsApi } from './modules/reports.api';
import { subresourcesApi } from './modules/subresources.api';
import { workflowsApi } from './modules/workflows.api';

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
