<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Workflow Import Defaults
    | Nilai fallback saat field tidak ada di JSON yang diimpor.
    |--------------------------------------------------------------------------
    */
    'workflow' => [
        'initiator_type' => env('WORKFLOW_DEFAULT_INITIATOR_TYPE', 'all'),
        'sla_drafting_hours' => (int) env('WORKFLOW_DEFAULT_SLA_DRAFTING_HOURS', 72),
        'sla_total_hours' => (int) env('WORKFLOW_DEFAULT_SLA_TOTAL_HOURS', 240),
        'sla_cutoff_hour' => (int) env('WORKFLOW_DEFAULT_SLA_CUTOFF_HOUR', 16),
        'scope' => env('WORKFLOW_DEFAULT_SCOPE', 'HO'),
        'category' => env('WORKFLOW_DEFAULT_CATEGORY', 'unified'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Workflow Step Defaults
    |--------------------------------------------------------------------------
    */
    'workflow_step' => [
        'approver_type' => 'role',       // ponytail: enum — tidak perlu env
        'phase' => 'f1_request', // ponytail: enum — tidak perlu env
    ],

    /*
    |--------------------------------------------------------------------------
    | Form Template Defaults
    |--------------------------------------------------------------------------
    */
    'form_template' => [
        'document_type' => 'f1', // ponytail: enum — tidak perlu env
    ],

    /*
    |--------------------------------------------------------------------------
    | Contract Type Defaults
    |--------------------------------------------------------------------------
    */
    'contract_type' => [
        'input_mechanism' => 'form', // ponytail: enum — tidak perlu env
    ],

    /*
    |--------------------------------------------------------------------------
    | Module Group Defaults
    |--------------------------------------------------------------------------
    */
    'module_group' => [
        'default_icon' => env('MODULE_GROUP_DEFAULT_ICON', 'LayoutGrid'),
    ],

    /*
    |--------------------------------------------------------------------------
    | System Roles configuration
    | Mendefinisikan nama role bawaan sistem untuk pengecekan hak akses/bypass.
    |--------------------------------------------------------------------------
    */
    'roles' => [
        'admin' => env('SYSTEM_ROLE_ADMIN', 'Admin'),
        'staff' => env('SYSTEM_ROLE_STAFF', 'Staff'),
        'manager' => env('SYSTEM_ROLE_MANAGER', 'Manager'),
        'director' => env('SYSTEM_ROLE_DIRECTOR', 'Director'),
        'vp' => env('SYSTEM_ROLE_VP', 'VP'),
        'ceo' => env('SYSTEM_ROLE_CEO', 'CEO'),
        'adhoc_approver' => env('SYSTEM_ROLE_ADHOC', 'Persetujuan Tambahan'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Daftar Entitas yang Diizinkan untuk Clean & Export/Import
    | Satu-satunya source of truth — dipakai controller & CleanMasterDataRequest
    |--------------------------------------------------------------------------
    */
    'allowed_entities' => [
        'company_groups',
        'regions',
        'companies',
        'departments',
        'divisions',
        'contract_statuses',
        'contract_types',
        'workflows',
        'contracts',
        'roles',
        'access_mappings',
        'navigation_mappings',
        'form_templates',
        'form_fields',
        'users',
    ],

];
