<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "--- SEARCHING FOR ANY UNIQUE INDEX IN THE ENTIRE DB ---\n";
try {
    $results = DB::select("
        SELECT 
            relname, 
            indexrelname 
        FROM 
            pg_stat_user_indexes 
        WHERE 
            relname = 'form_fields'
    ");
    foreach ($results as $r) {
        echo "Table: {$r->relname} - Index: {$r->indexrelname}\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "--- CHECKING PG_CONSTRAINT TABLE DIRECTLY ---\n";
try {
    $results = DB::select("
        SELECT conname, contype, pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conname LIKE '%unique%' OR conname LIKE '%pkey%'
    ");
    foreach ($results as $r) {
        echo "Name: {$r->conname} - Type: {$r->contype} - Def: {$r->pg_get_constraintdef}\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
