<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\CompanyGroup;
use Inertia\Inertia;

class OrganizationTreeController extends Controller
{
    public function index()
    {
        $groups = CompanyGroup::with(['companies.region'])->get();

        $tree = [];
        foreach ($groups as $group) {
            $groupNode = [
                'id' => 'g_'.$group->id,
                'name' => $group->name,
                'code' => $group->code,
                'type' => 'Group',
                'children' => [],
            ];

            $companiesByRegion = $group->companies->groupBy('region_id');
            foreach ($companiesByRegion as $regionId => $companies) {
                // Some companies might not have a region (region_id is null)
                if (! $regionId) {
                    $regionName = 'No Region';
                    $regionCode = '-';
                    $rId = 'null';
                } else {
                    $region = $companies->first()->region;
                    $regionName = $region ? $region->name : 'Unknown Region';
                    $regionCode = $region ? $region->code : '-';
                    $rId = $regionId;
                }

                $regionNode = [
                    'id' => 'r_'.$rId.'_g_'.$group->id,
                    'name' => $regionName,
                    'code' => $regionCode,
                    'type' => 'Region',
                    'children' => [],
                ];

                foreach ($companies as $company) {
                    $regionNode['children'][] = [
                        'id' => 'c_'.$company->id,
                        'name' => $company->name,
                        'code' => $company->code,
                        'type' => 'Company',
                        'children' => [],
                    ];
                }

                $groupNode['children'][] = $regionNode;
            }

            $tree[] = $groupNode;
        }

        return Inertia::render('Master/OrganizationTree', [
            'treeData' => $tree,
            'breadcrumbs' => [
                ['title' => 'Master Data', 'href' => '#', 'icon' => 'Database'],
                ['title' => 'Organization Tree', 'href' => route('admin.organization-tree'), 'description' => 'Hierarchical view of Group > Region > Company', 'icon' => 'Network'],
            ],
        ]);
    }
}
