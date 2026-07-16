<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Upload Categories and MIME Types
    |--------------------------------------------------------------------------
    |
    | This file contains the configuration for allowed file types and sizes
    | categorized by their usage in the application.
    |
    */

    'categories' => [
        // Contract-related documents (F1, F2, Main Contract)
        'contract_revision' => [
            'allowed_mimes' => ['docx', 'doc', 'pdf'],
            'max_size' => 102400, // 100MB
            'disk' => 'local',
            'directory' => 'contracts/{id}',
        ],

        // General attachments for contracts
        'contract_attachment' => [
            'allowed_mimes' => ['jpg', 'jpeg', 'png', 'pdf', 'docx', 'doc', 'xlsx', 'xls', 'zip', 'rar'],
            'max_size' => 102400, // 100MB
            'disk' => 'local',
            'directory' => 'contracts/{id}/attachments',
        ],

        // Messaging/Chat file sharing
        'chat_attachment' => [
            'allowed_mimes' => ['jpg', 'jpeg', 'png', 'pdf', 'docx', 'xlsx', 'txt'],
            'max_size' => 10240, // 10MB
            'disk' => 'local',
            'directory' => 'contracts/{id}/messages',
        ],

        // Vendor legal documents (KTP, NPWP, etc.)
        'vendor_document' => [
            'allowed_mimes' => ['pdf', 'jpg', 'jpeg', 'png'],
            'max_size' => 20480, // 20MB
            'disk' => 'public',
            'directory' => 'vendors/{id}/documents',
        ],

        // User profile pictures
        'user_avatar' => [
            'allowed_mimes' => ['jpg', 'jpeg', 'png'],
            'max_size' => 2048, // 2MB
            'disk' => 'public',
            'directory' => 'avatars',
        ],

        // Import master data/users via Excel/CSV
        'import_excel' => [
            'allowed_mimes' => ['xlsx', 'xls', 'csv'],
            'max_size' => 10240, // 10MB
        ],

        // Import master data/workflows via JSON
        'import_json' => [
            'allowed_mimes' => ['json'],
            'max_size' => 20480, // 20MB
        ],

        // Main agreement documents (F1 template, generated draft)
        'contract_agreement' => [
            'allowed_mimes' => ['docx'],
            'max_size' => 10240, // 10MB
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Global Restrictions
    |--------------------------------------------------------------------------
    */
    'global_max_size' => 204800, // 200MB
];
