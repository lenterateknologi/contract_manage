<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class CompaniesExport implements WithMultipleSheets
{
    public function sheets(): array
    {
        return [
            new CompaniesMainExport(),
            new CompanyGroupsSheetExport(),
            new RegionsSheetExport(),
        ];
    }
}
