<?php

namespace App\Http\Controllers;

use App\Models\ContractTemplate;
use App\Models\TemplateFolder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TemplateController extends Controller
{
    /**
     * Display the template management page.
     */
    public function index()
    {
        return Inertia::render('admin/templates', [
            'folders' => TemplateFolder::withCount('templates')->get(),
            'templates' => ContractTemplate::with('folder', 'creator')->get(),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#'],
                ['title' => 'Template Kontrak', 'href' => route('admin.templates.index')],
            ],
        ]);
    }

    /**
     * Store a newly created folder.
     */
    public function storeFolder(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:m_template_folders,id',
        ]);

        TemplateFolder::create([
            'name' => $request->name,
            'parent_id' => $request->parent_id,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        return back()->with('success', 'Folder berhasil dibuat.');
    }

    /**
     * Update the specified folder.
     */
    public function updateFolder(Request $request, TemplateFolder $folder)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $folder->update([
            'name' => $request->name,
            'updated_by' => Auth::id(),
        ]);

        return back()->with('success', 'Folder berhasil diperbarui.');
    }

    /**
     * Remove the specified folder.
     */
    public function destroyFolder(TemplateFolder $folder)
    {
        $folder->delete();

        return back()->with('success', 'Folder berhasil dihapus.');
    }

    /**
     * Store a newly uploaded template.
     */
    public function storeTemplate(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'template_folder_id' => 'nullable|exists:m_template_folders,id',
            'file' => 'required|file|mimes:docx,doc,pdf,xls,xlsx|max:10240', // 10MB max
        ]);

        $file = $request->file('file');
        $fileName = $file->getClientOriginalName();
        $path = $file->store('contract_templates');

        ContractTemplate::create([
            'name' => $request->name,
            'description' => $request->description,
            'template_folder_id' => $request->template_folder_id,
            'file_path' => $path,
            'file_name' => $fileName,
            'file_size' => $file->getSize(),
            'file_type' => $file->getClientOriginalExtension(),
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        return back()->with('success', 'Template berhasil diunggah.');
    }

    /**
     * Update the specifies template.
     */
    public function updateTemplate(Request $request, ContractTemplate $template)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'template_folder_id' => 'nullable|exists:m_template_folders,id',
        ]);

        $template->update([
            'name' => $request->name,
            'description' => $request->description,
            'template_folder_id' => $request->template_folder_id,
            'updated_by' => Auth::id(),
        ]);

        return back()->with('success', 'Template berhasil diperbarui.');
    }

    /**
     * Download the template file.
     */
    public function downloadTemplate(ContractTemplate $template)
    {
        if (! Storage::exists($template->file_path)) {
            abort(404, 'File tidak ditemukan.');
        }

        return Storage::download($template->file_path, $template->file_name);
    }

    /**
     * Remove the specified template.
     */
    public function destroyTemplate(ContractTemplate $template)
    {
        if (Storage::exists($template->file_path)) {
            Storage::delete($template->file_path);
        }

        $template->delete();

        return back()->with('success', 'Template berhasil dihapus.');
    }

    /**
     * Move the folder to a new parent.
     */
    public function moveFolder(Request $request, TemplateFolder $folder)
    {
        $request->validate([
            'parent_id' => 'nullable|exists:m_template_folders,id|different:id',
        ]);

        $folder->update(['parent_id' => $request->parent_id]);

        return back()->with('success', 'Folder berhasil dipindahkan.');
    }

    /**
     * Move the template to a new folder.
     */
    public function moveTemplate(Request $request, ContractTemplate $template)
    {
        $request->validate([
            'template_folder_id' => 'nullable|exists:m_template_folders,id',
        ]);

        $template->update(['template_folder_id' => $request->template_folder_id]);

        return back()->with('success', 'Template berhasil dipindahkan.');
    }

    /**
     * API: Get all folders and templates for the file manager.
     */
    public function getApiData()
    {
        return response()->json([
            'folders' => TemplateFolder::all(),
            'templates' => ContractTemplate::with('creator')->get(),
        ]);
    }
}
