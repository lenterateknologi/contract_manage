<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('dashboard');
})->name('home');

Route::middleware(['auth'])->group(function () {
    require __DIR__.'/web/transactions.php';
    require __DIR__.'/web/master.php';
    require __DIR__.'/web/services.php';
    require __DIR__.'/web/discussions.php';
    require __DIR__.'/web/form-builder.php';
});

require __DIR__.'/web/settings.php';
require __DIR__.'/web/auth.php';
