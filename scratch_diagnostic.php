<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "--- CHECKING CONSTRAINTS ---\n";
try {
    $constraints = DB::select("SELECT * FROM information_schema.key_column_usage WHERE table_name = 'form_fields'");
    print_r($constraints);
} catch (\Exception $e) {
    echo "Error checking constraints: " . $e->getMessage() . "\n";
}

echo "--- CHECKING INDEXES ---\n";
try {
    $indexes = DB::select("SHOW INDEXES FROM form_fields");
    foreach ($indexes as $idx) {
        echo "Index: {$idx->Key_name} - Column: {$idx->Column_name} - Unique: {$idx->Non_unique}\n";
    }
} catch (\Exception $e) {
    echo "Error checking indexes: " . $e->getMessage() . "\n";
}

echo "--- CHECKING TRIGGERS ---\n";
try {
    $triggers = DB::select("SHOW TRIGGERS");
    print_r($triggers);
} catch (\Exception $e) {
    echo "Error checking triggers: " . $e->getMessage() . "\n";
}

echo "--- SEARCHING FOR 'type_p_content_wrapper' ---\n";
try {
    $fields = DB::table('form_fields')->where('name', 'like', 'type_p_content_wrapper%')->get();
    foreach ($fields as $f) {
        echo "ID: {$f->id} - Template: {$f->form_template_id} - Name: {$f->name} - Deleted: {$f->deleted_at}\n";
    }
} catch (\Exception $e) {
    echo "Error searching fields: " . $e->getMessage() . "\n";
}
