<?php

namespace App\Exports\Master;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class DepartmentsWorkbookExport implements WithMultipleSheets
{
    public function sheets(): array
    {
        return [
            new DepartmentMainExport,
            new CompaniesSheetExport,
        ];
    }
}
