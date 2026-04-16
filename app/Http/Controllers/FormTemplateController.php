<?php

namespace App\Http\Controllers;

use App\Models\FormTemplate;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;

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
     * Store or update a form template and its fields.
     */
    public function save(Request $request, ?FormTemplate $template = null)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'fields' => 'required|array|min:1',
            'fields.*.label' => 'required|string|max:255',
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
                $field = $template->fields()->create([
                    'label' => $fieldData['label'],
                    'name' => $fieldData['name'] ?? Str::snake($fieldData['label']),
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
                    DB::table('form_fields')
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
     * Export form to PDF.
     */
    public function exportPdf(Request $request, FormTemplate $template)
    {
        try {
            $template->load('fields');
            $formData = json_decode($request->input('data', '[]'), true) ?? [];

            // Sort fields by order and build tree for nested rendering in Blade
            $fields = $template->fields->sortBy('order');

            $pdf = Pdf::loadView('pdf.form-template', [
                'template' => $template,
                'formData' => $formData,
                'fields' => $fields,
            ]);

            return $pdf->download($template->name.'.pdf');
        } catch (\Exception $e) {
            Log::error('PDF Export Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
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
}
