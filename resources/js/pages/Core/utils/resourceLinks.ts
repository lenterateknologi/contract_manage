export const DIALOG_RESOURCES = [
    'departments',
    'company-groups',
    'divisions',
    'regions',
    'companies',
    'roles',
    'contract-filter-templates',
    'locations',
    'business-units',
    'job-levels',
    'job-titles',
    'organization-levels',
    'organization-groups',
];

export function getCountColumnLink(resourceSlug: string, colName: string, row: any): { url: string; tooltip: string } | null {
    if (!row) return null;
    const rowName = row.name || row.code || 'entitas ini';

    // 1. Users Count Columns
    if (colName === 'users_count' || colName === 'total_users') {
        if (resourceSlug === 'departments') {
            return {
                url: `/admin/core/users?department_id%5B0%5D=${encodeURIComponent(row.id)}`,
                tooltip: `Lihat daftar pengguna di Departemen: ${rowName}`,
            };
        }
        if (resourceSlug === 'divisions') {
            return {
                url: `/admin/core/users?division_id%5B0%5D=${encodeURIComponent(row.id)}`,
                tooltip: `Lihat daftar pengguna di Divisi: ${rowName}`,
            };
        }
        if (resourceSlug === 'companies') {
            return {
                url: `/admin/core/users?company_id%5B0%5D=${encodeURIComponent(row.id)}`,
                tooltip: `Lihat daftar pengguna di Perusahaan: ${rowName}`,
            };
        }
        if (resourceSlug === 'company-groups') {
            return {
                url: `/admin/core/users?company_group_id%5B0%5D=${encodeURIComponent(row.id)}`,
                tooltip: `Lihat daftar pengguna di Group: ${rowName}`,
            };
        }
        if (resourceSlug === 'regions') {
            return {
                url: `/admin/core/users?region_id%5B0%5D=${encodeURIComponent(row.id)}`,
                tooltip: `Lihat daftar pengguna di Region: ${rowName}`,
            };
        }
        if (resourceSlug === 'locations') {
            return {
                url: `/admin/core/users?location_id%5B0%5D=${encodeURIComponent(row.id)}`,
                tooltip: `Lihat daftar pengguna di Lokasi: ${rowName}`,
            };
        }
        if (resourceSlug === 'job-titles') {
            return {
                url: `/admin/core/users?job_position_id%5B0%5D=${encodeURIComponent(row.id)}`,
                tooltip: `Lihat daftar pengguna dengan Jabatan: ${rowName}`,
            };
        }
        if (resourceSlug === 'job-levels') {
            return {
                url: `/admin/core/users?job_level_id%5B0%5D=${encodeURIComponent(row.id)}`,
                tooltip: `Lihat daftar pengguna dengan Level: ${rowName}`,
            };
        }
        if (resourceSlug === 'job-level-groups') {
            return {
                url: `/admin/core/users?job_level_group_id%5B0%5D=${encodeURIComponent(row.id)}`,
                tooltip: `Lihat daftar pengguna dengan Group Level: ${rowName}`,
            };
        }
        if (resourceSlug === 'roles') {
            return {
                url: `/admin/core/users?role_id%5B0%5D=${encodeURIComponent(row.id)}`,
                tooltip: `Lihat daftar pengguna dengan Role: ${rowName}`,
            };
        }
        if (resourceSlug === 'organization-groups') {
            return {
                url: `/admin/core/users?organization_group_id%5B0%5D=${encodeURIComponent(row.id)}`,
                tooltip: `Lihat daftar pengguna di Group Organisasi: ${rowName}`,
            };
        }
        if (resourceSlug === 'business-units') {
            if (row.company_id && row.location_id) {
                return {
                    url: `/admin/core/users?company_id%5B0%5D=${encodeURIComponent(row.company_id)}&location_id%5B0%5D=${encodeURIComponent(row.location_id)}`,
                    tooltip: `Lihat daftar pengguna di Business Unit: ${rowName}`,
                };
            }
            return {
                url: `/admin/core/users?company_id%5B0%5D=${encodeURIComponent(row.company_id || row.id)}`,
                tooltip: `Lihat daftar pengguna di Business Unit: ${rowName}`,
            };
        }
        if (resourceSlug === 'dashboard-types') {
            const params = new URLSearchParams();
            const normalize = (val: any) => {
                if (Array.isArray(val)) return val.filter(Boolean);
                if (typeof val === 'string') {
                    try {
                        const parsed = JSON.parse(val);
                        if (Array.isArray(parsed)) return parsed.filter(Boolean);
                    } catch {
                        // ignore parse error
                    }
                    return val ? [val] : [];
                }
                return [];
            };

            const userIds = normalize(row.user_ids);
            if (userIds.length > 0) {
                userIds.forEach((id: string, idx: number) => {
                    params.append(`id[${idx}]`, id);
                });
            } else {
                const roleIds = normalize(row.role_ids || (row.role_id ? [row.role_id] : []));
                roleIds.forEach((id: string, idx: number) => params.append(`role_id[${idx}]`, id));

                const levelIds = normalize(row.job_level_ids);
                levelIds.forEach((id: string, idx: number) => params.append(`job_level_id[${idx}]`, id));

                const titleIds = normalize(row.job_title_ids);
                titleIds.forEach((id: string, idx: number) => params.append(`job_position_id[${idx}]`, id));

                const divIds = normalize(row.division_ids || (row.division_id ? [row.division_id] : []));
                if (divIds.length > 0 && !row.scope_to_user_division) {
                    divIds.forEach((id: string, idx: number) => params.append(`division_id[${idx}]`, id));
                }

                const deptIds = normalize(row.department_ids || (row.department_id ? [row.department_id] : []));
                if (deptIds.length > 0 && !row.scope_to_user_department) {
                    deptIds.forEach((id: string, idx: number) => params.append(`department_id[${idx}]`, id));
                }

                const locationIds = normalize(row.location_ids);
                locationIds.forEach((id: string, idx: number) => params.append(`location_id[${idx}]`, id));
            }

            const qs = params.toString();
            return {
                url: qs ? `/admin/core/users?${qs}` : `/admin/core/users`,
                tooltip: `Lihat daftar pengguna dengan Profil Otoritas: ${rowName}`,
            };
        }
    }

    // 2. Department Count Columns
    if (colName === 'departments_count' || colName === 'total_departments') {
        if (resourceSlug === 'companies') {
            return {
                url: `/admin/core/departments?company_id%5B0%5D=${encodeURIComponent(row.id)}`,
                tooltip: `Lihat daftar departemen di Perusahaan: ${rowName}`,
            };
        }
        if (resourceSlug === 'organization-groups') {
            return {
                url: `/admin/core/departments?organization_group_id%5B0%5D=${encodeURIComponent(row.id)}`,
                tooltip: `Lihat daftar departemen di Group Organisasi: ${rowName}`,
            };
        }
        if (resourceSlug === 'organization-levels') {
            return {
                url: `/admin/core/departments?idorg_level%5B0%5D=${encodeURIComponent(row.idorg_level || row.id)}`,
                tooltip: `Lihat daftar departemen di Level: ${rowName}`,
            };
        }
    }

    // 3. Job Title Count Columns
    if (colName === 'job_titles_count') {
        if (resourceSlug === 'job-levels') {
            return {
                url: `/admin/core/job-titles?job_level_id%5B0%5D=${encodeURIComponent(row.id)}`,
                tooltip: `Lihat daftar posisi dengan Level: ${rowName}`,
            };
        }
    }

    // 4. Job Level Count Columns
    if (colName === 'job_levels_count') {
        if (resourceSlug === 'job-level-groups') {
            return {
                url: `/admin/core/job-levels?job_level_group_id%5B0%5D=${encodeURIComponent(row.id)}`,
                tooltip: `Lihat daftar level pada Group: ${rowName}`,
            };
        }
    }

    // 5. Company Count Columns
    if (colName === 'companies_count') {
        if (resourceSlug === 'company-groups') {
            return {
                url: `/admin/core/companies?company_group_id%5B0%5D=${encodeURIComponent(row.id)}`,
                tooltip: `Lihat daftar perusahaan di Group: ${rowName}`,
            };
        }
        if (resourceSlug === 'regions') {
            return {
                url: `/admin/core/companies?region_id%5B0%5D=${encodeURIComponent(row.id)}`,
                tooltip: `Lihat daftar perusahaan di Region: ${rowName}`,
            };
        }
    }

    // 6. Business Unit Count Columns
    if (colName === 'business_units_count' || colName === 'businessUnits_count') {
        if (resourceSlug === 'companies') {
            return {
                url: `/admin/core/business-units?company_id%5B0%5D=${encodeURIComponent(row.id)}`,
                tooltip: `Lihat daftar business unit di Perusahaan: ${rowName}`,
            };
        }
        if (resourceSlug === 'locations') {
            return {
                url: `/admin/core/business-units?location_id%5B0%5D=${encodeURIComponent(row.id)}`,
                tooltip: `Lihat daftar business unit di Lokasi: ${rowName}`,
            };
        }
    }

    // 7. Division Count Columns
    if (colName === 'divisions_count') {
        if (resourceSlug === 'departments') {
            return {
                url: `/admin/core/divisions?department_id%5B0%5D=${encodeURIComponent(row.id)}`,
                tooltip: `Lihat daftar divisi di Departemen: ${rowName}`,
            };
        }
    }

    return null;
}
