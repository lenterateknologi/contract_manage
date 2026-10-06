<?php

namespace App\Http\Controllers\Template;

use App\Http\Controllers\Controller;
use App\Models\ContractTemplate;
use App\Models\DashboardType;
use App\Models\TemplateFolder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TemplateController extends Controller
{
    /**
     * Get resolved template permissions for current user from DashboardType profile.
     */
    private function getTemplatePermissions(): array
    {
        $user = Auth::user();
        if (! $user) {
            return [
                'canRead' => false,
                'canDownload' => false,
                'canUpload' => false,
                'canCreateFolder' => false,
                'canEdit' => false,
                'canToggleVisibility' => false,
                'canDelete' => false,
            ];
        }

        if ($user->isAdmin() || in_array($user->role, ['Super Admin', 'Admin'])) {
            return [
                'canRead' => true,
                'canDownload' => true,
                'canUpload' => true,
                'canCreateFolder' => true,
                'canEdit' => true,
                'canToggleVisibility' => true,
                'canDelete' => true,
            ];
        }

        $policy = DashboardType::resolveForUser($user);

        if (! $policy) {
            return [
                'canRead' => true,
                'canDownload' => true,
                'canUpload' => false,
                'canCreateFolder' => false,
                'canEdit' => false,
                'canToggleVisibility' => false,
                'canDelete' => false,
            ];
        }

        return [
            'canRead' => (bool) ($policy->template_can_read ?? true),
            'canDownload' => (bool) ($policy->template_can_download ?? true),
            'canUpload' => (bool) ($policy->template_can_upload ?? false),
            'canCreateFolder' => (bool) ($policy->template_can_create_folder ?? false),
            'canEdit' => (bool) ($policy->template_can_edit ?? false),
            'canToggleVisibility' => (bool) ($policy->template_can_toggle_visibility ?? false),
            'canDelete' => (bool) ($policy->template_can_delete ?? false),
        ];
    }

    /**
     * Check permission against resolved template policy.
     */
    private function checkPermission(string $action = 'read')
    {
        $user = Auth::user();
        if (! $user) {
            abort(401, 'Unauthorized');
        }

        if ($user->isAdmin() || in_array($user->role, ['Super Admin', 'Admin'])) {
            return true;
        }

        $perms = $this->getTemplatePermissions();

        $allowed = match ($action) {
            'read', 'view' => $perms['canRead'],
            'download' => $perms['canDownload'],
            'upload' => $perms['canUpload'],
            'create_folder' => $perms['canCreateFolder'],
            'create' => $perms['canUpload'] || $perms['canCreateFolder'],
            'update', 'edit' => $perms['canEdit'],
            'toggle_visibility' => $perms['canToggleVisibility'],
            'delete' => $perms['canDelete'],
            default => false,
        };

        if (! $allowed) {
            abort(403, 'Akses ditolak: Anda tidak memiliki otoritas untuk melakukan tindakan ini pada Template Dokumen.');
        }

        return true;
    }

    /**
     * Display the template management page.
     */
    public function index()
    {
        $this->checkPermission('read');
        $permissions = $this->getTemplatePermissions();
        $canManage = $permissions['canEdit'] || $permissions['canToggleVisibility'];

        $folderQuery = TemplateFolder::query()
            ->select(['id', 'parent_id', 'name', 'is_visible', 'created_by', 'created_at', 'updated_at'])
            ->with(['creator'])
            ->withCount('templates')
            ->orderBy('name');

        $templateQuery = ContractTemplate::query()
            ->select([
                'id',
                'template_folder_id',
                'name',
                'description',
                'file_path',
                'file_name',
                'file_size',
                'file_type',
                'is_visible',
                'created_by',
                'created_at',
                'updated_at',
            ])
            ->with([
                'folder:id,name',
                'creator',
            ])
            ->orderBy('name');

        if (! $canManage) {
            $folderQuery->where('is_visible', true);
            $templateQuery->where('is_visible', true);
        }

        return Inertia::render('contract-templates/Index', [
            'folders' => $folderQuery->get(),
            'templates' => $templateQuery->get(),
            'permissions' => $permissions,
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
        $this->checkPermission('create');

        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:m_template_folders,id',
            'is_visible' => 'nullable|boolean',
        ]);

        TemplateFolder::create([
            'name' => $request->name,
            'parent_id' => $request->parent_id,
            'is_visible' => $request->boolean('is_visible', true),
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
        $this->checkPermission('update');

        $request->validate([
            'name' => 'required|string|max:255',
            'is_visible' => 'nullable|boolean',
        ]);

        $updateData = ['name' => $request->name, 'updated_by' => Auth::id()];
        if ($request->has('is_visible')) {
            $updateData['is_visible'] = $request->boolean('is_visible');
        }

        $folder->update($updateData);

        return back()->with('success', 'Folder berhasil diperbarui.');
    }

    /**
     * Toggle visibility of a folder.
     */
    public function toggleFolderVisibility(TemplateFolder $folder)
    {
        $this->checkPermission('update');

        $folder->update([
            'is_visible' => ! $folder->is_visible,
            'updated_by' => Auth::id(),
        ]);

        $status = $folder->is_visible ? 'ditampilkan' : 'disembunyikan';

        return back()->with('success', "Folder {$folder->name} berhasil {$status}.");
    }

    /**
     * Remove the specified folder and all its descendants.
     */
    public function destroyFolder(TemplateFolder $folder)
    {
        $this->checkPermission('delete');

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
        $this->checkPermission('create');

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'template_folder_id' => 'nullable|exists:m_template_folders,id',
            'is_visible' => 'nullable|boolean',
            'file' => 'required|file|mimes:docx,doc,pdf,xls,xlsx,txt,rtf,odt,ods,csv|max:20480', // 20MB max
        ]);

        $file = $request->file('file');
        $fileName = $file->getClientOriginalName();
        $path = $file->store('contract_templates', 'public');

        ContractTemplate::create([
            'name' => $request->name,
            'description' => $request->description,
            'template_folder_id' => $request->template_folder_id,
            'is_visible' => $request->boolean('is_visible', true),
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
        $this->checkPermission('update');

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'template_folder_id' => 'nullable|exists:m_template_folders,id',
            'is_visible' => 'nullable|boolean',
            'file' => 'nullable|file|mimes:docx,doc,pdf,xls,xlsx,txt,rtf,odt,ods,csv|max:20480',
        ]);

        $data = [
            'name' => $request->name,
            'description' => $request->description,
            'template_folder_id' => $request->template_folder_id,
            'updated_by' => Auth::id(),
        ];

        if ($request->has('is_visible')) {
            $data['is_visible'] = $request->boolean('is_visible');
        }

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
     * Toggle visibility of a template.
     */
    public function toggleTemplateVisibility(ContractTemplate $template)
    {
        $this->checkPermission('update');

        $template->update([
            'is_visible' => ! $template->is_visible,
            'updated_by' => Auth::id(),
        ]);

        $status = $template->is_visible ? 'ditampilkan' : 'disembunyikan';

        return back()->with('success', "Dokumen {$template->name} berhasil {$status}.");
    }

    /**
     * Download the template file.
     */
    public function downloadTemplate(ContractTemplate $template)
    {
        $this->checkPermission('read');

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
        $this->checkPermission('delete');

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
        $this->checkPermission('update');

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
        $this->checkPermission('update');

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
        $this->checkPermission('bulk_delete');

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
        $this->checkPermission('update');

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
        $user = Auth::user();
        $isAdmin = $user && ($user->isAdmin() || in_array($user->role, ['Super Admin', 'Admin']));

        $folderQuery = TemplateFolder::query();
        $templateQuery = ContractTemplate::with('creator');

        if (! $isAdmin) {
            $folderQuery->where('is_visible', true);
            $templateQuery->where('is_visible', true);
        }

        return response()->json([
            'folders' => $folderQuery->get(),
            'templates' => $templateQuery->get(),
        ]);
    }
}
