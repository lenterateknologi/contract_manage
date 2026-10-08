/**
 * Centralized API Endpoints Dictionary
 * Prevents hardcoding URLs in React components.
 */

export const API_ENDPOINTS = {
    // 1. Authentication
    AUTH: {
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        PROFILE: '/api/settings/profile',
    },

    // 2. Contracts (Core CRUD)
    CONTRACTS: {
        BASE: '/api/contracts',
        DETAIL: (id: string) => `/api/contracts/${id}`,
        CREATE: '/api/contracts',
        UPDATE: (id: string) => `/api/contracts/${id}`,
        DELETE: (id: string) => `/api/contracts/${id}`,
        BULK_DELETE: '/api/contracts/bulk-delete',
        REVIEW_DOC: (id: string) => `/api/contracts/${id}/review-doc`,
        TYPES: '/api/contracts/types',
        SUBMISSION_TYPES: '/api/contracts/submission-types',
        WORKFLOWS: '/api/contracts/workflows',
        USERS: '/api/contracts/users',
        ROLES: '/api/contracts/roles',
        DASHBOARD_METRICS: '/api/contracts/dashboard-metrics',
        DASHBOARD: {
            METRICS: '/api/contracts/dashboard-metrics',
            SUMMARY: '/api/contracts/dashboard/summary',
            OVERVIEW: '/api/contracts/dashboard/overview',
            DISTRIBUTIONS: '/api/contracts/dashboard/distributions',
            TRENDS: '/api/contracts/dashboard/trends',
            ANALYSIS: '/api/contracts/dashboard/analysis',
            WORKLOAD: '/api/contracts/dashboard/workload',
            MASTER_DATA: '/api/contracts/dashboard/master-data',
            RECENT_ACTIVITY: '/api/contracts/dashboard/recent-activity',
        },
    },

    // 3. Approval & Workflow Execution
    APPROVALS: {
        SEND: (id: string) => `/api/contracts/${id}/send`,
        APPROVE: (id: string) => `/api/contracts/${id}/approve`,
        REJECT: (id: string) => `/api/contracts/${id}/reject`,
        ASSIGN_PIC: (id: string) => `/api/contracts/${id}/assign-pic`,
        BULK_APPROVE: '/api/contracts/bulk-approve',
        ADD_ADHOC: (id: string) => `/api/contracts/${id}/add-approver`,
        SUBMIT_ADHOC: (id: string) => `/api/contracts/${id}/submit-approvers`,
        REMOVE_ADHOC: (id: string, approvalId: string) => `/api/contracts/${id}/approver/${approvalId}`,
        TIMELINE: (id: string) => `/api/contracts/${id}/timeline`,
        WORKFLOW: (id: string) => `/api/contracts/${id}/workflow`,
        CURRENT_STEP: (id: string) => `/api/contracts/${id}/current-step`,
    },

    // 4. Sub-Resources (Requirements, Actions, PO, Members, References, Forms, Files, Document Types)
    SUBRESOURCES: {
        DOCUMENT_TYPES: (id: string, type?: string) =>
            type ? `/api/contracts/${id}/document-types?type=${type}` : `/api/contracts/${id}/document-types`,
        REQUIREMENTS: (id: string) => `/api/contracts/${id}/requirements`,
        ACTIONS: (id: string) => `/api/contracts/${id}/actions`,
        MEMBERS: (id: string) => `/api/contracts/${id}/members`,
        REFERENCES: {
            BASE: (id: string) => `/api/contracts/${id}/reference`,
            SEARCH: (id: string) => `/api/contracts/${id}/reference/search`,
            UPDATE: (id: string) => `/api/contracts/${id}/reference`,
        },
        PURCHASE_ORDERS: {
            BASE: (id: string) => `/api/contracts/${id}/purchase-orders`,
            DETAIL: (id: string, poId: string) => `/api/contracts/${id}/purchase-orders/${poId}`,
            CREATE: (id: string) => `/api/contracts/${id}/purchase-orders`,
            UPDATE: (id: string, poId: string) => `/api/contracts/${id}/purchase-orders/${poId}`,
            DELETE: (id: string, poId: string) => `/api/contracts/${id}/purchase-orders/${poId}`,
        },
        FORM_SUBMISSIONS: {
            BASE: (id: string, type: string) => `/api/contracts/${id}/form-submissions/${type}`,
            SAVE: (id: string) => `/api/contracts/${id}/form-submissions`,
            PDF: (id: string, type: string) => `/api/contracts/${id}/form-submissions/${type}/pdf`,
            PDF_QUEUE: (id: string, type: string) => `/api/contracts/${id}/form-submissions/${type}/pdf/queue`,
            PDF_STATUS: (jobId: string) => `/admin/form-templates/pdf-status/${jobId}`,
            EXPORT_QUEUE: '/admin/form-templates/export-queue',
        },
        FILES: {
            REVISION: (id: string) => `/api/contracts/${id}/revision`,
            REVISION_VERSIONS: (id: string) => `/api/contracts/${id}/revision/versions`,
            CHANGE_VERSION: (id: string) => `/api/contracts/${id}/version`,
            AGREEMENT: (id: string) => `/api/contracts/${id}/agreement`,
            AGREEMENT_VERSIONS: (id: string) => `/api/contracts/${id}/agreement/versions`,
            ATTACHMENTS: (id: string) => `/api/contracts/${id}/attachments`,
            ATTACHMENT_DETAIL: (id: string, atId: string) => `/api/contracts/${id}/attachments/${atId}`,
            DOWNLOAD: (id: string, versionNo?: number, type: string = 'contract') =>
                versionNo ? `/api/contracts/${id}/file/${versionNo}?type=${type}` : `/api/contracts/${id}/download`,
            ATTACHMENT_DOWNLOAD: (id: string, atId: string) => `/api/contracts/${id}/attachment/${atId}`,
            PDF_PREVIEW: (id: string, versionNo: number, type: string = 'contract') => `/api/contracts/${id}/pdf/${versionNo}?type=${type}`,
            ATTACHMENT_PDF_PREVIEW: (id: string, atId: string) => `/api/contracts/${id}/attachment-pdf/${atId}`,
            VENDOR_DOCUMENT: (id: string, docId: string, fileName?: string) =>
                `/api/contracts/${id}/vendor-document/${encodeURIComponent(docId)}${fileName ? `?fileName=${encodeURIComponent(fileName)}` : ''}`,
            VENDOR_DOCUMENT_PDF: (id: string, docId: string, fileName?: string) =>
                `/api/contracts/${id}/vendor-document-pdf/${encodeURIComponent(docId)}${fileName ? `?fileName=${encodeURIComponent(fileName)}` : ''}`,
        },
        AUDIT_TRAIL: {
            BASE: (id: string) => `/api/contracts/${id}/audit-trail`,
            PDF: (id: string, params?: string) => `/api/contracts/${id}/audit-trail/pdf${params ? '?' + params : ''}`,
        },
    },

    // 5. Notifications
    NOTIFICATIONS: {
        BASE: '/api/notifications',
        UNREAD_COUNT: '/api/notifications/unread-count',
        MARK_ALL_READ: '/api/notifications/mark-all-read',
        MARK_READ: (id: string) => `/api/notifications/${id}/read`,
        DISMISS: (id: string) => `/api/notifications/${id}`,
    },

    // 6. Discussions & Chat
    DISCUSSIONS: {
        BASE: '/api/discussions',
        DETAIL: (contractId: string) => `/api/discussions/${contractId}`,
        SEND: (contractId: string) => `/api/discussions/${contractId}/messages`,
        MARK_READ: (contractId: string) => `/api/discussions/${contractId}/read`,
        CONTRACT_MESSAGES: (contractId: string) => `/api/contracts/${contractId}/messages`,
        MESSAGE_DETAIL: (messageId: string) => `/api/messages/${messageId}`,
        MESSAGE_REACTION: (messageId: string) => `/api/messages/${messageId}/reaction`,
        CONTRACT_MESSAGES_READ: (contractId: string) => `/api/contracts/${contractId}/messages/read`,
    },

    // 7. Workflow Admin
    WORKFLOWS: {
        BASE: '/api/admin/workflows',
        DETAIL: (id: string) => `/api/admin/workflows/${id}`,
        PREVIEW: (id: string) => `/api/admin/workflows/${id}/preview`,
        TOGGLE: (id: string) => `/api/admin/workflows/${id}/toggle`,
        DUPLICATE: (id: string) => `/api/admin/workflows/${id}/duplicate`,
        BULK_DELETE: '/api/admin/workflows/bulk-delete',
        PRESETS: '/api/admin/workflows/presets',
        PRESET_DETAIL: (id: string) => `/api/admin/workflows/presets/${id}`,
    },

    // 8. Form Templates
    FORM_TEMPLATES: {
        BASE: '/api/form-templates',
        DETAIL: (id: string) => `/api/form-templates/${id}`,
        FIELDS: (id: string) => `/api/form-templates/${id}/fields`,
    },

    // 9. Reports & Audit Trail
    REPORTS: {
        DIVISIONS: '/api/admin/reports/divisions',
        EXPORT_DIVISIONS: '/api/admin/reports/divisions/export',
        TEAM: '/api/admin/reports/team',
        EXPORT_TEAM: '/api/admin/reports/team/export',
        ANALYTICS: '/api/admin/reports/analytics',
        AUDIT: '/api/admin/reports/audit',
        EXPORT_ANALYTICS: '/api/admin/reports/analytics/export',
        EXPORT_AUDIT: '/api/admin/reports/audit/export',
        DATA: '/api/admin/reports/data',
    },
} as const;
