<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Portal Master Data Base URL & Endpoints
    |--------------------------------------------------------------------------
    | ponytail: centralized portal endpoints config
    */
    'base_url' => env('PORTAL_API_BASE_URL', 'http://127.0.0.1:8000'),

    'endpoints' => [
        'regions' => 'Region/GetAllDataRegion',
        'company_groups' => 'CompanyGroup/GetAllDataCompanyGroupByStatusActive',
        'locations' => 'Location/GetAllDataLocation',
        'companies' => 'company/GetAllDataCompany',
        'business_units' => 'BusinessUnit/GetAllDataBusinessUnit',
        'departments' => 'Organization/GetAllDataOrganization',
        'organizations' => 'Organization/GetAllDataOrganization',
        'users' => 'Employee/GetAllDataEmployeeAllColumnBystatusActive',
        'employees' => 'Employee/GetAllDataEmployeeAllColumnBystatusActive',
    ],
];
