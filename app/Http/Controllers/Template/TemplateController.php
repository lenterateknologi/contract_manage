<?php

namespace App\Http\Controllers\Template;

use App\Http\Controllers\Controller;
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
        return Inertia::render('contract-templates/Index', [
            'folders' => TemplateFolder::with('creator')->withCount('templates')->get(),
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
     * Remove the specified folder and all its descendants.
     */
    public function destroyFolder(TemplateFolder $folder)
    {
        $this->deleteFolderRecursively($folder);

        return back()->with('success', 'Folder berhasil dihapus.');
    }

    /**
     * Helper to recursively delete folder and sub-folders
     */
    private function deleteFolderRecursively(TemplateFolder $folder)
    {
        $folder->loadMissing(['templates', 'children']);

        // Delete template files
        foreach ($folder->templates as $tpl) {
            if (Storage::disk('public')->exists($tpl->file_path)) {
                Storage::disk('public')->delete($tpl->file_path);
            } elseif (Storage::exists($tpl->file_path)) {
                Storage::delete($tpl->file_path);
            }
            $tpl->delete();
        }

        // Delete children subfolders recursively
        foreach ($folder->children as $child) {
            $this->deleteFolderRecursively($child);
        }

        $folder->delete();
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
            'file' => 'required|file|mimes:docx,doc,pdf,xls,xlsx,txt,rtf,odt,ods,csv|max:20480', // 20MB max
        ]);

        $file = $request->file('file');
        $fileName = $file->getClientOriginalName();
        $path = $file->store('contract_templates', 'public');

        ContractTemplate::create([
            'name' => $request->name,
            'description' => $request->description,
            'template_folder_id' => $request->template_folder_id,
            'file_path' => $path,
            'file_name' => $fileName,
            'file_size' => $file->getSize(),
            'file_type' => strtolower($file->getClientOriginalExtension()),
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
            'file' => 'nullable|file|mimes:docx,doc,pdf,xls,xlsx,txt,rtf,odt,ods,csv|max:20480',
        ]);

        $data = [
            'name' => $request->name,
            'description' => $request->description,
            'template_folder_id' => $request->template_folder_id,
            'updated_by' => Auth::id(),
        ];

        if ($request->hasFile('file')) {
            if (Storage::disk('public')->exists($template->file_path)) {
                Storage::disk('public')->delete($template->file_path);
            } elseif (Storage::exists($template->file_path)) {
                Storage::delete($template->file_path);
            }

            $file = $request->file('file');
            $data['file_path'] = $file->store('contract_templates', 'public');
            $data['file_name'] = $file->getClientOriginalName();
            $data['file_size'] = $file->getSize();
            $data['file_type'] = strtolower($file->getClientOriginalExtension());
        }

        $template->update($data);

        return back()->with('success', 'Template berhasil diperbarui.');
    }

    /**
     * Download the template file.
     */
    public function downloadTemplate(ContractTemplate $template)
    {
        if (Storage::disk('public')->exists($template->file_path)) {
            return Storage::disk('public')->download($template->file_path, $template->file_name);
        }

        if (Storage::exists($template->file_path)) {
            return Storage::download($template->file_path, $template->file_name);
        }

        abort(404, 'File tidak ditemukan.');
    }

    /**
     * Remove the specified template.
     */
    public function destroyTemplate(ContractTemplate $template)
    {
        if (Storage::disk('public')->exists($template->file_path)) {
            Storage::disk('public')->delete($template->file_path);
        } elseif (Storage::exists($template->file_path)) {
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
     * Bulk delete items (folders and templates).
     */
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'folder_ids' => 'nullable|array',
            'folder_ids.*' => 'exists:m_template_folders,id',
            'template_ids' => 'nullable|array',
            'template_ids.*' => 'exists:m_contract_templates,id',
        ]);

        $folderIds = $request->input('folder_ids', []);
        $templateIds = $request->input('template_ids', []);

        // ponytail: bulk destroy templates and clean up files
        if (!empty($templateIds)) {
            $templates = ContractTemplate::whereIn('id', $templateIds)->get();
            foreach ($templates as $template) {
                if (Storage::disk('public')->exists($template->file_path)) {
                    Storage::disk('public')->delete($template->file_path);
                } elseif (Storage::exists($template->file_path)) {
                    Storage::delete($template->file_path);
                }
                $template->delete();
            }
        }

        // ponytail: bulk destroy folders (cascade deletes related templates & child folders)
        if (!empty($folderIds)) {
            $folders = TemplateFolder::whereIn('id', $folderIds)->get();
            foreach ($folders as $folder) {
                $this->deleteFolderRecursively($folder);
            }
        }

        return back()->with('success', 'Item terpilih berhasil dihapus.');
    }

    /**
     * Bulk move items (folders and templates) to a target folder.
     */
    public function bulkMove(Request $request)
    {
        $request->validate([
            'target_folder_id' => 'nullable|exists:m_template_folders,id',
            'folder_ids' => 'nullable|array',
            'folder_ids.*' => 'exists:m_template_folders,id',
            'template_ids' => 'nullable|array',
            'template_ids.*' => 'exists:m_contract_templates,id',
        ]);

        $targetFolderId = $request->input('target_folder_id');
        $folderIds = $request->input('folder_ids', []);
        $templateIds = $request->input('template_ids', []);

        // Move templates
        if (!empty($templateIds)) {
            ContractTemplate::whereIn('id', $templateIds)->update([
                'template_folder_id' => $targetFolderId,
            ]);
        }

        // Move folders (prevent moving a folder into itself)
        if (!empty($folderIds)) {
            $filteredFolderIds = array_filter($folderIds, fn($id) => $id !== $targetFolderId);
            if (!empty($filteredFolderIds)) {
                TemplateFolder::whereIn('id', $filteredFolderIds)->update([
                    'parent_id' => $targetFolderId,
                ]);
            }
        }

        return back()->with('success', 'Item terpilih berhasil dipindahkan.');
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
