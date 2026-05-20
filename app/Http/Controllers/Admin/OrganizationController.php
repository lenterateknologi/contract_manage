<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\Region;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OrganizationController extends Controller
{
    // ─── Company Groups ───────────────────────────────────────────────────────

    public function companyGroups(Request $request)
    {
        return Inertia::render('admin/index', [
            'currentView' => 'company-groups',
            'companyGroups' => CompanyGroup::with(['companies.region'])->get(),
            'regions' => Region::all(),
            'filters' => $request->only(['search', 'action', 'id']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Data Group', 'href' => route('admin.company-groups'), 'icon' => 'Users'],
            ],
        ]);
    }

    public function storeCompanyGroup(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:m_company_groups,code',
            'description' => 'nullable|string',
        ]);
        $data['created_by'] = $data['updated_by'] = Auth::id();
        CompanyGroup::create($data);

        return back()->with('success', 'Group berhasil dibuat.');
    }

    public function updateCompanyGroup(Request $request, CompanyGroup $group)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:m_company_groups,code,' . $group->id,
            'description' => 'nullable|string',
        ]);
        $data['updated_by'] = Auth::id();
        $group->update($data);

        return back()->with('success', 'Group berhasil diperbarui.');
    }

    public function destroyCompanyGroup(CompanyGroup $group)
    {
        $group->delete();

        return back()->with('success', 'Group berhasil dihapus.');
    }

    public function bulkDestroyCompanyGroup(Request $request)
    {
        $ids = $request->validate(['ids' => 'required|array'])['ids'];
        CompanyGroup::whereIn('id', $ids)->delete();

        return back()->with('success', 'Grup terpilih berhasil dihapus.');
    }

    // ─── Regions ─────────────────────────────────────────────────────────────

    public function regions(Request $request)
    {
        return Inertia::render('admin/index', [
            'currentView' => 'regions',
            'regions' => Region::with(['companies.group'])->get(),
            'companyGroups' => CompanyGroup::all(),
            'filters' => $request->only(['search', 'action', 'id', 'company_group_id']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Data Region', 'href' => route('admin.regions'), 'icon' => 'GitBranch'],
            ],
        ]);
    }

    public function storeRegion(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:m_regions,code',
            'alias' => 'nullable|string|max:50',
            'id_portal_master' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);
        $data['created_by'] = $data['updated_by'] = Auth::id();
        Region::create($data);

        return back()->with('success', 'Region berhasil dibuat.');
    }

    public function updateRegion(Request $request, Region $region)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:m_regions,code,' . $region->id,
            'alias' => 'nullable|string|max:50',
            'id_portal_master' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);
        $data['updated_by'] = Auth::id();
        $region->update($data);

        return back()->with('success', 'Region berhasil diperbarui.');
    }

    public function destroyRegion(Region $region)
    {
        $region->delete();

        return back()->with('success', 'Region berhasil dihapus.');
    }

    public function bulkDestroyRegion(Request $request)
    {
        $ids = $request->validate(['ids' => 'required|array'])['ids'];
        Region::whereIn('id', $ids)->delete();

        return back()->with('success', 'Wilayah terpilih berhasil dihapus.');
    }

    // ─── Companies ────────────────────────────────────────────────────────────

    public function companies(Request $request)
    {
        return Inertia::render('admin/index', [
            'currentView' => 'companies',
            'companies' => Company::with(['region', 'group'])->get(),
            'regions' => Region::all(),
            'companyGroups' => CompanyGroup::all(),
            'filters' => $request->only(['search', 'action', 'id', 'region_id']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Data Company', 'href' => route('admin.companies'), 'icon' => 'Building2'],
            ],
        ]);
    }

    public function storeCompany(Request $request)
    {
        $data = $request->validate([
            'company_group_id' => 'required|uuid|exists:m_company_groups,id',
            'region_id' => 'required|uuid|exists:m_regions,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:m_companies,code',
            'address' => 'nullable|string',
        ]);
        $data['created_by'] = $data['updated_by'] = Auth::id();
        Company::create($data);

        return back()->with('success', 'Company berhasil dibuat.');
    }

    public function updateCompany(Request $request, Company $company)
    {
        $data = $request->validate([
            'company_group_id' => 'required|uuid|exists:m_company_groups,id',
            'region_id' => 'required|uuid|exists:m_regions,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:m_companies,code,' . $company->id,
            'address' => 'nullable|string',
        ]);
        $data['updated_by'] = Auth::id();
        $company->update($data);

        return back()->with('success', 'Company berhasil diperbarui.');
    }

    public function destroyCompany(Company $company)
    {
        $company->delete();

        return back()->with('success', 'Company berhasil dihapus.');
    }

    public function bulkDestroyCompany(Request $request)
    {
        $ids = $request->validate(['ids' => 'required|array'])['ids'];
        Company::whereIn('id', $ids)->delete();

        return back()->with('success', 'Perusahaan terpilih berhasil dihapus.');
    }
}
