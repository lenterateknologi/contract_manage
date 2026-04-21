<?php

namespace App\Http\Controllers;

use App\Models\FormTemplate;
use App\Jobs\GeneratePdfJob;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\URL;

class FormTemplateController extends Controller
{
    /**
     * Display a listing of form templates.
     */
    public function index()
    {
        return Inertia::render('admin/form-templates', [
            'templates' => FormTemplate::withCount('fields')->get(),
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

        return Inertia::render('admin/form-builder', [
            'template' => $template,
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#'],
                ['title' => 'Form Template', 'href' => route('admin.form-templates.index')],
                ['title' => $template->exists ? 'Edit Builder' : 'New Builder', 'href' => '#'],
            ],
        ]);
    }

    /**
     * Export form to PDF via Background Queue (Reliable choice).
     */
    public function exportAdhocQueue(Request $request)
    {
        try {
            $templateData = $request->input('template');
            $formData = $request->input('form_data', '[]');

            $jobId = (string) Str::uuid();
            $cacheKey = 'pdf_adhoc_' . $jobId;

            Cache::put($cacheKey, [
                'template' => $templateData,
                'formData' => json_decode($formData, true) ?? [],
            ], 1800); // 30 minutes

            $printUrl = URL::temporarySignedRoute(
                'admin.form-templates.render-adhoc',
                now()->addMinutes(30),
                ['key' => $cacheKey]
            );

            if (app()->environment('local')) {
                $printUrl = str_replace('localhost', '127.0.0.1', $printUrl);
            }

            $fileName = (Str::slug($templateData['name'] ?? 'test')) . '_' . time() . '.pdf';

            // Queue the job
            GeneratePdfJob::dispatch($jobId, $printUrl, $fileName);

            Cache::put('pdf_status_' . $jobId, ['status' => 'pending', 'progress' => 10], 1800);

            return response()->json([
                'job_id' => $jobId,
                'message' => 'PDF generation started in background.'
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to queue PDF: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Check the status of a queued PDF job.
     */
    public function checkPdfStatus(string $jobId)
    {
        $status = Cache::get('pdf_status_' . $jobId);
        if (!$status) {
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
            $key = 'pdf_adhoc_' . Str::uuid();
            Cache::put($key, [
                'template' => $templateData,
                'formData' => json_decode($formData, true) ?? [],
            ], 600); // 10 minutes

            // Generate a signed URL for Browsershot to visit
            $printUrl = URL::temporarySignedRoute(
                'admin.form-templates.render-adhoc',
                now()->addMinutes(10),
                ['key' => $key]
            );

            // Force 127.0.0.1 on local dev
            if (app()->environment('local')) {
                $printUrl = str_replace('localhost', '127.0.0.1', $printUrl);
            }

            // High-Fidelity PDF rendering via Browsershot (Turbo Optimized)
            $pdfContent = \Spatie\Browsershot\Browsershot::url($printUrl)
                ->setNodeBinary('/opt/homebrew/bin/node')
                ->setNpmBinary('/opt/homebrew/bin/npm')
                ->setChromePath('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
                ->noSandbox()
                ->addChromiumArguments([
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                    '--disable-setuid-sandbox',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-extensions'
                ])
                ->timeout(180)
                ->format('A4')
                ->margins(0, 0, 0, 0)
                ->showBackground()
                ->waitForSelector('#pdf-render-complete')
                ->setDelay(200)
                ->pdf();


            return response($pdfContent)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="' . ($templateData['name'] ?? 'test') . '.pdf"');

        } catch (\Exception $e) {
            Log::error('Ad-hoc Browsershot Export Failed: ' . $e->getMessage());
            return response()->json(['message' => 'Gagal render PDF: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Render the ad-hoc form for Browsershot to visit.
     */
    public function renderAdhoc(string $key)
    {
        $data = Cache::get($key);
        if (!$data) abort(404, 'Data preview kedaluwarsa.');

        // Convert the virtual template data into an object/array compatible with FormPrint
        $templateData = $data['template'];

        // Ensure logo is Base64 encoded for the ad-hoc render too
        if (!empty($templateData['letterhead_json']['logo_url'])) {
            $logoBase64 = $this->getLogoBase64($templateData['letterhead_json']['logo_url']);
            if ($logoBase64) {
                $templateData['letterhead_json']['logo_url'] = $logoBase64;
            }
        }

        return Inertia::render('admin/form-print', [
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
            $template->has_letterhead = $request->has_letterhead ?? false;
            $template->letterhead_json = $request->letterhead_json ?? null;
            $template->updated_by = Auth::id();
            $template->save();

            // Sync fields: Delete old ones and create new ones (with parent mapping)
            $template->fields()->delete();

            $idMapping = [];
            $allFieldsData = $request->fields;

            // First pass: Create all fields without setting parent_id
            foreach ($allFieldsData as $fieldData) {
                $label = $fieldData['label'] ?? '';
                $name = $fieldData['name'] ?? (!empty($label) ? Str::snake($label) : 'field_' . Str::random(6));

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
     * Show the form for filling.
     */
    public function fill(FormTemplate $template)
    {
        $template->load(['fields' => function ($q) {
            $q->orderBy('order');
        }]);

        return Inertia::render('admin/form-filling', [
            'template' => $template,
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#'],
                ['title' => 'Form Template', 'href' => route('admin.form-templates.index')],
                ['title' => 'Isi Form', 'href' => '#'],
            ],
        ]);
    }

    /**
     * Render the form in a minimalist printable layout (Inertia).
     */
    public function renderPrint(Request $request, FormTemplate $template)
    {
        $template->load(['fields' => fn($q) => $q->orderBy('order')]);
        $formData = json_decode($request->input('data', '[]'), true) ?? [];

        // Inline logo as Base64 to prevent deadlock during PDF generation
        if ($template->has_letterhead && isset($template->letterhead_json['logo_url'])) {
            $logoBase64 = $this->getLogoBase64($template->letterhead_json['logo_url']);
            if ($logoBase64) {
                $letterhead = $template->letterhead_json;
                $letterhead['logo_url'] = $logoBase64;
                $template->letterhead_json = $letterhead;
            }
        }

        return Inertia::render('admin/form-print', [
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
            $printUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
                'admin.form-templates.render-print',
                now()->addMinutes(10),
                ['template' => $template->id, 'data' => $formData]
            );

            // Force 127.0.0.1 on local dev to avoid localhost resolution delays
            if (app()->environment('local')) {
                $printUrl = str_replace('localhost', '127.0.0.1', $printUrl);
            }


            // High-Fidelity PDF rendering via Browsershot (Turbo Optimized)
            $pdfContent = \Spatie\Browsershot\Browsershot::url($printUrl)
                ->setNodeBinary('/opt/homebrew/bin/node')
                ->setNpmBinary('/opt/homebrew/bin/npm')
                ->setChromePath('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
                ->noSandbox()
                ->addChromiumArguments([
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                    '--disable-setuid-sandbox',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-extensions'
                ])
                ->timeout(180)
                ->format('A4')
                ->margins(0, 0, 0, 0)
                ->showBackground()
                ->waitForSelector('#pdf-render-complete')
                ->setDelay(200)
                ->pdf();







            return response($pdfContent)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="' . $template->name . '.pdf"')
                ->header('Cache-Control', 'no-cache, no-store, must-revalidate');
        } catch (\Exception $e) {
            Log::error('Browsershot Export Failed: ' . $e->getMessage());

            // Fallback to legacy Blade if Browsershot fails
            $template->load('fields');
            $fields = $template->fields->sortBy('order');
            $pdf = Pdf::loadView('pdf.form-template', [
                'template' => $template,
                'formData' => json_decode($request->input('data', '[]'), true) ?? [],
                'fields' => $fields,
            ]);

            return $pdf->download($template->name . '.pdf');
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

            $printUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
                'admin.form-templates.render-print',
                now()->addMinutes(10),
                ['template' => $template->id, 'data' => $formData]
            );

            // Force 127.0.0.1 on local dev
            if (app()->environment('local')) {
                $printUrl = str_replace('localhost', '127.0.0.1', $printUrl);
            }


            // High-Fidelity Preview via Browsershot (Turbo Optimized)
            $pdfContent = \Spatie\Browsershot\Browsershot::url($printUrl)
                ->setNodeBinary('/opt/homebrew/bin/node')
                ->setNpmBinary('/opt/homebrew/bin/npm')
                ->setChromePath('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
                ->noSandbox()
                ->addChromiumArguments([
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                    '--disable-setuid-sandbox',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-extensions'
                ])
                ->timeout(180)
                ->format('A4')
                ->margins(0, 0, 0, 0)
                ->showBackground()
                ->waitForSelector('#pdf-render-complete')
                ->setDelay(200)
                ->pdf();







            return response($pdfContent)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'inline; filename="' . $template->name . '.pdf"');
        } catch (\Exception $e) {
            Log::error('Browsershot Stream Failed: ' . $e->getMessage());

            // Robust Fallback to DomPDF
            $template->load('fields');
            $fields = $template->fields->sortBy('order');
            $pdf = Pdf::loadView('pdf.form-template', [
                'template' => $template,
                'formData' => json_decode($request->input('data', '[]'), true) ?? [],
                'fields' => $fields,
            ]);

            return $pdf->stream($template->name . '.pdf');
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
    /**
     * Convert an image path/URL to Base64 to prevent network deadlocks in PDF generation.
     */
    private function getLogoBase64(?string $logoUrl): ?string
    {
        if (!$logoUrl) return null;

        try {
            $path = null;

            // Handle local domain URLs (e.g., http://127.0.0.1:8000/storage/...)
            // This is critical to prevent deadlocks in single-threaded dev servers
            $localUrl = config('app.url') ?: 'http://127.0.0.1:8000';
            if (str_starts_with($logoUrl, $localUrl)) {
                $trimmedPath = str_replace($localUrl . '/storage/', '', $logoUrl);
                // Also handle cases where /storage is not in the URL but we know it's local storage
                if ($trimmedPath === $logoUrl) {
                    $trimmedPath = str_replace($localUrl . '/', '', $logoUrl);
                }
                $path = storage_path('app/public/' . $trimmedPath);

                // Fallback to public path if storage path doesn'tExist
                if (!file_exists($path)) {
                    $path = public_path($trimmedPath);
                }
            }
            // Handle standard storage paths
            elseif (str_starts_with($logoUrl, '/storage/')) {

                $trimmedPath = str_replace('/storage/', '', $logoUrl);
                $path = storage_path('app/public/' . $trimmedPath);
            }
            // Handle direct public paths
            elseif (file_exists(public_path($logoUrl))) {
                $path = public_path($logoUrl);
            }
            // Handle external URLs (like unsplash used in dev)
            elseif (str_starts_with($logoUrl, 'http')) {
                $content = file_get_contents($logoUrl);
                $type = pathinfo(parse_url($logoUrl, PHP_URL_PATH), PATHINFO_EXTENSION) ?: 'png';
                return 'data:image/' . $type . ';base64,' . base64_encode($content);
            }

            if ($path && file_exists($path)) {
                $type = pathinfo($path, PATHINFO_EXTENSION);
                $data = file_get_contents($path);
                return 'data:image/' . $type . ';base64,' . base64_encode($data);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('PDF Logo Base64 failed: ' . $e->getMessage());
        }

        return null;
    }
}

