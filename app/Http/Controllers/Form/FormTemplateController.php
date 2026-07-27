<?php

namespace App\Http\Controllers\Form;

use App\Http\Controllers\Controller;
use App\Jobs\GeneratePdfJob;
use App\Models\ContractType;
use App\Models\FormField;
use App\Models\FormTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Inertia\Inertia;

class FormTemplateController extends Controller
{
    /**
     * Display a listing of form templates.
     */
    public function index()
    {
        return Inertia::render('form-management/Templates', [
            'templates' => FormTemplate::withCount('fields')->get(),
            'contract_types' => ContractType::all(),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#'],
                ['title' => 'Form Template', 'href' => route('admin.form-templates.index')],
            ],
        ]);
    }

    /**
     * Show the form for creating or editing a template (Builder).
     */
    public function builder(?FormTemplate $template = null)
    {
        if (! $template) {
            $template = new FormTemplate;
        } else {
            $template->load('fields');
        }

        return Inertia::render('form-builder/Index', [
            'template' => $template,
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#'],
                ['title' => 'Form Template', 'href' => route('admin.form-templates.index')],
                ['title' => $template->exists ? 'Edit Builder' : 'New Builder', 'href' => '#'],
            ],
        ]);
    }

    /**
     * Export form template to PDF — saves to storage and returns a download URL.
     */
    public function exportAdhocQueue(Request $request)
    {
        try {
            $templateData = $request->input('template');
            $formData = json_decode($request->input('form_data', '[]'), true) ?? [];

            // ponytail: Dispatch PDF generation to background queue to prevent single-threaded server deadlock
            $jobId = (string) Str::uuid();
            $key = 'pdf_adhoc_'.$jobId;
            Cache::put($key, [
                'template' => $templateData,
                'formData' => $formData,
            ], 1800); // 30 minutes

            $printUrl = URL::temporarySignedRoute(
                'admin.form-templates.render-adhoc',
                now()->addMinutes(30),
                ['key' => $key],
            );

            if (app()->environment('local')) {
                $printUrl = str_replace('localhost', '127.0.0.1', $printUrl);
            }

            $fileName = Str::slug($templateData['name'] ?? 'form').'_'.time().'.pdf';

            GeneratePdfJob::dispatch($jobId, $printUrl, $fileName);

            Cache::put('pdf_status_'.$jobId, ['status' => 'pending', 'progress' => 10], 1800);

            return response()->json([
                'success' => true,
                'job_id' => $jobId,
            ]);

        } catch (\Exception $e) {
            Log::error('Queue Adhoc Export Failed: '.$e->getMessage());

            return response()->json(['message' => 'Gagal export PDF: '.$e->getMessage()], 500);
        }
    }

    /**
     * Check the status of a queued PDF job.
     */
    public function checkPdfStatus(string $jobId)
    {
        $status = Cache::get('pdf_status_'.$jobId);
        if (! $status) {
            return response()->json(['status' => 'not_found'], 404);
        }

        return response()->json($status);
    }

    /**
     * Export form to PDF without requiring a saved template (Ad-hoc).
     */
    public function exportAdhoc(Request $request)
    {
        set_time_limit(180);

        try {
            $templateData = $request->input('template');
            $formData = $request->input('form_data', '[]');

            // Create a temporary "virtual" template for rendering
            $key = 'pdf_adhoc_'.Str::uuid();
            Cache::put($key, [
                'template' => $templateData,
                'formData' => json_decode($formData, true) ?? [],
            ], 600); // 10 minutes

            // Generate a signed URL for Browsershot to visit
            $printUrl = URL::temporarySignedRoute(
                'admin.form-templates.render-adhoc',
                now()->addMinutes(10),
                ['key' => $key],
            );

            // Force 127.0.0.1 on local dev
            if (app()->environment('local')) {
                $printUrl = str_replace('localhost', '127.0.0.1', $printUrl);
            }

            // High-Fidelity PDF rendering via Browsershot (Turbo Optimized)
            $chromePath = file_exists('/Applications/Brave Browser.app/Contents/MacOS/Brave Browser')
                ? '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
                : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

            $pdfContent = Browsershot::url($printUrl)
                ->setNodeBinary('/opt/homebrew/bin/node')
                ->setNpmBinary('/opt/homebrew/bin/npm')
                ->setChromePath($chromePath)
                ->noSandbox()
                ->addChromiumArguments([
                    'disable-gpu',
                    'disable-dev-shm-usage',
                    'disable-setuid-sandbox',
                    'no-first-run',
                    'disable-extensions',
                ])
                ->timeout(180)
                ->paperSize(210, 297, 'mm')
                ->margins(0, 0, 0, 0)
                ->showBackground()
                ->waitForSelector('#pdf-render-complete')
                ->setDelay(1000)
                ->pdf();

            return response($pdfContent)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="'.($templateData['name'] ?? 'test').'.pdf"');

        } catch (\Exception $e) {
            Log::error('Ad-hoc Browsershot Export Failed: '.$e->getMessage());

            return response()->json(['message' => 'Gagal render PDF: '.$e->getMessage()], 500);
        }
    }

    /**
     * Render the ad-hoc form for Browsershot to visit.
     */
    public function renderAdhoc(string $key)
    {
        $data = Cache::get($key);
        if (! $data) {
            abort(404, 'Data preview kedaluwarsa.');
        }

        // Convert the virtual template data into an object/array compatible with FormPrint
        $templateData = $data['template'];

        // Ensure logo is Base64 encoded for the ad-hoc render too
        if (! empty($templateData['letterhead_json']['logo_url'])) {
            $logoBase64 = $this->getLogoBase64($templateData['letterhead_json']['logo_url']);
            if ($logoBase64) {
                $templateData['letterhead_json']['logo_url'] = $logoBase64;
            }
        }

        return Inertia::render('form-management/Print', [
            'template' => $templateData,
            'formData' => $data['formData'],
        ]);
    }

    /**
     * Store or update a form template and its fields.
     */
    public function save(Request $request, ?FormTemplate $template = null)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'document_type' => 'nullable|string|max:50',
            'contract_type_id' => 'nullable|exists:m_contract_types,id',
            'is_active' => 'boolean',
            'fields' => 'sometimes|array',
            'fields.*.label' => 'nullable|string|max:255',
            'fields.*.type' => 'required|string',
            'fields.*.is_required' => 'boolean',
        ]);

        return DB::transaction(function () use ($request, $template) {
            if (! $template) {
                $template = new FormTemplate;
                $template->created_by = Auth::id();
            }

            $template->name = $request->name;
            $template->description = $request->description;
            if ($request->has('document_type')) {
                $template->document_type = $request->document_type;
            }
            if ($request->has('contract_type_id')) {
                $contractTypeId = $request->contract_type_id;
                if ($contractTypeId === 'null' || $contractTypeId === 'none' || empty($contractTypeId)) {
                    $contractTypeId = null;
                }
                $template->contract_type_id = $contractTypeId;
            }
            if ($request->has('is_active')) {
                $template->is_active = $request->is_active;
            }
            $template->has_letterhead = $request->has_letterhead ?? false;
            $template->letterhead_json = $request->letterhead_json ?? null;
            $template->updated_by = Auth::id();
            $template->save();

            // Sync fields: Delete old ones and create new ones (with parent mapping)
            $template->fields()->delete();

            $idMapping = [];
            $allFieldsData = $request->fields ?? [];

            // First pass: Create all fields without setting parent_id
            foreach ($allFieldsData as $fieldData) {
                $label = $fieldData['label'] ?? '';
                $name = $fieldData['name'] ?? (! empty($label) ? Str::snake($label) : 'field_'.Str::random(6));

                /** @var FormField $field */
                $field = $template->fields()->create([
                    'label' => $label,
                    'name' => $name,
                    'type' => $fieldData['type'],
                    'container_type' => $fieldData['container_type'] ?? null,
                    'placeholder' => $fieldData['placeholder'] ?? null,
                    'is_required' => $fieldData['is_required'] ?? false,
                    'use_rich_text' => $fieldData['use_rich_text'] ?? false,
                    'width' => $fieldData['width'] ?? '1/1',
                    'options' => $fieldData['options'] ?? null,
                    'order' => $fieldData['order'] ?? 0,
                    'validation_rules' => $fieldData['validation_rules'] ?? null,
                ]);
                $idMapping[$fieldData['id']] = $field->id;
            }

            // Second pass: Update parent_id using the mapping
            foreach ($allFieldsData as $fieldData) {
                if (! empty($fieldData['parent_id']) && isset($idMapping[$fieldData['parent_id']])) {
                    $dbId = $idMapping[$fieldData['id']];
                    DB::table('m_form_fields')
                        ->where('id', $dbId)
                        ->update(['parent_id' => $idMapping[$fieldData['parent_id']]]);
                }
            }

            return redirect()->route('admin.form-templates.builder', $template->id)->with('success', 'Template form berhasil disimpan.');
        });
    }

    /**
     * Render the form in a minimalist printable layout (Inertia).
     */
    public function renderPrint(Request $request, FormTemplate $template)
    {
        $template->load(['fields' => fn ($q) => $q->orderBy('order')]);
        $formData = json_decode($request->input('data', '[]'), true) ?? [];

        // Inline logo as Base64 to prevent deadlock during PDF generation
        $letterheadJson = $template->letterhead_json;
        if ($template->has_letterhead && is_array($letterheadJson) && isset($letterheadJson['logo_url'])) {
            $logoBase64 = $this->getLogoBase64($letterheadJson['logo_url']);
            if ($logoBase64) {
                $letterhead = $letterheadJson;
                $letterhead['logo_url'] = $logoBase64;
                $template->letterhead_json = $letterhead;
            }
        }

        return Inertia::render('form-management/Print', [
            'template' => $template,
            'formData' => $formData,
        ]);
    }

    /**
     * Export form to PDF (Download).
     */
    public function exportPdf(Request $request, FormTemplate $template)
    {
        set_time_limit(180);

        try {
            $formData = $request->input('data', '[]');

            // Generate a signed URL for Browsershot to visit
            $printUrl = URL::temporarySignedRoute(
                'admin.form-templates.render-print',
                now()->addMinutes(10),
                ['template' => $template->id, 'data' => $formData],
            );

            // Force 127.0.0.1 on local dev to avoid localhost resolution delays
            if (app()->environment('local')) {
                $printUrl = str_replace('localhost', '127.0.0.1', $printUrl);
            }

            // High-Fidelity PDF rendering via Browsershot (Turbo Optimized)
            $chromePath = file_exists('/Applications/Brave Browser.app/Contents/MacOS/Brave Browser')
                ? '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
                : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

            $pdfContent = Browsershot::url($printUrl)
                ->setNodeBinary('/opt/homebrew/bin/node')
                ->setNpmBinary('/opt/homebrew/bin/npm')
                ->setChromePath($chromePath)
                ->noSandbox()
                ->addChromiumArguments([
                    'disable-gpu',
                    'disable-dev-shm-usage',
                    'disable-setuid-sandbox',
                    'no-first-run',
                    'disable-extensions',
                ])
                ->timeout(180)
                ->paperSize(210, 297, 'mm')
                ->margins(0, 0, 0, 0)
                ->showBackground()
                ->waitForSelector('#pdf-render-complete')
                ->setDelay(1000)
                ->pdf();

            return response($pdfContent)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="'.$template->name.'.pdf"')
                ->header('Cache-Control', 'no-cache, no-store, must-revalidate');
        } catch (\Exception $e) {
            Log::error('Browsershot Export Failed: '.$e->getMessage());
            abort(500, 'Gagal menghasilkan PDF: '.$e->getMessage());
        }
    }

    /**
     * Stream form to PDF (Preview).
     */
    public function streamPdf(Request $request, FormTemplate $template)
    {
        set_time_limit(180);

        try {
            $formData = $request->input('data', '[]');

            $printUrl = URL::temporarySignedRoute(
                'admin.form-templates.render-print',
                now()->addMinutes(10),
                ['template' => $template->id, 'data' => $formData],
            );

            // Force 127.0.0.1 on local dev
            if (app()->environment('local')) {
                $printUrl = str_replace('localhost', '127.0.0.1', $printUrl);
            }

            // High-Fidelity Preview via Browsershot (Turbo Optimized)
            $chromePath = file_exists('/Applications/Brave Browser.app/Contents/MacOS/Brave Browser')
                ? '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
                : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

            $pdfContent = Browsershot::url($printUrl)
                ->setNodeBinary('/opt/homebrew/bin/node')
                ->setNpmBinary('/opt/homebrew/bin/npm')
                ->setChromePath($chromePath)
                ->noSandbox()
                ->addChromiumArguments([
                    'disable-gpu',
                    'disable-dev-shm-usage',
                    'disable-setuid-sandbox',
                    'no-first-run',
                    'disable-extensions',
                ])
                ->timeout(180)
                ->paperSize(210, 297, 'mm')
                ->margins(0, 0, 0, 0)
                ->showBackground()
                ->waitForSelector('#pdf-render-complete')
                ->setDelay(1000)
                ->pdf();

            return response($pdfContent)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'inline; filename="'.$template->name.'.pdf"');
        } catch (\Exception $e) {
            Log::error('Browsershot Stream Failed: '.$e->getMessage());
            abort(500, 'Gagal menghasilkan PDF: '.$e->getMessage());
        }
    }

    /**
     * Remove the specified template.
     */
    public function destroy(FormTemplate $template)
    {
        $template->delete();

        return back()->with('success', 'Template form berhasil dihapus.');
    }

    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return back();
        }

        FormTemplate::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids).' templates deleted successfully.');
    }

    /**
     * Duplicate a form template with all its fields.
     */
    public function duplicate(FormTemplate $template)
    {
        return DB::transaction(function () use ($template) {
            $newTemplate = $template->replicate();
            $newTemplate->name = $template->name.' (Copy)';
            $newTemplate->created_by = Auth::id();
            $newTemplate->updated_by = Auth::id();
            $newTemplate->save();

            // Load all fields to preserve hierarchy
            $fields = $template->fields()->get();
            $idMapping = [];

            // First pass: Create new fields
            foreach ($fields as $field) {
                /** @var FormField $field */
                $newField = $field->replicate();
                /* @var \App\Models\FormField $newField */
                $newField->form_template_id = $newTemplate->id;
                $newField->save();
                $idMapping[$field->id] = $newField->id;
            }

            // Second pass: Update parent IDs
            foreach ($fields as $field) {
                /** @var FormField $field */
                if ($field->parent_id && isset($idMapping[$field->parent_id])) {
                    $newFieldId = $idMapping[$field->id];
                    DB::table('m_form_fields')
                        ->where('id', $newFieldId)
                        ->update(['parent_id' => $idMapping[$field->parent_id]]);
                }
            }

            return redirect()->route('admin.form-templates.index')->with('success', 'Template berhasil diduplikasi.');
        });
    }

    /**
     * Export a form template as a JSON file.
     */
    public function export(FormTemplate $template)
    {
        $template->load(['fields' => fn ($q) => $q->orderBy('order')]);

        $fields = $template->fields->map(function ($field) {
            /* @var \App\Models\FormField $field */
            return [
                'id' => $field->id,
                'parent_id' => $field->parent_id,
                'label' => $field->label,
                'name' => $field->name,
                'type' => $field->type,
                'container_type' => $field->container_type,
                'placeholder' => $field->placeholder,
                'is_required' => (bool) $field->is_required,
                'use_rich_text' => (bool) $field->use_rich_text,
                'width' => $field->width,
                'options' => $field->options,
                'order' => (int) $field->order,
                'validation_rules' => $field->validation_rules,
            ];
        });

        $exportData = [
            'version' => '1.0',
            'name' => $template->name,
            'description' => $template->description,
            'document_type' => $template->document_type,
            'contract_type_id' => $template->contract_type_id,
            'has_letterhead' => (bool) $template->has_letterhead,
            'letterhead_json' => $template->letterhead_json,
            'fields' => $fields->toArray(),
        ];

        $fileName = Str::slug($template->name).'_export_'.date('Ymd_His').'.json';

        return response()->streamDownload(function () use ($exportData) {
            echo json_encode($exportData, JSON_PRETTY_PRINT);
        }, $fileName, [
            'Content-Type' => 'application/json',
        ]);
    }

    /**
     * Import a form template from a JSON file.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:json,txt',
        ]);

        try {
            $fileContent = file_get_contents($request->file('file')->getRealPath());
            $data = json_decode($fileContent, true);

            if (! is_array($data) || ! isset($data['name']) || ! isset($data['fields'])) {
                return back()->withErrors(['error' => 'Format file JSON tidak valid atau data tidak lengkap.']);
            }

            return DB::transaction(function () use ($data) {
                // Find a unique name
                $originalName = $data['name'].' (Imported)';
                $name = $originalName;
                $i = 1;
                while (FormTemplate::where('name', $name)->exists()) {
                    $name = $originalName." (Copy {$i})";
                    $i++;
                }

                // Verify contract_type_id exists
                $contractTypeId = null;
                if (! empty($data['contract_type_id'])) {
                    $exists = DB::table('m_contract_types')->where('id', $data['contract_type_id'])->exists();
                    if ($exists) {
                        $contractTypeId = $data['contract_type_id'];
                    }
                }

                $template = new FormTemplate;
                $template->name = $name;
                $template->description = $data['description'] ?? null;
                $template->document_type = $data['document_type'] ?? 'other';
                $template->contract_type_id = $contractTypeId;
                $template->has_letterhead = $data['has_letterhead'] ?? false;
                $template->letterhead_json = $data['letterhead_json'] ?? null;
                $template->created_by = Auth::id();
                $template->updated_by = Auth::id();
                $template->save();

                $idMapping = [];

                // First pass: Create all fields
                foreach ($data['fields'] as $fieldData) {
                    $label = $fieldData['label'] ?? '';
                    $fieldName = $fieldData['name'] ?? (! empty($label) ? Str::snake($label) : 'field_'.Str::random(6));

                    /** @var FormField $field */
                    $field = $template->fields()->create([
                        'label' => $label,
                        'name' => $fieldName,
                        'type' => $fieldData['type'],
                        'container_type' => $fieldData['container_type'] ?? null,
                        'placeholder' => $fieldData['placeholder'] ?? null,
                        'is_required' => $fieldData['is_required'] ?? false,
                        'use_rich_text' => $fieldData['use_rich_text'] ?? false,
                        'width' => $fieldData['width'] ?? '1/1',
                        'options' => $fieldData['options'] ?? null,
                        'order' => $fieldData['order'] ?? 0,
                        'validation_rules' => $fieldData['validation_rules'] ?? null,
                    ]);
                    $idMapping[$fieldData['id']] = $field->id;
                }

                // Second pass: Restore parent_id relationships
                foreach ($data['fields'] as $fieldData) {
                    if (! empty($fieldData['parent_id']) && isset($idMapping[$fieldData['parent_id']])) {
                        $dbId = $idMapping[$fieldData['id']];
                        DB::table('m_form_fields')
                            ->where('id', $dbId)
                            ->update(['parent_id' => $idMapping[$fieldData['parent_id']]]);
                    }
                }

                return redirect()->route('admin.form-templates.index')->with('success', 'Template form berhasil diimpor.');
            });
        } catch (\Exception $e) {
            Log::error('Form Template Import Error: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors(['error' => 'Gagal mengimpor template form: '.$e->getMessage()]);
        }
    }

    /**
     * Update only the metadata of a template.
     */
    public function updateMetadata(Request $request, FormTemplate $template)
    {
        // Sanitize input: convert string "null" or empty values to actual null
        $contractTypeId = $request->input('contract_type_id');
        if ($contractTypeId === 'null' || $contractTypeId === 'none' || empty($contractTypeId)) {
            $contractTypeId = null;
        }

        $request->merge(['contract_type_id' => $contractTypeId]);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'document_type' => 'nullable|string|max:50',
            'contract_type_id' => 'nullable|exists:m_contract_types,id',
            'is_active' => 'boolean',
        ]);

        $template->update($request->only(['name', 'description', 'document_type', 'contract_type_id', 'is_active']));

        return back()->with('success', 'Informasi template berhasil diperbarui.');
    }

    /**
     * Convert an image path/URL to Base64 to prevent network deadlocks in PDF generation.
     */
    private function getLogoBase64(?string $logoUrl): ?string
    {
        if (! $logoUrl) {
            return null;
        }

        try {
            $path = null;

            // Handle local domain URLs (e.g., http://127.0.0.1:8000/storage/...)
            // This is critical to prevent deadlocks in single-threaded dev servers
            $localUrl = config('app.url') ?: 'http://127.0.0.1:8000';
            if (str_starts_with($logoUrl, $localUrl)) {
                $trimmedPath = str_replace($localUrl.'/storage/', '', $logoUrl);
                // Also handle cases where /storage is not in the URL but we know it's local storage
                if ($trimmedPath === $logoUrl) {
                    $trimmedPath = str_replace($localUrl.'/', '', $logoUrl);
                }
                $path = storage_path('app/public/'.$trimmedPath);

                // Fallback to public path if storage path doesn'tExist
                if (! file_exists($path)) {
                    $path = public_path($trimmedPath);
                }
            }
            // Handle standard storage paths
            elseif (str_starts_with($logoUrl, '/storage/')) {

                $trimmedPath = str_replace('/storage/', '', $logoUrl);
                $path = storage_path('app/public/'.$trimmedPath);
            }
            // Handle direct public paths
            elseif (file_exists(public_path($logoUrl))) {
                $path = public_path($logoUrl);
            }
            // Handle external URLs (like unsplash used in dev)
            elseif (str_starts_with($logoUrl, 'http')) {
                $content = file_get_contents($logoUrl);
                $type = pathinfo(parse_url($logoUrl, PHP_URL_PATH), PATHINFO_EXTENSION) ?: 'png';

                return 'data:image/'.$type.';base64,'.base64_encode($content);
            }

            if ($path && file_exists($path)) {
                $type = pathinfo($path, PATHINFO_EXTENSION);
                $data = file_get_contents($path);

                return 'data:image/'.$type.';base64,'.base64_encode($data);
            }
        } catch (\Exception $e) {
            Log::warning('PDF Logo Base64 failed: '.$e->getMessage());
        }

        return null;
    }
}
