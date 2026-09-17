<?php

namespace App\Exports;

use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class UsersExport implements WithMultipleSheets
{
    protected ?Request $request;

    public function __construct($request = null)
    {
        $this->request = $request instanceof Request ? $request : null;
    }

    public function sheets(): array
    {
        return [
            new EmployeesExport($this->request),
            new RolesExport,
            new DivisionsExport,
        ];
    }
}
