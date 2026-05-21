<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\ContractStatus;
use App\Models\ContractType;
use App\Models\Department;
use App\Models\Region;
use App\Models\Workflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class MasterDataAdminController extends Controller
{
    /**
     * Display the index view with statistics.
     */
    public function index()
    {
        return Inertia::render('admin/index', [
            'currentView' => 'master-data-sync',
            'counts' => [
                'company_groups' => CompanyGroup::count(),
                'regions' => Region::count(),
                'companies' => Company::count(),
                'departments' => Department::count(),
                'contract_statuses' => ContractStatus::count(),
                'contract_types' => ContractType::count(),
            ],
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Ekspor Impor Master', 'href' => route('admin.master-data-sync'), 'icon' => 'RefreshCw'],
            ],
        ]);
    }

    /**
     * Export all master data to JSON format.
     */
    public function export()
    {
        try {
            $groups = CompanyGroup::all()->map(function ($g) {
                return [
                    'code' => $g->code,
                    'name' => $g->name,
                    'description' => $g->description,
                    'is_active' => $g->is_active,
                ];
            })->toArray();

            $regions = Region::all()->map(function ($r) {
                return [
                    'code' => $r->code,
                    'name' => $r->name,
                    'alias' => $r->alias,
                    'description' => $r->description,
                    'is_active' => $r->is_active,
                    'id_portal_master' => $r->id_portal_master,
                ];
            })->toArray();

            $companies = Company::with(['group', 'region'])->get()->map(function ($c) {
                return [
                    'code' => $c->code,
                    'name' => $c->name,
                    'alias' => $c->alias,
                    'address' => $c->address,
                    'company_group_code' => $c->group->code ?? null,
                    'region_code' => $c->region->code ?? null,
                    'is_active' => $c->is_active,
                ];
            })->toArray();

            $departments = Department::with(['company'])->get()->map(function ($d) {
                return [
                    'code' => $d->code,
                    'name' => $d->name,
                    'description' => $d->description,
                    'company_code' => $d->company->code ?? null,
                    'is_active' => $d->is_active,
                ];
            })->toArray();

            $statuses = ContractStatus::all()->map(function ($s) {
                return [
                    'code' => $s->code,
                    'label' => $s->label,
                    'color' => $s->color,
                    'bg_color' => $s->bg_color,
                    'icon' => $s->icon,
                    'description' => $s->description,
                    'is_active' => $s->is_active,
                    'display_mode' => $s->display_mode,
                    'allow_info_edit' => $s->allow_info_edit,
                    'allow_reference' => $s->allow_reference,
                ];
            })->toArray();

            $types = ContractType::with(['workflow'])->get()->map(function ($t) {
                return [
                    'code' => $t->code,
                    'name' => $t->name,
                    'workflow_name' => $t->workflow->name ?? null,
                    'features' => $t->features,
                    'description' => $t->description,
                    'f1_input_mechanism' => $t->f1_input_mechanism,
                    'f1_form_template_id' => $t->f1_form_template_id,
                    'f1_contract_template_id' => $t->f1_contract_template_id,
                    'f2_input_mechanism' => $t->f2_input_mechanism,
                    'f2_form_template_id' => $t->f2_form_template_id,
                    'f2_contract_template_id' => $t->f2_contract_template_id,
                ];
            })->toArray();

            $exportData = [
                'company_groups' => $groups,
                'regions' => $regions,
                'companies' => $companies,
                'departments' => $departments,
                'contract_statuses' => $statuses,
                'contract_types' => $types,
            ];

            $fileName = 'master_data_export_' . date('Ymd_His') . '.json';

            return response()->streamDownload(function () use ($exportData) {
                echo json_encode($exportData, JSON_PRETTY_PRINT);
            }, $fileName, [
                'Content-Type' => 'application/json',
            ]);
        } catch (\Exception $e) {
            Log::error('Master Data Export Error: ' . $e->getMessage());

            return back()->withErrors(['error' => 'Gagal mengekspor data master: ' . $e->getMessage()]);
        }
    }

    /**
     * Import master data from JSON.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:json',
        ]);

        try {
            $content = file_get_contents($request->file('file')->getRealPath());
            $data = json_decode($content, true);

            if (! is_array($data)) {
                return back()->withErrors(['error' => 'Format file JSON tidak valid.']);
            }

            $counts = [
                'company_groups' => 0,
                'regions' => 0,
                'companies' => 0,
                'departments' => 0,
                'contract_statuses' => 0,
                'contract_types' => 0,
            ];

            DB::transaction(function () use ($data, &$counts) {
                $admin = \Illuminate\Support\Facades\Auth::id();

                // 1. Company Groups
                if (! empty($data['company_groups']) && is_array($data['company_groups'])) {
                    foreach ($data['company_groups'] as $g) {
                        if (empty($g['code'])) {
                            continue;
                        }
                        CompanyGroup::updateOrCreate(
                            ['code' => $g['code']],
                            [
                                'name' => $g['name'] ?? $g['code'],
                                'description' => $g['description'] ?? null,
                                'is_active' => $g['is_active'] ?? true,
                                'created_by' => $admin,
                                'updated_by' => $admin,
                            ],
                        );
                        $counts['company_groups']++;
                    }
                }

                // 2. Regions
                if (! empty($data['regions']) && is_array($data['regions'])) {
                    foreach ($data['regions'] as $r) {
                        if (empty($r['code'])) {
                            continue;
                        }
                        Region::updateOrCreate(
                            ['code' => $r['code']],
                            [
                                'name' => $r['name'] ?? $r['code'],
                                'alias' => $r['alias'] ?? null,
                                'description' => $r['description'] ?? null,
                                'is_active' => $r['is_active'] ?? true,
                                'id_portal_master' => $r['id_portal_master'] ?? null,
                                'created_by' => $admin,
                                'updated_by' => $admin,
                            ],
                        );
                        $counts['regions']++;
                    }
                }

                $groupMap = CompanyGroup::pluck('id', 'code')->all();
                $regionMap = Region::pluck('id', 'code')->all();

                // 3. Companies
                if (! empty($data['companies']) && is_array($data['companies'])) {
                    foreach ($data['companies'] as $c) {
                        if (empty($c['code'])) {
                            continue;
                        }
                        $groupId = ! empty($c['company_group_code']) ? ($groupMap[$c['company_group_code']] ?? null) : null;
                        $regionId = ! empty($c['region_code']) ? ($regionMap[$c['region_code']] ?? null) : null;

                        Company::updateOrCreate(
                            ['code' => $c['code']],
                            [
                                'name' => $c['name'] ?? $c['code'],
                                'alias' => $c['alias'] ?? null,
                                'address' => $c['address'] ?? null,
                                'company_group_id' => $groupId,
                                'region_id' => $regionId,
                                'is_active' => $c['is_active'] ?? true,
                                'created_by' => $admin,
                                'updated_by' => $admin,
                            ],
                        );
                        $counts['companies']++;
                    }
                }

                $companyMap = Company::pluck('id', 'code')->all();

                // 4. Departments
                if (! empty($data['departments']) && is_array($data['departments'])) {
                    foreach ($data['departments'] as $d) {
                        if (empty($d['code'])) {
                            continue;
                        }
                        $companyId = ! empty($d['company_code']) ? ($companyMap[$d['company_code']] ?? null) : null;

                        Department::updateOrCreate(
                            ['code' => $d['code']],
                            [
                                'name' => $d['name'] ?? $d['code'],
                                'description' => $d['description'] ?? null,
                                'company_id' => $companyId,
                                'is_active' => $d['is_active'] ?? true,
                                'created_by' => $admin,
                                'updated_by' => $admin,
                            ],
                        );
                        $counts['departments']++;
                    }
                }

                // 5. Contract Statuses
                if (! empty($data['contract_statuses']) && is_array($data['contract_statuses'])) {
                    foreach ($data['contract_statuses'] as $s) {
                        if (empty($s['code'])) {
                            continue;
                        }
                        ContractStatus::updateOrCreate(
                            ['code' => $s['code']],
                            [
                                'label' => $s['label'] ?? $s['code'],
                                'color' => $s['color'] ?? null,
                                'bg_color' => $s['bg_color'] ?? null,
                                'icon' => $s['icon'] ?? null,
                                'description' => $s['description'] ?? null,
                                'is_active' => $s['is_active'] ?? true,
                                'display_mode' => $s['display_mode'] ?? 'badge',
                                'allow_info_edit' => $s['allow_info_edit'] ?? false,
                                'allow_reference' => $s['allow_reference'] ?? false,
                                'created_by' => $admin,
                                'updated_by' => $admin,
                            ],
                        );
                        $counts['contract_statuses']++;
                    }
                }

                $workflowMap = Workflow::pluck('id', 'name')->all();

                // 6. Contract Types
                if (! empty($data['contract_types']) && is_array($data['contract_types'])) {
                    foreach ($data['contract_types'] as $t) {
                        if (empty($t['code'])) {
                            continue;
                        }
                        $workflowId = ! empty($t['workflow_name']) ? ($workflowMap[$t['workflow_name']] ?? null) : null;

                        ContractType::updateOrCreate(
                            ['code' => $t['code']],
                            [
                                'name' => $t['name'] ?? $t['code'],
                                'workflow_id' => $workflowId,
                                'features' => $t['features'] ?? null,
                                'description' => $t['description'] ?? null,
                                'f1_input_mechanism' => $t['f1_input_mechanism'] ?? 'form',
                                'f1_form_template_id' => $t['f1_form_template_id'] ?? null,
                                'f1_contract_template_id' => $t['f1_contract_template_id'] ?? null,
                                'f2_input_mechanism' => $t['f2_input_mechanism'] ?? 'form',
                                'f2_form_template_id' => $t['f2_form_template_id'] ?? null,
                                'f2_contract_template_id' => $t['f2_contract_template_id'] ?? null,
                            ],
                        );
                        $counts['contract_types']++;
                    }
                }
            });

            $successMsg = sprintf(
                'Data master berhasil diimpor: %d Group, %d Region, %d Company, %d Departemen, %d Status, %d Tipe Kontrak.',
                $counts['company_groups'],
                $counts['regions'],
                $counts['companies'],
                $counts['departments'],
                $counts['contract_statuses'],
                $counts['contract_types'],
            );

            return redirect()->route('admin.master-data-sync')->with('success', $successMsg);
        } catch (\Exception $e) {
            Log::error('Master Data Import Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors(['error' => 'Gagal mengimpor data master: ' . $e->getMessage()]);
        }
    }
}
