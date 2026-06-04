<?php

namespace App\Http\Controllers\Admin;

use App\Exports\CompaniesExport;
use App\Exports\CompanyGroupsExport;
use App\Exports\RegionsExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\Common\BulkDeleteRequest;
use App\Http\Requests\Common\ImportFileRequest;
use App\Http\Requests\Company\StoreCompanyRequest;
use App\Http\Requests\Company\UpdateCompanyRequest;
use App\Http\Requests\CompanyGroup\StoreCompanyGroupRequest;
use App\Http\Requests\CompanyGroup\UpdateCompanyGroupRequest;
use App\Http\Requests\Region\StoreRegionRequest;
use App\Http\Requests\Region\UpdateRegionRequest;
use App\Imports\CompaniesImport;
use App\Imports\CompanyGroupsImport;
use App\Imports\RegionsImport;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\Region;
use App\Queries\Master\OrganizationQuery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class OrganizationController extends Controller
{
    public function __construct(
        protected OrganizationQuery $organizationQuery,
    ) {}

    // ─── Company Groups ───────────────────────────────────────────────────────

    public function companyGroups(Request $request)
    {
        $query = $this->organizationQuery->companyGroups($request);

        return Inertia::render('admin/Index', [
            'currentView' => 'company-groups',
            'companyGroups' => $query->paginate($request->input('per_page', 10))->withQueryString(),
            'regions' => Region::all(),
            'filters' => $request->only(['search', 'action', 'id', 'region_id']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Data Group', 'href' => route('admin.company-groups'), 'icon' => 'Users'],
            ],
        ]);
    }

    public function storeCompanyGroup(StoreCompanyGroupRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] = $data['updated_by'] = Auth::id();
        CompanyGroup::create($data);

        return back()->with('success', 'Group berhasil dibuat.');
    }

    public function updateCompanyGroup(UpdateCompanyGroupRequest $request, CompanyGroup $group)
    {
        $data = $request->validated();
        $data['updated_by'] = Auth::id();
        $group->update($data);

        return back()->with('success', 'Group berhasil diperbarui.');
    }

    public function destroyCompanyGroup(CompanyGroup $group)
    {
        $group->delete();

        return back()->with('success', 'Group berhasil dihapus.');
    }

    public function bulkDestroyCompanyGroup(BulkDeleteRequest $request)
    {
        $ids = $request->validated()['ids'];
        CompanyGroup::whereIn('id', $ids)->delete();

        return back()->with('success', 'Grup terpilih berhasil dihapus.');
    }

    // ─── Regions ─────────────────────────────────────────────────────────────

    public function regions(Request $request)
    {
        return Inertia::render('admin/Index', [
            'currentView' => 'regions',
            'regions' => $this->organizationQuery->regions()->get(),
            'companyGroups' => CompanyGroup::all(),
            'filters' => $request->only(['search', 'action', 'id', 'company_group_id']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Data Region', 'href' => route('admin.regions'), 'icon' => 'GitBranch'],
            ],
        ]);
    }

    public function storeRegion(StoreRegionRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] = $data['updated_by'] = Auth::id();
        Region::create($data);

        return back()->with('success', 'Region berhasil dibuat.');
    }

    public function updateRegion(UpdateRegionRequest $request, Region $region)
    {
        $data = $request->validated();
        $data['updated_by'] = Auth::id();
        $region->update($data);

        return back()->with('success', 'Region berhasil diperbarui.');
    }

    public function destroyRegion(Region $region)
    {
        $region->delete();

        return back()->with('success', 'Region berhasil dihapus.');
    }

    public function bulkDestroyRegion(BulkDeleteRequest $request)
    {
        $ids = $request->validated()['ids'];
        Region::whereIn('id', $ids)->delete();

        return back()->with('success', 'Wilayah terpilih berhasil dihapus.');
    }

    // ─── Companies ────────────────────────────────────────────────────────────

    public function companies(Request $request)
    {
        $query = $this->organizationQuery->companies($request);

        return Inertia::render('admin/Index', [
            'currentView' => 'companies',
            'companies' => $query->paginate($request->input('per_page', 10))->withQueryString(),
            'regions' => Region::all(),
            'companyGroups' => CompanyGroup::all(),
            'filters' => $request->only(['search', 'action', 'id', 'region_id', 'company_group_id']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Data Company', 'href' => route('admin.companies'), 'icon' => 'Building2'],
            ],
        ]);
    }

    public function storeCompany(StoreCompanyRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] = $data['updated_by'] = Auth::id();
        Company::create($data);

        return back()->with('success', 'Company berhasil dibuat.');
    }

    public function updateCompany(UpdateCompanyRequest $request, Company $company)
    {
        $data = $request->validated();
        $data['updated_by'] = Auth::id();
        $company->update($data);

        return back()->with('success', 'Company berhasil diperbarui.');
    }

    public function destroyCompany(Company $company)
    {
        $company->delete();

        return back()->with('success', 'Company berhasil dihapus.');
    }

    public function bulkDestroyCompany(BulkDeleteRequest $request)
    {
        $ids = $request->validated()['ids'];
        Company::whereIn('id', $ids)->delete();

        return back()->with('success', 'Perusahaan terpilih berhasil dihapus.');
    }

    public function exportCompanyGroups()
    {
        return Excel::download(new CompanyGroupsExport, 'group_perusahaan_'.date('Ymd').'.xlsx');
    }

    public function importCompanyGroups(ImportFileRequest $request)
    {
        try {
            Excel::import(new CompanyGroupsImport, $request->file('file'));

            return back()->with('success', 'Group perusahaan berhasil diimpor.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal mengimpor data: '.$e->getMessage()]);
        }
    }

    public function exportRegions()
    {
        return Excel::download(new RegionsExport, 'wilayah_region_'.date('Ymd').'.xlsx');
    }

    public function importRegions(ImportFileRequest $request)
    {
        try {
            Excel::import(new RegionsImport, $request->file('file'));

            return back()->with('success', 'Wilayah region berhasil diimpor.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal mengimpor data: '.$e->getMessage()]);
        }
    }

    public function exportCompanies()
    {
        return Excel::download(new CompaniesExport, 'data_perusahaan_'.date('Ymd').'.xlsx');
    }

    public function importCompanies(ImportFileRequest $request)
    {
        try {
            Excel::import(new CompaniesImport, $request->file('file'));

            return back()->with('success', 'Data perusahaan berhasil diimpor.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal mengimpor data: '.$e->getMessage()]);
        }
    }
}
