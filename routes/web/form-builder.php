<?php

use App\Http\Controllers\Form\FormTemplateController;
use Illuminate\Support\Facades\Route;

/*
 * ── Digital Form Builder & Templates ──
 * This feature is web-only for administrative management of forms.
 */

// Public Signed Routes for Browsershot / PDF Rendering
Route::prefix('admin/form-templates')->controller(FormTemplateController::class)->group(function () {
    Route::get('/render-adhoc/{key}', 'renderAdhoc')->name('admin.form-templates.render-adhoc')->middleware('signed');
    Route::get('/{template}/render-print', 'renderPrint')->name('admin.form-templates.render-print')->middleware('signed');
});

Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {

    // Form Builder Management
    Route::controller(FormTemplateController::class)->prefix('form-templates')->group(function () {
        Route::get('/', 'index')->name('admin.form-templates.index');
        Route::get('/builder/{template?}', 'builder')->name('admin.form-templates.builder');
        Route::post('/save/{template?}', 'save')->name('admin.form-templates.save');
        Route::get('/{template}/export', 'export')->name('admin.form-templates.export');
        Route::post('/import', 'import')->name('admin.form-templates.import');
        Route::post('/export-adhoc', 'exportAdhoc')->name('admin.form-templates.export-adhoc');
        Route::post('/export-queue', 'exportAdhocQueue')->name('admin.form-templates.export-queue');
        Route::get('/pdf-status/{jobId}', 'checkPdfStatus')->name('admin.form-templates.pdf-status');
        Route::post('/{template}/export-pdf', 'exportPdf')->name('admin.form-templates.export-pdf');
        Route::post('/{template}/stream-pdf', 'streamPdf')->name('admin.form-templates.stream-pdf');
        Route::delete('/{template}', 'destroy')->name('admin.form-templates.destroy');
        Route::post('/bulk-delete', 'bulkDestroy')->name('admin.form-templates.bulk-destroy');
        Route::post('/{template}/duplicate', 'duplicate')->name('admin.form-templates.duplicate');
        Route::patch('/{template}/metadata', 'updateMetadata')->name('admin.form-templates.metadata.update');
    });
});
