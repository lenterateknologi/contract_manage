<?php

namespace App\Services\Crud;

use App\Models\CompanyGroup;
use App\Models\JobLevelGroup;
use App\Models\OrganizationGroup;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ResourceQueryBuilderService
{
    /**
     * Apply search across searchable columns (including comma-separated multiple terms, tree-aware searches, and relations).
     */
    public function applySearch(Builder $query, Request $request, string $resourceClass, string $resourceSlug): Builder
    {
        if (! $request->has('search') || trim((string) $request->input('search')) === '') {
            return $query;
        }

        $search = $request->input('search');
        $searchTerms = array_values(array_filter(array_map('trim', explode(',', $search)), fn ($t) => $t !== ''));

        $searchableColumns = collect($resourceClass::table())
            ->filter(fn ($column) => $column->isSearchable())
            ->map(fn ($column) => $column->getName());

        if ($searchableColumns->isEmpty() || empty($searchTerms)) {
            return $query;
        }

        $modelClass = $resourceClass::$model;

        if ($resourceSlug === 'contract-types') {
            // Tree-aware search: find matching IDs then expand to include ancestors + descendants
            $matchingIds = $modelClass::where(function ($q) use ($searchableColumns, $searchTerms) {
                foreach ($searchTerms as $term) {
                    $lowerTerm = strtolower($term);
                    $q->orWhere(function ($subQ) use ($searchableColumns, $lowerTerm) {
                        foreach ($searchableColumns as $column) {
                            $subQ->orWhere(DB::raw("LOWER(COALESCE(CAST({$column} AS text), ''))"), 'like', "%{$lowerTerm}%");
                        }
                    });
                }
            })->pluck('id')->toArray();

            if (! empty($matchingIds)) {
                $ancestorIds = [];
                $toCheck = $matchingIds;
                while (! empty($toCheck)) {
                    $parents = $modelClass::whereIn('id', $toCheck)->whereNotNull('parent_id')->pluck('parent_id')->toArray();
                    $newParents = array_diff($parents, $ancestorIds, $matchingIds);
                    $ancestorIds = array_merge($ancestorIds, $newParents);
                    $toCheck = $newParents;
                }

                $descendantIds = [];
                $toCheck = $matchingIds;
                while (! empty($toCheck)) {
                    $children = $modelClass::whereIn('parent_id', $toCheck)->pluck('id')->toArray();
                    $newChildren = array_diff($children, $descendantIds, $matchingIds);
                    $descendantIds = array_merge($descendantIds, $newChildren);
                    $toCheck = $newChildren;
                }

                $allIds = array_unique(array_merge($matchingIds, $ancestorIds, $descendantIds));
                $query->whereIn('id', $allIds);
            } else {
                $query->whereRaw('1 = 0');
            }

            return $query;
        }

        if ($resourceSlug === 'users') {
            $searchColumns = collect(['nik', 'name', 'email', 'username', 'jobtitle_name', 'joblevel_name', 'company_name', 'location_name', 'org_name', 'reporting_to']);
            $query->where(function ($q) use ($searchColumns, $searchTerms) {
                foreach ($searchTerms as $term) {
                    $lowerTerm = strtolower($term);
                    $q->orWhere(function ($subQ) use ($searchColumns, $lowerTerm) {
                        foreach ($searchColumns as $column) {
                            $subQ->orWhere(DB::raw("LOWER(COALESCE(CAST({$column} AS text), ''))"), 'like', "%{$lowerTerm}%");
                        }
                        $subQ->orWhereHas('department', function ($deptQ) use ($lowerTerm) {
                            $deptQ->where(DB::raw("LOWER(COALESCE(CAST(org_group_name AS text), ''))"), 'like', "%{$lowerTerm}%");
                        });
                    });
                }
            });

            return $query;
        }

        if ($resourceSlug === 'companies') {
            $searchColumns = collect(['code', 'name', 'alias', 'npwp', 'company_group_name', 'region_name', 'city_name', 'oracle_code']);
        } elseif ($resourceSlug === 'locations') {
            $searchColumns = collect(['code', 'name', 'location_group_name', 'city_name', 'province_name', 'oracle_code']);
        } elseif ($resourceSlug === 'business-units') {
            $searchColumns = collect(['code', 'name', 'company_name', 'location_name', 'company_group_name', 'region_name', 'komoditi_name', 'kebun']);
        } else {
            $searchColumns = $searchableColumns;
        }

        $query->where(function ($q) use ($searchColumns, $searchTerms) {
            foreach ($searchTerms as $term) {
                $lowerTerm = strtolower($term);
                $q->orWhere(function ($subQ) use ($searchColumns, $lowerTerm) {
                    foreach ($searchColumns as $column) {
                        $subQ->orWhere(DB::raw("LOWER(COALESCE(CAST({$column} AS text), ''))"), 'like', "%{$lowerTerm}%");
                    }
                });
            }
        });

        return $query;
    }

    /**
     * Apply configured filters, including date ranges, boolean checks, and relation lookups.
     */
    public function applyFilters(Builder $query, Request $request, string $resourceClass, string $resourceSlug): Builder
    {
        $modelClass = $resourceClass::$model;
        $tableColumns = Schema::getColumnListing((new $modelClass)->getTable());
        $hasIsUsedColumn = in_array('is_used', $tableColumns);
        $hasIsActiveColumn = in_array('is_active', $tableColumns);

        $isUsedRequested = $request->has('is_used');
        $isActiveRequested = $request->has('is_active');

        foreach ($resourceClass::filters() as $filter) {
            $key = $filter->getName();
            $fromKey = "{$key}_from";
            $toKey = "{$key}_to";

            if ($request->filled($fromKey) || $request->filled($toKey)) {
                $from = $request->input($fromKey);
                $to = $request->input($toKey);
                if ($from && $to) {
                    $query->whereBetween(DB::raw("DATE({$key})"), [$from, $to]);
                } elseif ($from) {
                    $query->whereDate($key, '>=', $from);
                } elseif ($to) {
                    $query->whereDate($key, '<=', $to);
                }
            } elseif ($request->has($key) && $request->input($key) !== '' && $request->input($key) !== null) {
                $val = $request->input($key);
                if (is_array($val)) {
                    $vals = array_values(array_filter($val, fn ($v) => $v !== '' && $v !== null));
                    if (! empty($vals)) {
                        if ($key === 'is_used' || $key === 'is_active') {
                            $boolVals = array_map(fn ($v) => $v === '1' || $v === 1 || $v === true || $v === 'true', $vals);
                            $query->whereIn($key, $boolVals);
                        } elseif ($key === 'company_group_id' && in_array($resourceSlug, ['companies', 'business-units', 'locations'])) {
                            $hasEmpty = in_array('__empty__', $vals, true) || in_array('empty', $vals, true) || in_array('-', $vals, true);
                            $concreteVals = array_values(array_filter($vals, fn ($v) => ! in_array($v, ['__empty__', 'empty', 'null', '-'], true)));
                            $groupNames = ! empty($concreteVals) ? CompanyGroup::whereIn('id', $concreteVals)->pluck('name')->toArray() : [];
                            $query->where(function ($q) use ($concreteVals, $groupNames, $hasEmpty) {
                                if (! empty($concreteVals)) {
                                    $q->whereIn('company_group_id', $concreteVals);
                                    if (! empty($groupNames)) {
                                        $q->orWhereIn('company_group_name', $groupNames);
                                    }
                                }
                                if ($hasEmpty) {
                                    $q->orWhereNull('company_group_id')
                                        ->orWhere(DB::raw('CAST(company_group_id AS text)'), '')
                                        ->orWhereNull('company_group_name')
                                        ->orWhere(DB::raw('CAST(company_group_name AS text)'), '');
                                }
                            });
                        } elseif ($key === 'organization_group_id' && $resourceSlug === 'users') {
                            $hasEmpty = in_array('__empty__', $vals, true) || in_array('empty', $vals, true) || in_array('-', $vals, true);
                            $concreteVals = array_values(array_filter($vals, fn ($v) => ! in_array($v, ['__empty__', 'empty', 'null', '-'], true)));
                            $orgGroupNames = ! empty($concreteVals) ? OrganizationGroup::whereIn('id', $concreteVals)->pluck('name')->toArray() : [];
                            $orgGroupIds = ! empty($concreteVals) ? OrganizationGroup::whereIn('id', $concreteVals)->pluck('idorg_group')->filter()->toArray() : [];

                            $query->where(function ($q) use ($concreteVals, $orgGroupNames, $orgGroupIds, $hasEmpty) {
                                if (! empty($concreteVals)) {
                                    $q->whereHas('department', function ($deptQ) use ($orgGroupNames, $orgGroupIds) {
                                        $deptQ->where(function ($subQ) use ($orgGroupNames, $orgGroupIds) {
                                            if (! empty($orgGroupNames)) {
                                                $subQ->whereIn('org_group_name', $orgGroupNames);
                                            }
                                            if (! empty($orgGroupIds)) {
                                                $subQ->orWhereIn('idorg_group', $orgGroupIds);
                                            }
                                        });
                                    });
                                }
                                if ($hasEmpty) {
                                    $q->orWhereNull('department_id')
                                        ->orWhereDoesntHave('department')
                                        ->orWhereHas('department', function ($deptQ) {
                                            $deptQ->whereNull('org_group_name')
                                                ->orWhere('org_group_name', '');
                                        });
                                }
                            });
                        } elseif ($key === 'job_level_group_id' && ($resourceSlug === 'users' || $resourceSlug === 'job-levels')) {
                            $hasEmpty = in_array('__empty__', $vals, true) || in_array('empty', $vals, true) || in_array('-', $vals, true);
                            $concreteVals = array_values(array_filter($vals, fn ($v) => ! in_array($v, ['__empty__', 'empty', 'null', '-'], true)));
                            $groupNames = ! empty($concreteVals) ? JobLevelGroup::whereIn('id', $concreteVals)->pluck('name')->toArray() : [];
                            $groupIds = ! empty($concreteVals) ? JobLevelGroup::whereIn('id', $concreteVals)->pluck('idjoblevelgroup')->filter()->toArray() : [];

                            $query->where(function ($q) use ($resourceSlug, $concreteVals, $groupNames, $groupIds, $hasEmpty) {
                                if (! empty($concreteVals)) {
                                    if ($resourceSlug === 'job-levels') {
                                        $q->whereIn('job_level_group_id', $concreteVals);
                                        if (! empty($groupIds)) {
                                            $q->orWhereIn('id_job_level_group', $groupIds);
                                        }
                                        if (! empty($groupNames)) {
                                            $q->orWhereIn('group_name', $groupNames);
                                        }
                                    } else {
                                        $q->whereHas('jobLevel', function ($jlQ) use ($concreteVals, $groupIds, $groupNames) {
                                            $jlQ->where(function ($subQ) use ($concreteVals, $groupIds, $groupNames) {
                                                $subQ->whereIn('job_level_group_id', $concreteVals);
                                                if (! empty($groupIds)) {
                                                    $subQ->orWhereIn('id_job_level_group', $groupIds);
                                                }
                                                if (! empty($groupNames)) {
                                                    $subQ->orWhereIn('group_name', $groupNames);
                                                }
                                            });
                                        });
                                    }
                                }
                                if ($hasEmpty) {
                                    if ($resourceSlug === 'job-levels') {
                                        $q->orWhereNull('job_level_group_id')
                                            ->orWhereNull('group_name')
                                            ->orWhere('group_name', '');
                                    } else {
                                        $q->orWhereNull('job_level_id')
                                            ->orWhereDoesntHave('jobLevel')
                                            ->orWhereHas('jobLevel', function ($jlQ) {
                                                $jlQ->whereNull('group_name')
                                                    ->orWhere('group_name', '');
                                            });
                                    }
                                }
                            });
                        } else {
                            $hasEmpty = in_array('__empty__', $vals, true) || in_array('empty', $vals, true) || in_array('null', $vals, true) || in_array('-', $vals, true);
                            $concreteVals = array_values(array_filter($vals, fn ($v) => ! in_array($v, ['__empty__', 'empty', 'null', '-'], true)));

                            if ($hasEmpty && ! empty($concreteVals)) {
                                $query->where(function ($q) use ($key, $concreteVals) {
                                    $q->whereIn($key, $concreteVals)
                                        ->orWhereNull($key)
                                        ->orWhere(DB::raw("CAST({$key} AS text)"), '');
                                });
                            } elseif ($hasEmpty) {
                                $query->where(function ($q) use ($key) {
                                    $q->whereNull($key)
                                        ->orWhere(DB::raw("CAST({$key} AS text)"), '');
                                });
                            } else {
                                $query->whereIn($key, $concreteVals);
                            }
                        }
                    }
                } else {
                    if ($key === 'is_used' || $key === 'is_active') {
                        $boolVal = ($val === '1' || $val === 1 || $val === true || $val === 'true');
                        $query->where($key, $boolVal);
                    } elseif ($key === 'company_group_id' && in_array($resourceSlug, ['companies', 'business-units', 'locations'])) {
                        if (in_array($val, ['__empty__', 'empty', 'null', '-'], true)) {
                            $query->where(function ($q) {
                                $q->whereNull('company_group_id')
                                    ->orWhere(DB::raw('CAST(company_group_id AS text)'), '')
                                    ->orWhereNull('company_group_name')
                                    ->orWhere(DB::raw('CAST(company_group_name AS text)'), '');
                            });
                        } else {
                            $groupName = CompanyGroup::find($val)?->name;
                            $query->where(function ($q) use ($val, $groupName) {
                                $q->where('company_group_id', $val);
                                if ($groupName) {
                                    $q->orWhere('company_group_name', $groupName);
                                }
                            });
                        }
                    } elseif ($key === 'organization_group_id' && $resourceSlug === 'users') {
                        if (in_array($val, ['__empty__', 'empty', 'null', '-'], true)) {
                            $query->where(function ($q) {
                                $q->whereNull('department_id')
                                    ->orWhereDoesntHave('department')
                                    ->orWhereHas('department', function ($deptQ) {
                                        $deptQ->whereNull('org_group_name')
                                            ->orWhere('org_group_name', '');
                                    });
                            });
                        } else {
                            $orgGroup = OrganizationGroup::find($val);
                            $orgGroupName = $orgGroup?->name;
                            $idOrgGroup = $orgGroup?->idorg_group;

                            $query->whereHas('department', function ($deptQ) use ($orgGroupName, $idOrgGroup) {
                                $deptQ->where(function ($subQ) use ($orgGroupName, $idOrgGroup) {
                                    if ($orgGroupName) {
                                        $subQ->where('org_group_name', $orgGroupName);
                                    }
                                    if ($idOrgGroup) {
                                        $subQ->orWhere('idorg_group', $idOrgGroup);
                                    }
                                });
                            });
                        }
                    } else {
                        if (in_array($val, ['__empty__', 'empty', 'null', '-'], true)) {
                            $query->where(function ($q) use ($key) {
                                $q->whereNull($key)
                                    ->orWhere(DB::raw("CAST({$key} AS text)"), '');
                            });
                        } else {
                            $query->where($key, $val);
                        }
                    }
                }
            }
        }

        // Apply default is_used = true and is_active = true if not explicitly provided and column exists on table
        if (! $isUsedRequested && $hasIsUsedColumn) {
            $query->where('is_used', true);
        }
        if (! $isActiveRequested && $hasIsActiveColumn) {
            $query->where('is_active', true);
        }

        return $query;
    }

    /**
     * Apply sorting by column or relationship.
     */
    public function applySorting(Builder $query, Request $request, string $resourceClass): Builder
    {
        $sortBy = $request->input('sort_by');
        $sortDir = strtolower($request->input('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $modelClass = $resourceClass::$model;
        $modelInstance = new $modelClass;
        $tableName = $modelInstance->getTable();

        if ($sortBy) {
            $sortColumnMap = [
                'user_identity' => 'name',
                'position_access' => 'jobtitle_name',
                'placement_org' => 'company_name',
                'company_identity' => 'name',
                'org_structure' => 'company_group_name',
                'legal_integration' => 'npwp',
                'location_identity' => 'name',
                'location_group' => 'location_group_name',
                'region_group' => 'location_group_name',
                'bu_identity' => 'name',
                'company_placement' => 'company_name',
                'role_name' => 'roleRelation.name',
                'role' => 'roleRelation.name',
                'division_name' => 'division.name',
                'department_name' => 'department.name',
                'org_group_name' => 'department.org_group_name',
                'company_group_name' => 'companyGroup.name',
                'company_group_code' => 'companyGroup.code',
                'region_name' => 'region.name',
            ];
            $actualSortBy = $sortColumnMap[$sortBy] ?? $sortBy;

            if (str_contains($actualSortBy, '.')) {
                [$relation, $relColumn] = explode('.', $actualSortBy, 2);
                $method = method_exists($modelInstance, $relation) ? $relation : Str::camel($relation);
                if (method_exists($modelInstance, $method)) {
                    $relationInstance = $modelInstance->{$method}();
                    if ($relationInstance instanceof BelongsTo) {
                        $relatedModel = $relationInstance->getRelated();
                        $relatedTable = $relatedModel->getTable();
                        $foreignKey = $relationInstance->getForeignKeyName();
                        $ownerKey = $relationInstance->getOwnerKeyName();

                        $query->orderBy(
                            $relatedModel->newQuery()
                                ->select($relColumn)
                                ->whereColumn("{$relatedTable}.{$ownerKey}", "{$tableName}.{$foreignKey}")
                                ->limit(1),
                            $sortDir
                        );
                    } else {
                        $query->orderBy("{$tableName}.id", $sortDir);
                    }
                } else {
                    $query->orderBy("{$tableName}.id", $sortDir);
                }
            } else {
                if (Schema::hasColumn($tableName, $actualSortBy)) {
                    $query->orderBy("{$tableName}.{$actualSortBy}", $sortDir);
                } else {
                    $query->orderBy("{$tableName}.id", $sortDir);
                }
            }
        } elseif (! empty($resourceClass::$defaultSortBy)) {
            $defaultCol = $resourceClass::$defaultSortBy;
            if (Schema::hasColumn($tableName, $defaultCol)) {
                $query->orderBy("{$tableName}.{$defaultCol}", $resourceClass::$defaultSortDir ?? 'asc');
            } else {
                $query->latest("{$tableName}.id");
            }
        } else {
            $query->latest("{$tableName}.id");
        }

        return $query;
    }
}
