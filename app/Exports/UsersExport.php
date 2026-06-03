<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class UsersExport implements WithMultipleSheets
{
    public function sheets(): array
    {
        return [
            new EmployeesExport,
            new RolesExport,
            new DepartmentsExport,
        ];
    }
}
