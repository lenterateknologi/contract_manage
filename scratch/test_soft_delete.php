<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// 1. Get a test user
$user = User::first();
if (!$user) {
    echo "No user found to test deletion.\n";
    exit;
}

$userId = $user->id;
echo "Testing Soft Delete for User: " . $user->name . " (ID: $userId)\n";

// 2. Delete the user
$user->delete();
echo "User deleted.\n";

// 3. Verify in DB
$dbUser = DB::table('users')->where('id', $userId)->first();
if ($dbUser && $dbUser->deleted_at !== null) {
    echo "SUCCESS: User still exists in DB and has deleted_at = " . $dbUser->deleted_at . "\n";
} else {
    echo "FAILED: User was permanently deleted or deleted_at is NULL.\n";
}

// 4. Verify Eloquent doesn't see it
$eloquentUser = User::find($userId);
if (!$eloquentUser) {
    echo "SUCCESS: Eloquent find() did not return the user.\n";
} else {
    echo "FAILED: Eloquent find() still returns the user.\n";
}

// 5. Restore the user
User::withTrashed()->find($userId)->restore();
echo "User restored.\n";

$restoredUser = User::find($userId);
if ($restoredUser) {
    echo "SUCCESS: User is visible again.\n";
} else {
    echo "FAILED: User is still hidden after restore.\n";
}
