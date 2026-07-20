<?php

namespace App\Http\Controllers\Swagger;

use OpenApi\Attributes as OA;

/**
 * Class SwaggerMasterDocs
 *
 * Virtual file to define Swagger / OpenAPI documentation for master data endpoints.
 * This keeps the main controllers clean and separates documentation concern.
 */
#[OA\Schema(
    schema: 'Department',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid', example: '019e8b4f-ceab-736c-98b7-cda53ab88524'),
        new OA\Property(property: 'company_id', type: 'string', format: 'uuid', nullable: true, example: '019e8b4f-ceab-736c-98b7-cda53ab88520'),
        new OA\Property(property: 'code', type: 'string', example: 'MKT'),
        new OA\Property(property: 'name', type: 'string', example: 'Marketing'),
        new OA\Property(property: 'description', type: 'string', nullable: true, example: 'Departemen Pemasaran'),
        new OA\Property(property: 'is_active', type: 'boolean', example: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
    ],
)]
#[OA\Schema(
    schema: 'Vendor',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid', example: '019e8b4f-ceab-736c-98b7-cda53ab88524'),
        new OA\Property(property: 'code', type: 'string', example: 'VND-001'),
        new OA\Property(property: 'name', type: 'string', example: 'PT Rekanan Sukses Mandiri'),
        new OA\Property(property: 'category', type: 'string', nullable: true, example: 'IT Consultant'),
        new OA\Property(property: 'email', type: 'string', format: 'email', nullable: true, example: 'info@rekanan.com'),
        new OA\Property(property: 'phone', type: 'string', nullable: true, example: '021-5556677'),
        new OA\Property(property: 'address', type: 'string', nullable: true, example: 'Jl. Jendral Sudirman No. 10'),
        new OA\Property(property: 'company_type', type: 'string', nullable: true, example: 'PT'),
        new OA\Property(property: 'is_individual', type: 'boolean', example: false),
        new OA\Property(property: 'website', type: 'string', nullable: true, example: 'https://rekanan.com'),
        new OA\Property(property: 'pic_name', type: 'string', nullable: true, example: 'Budi Santoso'),
        new OA\Property(property: 'pic_position', type: 'string', nullable: true, example: 'Account Manager'),
        new OA\Property(property: 'npwp', type: 'string', nullable: true, example: '01.234.567.8-999.000'),
        new OA\Property(property: 'nib', type: 'string', nullable: true, example: '123456789012'),
        new OA\Property(property: 'siup', type: 'string', nullable: true, example: '503/SIUP/2026'),
        new OA\Property(property: 'director_name', type: 'string', nullable: true, example: 'Joko Widodo'),
        new OA\Property(property: 'bank_name', type: 'string', nullable: true, example: 'Bank Central Asia'),
        new OA\Property(property: 'bank_account_no', type: 'string', nullable: true, example: '1234567890'),
        new OA\Property(property: 'bank_account_name', type: 'string', nullable: true, example: 'PT Rekanan Sukses Mandiri'),
        new OA\Property(property: 'is_active', type: 'boolean', example: true),
    ],
)]
#[OA\Schema(
    schema: 'Workflow',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid', example: '019e8b4f-ceab-736c-98b7-cda53ab88524'),
        new OA\Property(property: 'contract_type_id', type: 'string', format: 'uuid', nullable: true, example: '019e8b4f-ceab-736c-98b7-cda53ab88520'),
        new OA\Property(property: 'department_id', type: 'string', format: 'uuid', nullable: true, example: '019e8b4f-ceab-736c-98b7-cda53ab88521'),
        new OA\Property(property: 'name', type: 'string', example: 'Alur Persetujuan Perjanjian Kerjasama'),
        new OA\Property(property: 'description', type: 'string', nullable: true, example: 'Alur standar untuk PKS vendor'),
        new OA\Property(property: 'is_default', type: 'boolean', example: true),
        new OA\Property(property: 'is_template', type: 'boolean', example: false),
        new OA\Property(property: 'is_tax_involved', type: 'boolean', example: false),
        new OA\Property(property: 'initiator_type', type: 'string', example: 'all'),
        new OA\Property(property: 'sla_drafting_hours', type: 'integer', example: 48),
        new OA\Property(property: 'sla_total_hours', type: 'integer', example: 120),
        new OA\Property(property: 'workflow_category', type: 'string', example: 'procurement'),
    ],
)]
#[OA\Schema(
    schema: 'ContractType',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid', example: '019e8b4f-ceab-736c-98b7-cda53ab88524'),
        new OA\Property(property: 'name', type: 'string', example: 'Perjanjian Kerjasama (PKS)'),
        new OA\Property(property: 'code', type: 'string', example: 'PKS'),
        new OA\Property(property: 'description', type: 'string', nullable: true, example: 'Tipe kontrak untuk kerjasama umum'),
        new OA\Property(property: 'is_active', type: 'boolean', example: true),
    ],
)]
#[OA\Schema(
    schema: 'ContractStatus',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid', example: '019e8b4f-ceab-736c-98b7-cda53ab88524'),
        new OA\Property(property: 'name', type: 'string', example: 'Dalam Review'),
        new OA\Property(property: 'code', type: 'string', example: 'in_review'),
        new OA\Property(property: 'color', type: 'string', example: 'yellow'),
        new OA\Property(property: 'description', type: 'string', nullable: true, example: 'Sedang direview oleh approver'),
        new OA\Property(property: 'is_active', type: 'boolean', example: true),
    ],
)]
#[OA\Schema(
    schema: 'CompanyGroup',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid', example: '019e8b4f-ceab-736c-98b7-cda53ab88524'),
        new OA\Property(property: 'code', type: 'string', example: 'LTG'),
        new OA\Property(property: 'name', type: 'string', example: 'Lentera Teknologi Group'),
        new OA\Property(property: 'description', type: 'string', nullable: true, example: 'Holding Company Group'),
    ],
)]
#[OA\Schema(
    schema: 'Region',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid', example: '019e8b4f-ceab-736c-98b7-cda53ab88524'),
        new OA\Property(property: 'code', type: 'string', example: 'JKT'),
        new OA\Property(property: 'name', type: 'string', example: 'DKI Jakarta'),
        new OA\Property(property: 'description', type: 'string', nullable: true, example: 'Regional Jakarta'),
    ],
)]
#[OA\Schema(
    schema: 'Company',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid', example: '019e8b4f-ceab-736c-98b7-cda53ab88524'),
        new OA\Property(property: 'company_group_id', type: 'string', format: 'uuid', nullable: true, example: '019e8b4f-ceab-736c-98b7-cda53ab88520'),
        new OA\Property(property: 'region_id', type: 'string', format: 'uuid', nullable: true, example: '019e8b4f-ceab-736c-98b7-cda53ab88521'),
        new OA\Property(property: 'code', type: 'string', example: 'PT-LTM'),
        new OA\Property(property: 'name', type: 'string', example: 'PT Lentera Teknologi Mandiri'),
        new OA\Property(property: 'alias', type: 'string', nullable: true, example: 'LTM'),
        new OA\Property(property: 'address', type: 'string', nullable: true, example: 'Gedung Lentera LT. 5'),
        new OA\Property(property: 'is_active', type: 'boolean', example: true),
    ],
)]
class SwaggerMasterDocs
{
    // ==========================================
    // DEPARTMENTS ENDPOINTS
    // ==========================================

