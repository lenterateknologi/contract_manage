<?php

namespace App\Http\Controllers\Admin;

use App\Exports\VendorsExport;
use App\Http\Controllers\Controller;
use App\Http\Queries\Master\VendorQuery;
use App\Http\Requests\Common\ImportFileRequest;
use App\Http\Requests\Vendor\StoreVendorRequest;
use App\Http\Requests\Vendor\UpdateVendorRequest;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class VendorAdminController extends Controller
{
    public function __construct(
        protected VendorQuery $vendorQuery,
    ) {}

    public function index(Request $request)
    {
        $query = $this->vendorQuery->list($request);

        return Inertia::render('admin/Index', [
            'currentView' => 'vendors',
            'vendors' => $query->orderBy('vendor_name')->paginate($request->input('per_page', 15))->withQueryString(),
            'filters' => $request->only(['search', 'category', 'is_active']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Master Vendor', 'href' => route('core.index', 'vendors'), 'description' => 'Kelola database pihak ketiga dan mitra.', 'icon' => 'Truck'],
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('vendors/form', [
            'vendor' => null,
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Master Vendor', 'href' => route('core.index', 'vendors'), 'icon' => 'Truck'],
                ['title' => 'Tambah Vendor', 'href' => '#', 'description' => 'Registrasi rekanan baru.'],
            ],
        ]);
    }

    public function edit(Vendor $vendor)
    {
        $vendor = $this->vendorQuery->findWithDocuments($vendor->id);

        return Inertia::render('vendors/form', [
            'vendor' => $vendor,
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Master Vendor', 'href' => route('core.index', 'vendors'), 'icon' => 'Truck'],
                ['title' => 'Kelola Vendor', 'href' => '#', 'description' => 'Update profil & kelola dokumen legal.'],
            ],
        ]);
    }

    public function store(StoreVendorRequest $request)
    {
        $data = $request->validated();

        $data['created_by'] = Auth::id();
        $data['updated_by'] = Auth::id();

        $vendor = Vendor::create($data);

        return redirect()->route('admin.vendors.edit', $vendor->id)->with('success', 'Vendor berhasil dibuat. Anda sekarang dapat melampirkan dokumen.');
    }

    public function update(UpdateVendorRequest $request, Vendor $vendor)
    {
        $data = $request->validated();
        $data['updated_by'] = Auth::id();
        $vendor->update($data);

        return back()->with('success', 'Vendor berhasil diperbarui.');
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

        return back()->with('success', count($ids).' vendor berhasil dihapus.');
    }

    public function export()
    {
        return Excel::download(
            new VendorsExport,
            'data_vendor_'.date('Ymd').'.xlsx',
        );
    }

    public function import(ImportFileRequest $request)
    {
        try {
            Excel::import(new VendorsImport, $request->file('file'));

            return back()->with('success', 'Data vendor berhasil diimpor.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal mengimpor data: '.$e->getMessage()]);
        }
    }
}
