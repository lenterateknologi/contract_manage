<?php

use App\Models\Department;
use Illuminate\Support\Str;

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$count = Department::count();
echo "Current Department Count: " . $count . "\n";

if ($count === 0) {
    echo "Seeding departments...\n";
    $depts = [
        ['name' => 'Legal & Compliance', 'code' => 'LGL'],
        ['name' => 'Finance & Accounting', 'code' => 'FIN'],
        ['name' => 'Human Resources', 'code' => 'HRD'],
        ['name' => 'Information Technology', 'code' => 'ITD'],
        ['name' => 'Operations', 'code' => 'OPS'],
        ['name' => 'Procurement', 'code' => 'PRO'],
        ['name' => 'Marketing', 'code' => 'MKT'],
    ];

    foreach ($depts as $d) {
        Department::create([
            'id' => Str::uuid(),
            'name' => $d['name'],
            'code' => $d['code'],
            'is_active' => true,
        ]);
        echo "Created: " . $d['name'] . "\n";
    }
} else {
    echo "Departments already exist.\n";
}