    #[OA\Get(
        path: '/api/admin/departments',
        summary: 'Get list of departments',
        tags: ['Admin - Departments'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of departments retrieved successfully',
                content: new OA\JsonContent(
                    type: 'object',
                    properties: [
                        new OA\Property(property: 'current_page', type: 'integer'),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Department')),
                        new OA\Property(property: 'total', type: 'integer'),
                    ],
                ),
            ),
        ],
    )]
    public function getDepartments() {}

    #[OA\Post(
        path: '/api/admin/departments',
        summary: 'Create a new department',
        tags: ['Admin - Departments'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'code', type: 'string', example: 'HRD'),
                    new OA\Property(property: 'name', type: 'string', example: 'Human Resource Department'),
                    new OA\Property(property: 'company_id', type: 'string', format: 'uuid', nullable: true),
                    new OA\Property(property: 'description', type: 'string', example: 'Divisi Sumber Daya Manusia'),
                    new OA\Property(property: 'is_active', type: 'boolean', default: true),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 201, description: 'Department created successfully', content: new OA\JsonContent(ref: '#/components/schemas/Department')),
            new OA\Response(response: 422, description: 'Validation error'),
        ],
    )]
    public function createDepartment() {}

    #[OA\Put(
        path: '/api/admin/departments/{department}',
        summary: 'Update an existing department',
        tags: ['Admin - Departments'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'department', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'code', type: 'string', example: 'HRD'),
                    new OA\Property(property: 'name', type: 'string', example: 'Human Resource Development'),
                    new OA\Property(property: 'company_id', type: 'string', format: 'uuid', nullable: true),
                    new OA\Property(property: 'description', type: 'string', example: 'Divisi SDM Terupdate'),
                    new OA\Property(property: 'is_active', type: 'boolean', example: true),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'Department updated successfully', content: new OA\JsonContent(ref: '#/components/schemas/Department')),
            new OA\Response(response: 404, description: 'Department not found'),
        ],
    )]
    public function updateDepartment() {}

    #[OA\Delete(
        path: '/api/admin/departments/{department}',
        summary: 'Soft delete a department',
        tags: ['Admin - Departments'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'department', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Department deleted successfully'),
            new OA\Response(response: 404, description: 'Department not found'),
        ],
    )]
    public function deleteDepartment() {}

    #[OA\Post(
        path: '/api/admin/departments/bulk-delete',
        summary: 'Bulk delete departments',
        tags: ['Admin - Departments'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'ids', type: 'array', items: new OA\Items(type: 'string', format: 'uuid'), example: ['019e8b4f-ceab-736c-98b7-cda53ab88524']),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'Departments deleted successfully'),
        ],
    )]
    public function bulkDeleteDepartments() {}

    // ==========================================
    // VENDORS ENDPOINTS
    // ==========================================

    #[OA\Get(
        path: '/api/admin/vendors',
        summary: 'Get list of vendors',
        tags: ['Admin - Vendors'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'category', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'is_active', in: 'query', required: false, schema: new OA\Schema(type: 'boolean')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of vendors retrieved successfully',
                content: new OA\JsonContent(
                    type: 'object',
                    properties: [
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Vendor')),
                    ],
                ),
            ),
        ],
    )]
    public function getVendors() {}

    #[OA\Post(
        path: '/api/admin/vendors',
        summary: 'Create a new vendor',
        tags: ['Admin - Vendors'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'code', type: 'string', example: 'VND-002'),
                    new OA\Property(property: 'name', type: 'string', example: 'CV Karya Utama'),
                    new OA\Property(property: 'category', type: 'string', example: 'Logistics'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'contact@karyautama.co.id'),
                    new OA\Property(property: 'phone', type: 'string', example: '022-8889900'),
                    new OA\Property(property: 'address', type: 'string', example: 'Jl. Asia Afrika No. 12, Bandung'),
                    new OA\Property(property: 'company_type', type: 'string', example: 'CV'),
                    new OA\Property(property: 'is_individual', type: 'boolean', default: false),
                    new OA\Property(property: 'website', type: 'string', example: 'www.karyautama.co.id'),
                    new OA\Property(property: 'pic_name', type: 'string', example: 'Ahmad Subardjo'),
                    new OA\Property(property: 'pic_position', type: 'string', example: 'Operations Manager'),
                    new OA\Property(property: 'npwp', type: 'string', example: '02.444.555.6-777.000'),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 201, description: 'Vendor created successfully', content: new OA\JsonContent(ref: '#/components/schemas/Vendor')),
        ],
    )]
    public function createVendor() {}

    #[OA\Put(
        path: '/api/admin/vendors/{vendor}',
        summary: 'Update an existing vendor',
        tags: ['Admin - Vendors'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'vendor', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'code', type: 'string', example: 'VND-002'),
                    new OA\Property(property: 'name', type: 'string', example: 'CV Karya Utama Perkasa'),
                    new OA\Property(property: 'category', type: 'string', example: 'Logistics & Shipping'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'admin@karyautamaperkasa.co.id'),
                    new OA\Property(property: 'is_active', type: 'boolean', example: true),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'Vendor updated successfully', content: new OA\JsonContent(ref: '#/components/schemas/Vendor')),
        ],
    )]
    public function updateVendor() {}

    #[OA\Delete(
        path: '/api/admin/vendors/{vendor}',
        summary: 'Soft delete a vendor',
        tags: ['Admin - Vendors'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'vendor', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Vendor deleted successfully'),
        ],
    )]
    public function deleteVendor() {}

    #[OA\Post(
        path: '/api/admin/vendors/bulk-delete',
        summary: 'Bulk delete vendors',
        tags: ['Admin - Vendors'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'ids', type: 'array', items: new OA\Items(type: 'string', format: 'uuid')),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'Vendors deleted successfully'),
        ],
    )]
    public function bulkDeleteVendors() {}

    // ==========================================
    // WORKFLOWS ENDPOINTS
    // ==========================================

    #[OA\Get(
        path: '/api/admin/workflows',
        summary: 'Get list of workflows',
        tags: ['Admin - Workflows'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of workflows retrieved successfully',
                content: new OA\JsonContent(
                    type: 'object',
                    properties: [
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Workflow')),
                    ],
                ),
            ),
        ],
    )]
    public function getWorkflows() {}

    #[OA\Post(
        path: '/api/admin/workflows',
        summary: 'Create a new workflow',
        tags: ['Admin - Workflows'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Workflow HR Internal'),
                    new OA\Property(property: 'description', type: 'string', example: 'Alur persetujuan berkas internal divisi SDM'),
                    new OA\Property(property: 'contract_type_id', type: 'string', format: 'uuid', nullable: true),
                    new OA\Property(property: 'department_id', type: 'string', format: 'uuid', nullable: true),
                    new OA\Property(property: 'is_default', type: 'boolean', default: false),
                    new OA\Property(property: 'is_tax_involved', type: 'boolean', default: false),
                    new OA\Property(property: 'sla_drafting_hours', type: 'integer', default: 24),
                    new OA\Property(property: 'sla_total_hours', type: 'integer', default: 72),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 201, description: 'Workflow created successfully', content: new OA\JsonContent(ref: '#/components/schemas/Workflow')),
        ],
    )]
    public function createWorkflow() {}

    #[OA\Put(
        path: '/api/admin/workflows/{workflow}',
        summary: 'Update an existing workflow',
        tags: ['Admin - Workflows'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'workflow', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Workflow HR Internal Updated'),
                    new OA\Property(property: 'is_active', type: 'boolean', example: true),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'Workflow updated successfully', content: new OA\JsonContent(ref: '#/components/schemas/Workflow')),
        ],
    )]
    public function updateWorkflow() {}

    #[OA\Delete(
        path: '/api/admin/workflows/{workflow}',
        summary: 'Soft delete a workflow',
        tags: ['Admin - Workflows'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'workflow', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Workflow deleted successfully'),
        ],
    )]
    public function deleteWorkflow() {}

    #[OA\Post(
        path: '/api/admin/workflows/bulk-delete',
        summary: 'Bulk delete workflows',
        tags: ['Admin - Workflows'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'ids', type: 'array', items: new OA\Items(type: 'string', format: 'uuid')),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'Workflows deleted successfully'),
        ],
    )]
    public function bulkDeleteWorkflows() {}

    // ==========================================
    // CONTRACT TYPES ENDPOINTS
    // ==========================================

    #[OA\Get(
        path: '/api/admin/contract-types',
        summary: 'Get list of contract types',
        tags: ['Admin - Contract Types'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of contract types retrieved successfully',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/ContractType')),
            ),
        ],
    )]
    public function getContractTypes() {}

    #[OA\Post(
        path: '/api/admin/contract-types',
        summary: 'Create a new contract type',
        tags: ['Admin - Contract Types'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'code', type: 'string', example: 'NDA'),
                    new OA\Property(property: 'name', type: 'string', example: 'Non-Disclosure Agreement'),
                    new OA\Property(property: 'description', type: 'string', example: 'Dokumen kerahasiaan data'),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 201, description: 'Contract Type created successfully', content: new OA\JsonContent(ref: '#/components/schemas/ContractType')),
        ],
    )]
    public function createContractType() {}

    #[OA\Put(
        path: '/api/admin/contract-types/{type}',
        summary: 'Update an existing contract type',
        tags: ['Admin - Contract Types'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'type', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'code', type: 'string', example: 'NDA'),
                    new OA\Property(property: 'name', type: 'string', example: 'Non-Disclosure Agreement Amandemen'),
                    new OA\Property(property: 'is_active', type: 'boolean', example: true),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'Contract Type updated successfully', content: new OA\JsonContent(ref: '#/components/schemas/ContractType')),
        ],
    )]
    public function updateContractType() {}

    #[OA\Delete(
        path: '/api/admin/contract-types/{type}',
        summary: 'Soft delete a contract type',
        tags: ['Admin - Contract Types'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'type', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Contract Type deleted successfully'),
        ],
    )]
    public function deleteContractType() {}

    #[OA\Post(
        path: '/api/admin/contract-types/bulk-delete',
        summary: 'Bulk delete contract types',
        tags: ['Admin - Contract Types'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'ids', type: 'array', items: new OA\Items(type: 'string', format: 'uuid')),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'Contract Types deleted successfully'),
        ],
    )]
    public function bulkDeleteContractTypes() {}

    // ==========================================
    // COMPANIES ENDPOINTS
    // ==========================================

    #[OA\Get(
        path: '/api/admin/companies',
        summary: 'Get list of companies',
        tags: ['Admin - Companies'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of companies retrieved successfully',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/Company')),
            ),
        ],
    )]
    public function getCompanies() {}

    #[OA\Post(
        path: '/api/admin/companies',
        summary: 'Create a new company',
        tags: ['Admin - Companies'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'code', type: 'string', example: 'PT-TMS'),
                    new OA\Property(property: 'name', type: 'string', example: 'PT Teknologi Mega Solusi'),
                    new OA\Property(property: 'alias', type: 'string', example: 'TMS'),
                    new OA\Property(property: 'company_group_id', type: 'string', format: 'uuid', nullable: true),
                    new OA\Property(property: 'region_id', type: 'string', format: 'uuid', nullable: true),
                    new OA\Property(property: 'address', type: 'string', example: 'Gedung Central, Jakarta'),
                    new OA\Property(property: 'is_active', type: 'boolean', default: true),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 201, description: 'Company created successfully', content: new OA\JsonContent(ref: '#/components/schemas/Company')),
        ],
    )]
    public function createCompany() {}

    #[OA\Put(
        path: '/api/admin/companies/{company}',
        summary: 'Update an existing company',
        tags: ['Admin - Companies'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'company', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'code', type: 'string', example: 'PT-TMS'),
                    new OA\Property(property: 'name', type: 'string', example: 'PT Teknologi Mega Solusi Internasional'),
                    new OA\Property(property: 'alias', type: 'string', example: 'TMSI'),
                    new OA\Property(property: 'is_active', type: 'boolean', example: true),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'Company updated successfully', content: new OA\JsonContent(ref: '#/components/schemas/Company')),
        ],
    )]
    public function updateCompany() {}

    #[OA\Delete(
        path: '/api/admin/companies/{company}',
        summary: 'Soft delete a company',
        tags: ['Admin - Companies'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'company', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Company deleted successfully'),
        ],
    )]
    public function deleteCompany() {}

    #[OA\Post(
        path: '/api/admin/companies/bulk-delete',
        summary: 'Bulk delete companies',
        tags: ['Admin - Companies'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'ids', type: 'array', items: new OA\Items(type: 'string', format: 'uuid')),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'Companies deleted successfully'),
        ],
    )]
    public function bulkDeleteCompanies() {}

    // ==========================================
    // REGIONS ENDPOINTS
    // ==========================================

    #[OA\Get(
        path: '/api/admin/regions',
        summary: 'Get list of regions',
        tags: ['Admin - Regions'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of regions retrieved successfully',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/Region')),
            ),
        ],
    )]
    public function getRegions() {}

    #[OA\Post(
        path: '/api/admin/regions',
        summary: 'Create a new region',
        tags: ['Admin - Regions'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'code', type: 'string', example: 'BDG'),
                    new OA\Property(property: 'name', type: 'string', example: 'Bandung'),
                    new OA\Property(property: 'description', type: 'string', example: 'Regional Jawa Barat'),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 201, description: 'Region created successfully', content: new OA\JsonContent(ref: '#/components/schemas/Region')),
        ],
    )]
    public function createRegion() {}

    #[OA\Put(
        path: '/api/admin/regions/{region}',
        summary: 'Update an existing region',
        tags: ['Admin - Regions'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'region', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'code', type: 'string', example: 'BDG'),
                    new OA\Property(property: 'name', type: 'string', example: 'Bandung Raya'),
                    new OA\Property(property: 'description', type: 'string', example: 'Jawa Barat & Bandung Raya'),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'Region updated successfully', content: new OA\JsonContent(ref: '#/components/schemas/Region')),
        ],
    )]
    public function updateRegion() {}

    #[OA\Delete(
        path: '/api/admin/regions/{region}',
        summary: 'Soft delete a region',
        tags: ['Admin - Regions'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'region', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Region deleted successfully'),
        ],
    )]
    public function deleteRegion() {}

    #[OA\Post(
        path: '/api/admin/regions/bulk-delete',
        summary: 'Bulk delete regions',
        tags: ['Admin - Regions'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'ids', type: 'array', items: new OA\Items(type: 'string', format: 'uuid')),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'Regions deleted successfully'),
        ],
    )]
    public function bulkDeleteRegions() {}

    // ==========================================
    // COMPANY GROUPS ENDPOINTS
    // ==========================================

    #[OA\Get(
        path: '/api/admin/company-groups',
        summary: 'Get list of company groups',
        tags: ['Admin - Company Groups'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of company groups retrieved successfully',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/CompanyGroup')),
            ),
        ],
    )]
    public function getCompanyGroups() {}

    #[OA\Post(
        path: '/api/admin/company-groups',
        summary: 'Create a new company group',
        tags: ['Admin - Company Groups'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'code', type: 'string', example: 'ENT'),
                    new OA\Property(property: 'name', type: 'string', example: 'Enterprise Group'),
                    new OA\Property(property: 'description', type: 'string', example: 'Grup bisnis utama'),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 201, description: 'Company Group created successfully', content: new OA\JsonContent(ref: '#/components/schemas/CompanyGroup')),
        ],
    )]
    public function createCompanyGroup() {}

    #[OA\Put(
        path: '/api/admin/company-groups/{group}',
        summary: 'Update an existing company group',
        tags: ['Admin - Company Groups'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'group', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'code', type: 'string', example: 'ENT'),
                    new OA\Property(property: 'name', type: 'string', example: 'Enterprise Division Group'),
                    new OA\Property(property: 'description', type: 'string', example: 'Grup bisnis utama terupdate'),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'Company Group updated successfully', content: new OA\JsonContent(ref: '#/components/schemas/CompanyGroup')),
        ],
    )]
    public function updateCompanyGroup() {}

    #[OA\Delete(
        path: '/api/admin/company-groups/{group}',
        summary: 'Soft delete a company group',
        tags: ['Admin - Company Groups'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'group', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Company Group deleted successfully'),
        ],
    )]
    public function deleteCompanyGroup() {}

    #[OA\Post(
        path: '/api/admin/company-groups/bulk-delete',
        summary: 'Bulk delete company groups',
        tags: ['Admin - Company Groups'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'ids', type: 'array', items: new OA\Items(type: 'string', format: 'uuid')),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'Company Groups deleted successfully'),
        ],
    )]
    public function bulkDeleteCompanyGroups() {}

    // ==========================================
    // CONTRACT STATUSES ENDPOINTS
    // ==========================================

    #[OA\Get(
        path: '/api/admin/contract-statuses',
        summary: 'Get list of contract statuses',
        tags: ['Admin - Contract Statuses'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of contract statuses retrieved successfully',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/ContractStatus')),
            ),
        ],
    )]
    public function getContractStatuses() {}

    #[OA\Post(
        path: '/api/admin/contract-statuses',
        summary: 'Create a new contract status',
        tags: ['Admin - Contract Statuses'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'code', type: 'string', example: 'pending_signatures'),
                    new OA\Property(property: 'name', type: 'string', example: 'Menunggu Upload Tanda Tangan'),
                    new OA\Property(property: 'color', type: 'string', example: 'blue'),
                    new OA\Property(property: 'description', type: 'string', example: 'Menunggu tanda tangan pihak terkait'),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 201, description: 'Contract Status created successfully', content: new OA\JsonContent(ref: '#/components/schemas/ContractStatus')),
        ],
    )]
    public function createContractStatus() {}

    #[OA\Put(
        path: '/api/admin/contract-statuses/{status}',
        summary: 'Update an existing contract status',
        tags: ['Admin - Contract Statuses'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'status', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'code', type: 'string', example: 'pending_signatures'),
                    new OA\Property(property: 'name', type: 'string', example: 'Menunggu Proses Upload Tanda Tangan'),
                    new OA\Property(property: 'color', type: 'string', example: 'indigo'),
                    new OA\Property(property: 'is_active', type: 'boolean', example: true),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'Contract Status updated successfully', content: new OA\JsonContent(ref: '#/components/schemas/ContractStatus')),
        ],
    )]
    public function updateContractStatus() {}

    #[OA\Delete(
        path: '/api/admin/contract-statuses/{status}',
        summary: 'Soft delete a contract status',
        tags: ['Admin - Contract Statuses'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'status', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Contract Status deleted successfully'),
        ],
    )]
    public function deleteContractStatus() {}

    #[OA\Post(
        path: '/api/admin/contract-statuses/bulk-delete',
        summary: 'Bulk delete contract statuses',
        tags: ['Admin - Contract Statuses'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'ids', type: 'array', items: new OA\Items(type: 'string', format: 'uuid')),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'Contract Statuses deleted successfully'),
        ],
    )]
    public function bulkDeleteContractStatuses() {}

    // ==========================================
    // BULK DELETE USERS & ROLES ENDPOINTS
    // ==========================================

    #[OA\Post(
        path: '/api/admin/users/bulk-delete',
        summary: 'Bulk delete users',
        tags: ['Admin - Users'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'ids', type: 'array', items: new OA\Items(type: 'string', format: 'uuid')),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'Users deleted successfully'),
        ],
    )]
    public function bulkDeleteUsers() {}

    #[OA\Post(
        path: '/api/admin/roles/bulk-delete',
        summary: 'Bulk delete roles',
        tags: ['Admin - Roles'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'ids', type: 'array', items: new OA\Items(type: 'string', format: 'uuid')),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'Roles deleted successfully'),
        ],
    )]
    public function bulkDeleteRoles() {}

    // ==========================================
    // MASTER DATA SYNC ENDPOINTS
    // ==========================================

    #[OA\Get(
        path: '/api/admin/master-data-sync',
        summary: 'Get master data sync dashboard with entity counts',
        tags: ['Admin - Master Data Sync'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Dashboard with entity counts retrieved successfully'),
        ],
    )]
    public function masterDataSyncIndex() {}

    #[OA\Get(
        path: '/api/admin/master-data-sync/export',
        summary: 'Export selected master data entities to JSON',
        tags: ['Admin - Master Data Sync'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'entities',
                in: 'query',
                required: false,
                description: 'Comma-separated list of entities to export (e.g. company_groups,regions,workflows). Exports all if omitted.',
                schema: new OA\Schema(type: 'string'),
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: 'JSON file download with master data'),
            new OA\Response(response: 500, description: 'Export failed'),
        ],
    )]
    public function masterDataSyncExport() {}

    #[OA\Post(
        path: '/api/admin/master-data-sync/import',
        summary: 'Import master data from a JSON file',
        tags: ['Admin - Master Data Sync'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    required: ['file'],
                    properties: [
                        new OA\Property(property: 'file', type: 'string', format: 'binary', description: 'JSON export file'),
                    ],
                ),
            ),
        ),
        responses: [
            new OA\Response(response: 302, description: 'Redirect with import summary on success'),
            new OA\Response(response: 422, description: 'Invalid JSON file'),
            new OA\Response(response: 500, description: 'Import failed'),
        ],
    )]
    public function masterDataSyncImport() {}

    #[OA\Post(
        path: '/api/admin/master-data-sync/clean',
        summary: 'Permanently delete selected master data entities',
        tags: ['Admin - Master Data Sync'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['entities'],
                properties: [
                    new OA\Property(
                        property: 'entities',
                        type: 'array',
                        items: new OA\Items(type: 'string'),
                        description: 'List of entity keys to clean (e.g. ["company_groups", "workflows"])',
                    ),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'Data cleaned successfully'),
            new OA\Response(response: 422, description: 'Invalid entity key'),
            new OA\Response(response: 500, description: 'Clean operation failed'),
        ],
    )]
    public function masterDataSyncClean() {}
}
