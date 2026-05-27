<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use App\Models\VendorDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class VendorAdminController extends Controller
{
    public function index(Request $request)
    {
        $query = Vendor::query()
            ->when($request->search, function ($q, $search) {
                $search = strtolower($search);
                $q->where(function ($qq) use ($search) {
                    $qq->where(\Illuminate\Support\Facades\DB::raw('LOWER(name)'), 'like', "%{$search}%")
                        ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(code)'), 'like', "%{$search}%")
                        ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(category)'), 'like', "%{$search}%")
                        ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(email)'), 'like', "%{$search}%");
                });
            })
            ->when($request->category, function ($q, $category) {
                $q->whereIn('category', (array) $category);
            })
            ->when($request->is_active, function ($q, $active) {
                $bools = collect((array) $active)->map(fn ($v) => filter_var($v, FILTER_VALIDATE_BOOLEAN))->toArray();
                $q->whereIn('is_active', $bools);
            });

        return Inertia::render('admin/index', [
            'currentView' => 'vendors',
            'vendors' => $query->orderBy('name')->paginate($request->input('per_page', 10))->withQueryString(),
            'filters' => $request->only(['search', 'category', 'is_active']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Master Vendor', 'href' => route('admin.vendors'), 'description' => 'Kelola database pihak ketiga dan mitra.', 'icon' => 'Truck'],
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/vendors/form', [
            'vendor' => null,
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Master Vendor', 'href' => route('admin.vendors'), 'icon' => 'Truck'],
                ['title' => 'Tambah Vendor', 'href' => '#', 'description' => 'Registrasi rekanan baru.'],
            ],
        ]);
    }

    public function edit(Vendor $vendor)
    {
        $vendor->load('documents');

        return Inertia::render('admin/vendors/form', [
            'vendor' => $vendor,
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Master Vendor', 'href' => route('admin.vendors'), 'icon' => 'Truck'],
                ['title' => 'Kelola Vendor', 'href' => '#', 'description' => 'Update profil & kelola dokumen legal.'],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:50|unique:m_vendors,code',
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'is_active' => 'boolean',
            'company_type' => 'nullable|string|max:100',
            'is_individual' => 'boolean',
            'website' => 'nullable|string|max:255',
            'pic_name' => 'nullable|string|max:255',
            'pic_position' => 'nullable|string|max:255',
            'npwp' => 'nullable|string|max:50',
            'nib' => 'nullable|string|max:50',
            'siup' => 'nullable|string|max:50',
            'director_name' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'bank_account_no' => 'nullable|string|max:100',
            'bank_account_name' => 'nullable|string|max:255',
        ]);

        $data['created_by'] = Auth::id();
        $data['updated_by'] = Auth::id();

        $vendor = Vendor::create($data);

        return redirect()->route('admin.vendors.edit', $vendor->id)->with('success', 'Vendor berhasil dibuat. Anda sekarang dapat melampirkan dokumen.');
    }

    public function update(Request $request, Vendor $vendor)
    {
        $data = $request->validate([
            'code' => 'required|string|max:50|unique:m_vendors,code,' . $vendor->id,
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'is_active' => 'boolean',
            'company_type' => 'nullable|string|max:100',
            'is_individual' => 'boolean',
            'website' => 'nullable|string|max:255',
            'pic_name' => 'nullable|string|max:255',
            'pic_position' => 'nullable|string|max:255',
            'npwp' => 'nullable|string|max:50',
            'nib' => 'nullable|string|max:50',
            'siup' => 'nullable|string|max:50',
            'director_name' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'bank_account_no' => 'nullable|string|max:100',
            'bank_account_name' => 'nullable|string|max:255',
        ]);

        $data['updated_by'] = Auth::id();

        $vendor->update($data);

        return back()->with('success', 'Vendor berhasil diperbarui.');
    }

    public function uploadDocument(Request $request, Vendor $vendor)
    {
        $request->validate([
            'document_file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'document_type' => 'required|string',
            'expires_at' => 'nullable|date',
        ]);

        $file = $request->file('document_file');
        $originalName = $file->getClientOriginalName();
        $path = $file->storeAs("vendor_documents/{$vendor->id}", time() . "_{$originalName}", 'public');

        $vendor->documents()->create([
            'document_name' => $originalName,
            'document_type' => $request->document_type,
            'file_url' => '/storage/' . $path,
            'expires_at' => $request->filled('expires_at') && $request->expires_at !== '' ? $request->expires_at : null,
            'is_verified' => true,
        ]);

        return back()->with('success', 'Dokumen berhasil diunggah.');
    }

    public function destroyDocument(Vendor $vendor, VendorDocument $document)
    {
        if ($document->vendor_id !== $vendor->id) {
            abort(403);
        }

        $document->delete();

        return back()->with('success', 'Dokumen berhasil dihapus.');
    }

    public function destroy(Vendor $vendor)
    {
        $vendor->delete();

        return back()->with('success', 'Vendor berhasil dihapus.');
    }

    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return back();
        }

        Vendor::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids) . ' vendor berhasil dihapus.');
    }

    public function export()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\VendorsExport(),
            'data_vendor_' . date('Ymd') . '.xlsx',
        );
    }

    public function import(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:xlsx,xls']);

        try {
            \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\VendorsImport(), $request->file('file'));

            return back()->with('success', 'Data vendor berhasil diimpor.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal mengimpor data: ' . $e->getMessage()]);
        }
    }
}
