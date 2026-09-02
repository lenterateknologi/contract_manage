<?php

namespace App\Services;

use App\Models\BusinessUnit;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\ContractFilterTemplate;
use App\Models\Department;
use App\Models\JobLevel;
use App\Models\JobTitle;
use App\Models\Location;
use App\Models\Region;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PortalSyncService
{
    /**
     * Get the base URL configured for Portal API.
     */
    public function getBaseUrl(): string
    {
        return rtrim(config('portal.base_url', config('services.portal.base_url', 'http://127.0.0.1:8000')), '/');
    }

    /**
     * Get endpoint from config.
     */
    public function getEndpoint(string $key): string
    {
        return config("portal.endpoints.{$key}", 'Region/GetAllDataRegion');
    }

    /**
     * Synchronize Regions from Portal API.
     *
     * @return array{success: bool, message: string, synced: int, total: int, data?: array}
     */
    public function syncRegions(): array
    {
        $baseUrl = $this->getBaseUrl();
        $endpoint = $this->getEndpoint('regions');
        $fullUrl = "{$baseUrl}/{$endpoint}";

        try {
            $response = Http::timeout(30)->get($fullUrl);

            if (! $response->successful()) {
                Log::warning('Portal region sync failed with HTTP status: '.$response->status(), ['url' => $fullUrl]);

                return [
                    'success' => false,
                    'message' => "Gagal terhubung ke Portal API (HTTP {$response->status()}) pada {$fullUrl}",
                    'synced' => 0,
                    'total' => 0,
                ];
            }

            $json = $response->json();
            $data = $json['data'] ?? [];

            if (! is_array($data)) {
                return [
                    'success' => false,
                    'message' => 'Format respon API Portal tidak valid (data bukan array).',
                    'synced' => 0,
                    'total' => 0,
                ];
            }

            $syncedCount = 0;
            $userId = Auth::id();

            // Preload existing records in 1 query to avoid N+1 queries
            $existingByIdRegion = Region::withTrashed()
                ->whereNotNull('idregion')
                ->get()
                ->keyBy('idregion');

            $existingByCode = Region::withTrashed()
                ->whereNotNull('code')
                ->get()
                ->keyBy('code');

            DB::transaction(function () use ($data, $userId, &$syncedCount, $existingByIdRegion, $existingByCode) {
                foreach ($data as $item) {
                    $idRegion = $item['idregion'] ?? null;
                    $regionCode = isset($item['regionCode']) ? trim((string) $item['regionCode']) : '';
                    $regionName = isset($item['regionName']) ? trim((string) $item['regionName']) : '';

                    if (empty($regionCode) && empty($regionName)) {
                        continue;
                    }

                    $isActive = isset($item['isActive']) ? (bool) $item['isActive'] : true;
                    $createdDate = ! empty($item['createdDate']) ? Carbon::parse($item['createdDate']) : null;
                    $modifiedDate = ! empty($item['modifiedDate']) ? Carbon::parse($item['modifiedDate']) : null;

                    // Match in-memory
                    $region = null;
                    if (! empty($idRegion) && isset($existingByIdRegion[$idRegion])) {
                        $region = $existingByIdRegion[$idRegion];
                    } elseif (! empty($regionCode) && isset($existingByCode[$regionCode])) {
                        $region = $existingByCode[$regionCode];
                    }

                    $attributes = [
                        'idregion' => $idRegion,
                        'code' => $regionCode,
                        'name' => $regionName,
                        'alias' => $item['regionCodeAlias'] ?? $item['alias'] ?? null,
                        'region_ad' => $item['regionAd'] ?? null,
                        'created_by_name' => $item['createdBy'] ?? null,
                        'modified_by_name' => $item['modifiedBy'] ?? null,
                        'portal_created_date' => $createdDate,
                        'portal_modified_date' => $modifiedDate,
                        'is_active' => $isActive,
                    ];

                    if ($region) {
                        if ($region->trashed()) {
                            $region->restore();
                        }
                        $attributes['updated_by'] = $userId;
                        $region->update($attributes);
                    } else {
                        $attributes['is_used'] = false; // default false for system
                        $attributes['created_by'] = $userId;
                        $attributes['updated_by'] = $userId;
                        $newRegion = Region::create($attributes);

                        // Cache in memory for loop uniqueness
                        if (! empty($idRegion)) {
                            $existingByIdRegion[$idRegion] = $newRegion;
                        }
                        if (! empty($regionCode)) {
                            $existingByCode[$regionCode] = $newRegion;
                        }
                    }

                    $syncedCount++;
                }
            });

            return [
                'success' => true,
                'message' => "Berhasil sinkronisasi {$syncedCount} data Region dari Portal.",
                'synced' => $syncedCount,
                'total' => count($data),
            ];
        } catch (\Throwable $e) {
            Log::error('Portal region sync exception: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return [
                'success' => false,
                'message' => 'Gagal melakukan sinkronisasi: '.$e->getMessage(),
                'synced' => 0,
                'total' => 0,
            ];
        }
    }

    /**
     * Synchronize Company Groups from Portal API.
     *
     * @return array{success: bool, message: string, synced: int, total: int}
     */
    public function syncCompanyGroups(): array
    {
        $baseUrl = $this->getBaseUrl();
        $endpoint = $this->getEndpoint('company_groups');
        $fullUrl = "{$baseUrl}/{$endpoint}";

        try {
            $response = Http::timeout(30)->get($fullUrl);

            if (! $response->successful()) {
                Log::warning('Portal company group sync failed with HTTP status: '.$response->status(), ['url' => $fullUrl]);

                return [
                    'success' => false,
                    'message' => "Gagal terhubung ke Portal API (HTTP {$response->status()}) pada {$fullUrl}",
                    'synced' => 0,
                    'total' => 0,
                ];
            }

            $json = $response->json();
            $data = $json['data'] ?? [];

            if (! is_array($data)) {
                return [
                    'success' => false,
                    'message' => 'Format respon API Portal tidak valid (data bukan array).',
                    'synced' => 0,
                    'total' => 0,
                ];
            }

            $syncedCount = 0;
            $userId = Auth::id();

            // Preload existing company groups in 1 query
            $existingById = CompanyGroup::withTrashed()
                ->whereNotNull('idcompany_group')
                ->get()
                ->keyBy('idcompany_group');

            $existingByCode = CompanyGroup::withTrashed()
                ->whereNotNull('code')
                ->get()
                ->keyBy('code');

            DB::transaction(function () use ($data, $userId, &$syncedCount, $existingById, $existingByCode) {
                foreach ($data as $item) {
                    $idGroup = $item['idcompanyGroup'] ?? null;
                    $groupCode = isset($item['companyGroupCode']) ? trim((string) $item['companyGroupCode']) : '';
                    $groupName = isset($item['companyGroupName']) ? trim((string) $item['companyGroupName']) : '';

                    if (empty($groupCode) && empty($groupName)) {
                        continue;
                    }

                    $isActive = isset($item['isActive']) ? (bool) $item['isActive'] : true;
                    $createdDate = ! empty($item['createdDate']) ? Carbon::parse($item['createdDate']) : null;
                    $modifiedDate = ! empty($item['modifiedDate']) ? Carbon::parse($item['modifiedDate']) : null;

                    // Match in-memory
                    $group = null;
                    if (! empty($idGroup) && isset($existingById[$idGroup])) {
                        $group = $existingById[$idGroup];
                    } elseif (! empty($groupCode) && isset($existingByCode[$groupCode])) {
                        $group = $existingByCode[$groupCode];
                    }

                    $attributes = [
                        'idcompany_group' => $idGroup,
                        'code' => $groupCode,
                        'name' => $groupName,
                        'created_by_name' => $item['createdBy'] ?? null,
                        'modified_by_name' => $item['modifiedBy'] ?? null,
                        'portal_created_date' => $createdDate,
                        'portal_modified_date' => $modifiedDate,
                        'is_active' => $isActive,
                    ];

                    if ($group) {
                        if ($group->trashed()) {
                            $group->restore();
                        }
                        $attributes['updated_by'] = $userId;
                        $group->update($attributes);
                    } else {
                        $attributes['is_used'] = false; // default false for system
                        $attributes['created_by'] = $userId;
                        $attributes['updated_by'] = $userId;
                        $newGroup = CompanyGroup::create($attributes);

                        if (! empty($idGroup)) {
                            $existingById[$idGroup] = $newGroup;
                        }
                        if (! empty($groupCode)) {
                            $existingByCode[$groupCode] = $newGroup;
                        }
                    }

                    $syncedCount++;
                }
            });

            return [
                'success' => true,
                'message' => "Berhasil sinkronisasi {$syncedCount} data Group Perusahaan dari Portal.",
                'synced' => $syncedCount,
                'total' => count($data),
            ];
        } catch (\Throwable $e) {
            Log::error('Portal company group sync exception: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return [
                'success' => false,
                'message' => 'Gagal melakukan sinkronisasi: '.$e->getMessage(),
                'synced' => 0,
                'total' => 0,
            ];
        }
    }

    /**
     * Synchronize Locations from Portal API.
     *
     * @return array{success: bool, message: string, synced: int, total: int}
     */
    public function syncLocations(): array
    {
        $baseUrl = $this->getBaseUrl();
        $endpoint = $this->getEndpoint('locations');
        $fullUrl = "{$baseUrl}/{$endpoint}";

        try {
            $response = Http::timeout(45)->get($fullUrl);

            if (! $response->successful()) {
                Log::warning('Portal location sync failed with HTTP status: '.$response->status(), ['url' => $fullUrl]);

                return [
                    'success' => false,
                    'message' => "Gagal terhubung ke Portal API (HTTP {$response->status()}) pada {$fullUrl}",
                    'synced' => 0,
                    'total' => 0,
                ];
            }

            $json = $response->json();
            $data = $json['data'] ?? [];

            if (! is_array($data)) {
                return [
                    'success' => false,
                    'message' => 'Format respon API Portal tidak valid (data bukan array).',
                    'synced' => 0,
                    'total' => 0,
                ];
            }

            $syncedCount = 0;
            $userId = Auth::id();

            // Preload existing locations in 1 query
            $existingById = Location::withTrashed()
                ->whereNotNull('idlocation')
                ->get()
                ->keyBy('idlocation');

            $existingByCode = Location::withTrashed()
                ->whereNotNull('code')
                ->get()
                ->keyBy('code');

            DB::transaction(function () use ($data, $userId, &$syncedCount, $existingById, $existingByCode) {
                foreach ($data as $item) {
                    $idLocation = $item['idlocation'] ?? null;
                    $locationCode = isset($item['locationCode']) ? trim((string) $item['locationCode']) : '';
                    $locationName = isset($item['locationName']) ? trim((string) $item['locationName']) : '';

                    if (empty($locationCode) && empty($locationName)) {
                        continue;
                    }

                    $isActive = isset($item['isActive']) ? (bool) $item['isActive'] : true;
                    $createdDate = ! empty($item['createdDate']) ? Carbon::parse($item['createdDate']) : null;
                    $modifiedDate = ! empty($item['modifiedDate']) ? Carbon::parse($item['modifiedDate']) : null;

                    // Match in-memory
                    $location = null;
                    if (! empty($idLocation) && isset($existingById[$idLocation])) {
                        $location = $existingById[$idLocation];
                    } elseif (! empty($locationCode) && isset($existingByCode[$locationCode])) {
                        $location = $existingByCode[$locationCode];
                    }

                    $attributes = [
                        'idlocation' => $idLocation,
                        'code' => $locationCode,
                        'name' => $locationName,
                        'idlocation_group' => $item['idlocationGroup'] ?? null,
                        'location_group_name' => $item['locationGroupName'] ?? null,
                        'phone' => $item['phone'] ?? null,
                        'fax' => $item['fax'] ?? null,
                        'idcountry' => $item['idcountry'] ?? null,
                        'country_name' => $item['countryName'] ?? null,
                        'idprovince' => $item['idprovince'] ?? null,
                        'province_name' => $item['provinceName'] ?? null,
                        'idcity' => $item['idcity'] ?? null,
                        'city_name' => $item['cityName'] ?? null,
                        'idsub_district' => $item['idsubDistrict'] ?? null,
                        'sub_district_name' => $item['subDistrictName'] ?? null,
                        'idvillage' => $item['idvillage'] ?? null,
                        'village_name' => $item['villageName'] ?? null,
                        'address' => $item['address'] ?? null,
                        'zip_code' => $item['zipCode'] ?? null,
                        'oracle_code' => $item['oracleCode'] ?? null,
                        'created_by_name' => $item['createdBy'] ?? null,
                        'modified_by_name' => $item['modifiedBy'] ?? null,
                        'portal_created_date' => $createdDate,
                        'portal_modified_date' => $modifiedDate,
                        'is_active' => $isActive,
                    ];

                    if ($location) {
                        if ($location->trashed()) {
                            $location->restore();
                        }
                        $attributes['updated_by'] = $userId;
                        $location->update($attributes);
                    } else {
                        $attributes['is_used'] = false; // default false for system
                        $attributes['created_by'] = $userId;
                        $attributes['updated_by'] = $userId;
                        $newLocation = Location::create($attributes);

                        if (! empty($idLocation)) {
                            $existingById[$idLocation] = $newLocation;
                        }
                        if (! empty($locationCode)) {
                            $existingByCode[$locationCode] = $newLocation;
                        }
                    }

                    $syncedCount++;
                }
            });

            return [
                'success' => true,
                'message' => "Berhasil sinkronisasi {$syncedCount} data Lokasi dari Portal.",
                'synced' => $syncedCount,
                'total' => count($data),
            ];
        } catch (\Throwable $e) {
            Log::error('Portal location sync exception: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return [
                'success' => false,
                'message' => 'Gagal melakukan sinkronisasi: '.$e->getMessage(),
                'synced' => 0,
                'total' => 0,
            ];
        }
    }

    /**
     * Synchronize Companies from Portal API.
     *
     * @return array{success: bool, message: string, synced: int, total: int}
     */
    public function syncCompanies(): array
    {
        $baseUrl = $this->getBaseUrl();
        $endpoint = $this->getEndpoint('companies');
        $fullUrl = "{$baseUrl}/{$endpoint}";

        try {
            $response = Http::timeout(60)->get($fullUrl);

            if (! $response->successful()) {
                Log::warning('Portal company sync failed with HTTP status: '.$response->status(), ['url' => $fullUrl]);

                return [
                    'success' => false,
                    'message' => "Gagal terhubung ke Portal API (HTTP {$response->status()}) pada {$fullUrl}",
                    'synced' => 0,
                    'total' => 0,
                ];
            }

            $json = $response->json();
            $data = $json['data'] ?? [];

            if (! is_array($data)) {
                return [
                    'success' => false,
                    'message' => 'Format respon API Portal tidak valid (data bukan array).',
                    'synced' => 0,
                    'total' => 0,
                ];
            }

            $syncedCount = 0;
            $userId = Auth::id();

            // Preload existing relations & records in 1 query
            $existingById = Company::withTrashed()
                ->whereNotNull('idcompany')
                ->get()
                ->keyBy('idcompany');

            $existingByCode = Company::withTrashed()
                ->whereNotNull('code')
                ->get()
                ->keyBy('code');

            $groupsById = CompanyGroup::withTrashed()
                ->whereNotNull('idcompany_group')
                ->get()
                ->keyBy('idcompany_group');

            $regionsById = Region::withTrashed()
                ->whereNotNull('idregion')
                ->get()
                ->keyBy('idregion');

            DB::transaction(function () use ($data, $userId, &$syncedCount, $existingById, $existingByCode, $groupsById, $regionsById) {
                foreach ($data as $item) {
                    $idCompany = $item['idcompany'] ?? null;
                    $companyCode = isset($item['companyCode']) ? trim((string) $item['companyCode']) : '';
                    $companyName = isset($item['companyName']) ? trim((string) $item['companyName']) : '';

                    if (empty($companyCode) && empty($companyName)) {
                        continue;
                    }

                    $isActive = isset($item['isActive']) ? (bool) $item['isActive'] : true;
                    $createdDate = ! empty($item['createdDate']) ? Carbon::parse($item['createdDate']) : null;
                    $modifiedDate = ! empty($item['modifiedDate']) ? Carbon::parse($item['modifiedDate']) : null;

                    // Match in-memory
                    $company = null;
                    if (! empty($idCompany) && isset($existingById[$idCompany])) {
                        $company = $existingById[$idCompany];
                    } elseif (! empty($companyCode) && isset($existingByCode[$companyCode])) {
                        $company = $existingByCode[$companyCode];
                    }

                    $idGroup = $item['idcompanyGroup'] ?? null;
                    $groupId = ! empty($idGroup) && isset($groupsById[$idGroup]) ? $groupsById[$idGroup]->id : null;

                    $idReg = $item['idregion'] ?? null;
                    $regionId = ! empty($idReg) && isset($regionsById[$idReg]) ? $regionsById[$idReg]->id : null;

                    $attributes = [
                        'idcompany' => $idCompany,
                        'code' => $companyCode,
                        'name' => $companyName,
                        'alias' => $item['companyAlias'] ?? null,
                        'npwp' => $item['npwp'] ?? null,
                        'idcompany_group' => $idGroup,
                        'company_group_name' => $item['companyGroupName'] ?? null,
                        'company_group_id' => $groupId,
                        'idcountry' => $item['idcountry'] ?? null,
                        'country_name' => $item['countryName'] ?? null,
                        'idprovince' => $item['idprovince'] ?? null,
                        'province_name' => $item['provinceName'] ?? null,
                        'idcity' => $item['idcity'] ?? null,
                        'city_name' => $item['cityName'] ?? null,
                        'idsub_district' => $item['idsubDistrict'] ?? null,
                        'sub_district_name' => $item['subDistrictName'] ?? null,
                        'idvillage' => $item['idvillage'] ?? null,
                        'village_name' => $item['villageName'] ?? null,
                        'address' => $item['address'] ?? null,
                        'zip_code' => $item['zipCode'] ?? null,
                        'phone' => $item['phone'] ?? null,
                        'fax' => $item['fax'] ?? null,
                        'email' => $item['email'] ?? null,
                        'oracle_code' => $item['oracleCode'] ?? null,
                        'idregion' => $idReg,
                        'region_name' => $item['regionName'] ?? null,
                        'region_id' => $regionId,
                        'reg_no' => $item['regNo'] ?? null,
                        'bank_account' => $item['bankAccount'] ?? null,
                        'npp' => $item['npp'] ?? null,
                        'created_by_name' => $item['createdBy'] ?? null,
                        'modified_by_name' => $item['modifiedBy'] ?? null,
                        'portal_created_date' => $createdDate,
                        'portal_modified_date' => $modifiedDate,
                        'is_active' => $isActive,
                    ];

                    if ($company) {
                        if ($company->trashed()) {
                            $company->restore();
                        }
                        $attributes['updated_by'] = $userId;
                        $company->update($attributes);
                    } else {
                        $attributes['is_used'] = false; // default false for system
                        $attributes['created_by'] = $userId;
                        $attributes['updated_by'] = $userId;
                        $newCompany = Company::create($attributes);

                        if (! empty($idCompany)) {
                            $existingById[$idCompany] = $newCompany;
                        }
                        if (! empty($companyCode)) {
                            $existingByCode[$companyCode] = $newCompany;
                        }
                    }

                    $syncedCount++;
                }
            });

            return [
                'success' => true,
                'message' => "Berhasil sinkronisasi {$syncedCount} data Perusahaan dari Portal.",
                'synced' => $syncedCount,
                'total' => count($data),
            ];
        } catch (\Throwable $e) {
            Log::error('Portal company sync exception: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return [
                'success' => false,
                'message' => 'Gagal melakukan sinkronisasi: '.$e->getMessage(),
                'synced' => 0,
                'total' => 0,
            ];
        }
    }

    /**
     * Synchronize Business Units from Portal API.
     *
     * @return array{success: bool, message: string, synced: int, total: int}
     */
    public function syncBusinessUnits(): array
    {
        $baseUrl = $this->getBaseUrl();
        $endpoint = $this->getEndpoint('business_units');
        $fullUrl = "{$baseUrl}/{$endpoint}";

        try {
            $response = Http::timeout(60)->get($fullUrl);

            if (! $response->successful()) {
                Log::warning('Portal business unit sync failed with HTTP status: '.$response->status(), ['url' => $fullUrl]);

                return [
                    'success' => false,
                    'message' => "Gagal terhubung ke Portal API (HTTP {$response->status()}) pada {$fullUrl}",
                    'synced' => 0,
                    'total' => 0,
                ];
            }

            $json = $response->json();
            $data = $json['data'] ?? [];

            if (! is_array($data)) {
                return [
                    'success' => false,
                    'message' => 'Format respon API Portal tidak valid (data bukan array).',
                    'synced' => 0,
                    'total' => 0,
                ];
            }

            $syncedCount = 0;
            $userId = Auth::id();

            // Preload existing relations & records in 1 query
            $existingById = BusinessUnit::withTrashed()
                ->whereNotNull('idbusiness_unit')
                ->get()
                ->keyBy('idbusiness_unit');

            $existingByCode = BusinessUnit::withTrashed()
                ->whereNotNull('code')
                ->get()
                ->keyBy('code');

            $companiesById = Company::withTrashed()
                ->whereNotNull('idcompany')
                ->get()
                ->keyBy('idcompany');

            $locationsById = Location::withTrashed()
                ->whereNotNull('idlocation')
                ->get()
                ->keyBy('idlocation');

            $groupsById = CompanyGroup::withTrashed()
                ->whereNotNull('idcompany_group')
                ->get()
                ->keyBy('idcompany_group');

            $regionsById = Region::withTrashed()
                ->whereNotNull('idregion')
                ->get()
                ->keyBy('idregion');

            DB::transaction(function () use ($data, $userId, &$syncedCount, $existingById, $existingByCode, $companiesById, $locationsById, $groupsById, $regionsById) {
                foreach ($data as $item) {
                    $idUnit = $item['idbusinessUnit'] ?? null;
                    $unitCode = isset($item['kodeBisnisUnit']) ? trim((string) $item['kodeBisnisUnit']) : '';
                    $unitName = isset($item['deskripsi']) ? trim((string) $item['deskripsi']) : '';

                    if (empty($unitCode) && empty($unitName)) {
                        continue;
                    }

                    $isActive = isset($item['isActive']) ? (bool) $item['isActive'] : true;
                    $createdDate = ! empty($item['createdDate']) ? Carbon::parse($item['createdDate']) : null;
                    $modifiedDate = ! empty($item['modifiedDate']) ? Carbon::parse($item['modifiedDate']) : null;
                    $lastReqDate = ! empty($item['lastReqDate']) ? Carbon::parse($item['lastReqDate']) : null;

                    // Match in-memory
                    $unit = null;
                    if (! empty($idUnit) && isset($existingById[$idUnit])) {
                        $unit = $existingById[$idUnit];
                    } elseif (! empty($unitCode) && isset($existingByCode[$unitCode])) {
                        $unit = $existingByCode[$unitCode];
                    }

                    $idCompany = $item['idcompany'] ?? null;
                    $companyId = ! empty($idCompany) && isset($companiesById[$idCompany]) ? $companiesById[$idCompany]->id : null;

                    $idLocation = $item['idlocation'] ?? null;
                    $locationId = ! empty($idLocation) && isset($locationsById[$idLocation]) ? $locationsById[$idLocation]->id : null;

                    $idGroup = $item['idcompanyGroup'] ?? null;
                    $groupId = ! empty($idGroup) && isset($groupsById[$idGroup]) ? $groupsById[$idGroup]->id : null;

                    $idReg = $item['idregion'] ?? null;
                    $regionId = ! empty($idReg) && isset($regionsById[$idReg]) ? $regionsById[$idReg]->id : null;

                    $attributes = [
                        'idbusiness_unit' => $idUnit,
                        'code' => $unitCode,
                        'name' => $unitName,
                        'idcompany' => $idCompany,
                        'company_name' => $item['companyName'] ?? null,
                        'company_oracle_code' => $item['companyOracleCode'] ?? null,
                        'company_id' => $companyId,
                        'idlocation' => $idLocation,
                        'location_name' => $item['locationName'] ?? null,
                        'location_oracle_code' => $item['locationOracleCode'] ?? null,
                        'location_id' => $locationId,
                        'idcompany_group' => $idGroup,
                        'company_group_code' => $item['companyGroupCode'] ?? null,
                        'company_group_name' => $item['companyGroupName'] ?? null,
                        'company_group_id' => $groupId,
                        'idregion' => $idReg,
                        'region_code' => $item['regionCode'] ?? null,
                        'region_name' => $item['regionName'] ?? null,
                        'region_id' => $regionId,
                        'idkomoditi' => $item['idkomoditi'] ?? null,
                        'komoditi_name' => $item['komoditiName'] ?? null,
                        'kebun' => $item['kebun'] ?? null,
                        'last_req_date' => $lastReqDate,
                        'rice_exclude' => isset($item['riceExclude']) ? (int) $item['riceExclude'] : 0,
                        'is_downstream' => isset($item['isDownstream']) ? (int) $item['isDownstream'] : 0,
                        'ktu' => $item['ktu'] ?? null,
                        'kpp' => $item['kpp'] ?? null,
                        'dppjamsostek' => $item['dppjamsostek'] ?? null,
                        'latitude' => $item['latitude'] ?? null,
                        'longitude' => $item['longitude'] ?? null,
                        'created_by_name' => $item['createdBy'] ?? null,
                        'modified_by_name' => $item['modifiedBy'] ?? null,
                        'portal_created_date' => $createdDate,
                        'portal_modified_date' => $modifiedDate,
                        'is_active' => $isActive,
                    ];

                    if ($unit) {
                        if ($unit->trashed()) {
                            $unit->restore();
                        }
                        $attributes['updated_by'] = $userId;
                        $unit->update($attributes);
                    } else {
                        $attributes['is_used'] = false; // default false for system
                        $attributes['created_by'] = $userId;
                        $attributes['updated_by'] = $userId;
                        $newUnit = BusinessUnit::create($attributes);

                        if (! empty($idUnit)) {
                            $existingById[$idUnit] = $newUnit;
                        }
                        if (! empty($unitCode)) {
                            $existingByCode[$unitCode] = $newUnit;
                        }
                    }

                    $syncedCount++;
                }
            });

            return [
                'success' => true,
                'message' => "Berhasil sinkronisasi {$syncedCount} data Bisnis Unit dari Portal.",
                'synced' => $syncedCount,
                'total' => count($data),
            ];
        } catch (\Throwable $e) {
            Log::error('Portal business unit sync exception: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return [
                'success' => false,
                'message' => 'Gagal melakukan sinkronisasi: '.$e->getMessage(),
                'synced' => 0,
                'total' => 0,
            ];
        }
    }

    /**
     * Synchronize Employees/Users from Portal API.
     *
     * @return array{success: bool, message: string, synced: int, total: int}
     */
    public function syncEmployees(): array
    {
        $baseUrl = $this->getBaseUrl();
        $endpoint = $this->getEndpoint('users');
        $fullUrl = "{$baseUrl}/{$endpoint}";

        try {
            $response = Http::timeout(90)->get($fullUrl);

            if (! $response->successful()) {
                Log::warning('Portal employee sync failed with HTTP status: '.$response->status(), ['url' => $fullUrl]);

                return [
                    'success' => false,
                    'message' => "Gagal terhubung ke Portal API (HTTP {$response->status()}) pada {$fullUrl}",
                    'synced' => 0,
                    'total' => 0,
                ];
            }

            $json = $response->json();
            $data = $json['data'] ?? [];

            if (! is_array($data)) {
                return [
                    'success' => false,
                    'message' => 'Format respon API Portal tidak valid (data bukan array).',
                    'synced' => 0,
                    'total' => 0,
                ];
            }

            $syncedCount = 0;
            $userId = Auth::id();

            // Default fallback role: Staff
            $staffRoleId = Role::where('name', 'Staff')->value('id');
            $defaultFilterTemplateId = ContractFilterTemplate::where('name', 'like', '%staff biasa%')->value('id');

            // Preload existing relations & records in 1 query
            $existingByIdEmployee = User::withTrashed()
                ->whereNotNull('idemployee')
                ->get()
                ->keyBy('idemployee');

            $existingByEmail = User::withTrashed()
                ->whereNotNull('email')
                ->get()
                ->keyBy(fn ($u) => strtolower(trim($u->email)));

            $existingByNik = User::withTrashed()
                ->whereNotNull('nik')
                ->get()
                ->keyBy('nik');

            $existingByUsername = User::withTrashed()
                ->whereNotNull('username')
                ->get()
                ->keyBy('username');

            $existingByCode = User::withTrashed()
                ->whereNotNull('code')
                ->get()
                ->keyBy('code');

            $companiesById = Company::withTrashed()
                ->whereNotNull('idcompany')
                ->get()
                ->keyBy('idcompany');

            $locationsById = Location::withTrashed()
                ->whereNotNull('idlocation')
                ->get()
                ->keyBy('idlocation');

            $locationsByName = Location::withTrashed()
                ->whereNotNull('name')
                ->get()
                ->keyBy(fn ($l) => strtolower(trim($l->name)));

            $departmentsByIdOrg = Department::withTrashed()
                ->whereNotNull('idorganization')
                ->get()
                ->keyBy('idorganization');

            $departmentsByName = Department::withTrashed()
                ->whereNotNull('name')
                ->get()
                ->keyBy(fn ($d) => strtolower(trim($d->name)));

            $jobTitlesById = JobTitle::withTrashed()
                ->whereNotNull('idjobtitle')
                ->get()
                ->keyBy('idjobtitle');

            $jobTitlesByName = JobTitle::withTrashed()
                ->whereNotNull('name')
                ->get()
                ->keyBy(fn ($jt) => strtolower(trim($jt->name)));

            $jobLevelsById = JobLevel::withTrashed()
                ->whereNotNull('idjoblevel')
                ->get()
                ->keyBy('idjoblevel');

            $jobLevelsByName = JobLevel::withTrashed()
                ->whereNotNull('name')
                ->get()
                ->keyBy(fn ($jl) => strtolower(trim($jl->name)));

            $defaultPasswordHash = Hash::make('Password@123');
            $now = now();

            DB::transaction(function () use (
                $data,
                $userId,
                $staffRoleId,
                $defaultFilterTemplateId,
                $defaultPasswordHash,
                $now,
                &$syncedCount,
                $existingByIdEmployee,
                $existingByEmail,
                $existingByNik,
                $existingByUsername,
                $existingByCode,
                $companiesById,
                $locationsById,
                $locationsByName,
                $departmentsByIdOrg,
                $departmentsByName,
                $jobTitlesById,
                $jobTitlesByName,
                $jobLevelsById,
                $jobLevelsByName
            ) {
                foreach ($data as $item) {
                    $idEmployee = $item['idemployee'] ?? null;
                    $nik = isset($item['nik']) ? trim((string) $item['nik']) : '';
                    $name = isset($item['employeeName']) ? trim((string) $item['employeeName']) : '';
                    $officeMail = isset($item['officeMail']) ? strtolower(trim((string) $item['officeMail'])) : '';

                    if (empty($name) && empty($nik) && empty($officeMail)) {
                        continue;
                    }

                    $isActive = isset($item['isActive']) ? (bool) $item['isActive'] : true;
                    $startDate = ! empty($item['startDate']) ? Carbon::parse($item['startDate']) : null;
                    $joinDate = ! empty($item['joinDate']) ? Carbon::parse($item['joinDate']) : null;
                    $modifiedDate = ! empty($item['modifiedDate']) ? Carbon::parse($item['modifiedDate']) : null;

                    // Match in-memory: 1) idemployee, 2) nik, 3) username, 4) code, 5) email
                    $user = null;
                    if (! empty($idEmployee) && isset($existingByIdEmployee[$idEmployee])) {
                        $user = $existingByIdEmployee[$idEmployee];
                    } elseif (! empty($nik) && isset($existingByNik[$nik])) {
                        $user = $existingByNik[$nik];
                    } elseif (! empty($nik) && isset($existingByUsername[$nik])) {
                        $user = $existingByUsername[$nik];
                    } elseif (! empty($nik) && isset($existingByCode[$nik])) {
                        $user = $existingByCode[$nik];
                    } elseif (! empty($officeMail) && isset($existingByEmail[$officeMail])) {
                        $user = $existingByEmail[$officeMail];
                    }

                    $idCompany = $item['idcompany'] ?? null;
                    $company = ! empty($idCompany) && isset($companiesById[$idCompany]) ? $companiesById[$idCompany] : null;
                    $companyId = $company?->id;
                    $companyGroupId = $company?->company_group_id;
                    $regionId = $company?->region_id;

                    $idLocation = $item['idlocation'] ?? null;
                    $locationName = isset($item['locationName']) ? trim((string) $item['locationName']) : null;
                    $locationId = null;
                    if (! empty($idLocation) && isset($locationsById[$idLocation])) {
                        $locationId = $locationsById[$idLocation]->id;
                    } elseif (! empty($locationName) && isset($locationsByName[strtolower($locationName)])) {
                        $locationId = $locationsByName[strtolower($locationName)]->id;
                    }

                    $idOrg = $item['idorganization'] ?? null;
                    $orgName = isset($item['orgName']) ? trim((string) $item['orgName']) : null;
                    $departmentId = null;
                    if (! empty($idOrg) && isset($departmentsByIdOrg[$idOrg])) {
                        $departmentId = $departmentsByIdOrg[$idOrg]->id;
                    } elseif (! empty($orgName) && isset($departmentsByName[strtolower($orgName)])) {
                        $departmentId = $departmentsByName[strtolower($orgName)]->id;
                    }

                    $idJobTitle = $item['idjobtitle'] ?? null;
                    $jobTitleName = isset($item['jobtitleName']) ? trim((string) $item['jobtitleName']) : null;
                    $jobPositionId = null;
                    if (! empty($idJobTitle) && isset($jobTitlesById[$idJobTitle])) {
                        $jobPositionId = $jobTitlesById[$idJobTitle]->id;
                    } elseif (! empty($jobTitleName) && isset($jobTitlesByName[strtolower($jobTitleName)])) {
                        $jobPositionId = $jobTitlesByName[strtolower($jobTitleName)]->id;
                    }

                    $idJobLevel = $item['idjoblevel'] ?? null;
                    $jobLevelName = isset($item['joblevelName']) ? trim((string) $item['joblevelName']) : null;
                    $jobLevelId = null;
                    if (! empty($idJobLevel) && isset($jobLevelsById[$idJobLevel])) {
                        $jobLevelId = $jobLevelsById[$idJobLevel]->id;
                    } elseif (! empty($jobLevelName) && isset($jobLevelsByName[strtolower($jobLevelName)])) {
                        $jobLevelId = $jobLevelsByName[strtolower($jobLevelName)]->id;
                    }

                    $username = $nik ?: (! empty($officeMail) ? explode('@', $officeMail)[0] : "user_{$idEmployee}");

                    $attributes = [
                        'idemployee' => $idEmployee,
                        'nik' => $nik ?: null,
                        'username' => $username,
                        'name' => $name,
                        'email' => $officeMail ?: ($nik ? "{$nik}@local.sys" : "user_{$idEmployee}@local.sys"),
                        'gender' => $item['gender'] ?? null,
                        'mobile_no' => $item['mobileNo'] ?? null,
                        'department_id' => $departmentId,
                        'idorganization' => $idOrg,
                        'org_name' => $orgName,
                        'company_id' => $companyId,
                        'company_group_id' => $companyGroupId,
                        'region_id' => $regionId,
                        'idcompany' => $idCompany,
                        'company_name' => $item['companyName'] ?? null,
                        'location_id' => $locationId,
                        'idlocation' => $idLocation,
                        'location_name' => $item['locationName'] ?? null,
                        'job_position_id' => $jobPositionId,
                        'idjobtitle' => $idJobTitle,
                        'jobtitle_name' => $jobTitleName,
                        'job_level_id' => $jobLevelId,
                        'idjoblevel' => $idJobLevel,
                        'joblevel_name' => $jobLevelName,
                        'idemployment_type' => $item['idemploymentType'] ?? null,
                        'idreporting_to' => $item['idreportingTo'] ?? null,
                        'reporting_to' => $item['reportingTo'] ?? null,
                        'start_date' => $startDate,
                        'join_date' => $joinDate,
                        'modified_by_name' => $item['modifiedBy'] ?? null,
                        'portal_modified_date' => $modifiedDate,
                        'is_employee' => true,
                        'is_active' => $isActive,
                    ];

                    if ($user) {
                        $attributes['updated_by'] = $userId;
                        $attributes['updated_at'] = $now;
                        $attributes['deleted_at'] = null;
                        DB::table('m_users')->where('id', $user->id)->update($attributes);
                    } else {
                        $newId = (string) Str::uuid();
                        $attributes['id'] = $newId;
                        $attributes['password'] = $defaultPasswordHash;
                        $attributes['role_id'] = $staffRoleId;
                        $attributes['contract_filter_template_id'] = $defaultFilterTemplateId;
                        $attributes['is_used'] = false; // default false for system
                        $attributes['created_by'] = $userId;
                        $attributes['updated_by'] = $userId;
                        $attributes['created_at'] = $now;
                        $attributes['updated_at'] = $now;
                        DB::table('m_users')->insert($attributes);

                        $obj = (object) ['id' => $newId, 'nik' => $nik, 'email' => $attributes['email'], 'username' => $username];
                        if (! empty($idEmployee)) {
                            $existingByIdEmployee[$idEmployee] = $obj;
                        }
                        if (! empty($officeMail)) {
                            $existingByEmail[$officeMail] = $obj;
                        }
                        if (! empty($nik)) {
                            $existingByNik[$nik] = $obj;
                            $existingByUsername[$nik] = $obj;
                        }
                    }

                    $syncedCount++;
                }
            });

            return [
                'success' => true,
                'message' => "Berhasil sinkronisasi {$syncedCount} data Karyawan / Pengguna dari Portal.",
                'synced' => $syncedCount,
                'total' => count($data),
            ];
        } catch (\Throwable $e) {
            Log::error('Portal employee sync exception: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return [
                'success' => false,
                'message' => 'Gagal melakukan sinkronisasi: '.$e->getMessage(),
                'synced' => 0,
                'total' => 0,
            ];
        }
    }

    /**
     * Synchronize Departments / Organizations from Portal API.
     *
     * @return array{success: bool, message: string, synced: int, total: int}
     */
    public function syncDepartments(): array
    {
        $baseUrl = $this->getBaseUrl();
        $endpoint = $this->getEndpoint('departments');
        $fullUrl = "{$baseUrl}/{$endpoint}";

        try {
            $response = Http::timeout(60)->get($fullUrl);

            if (! $response->successful()) {
                Log::warning('Portal department sync failed with HTTP status: '.$response->status(), ['url' => $fullUrl]);

                return [
                    'success' => false,
                    'message' => "Gagal terhubung ke Portal API (HTTP {$response->status()}) pada {$fullUrl}",
                    'synced' => 0,
                    'total' => 0,
                ];
            }

            $json = $response->json();
            $data = $json['data'] ?? [];

            if (! is_array($data)) {
                return [
                    'success' => false,
                    'message' => 'Format respon API Portal tidak valid (data bukan array).',
                    'synced' => 0,
                    'total' => 0,
                ];
            }

            $syncedCount = 0;
            $userId = Auth::id();

            // Preload existing records in 1 query
            $existingByIdOrg = Department::withTrashed()
                ->whereNotNull('idorganization')
                ->get()
                ->keyBy('idorganization');

            $existingByCode = Department::withTrashed()
                ->whereNotNull('code')
                ->get()
                ->keyBy('code');

            DB::transaction(function () use ($data, $userId, &$syncedCount, $existingByIdOrg, $existingByCode) {
                foreach ($data as $item) {
                    $idOrganization = $item['idorganization'] ?? null;
                    $orgCode = isset($item['orgCode']) ? trim((string) $item['orgCode']) : (isset($item['code']) ? trim((string) $item['code']) : '');
                    $orgName = isset($item['orgName']) ? trim((string) $item['orgName']) : (isset($item['name']) ? trim((string) $item['name']) : '');

                    if (empty($orgCode) && empty($orgName)) {
                        continue;
                    }

                    $isActive = isset($item['isActive']) ? (bool) $item['isActive'] : true;
                    $createdDate = ! empty($item['createdDate']) ? Carbon::parse($item['createdDate']) : null;
                    $modifiedDate = ! empty($item['modifiedDate']) ? Carbon::parse($item['modifiedDate']) : null;

                    // Match in-memory: 1) idorganization, 2) code
                    $dept = null;
                    if (! empty($idOrganization) && isset($existingByIdOrg[$idOrganization])) {
                        $dept = $existingByIdOrg[$idOrganization];
                    } elseif (! empty($orgCode) && isset($existingByCode[$orgCode])) {
                        $dept = $existingByCode[$orgCode];
                    }

                    $attributes = [
                        'idorganization' => $idOrganization,
                        'code' => $orgCode,
                        'name' => $orgName,
                        'idorg_group' => $item['idorgGroup'] ?? null,
                        'org_group_name' => $item['orgGroupName'] ?? null,
                        'idorg_level' => $item['idorgLevel'] ?? null,
                        'org_level_name' => $item['orgLevelName'] ?? null,
                        'description' => $item['description'] ?? null,
                        'created_by_name' => $item['createdBy'] ?? null,
                        'modified_by_name' => $item['modifiedBy'] ?? null,
                        'portal_created_date' => $createdDate,
                        'portal_modified_date' => $modifiedDate,
                        'is_active' => $isActive,
                    ];

                    if ($dept) {
                        if ($dept->trashed()) {
                            $dept->restore();
                        }
                        $attributes['updated_by'] = $userId;
                        $dept->update($attributes);
                    } else {
                        $attributes['is_used'] = false; // default false for system
                        $attributes['created_by'] = $userId;
                        $attributes['updated_by'] = $userId;
                        $newDept = Department::create($attributes);

                        if (! empty($idOrganization)) {
                            $existingByIdOrg[$idOrganization] = $newDept;
                        }
                        if (! empty($orgCode)) {
                            $existingByCode[$orgCode] = $newDept;
                        }
                    }

                    $syncedCount++;
                }
            });

            return [
                'success' => true,
                'message' => "Berhasil sinkronisasi {$syncedCount} data Organisasi / Departemen dari Portal.",
                'synced' => $syncedCount,
                'total' => count($data),
            ];
        } catch (\Throwable $e) {
            Log::error('Portal department sync exception: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return [
                'success' => false,
                'message' => 'Gagal melakukan sinkronisasi: '.$e->getMessage(),
                'synced' => 0,
                'total' => 0,
            ];
        }
    }

    /**
     * Synchronize Job Levels from Portal API.
     *
     * @return array{success: bool, message: string, synced: int, total: int}
     */
    public function syncJobLevels(): array
    {
        $baseUrl = $this->getBaseUrl();
        $endpoint = $this->getEndpoint('job_levels');
        $fullUrl = "{$baseUrl}/{$endpoint}";

        try {
            $response = Http::timeout(30)->get($fullUrl);

            if (! $response->successful()) {
                Log::warning('Portal job level sync failed with HTTP status: '.$response->status(), ['url' => $fullUrl]);

                return [
                    'success' => false,
                    'message' => "Gagal terhubung ke Portal API (HTTP {$response->status()}) pada {$fullUrl}",
                    'synced' => 0,
                    'total' => 0,
                ];
            }

            $json = $response->json();
            $data = $json['data'] ?? [];

            if (! is_array($data)) {
                return [
                    'success' => false,
                    'message' => 'Format respon API Portal tidak valid (data bukan array).',
                    'synced' => 0,
                    'total' => 0,
                ];
            }

            $syncedCount = 0;
            $userId = Auth::id();

            // Preload existing job levels in 1 query
            $existingByIdJobLevel = JobLevel::withTrashed()
                ->whereNotNull('idjoblevel')
                ->get()
                ->keyBy('idjoblevel');

            $existingByCode = JobLevel::withTrashed()
                ->whereNotNull('code')
                ->get()
                ->keyBy('code');

            DB::transaction(function () use ($data, $userId, &$syncedCount, $existingByIdJobLevel, $existingByCode) {
                foreach ($data as $item) {
                    $idJobLevel = $item['idjoblevel'] ?? null;
                    $code = isset($item['joblevelCode']) ? trim((string) $item['joblevelCode']) : (isset($item['code']) ? trim((string) $item['code']) : '');
                    $name = isset($item['joblevelName']) ? trim((string) $item['joblevelName']) : (isset($item['name']) ? trim((string) $item['name']) : '');

                    if (empty($code) && empty($name)) {
                        continue;
                    }

                    $isActive = isset($item['isActive']) ? (bool) $item['isActive'] : true;
                    $createdDate = ! empty($item['createdDate']) ? Carbon::parse($item['createdDate']) : null;
                    $modifiedDate = ! empty($item['modifiedDate']) ? Carbon::parse($item['modifiedDate']) : null;

                    // Match in-memory: 1) idjoblevel, 2) code
                    $jobLevel = null;
                    if (! empty($idJobLevel) && isset($existingByIdJobLevel[$idJobLevel])) {
                        $jobLevel = $existingByIdJobLevel[$idJobLevel];
                    } elseif (! empty($code) && isset($existingByCode[$code])) {
                        $jobLevel = $existingByCode[$code];
                    }

                    $attributes = [
                        'idjoblevel' => $idJobLevel,
                        'code' => $code,
                        'name' => $name,
                        'id_job_level_group' => $item['idjobLevelGroup'] ?? null,
                        'group_name' => $item['groupName'] ?? null,
                        'created_by_name' => $item['createdBy'] ?? null,
                        'modified_by_name' => $item['modifiedBy'] ?? null,
                        'portal_created_date' => $createdDate,
                        'portal_modified_date' => $modifiedDate,
                        'is_active' => $isActive,
                    ];

                    if ($jobLevel) {
                        if ($jobLevel->trashed()) {
                            $jobLevel->restore();
                        }
                        $attributes['updated_by'] = $userId;
                        $jobLevel->update($attributes);
                    } else {
                        $attributes['is_used'] = $isActive;
                        $attributes['created_by'] = $userId;
                        $attributes['updated_by'] = $userId;
                        $newJobLevel = JobLevel::create($attributes);

                        if (! empty($idJobLevel)) {
                            $existingByIdJobLevel[$idJobLevel] = $newJobLevel;
                        }
                        if (! empty($code)) {
                            $existingByCode[$code] = $newJobLevel;
                        }
                    }

                    $syncedCount++;
                }
            });

            return [
                'success' => true,
                'message' => "Berhasil sinkronisasi {$syncedCount} data Job Level dari Portal.",
                'synced' => $syncedCount,
                'total' => count($data),
            ];
        } catch (\Throwable $e) {
            Log::error('Portal job level sync exception: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return [
                'success' => false,
                'message' => 'Gagal melakukan sinkronisasi: '.$e->getMessage(),
                'synced' => 0,
                'total' => 0,
            ];
        }
    }

    /**
     * Synchronize Job Titles from Portal API.
     *
     * @return array{success: bool, message: string, synced: int, total: int}
     */
    public function syncJobTitles(): array
    {
        $baseUrl = $this->getBaseUrl();
        $endpoint = $this->getEndpoint('job_titles');
        $fullUrl = "{$baseUrl}/{$endpoint}";

        try {
            $response = Http::timeout(30)->get($fullUrl);

            if (! $response->successful()) {
                Log::warning('Portal job title sync failed with HTTP status: '.$response->status(), ['url' => $fullUrl]);

                return [
                    'success' => false,
                    'message' => "Gagal terhubung ke Portal API (HTTP {$response->status()}) pada {$fullUrl}",
                    'synced' => 0,
                    'total' => 0,
                ];
            }

            $json = $response->json();
            $data = $json['data'] ?? [];

            if (! is_array($data)) {
                return [
                    'success' => false,
                    'message' => 'Format respon API Portal tidak valid (data bukan array).',
                    'synced' => 0,
                    'total' => 0,
                ];
            }

            $syncedCount = 0;
            $userId = Auth::id();

            // Preload job levels to resolve foreign key relation
            $jobLevelsById = JobLevel::whereNotNull('idjoblevel')->get()->keyBy('idjoblevel');
            $jobLevelsByName = JobLevel::all()->keyBy(fn ($jl) => strtolower(trim($jl->name)));

            // Preload existing job titles in 1 query
            $existingByIdJobTitle = JobTitle::withTrashed()
                ->whereNotNull('idjobtitle')
                ->get()
                ->keyBy('idjobtitle');

            $existingByCode = JobTitle::withTrashed()
                ->whereNotNull('code')
                ->get()
                ->keyBy('code');

            DB::transaction(function () use (
                $data,
                $userId,
                &$syncedCount,
                $jobLevelsById,
                $jobLevelsByName,
                $existingByIdJobTitle,
                $existingByCode
            ) {
                foreach ($data as $item) {
                    $idJobTitle = $item['idjobtitle'] ?? null;
                    $code = isset($item['jobtitleCode']) ? trim((string) $item['jobtitleCode']) : (isset($item['code']) ? trim((string) $item['code']) : '');
                    $name = isset($item['jobtitleName']) ? trim((string) $item['jobtitleName']) : (isset($item['name']) ? trim((string) $item['name']) : '');

                    if (empty($code) && empty($name)) {
                        continue;
                    }

                    $idJobLevel = $item['idjoblevel'] ?? null;
                    $jobLevelName = isset($item['joblevelName']) ? trim((string) $item['joblevelName']) : null;

                    $jobLevelId = null;
                    if (! empty($idJobLevel) && isset($jobLevelsById[$idJobLevel])) {
                        $jobLevelId = $jobLevelsById[$idJobLevel]->id;
                    } elseif (! empty($jobLevelName) && isset($jobLevelsByName[strtolower($jobLevelName)])) {
                        $jobLevelId = $jobLevelsByName[strtolower($jobLevelName)]->id;
                    }

                    $isActive = isset($item['isActive']) ? (bool) $item['isActive'] : true;
                    $createdDate = ! empty($item['createdDate']) ? Carbon::parse($item['createdDate']) : null;
                    $modifiedDate = ! empty($item['modifiedDate']) ? Carbon::parse($item['modifiedDate']) : null;

                    // Match in-memory: 1) idjobtitle, 2) code
                    $jobTitle = null;
                    if (! empty($idJobTitle) && isset($existingByIdJobTitle[$idJobTitle])) {
                        $jobTitle = $existingByIdJobTitle[$idJobTitle];
                    } elseif (! empty($code) && isset($existingByCode[$code])) {
                        $jobTitle = $existingByCode[$code];
                    }

                    $attributes = [
                        'idjobtitle' => $idJobTitle,
                        'code' => $code,
                        'name' => $name,
                        'job_level_id' => $jobLevelId,
                        'idjoblevel' => $idJobLevel,
                        'job_level_name' => $jobLevelName,
                        'created_by_name' => $item['createdBy'] ?? null,
                        'modified_by_name' => $item['modifiedBy'] ?? null,
                        'portal_created_date' => $createdDate,
                        'portal_modified_date' => $modifiedDate,
                        'is_active' => $isActive,
                    ];

                    if ($jobTitle) {
                        if ($jobTitle->trashed()) {
                            $jobTitle->restore();
                        }
                        $attributes['updated_by'] = $userId;
                        $jobTitle->update($attributes);
                    } else {
                        $attributes['is_used'] = $isActive;
                        $attributes['created_by'] = $userId;
                        $attributes['updated_by'] = $userId;
                        $newJobTitle = JobTitle::create($attributes);

                        if (! empty($idJobTitle)) {
                            $existingByIdJobTitle[$idJobTitle] = $newJobTitle;
                        }
                        if (! empty($code)) {
                            $existingByCode[$code] = $newJobTitle;
                        }
                    }

                    $syncedCount++;
                }
            });

            return [
                'success' => true,
                'message' => "Berhasil sinkronisasi {$syncedCount} data Job Title dari Portal.",
                'synced' => $syncedCount,
                'total' => count($data),
            ];
        } catch (\Throwable $e) {
            Log::error('Portal job title sync exception: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return [
                'success' => false,
                'message' => 'Gagal melakukan sinkronisasi: '.$e->getMessage(),
                'synced' => 0,
                'total' => 0,
            ];
        }
    }
}
