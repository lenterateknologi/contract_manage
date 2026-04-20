<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "--- CHECKING FOR COMPOSITE INDEXES ON ALL TABLES ---\n";
try {
    $results = DB::select("
        SELECT
            schemaname,
            tablename,
            indexname,
            indexdef
        FROM
            pg_indexes
        WHERE
            tablename NOT LIKE 'pg_%'
            AND tablename NOT LIKE 'sql_%'
    ");
    foreach ($results as $r) {
        if (strpos($r->indexname, 'form_fields') !== false) {
            echo "Table: {$r->tablename} - Index: {$r->indexname}\nDef: {$r->indexdef}\n\n";
        }
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
