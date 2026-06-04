<?php

use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    require __DIR__.'/api/transactions.php';
    require __DIR__.'/api/master.php';
    require __DIR__.'/api/services.php';
    require __DIR__.'/api/settings.php';
    require __DIR__.'/api/discussions.php';
});

require __DIR__.'/api/auth.php';
