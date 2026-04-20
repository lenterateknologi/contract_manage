<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "--- CHECKING ALL UNIQUE CONSTRAINTS IN PUBLIC SCHEMA ---\n";
try {
    $results = DB::select("
        SELECT 
            t.relname as table_name,
            i.relname as index_name,
            a.attname as column_name
        FROM 
            pg_class t,
            pg_class i,
            pg_index x,
            pg_attribute a
        WHERE 
            t.oid = x.indrelid
            AND i.oid = x.indexrelid
            AND a.attrelid = t.oid
            AND a.attnum = ANY(x.indkey)
            AND t.relkind = 'r'
            AND x.indisunique = true
            AND t.relname = 'form_fields'
        ORDER BY 
            t.relname,
            i.relname;
    ");
    foreach ($results as $r) {
        echo "Table: {$r->table_name} - Index: {$r->index_name} - Col: {$r->column_name}\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
