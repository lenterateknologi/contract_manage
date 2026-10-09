import { Button } from '@/components/ui/buttons/Button';
import { ConfirmationModal } from '@/components/ui/dialogs/ConfirmationModal';
import { useToast } from '@/components/ui/feedback/Toast';
import { FloatingPanel } from '@/components/ui/navigation/FloatingPanel';
import { MasterPageLayout } from '@/components/ui/navigation/MasterPageLayout';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { ColumnVisibilityDropdown } from '@/components/ui/selection/ColumnVisibilityDropdown';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/selection/DropdownMenu';
import { DataTable } from '@/components/ui/tables/DataTable';
import { ExcelActions } from '@/components/ui/tables/ExcelActions';
import { parseDateInput } from '@/lib/formatters';
import LucideIcons from '@/lib/lucide-dynamic';
import { cn } from '@/lib/utils';
import { SlaSimulationModal } from '@/features/Contracts/components/parts/SlaSimulationModal';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Building,
    Building2,
    Calculator,
    Calendar,
    Copy,
    Database,
    Edit2,
    FileText,
    GitBranch,
    Handshake,
    Layers,
    MapPin,
    MoreVertical,
    Plus,
    RefreshCw,
    Trash2,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';
import ResourceBulkEditModal from '../components/ResourceBulkEditModal';
import ResourceQuickDialog from '../components/ResourceQuickDialog';
import { flattenHierarchy, getCookie } from '../utils/hierarchy';
import { DIALOG_RESOURCES, getCountColumnLink } from '../utils/resourceLinks';
import { ResourceIndexProps } from '../utils/types';

export default function ResourceIndex({
    resourceSlug,
    title,
    tableSchema,
    formSchema,
    data,
    filters,
    activeFilters = {},
    hasExport = false,
    hasImport = false,
    hasPortalSync = false,
}: ResourceIndexProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedRows, setSelectedRows] = useState<any[]>([]);
    const [showBulkEditModal, setShowBulkEditModal] = useState(false);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [bulkSelectedFields, setBulkSelectedFields] = useState<Record<string, boolean>>({});
    const [bulkFieldValues, setBulkFieldValues] = useState<Record<string, any>>({});
    const [bulkProcessing, setBulkProcessing] = useState(false);

    const { showProgress, hideProgress } = useToast();
    const [isDeptDialogOpen, setIsDeptDialogOpen] = useState(false);
    const [editDataId, setEditDataId] = useState<string | null>(null);
    const [localAccessTypes, setLocalAccessTypes] = useState<Record<string, string>>({});
    const [isSyncing, setIsSyncing] = useState(false);
    const [showSyncConfirm, setShowSyncConfirm] = useState(false);
    const [updatingRowId, setUpdatingRowId] = useState<string | null>(null);
    const [isSlaSimOpen, setIsSlaSimOpen] = useState(false);

    const handleSingleToggle = (rowId: string, colName: string, currentVal: boolean) => {
        setUpdatingRowId(rowId);
        const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
        router.post(
            `/admin/core/${resourceSlug}/bulk-update`,
            {
                ids: [rowId],
                values: { [colName]: !currentVal },
                return_url: currentUrl,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => {
                    setUpdatingRowId(null);
                },
            },
        );
    };

    // Dynamic initial form fields from formSchema
    const initialFormData = React.useMemo(() => {
        const initial: Record<string, any> = {};
        formSchema.forEach((field) => {
            if (field.isGroup && Array.isArray(field.schema)) {
                field.schema.forEach((subField: any) => {
                    const isBool = subField.type === 'switch' || subField.type === 'toggle' || subField.name.startsWith('can_change_');
                    initial[subField.name] = subField.defaultValue ?? (isBool ? false : '');
                });
            } else {
                const isBool = field.type === 'switch' || field.type === 'toggle' || field.name.startsWith('can_change_');
                initial[field.name] = field.defaultValue ?? (isBool ? false : '');
            }
        });
        return initial;
    }, [formSchema]);

    const deptForm = useForm(initialFormData);

    const handleOpenEdit = (row: any) => {
        const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
        const returnParam = currentUrl ? `?return_url=${encodeURIComponent(currentUrl)}` : '';

        if (resourceSlug === 'vendors') {
            router.visit(`/admin/core/${resourceSlug}/${row.id}/edit${returnParam}`);
        } else if (DIALOG_RESOURCES.includes(resourceSlug)) {
            const editValues: Record<string, any> = {};
            formSchema.forEach((field) => {
                if (field.isGroup && Array.isArray(field.schema)) {
                    field.schema.forEach((subField: any) => {
                        editValues[subField.name] = row[subField.name] ?? (subField.type === 'switch' ? false : '');
                    });
                } else {
                    editValues[field.name] = row[field.name] ?? (field.type === 'switch' ? false : '');
                }
            });
            const initialTypes: Record<string, string> = {};
            const DIMENSIONS = [
                { key: 'company_group', toggleName: 'can_change_company_group', allowedName: 'allowed_company_groups' },
                { key: 'region', toggleName: 'can_change_region', allowedName: 'allowed_regions' },
                { key: 'company', toggleName: 'can_change_company', allowedName: 'allowed_companies' },
                { key: 'division', toggleName: 'can_change_division', allowedName: 'allowed_divisions' },
                { key: 'department', toggleName: 'can_change_department', allowedName: 'allowed_departments' },
            ];
            DIMENSIONS.forEach((dim) => {
                const canChange = row[dim.toggleName] === true || row[dim.toggleName] === 1 || String(row[dim.toggleName]) === 'true';
                const allowed = row[dim.allowedName] || [];
                if (!canChange) {
                    initialTypes[dim.key] = 'user_data';
                } else {
                    initialTypes[dim.key] = allowed.length > 0 ? 'custom' : 'full_access';
                }
            });
            setLocalAccessTypes(initialTypes);
            deptForm.setData(editValues);
            setEditDataId(row.id);
            setIsDeptDialogOpen(true);
        } else {
            router.visit(`/admin/core/${resourceSlug}/${row.id}/edit${returnParam}`);
        }
    };

    const handleDuplicate = (row: any) => {
        const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
        const returnParam = currentUrl ? `&return_url=${encodeURIComponent(currentUrl)}` : '';

        if (DIALOG_RESOURCES.includes(resourceSlug)) {
            const editValues: Record<string, any> = {};
            formSchema.forEach((field) => {
                if (field.isGroup && Array.isArray(field.schema)) {
                    field.schema.forEach((subField: any) => {
                        editValues[subField.name] = row[subField.name] ?? (subField.type === 'switch' ? false : '');
                    });
                } else {
                    editValues[field.name] = row[field.name] ?? (field.type === 'switch' ? false : '');
                }
            });
            if (editValues.name) editValues.name = `${editValues.name} (Copy)`;
            if (editValues.code) editValues.code = `${editValues.code}_COPY`;

            const initialTypes: Record<string, string> = {};
            const DIMENSIONS = [
                { key: 'company_group', toggleName: 'can_change_company_group', allowedName: 'allowed_company_groups' },
                { key: 'region', toggleName: 'can_change_region', allowedName: 'allowed_regions' },
                { key: 'company', toggleName: 'can_change_company', allowedName: 'allowed_companies' },
                { key: 'division', toggleName: 'can_change_division', allowedName: 'allowed_divisions' },
                { key: 'department', toggleName: 'can_change_department', allowedName: 'allowed_departments' },
            ];
            DIMENSIONS.forEach((dim) => {
                const canChange = row[dim.toggleName] === true || row[dim.toggleName] === 1 || String(row[dim.toggleName]) === 'true';
                const allowed = row[dim.allowedName] || [];
                if (!canChange) {
                    initialTypes[dim.key] = 'user_data';
                } else {
                    initialTypes[dim.key] = allowed.length > 0 ? 'custom' : 'full_access';
                }
            });
            setLocalAccessTypes(initialTypes);
            deptForm.setData(editValues);
            setEditDataId(null);
            setIsDeptDialogOpen(true);
        } else {
            router.visit(`/admin/core/${resourceSlug}/create?duplicate_from=${row.id}${returnParam}`);
        }
    };

    const handleDeptSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
        deptForm.transform((formData) => ({
            ...formData,
            return_url: currentUrl,
        }));

        if (editDataId) {
            deptForm.put(`/admin/core/${resourceSlug}/${editDataId}`, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setIsDeptDialogOpen(false);
                    deptForm.reset();
                },
            });
        } else {
            deptForm.post(`/admin/core/${resourceSlug}`, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setIsDeptDialogOpen(false);
                    deptForm.reset();
                },
            });
        }
    };

    React.useEffect(() => {
        setSelectedRows([]);
        setBulkSelectedFields({});
        setBulkFieldValues({});

        // Auto-apply saved filter from cookie on initial visit
        if (typeof window !== 'undefined') {
            const currentSearch = window.location.search;
            if (!currentSearch || currentSearch === '' || currentSearch === '?') {
                const storageKey = `saved_filter_${resourceSlug}`;
                const raw = getCookie(storageKey) || localStorage.getItem(storageKey);
                if (raw) {
                    try {
                        const saved = JSON.parse(raw);
                        if (saved && typeof saved === 'object' && Object.keys(saved).length > 0) {
                            router.get(`/admin/core/${resourceSlug}`, { ...saved, page: 1 }, { preserveState: true, replace: true });
                        }
                    } catch {
                        // Ignore parse errors
                    }
                }
            }
        }
    }, [resourceSlug]);

    const handleDelete = () => {
        if (!deleteId) return;
        setIsDeleting(true);
        const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
        router.delete(`/admin/core/${resourceSlug}/${deleteId}${currentUrl ? `?return_url=${encodeURIComponent(currentUrl)}` : ''}`, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeleteId(null);
            },
        });
    };

    const handleBulkDelete = () => {
        if (selectedRows.length === 0) return;
        setIsBulkDeleting(true);
        const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
        router.post(
            `/admin/core/${resourceSlug}/bulk-delete`,
            {
                ids: selectedRows.map((r: any) => r.id),
                return_url: currentUrl,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => {
                    setIsBulkDeleting(false);
                    setShowBulkDeleteConfirm(false);
                    setSelectedRows([]);
                },
            },
        );
    };

    const handleQuickBulkToggle = (colName: 'is_used' | 'is_active', active: boolean) => {
        if (selectedRows.length === 0) return;
        setIsBulkDeleting(true);
        const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
        router.post(
            `/admin/core/${resourceSlug}/bulk-update`,
            {
                ids: selectedRows.map((r) => r.id),
                values: { [colName]: active },
                return_url: currentUrl,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => {
                    setIsBulkDeleting(false);
                    setSelectedRows([]);
                },
            },
        );
    };

    const flattenedFields = React.useMemo(() => {
        const getFlattened = (schema: any[]): any[] => {
            let fields: any[] = [];
            schema.forEach((item) => {
                if (item.isGroup && Array.isArray(item.schema)) {
                    fields = [...fields, ...getFlattened(item.schema)];
                } else {
                    fields.push(item);
                }
            });
            return fields;
        };
        return getFlattened(formSchema || []);
    }, [formSchema]);

    const handleBulkSave = () => {
        const valuesToUpdate: Record<string, any> = {};
        let hasSelection = false;
        Object.keys(bulkSelectedFields).forEach((name) => {
            if (bulkSelectedFields[name]) {
                const val = bulkFieldValues[name];
                valuesToUpdate[name] = val !== undefined ? val : '';
                hasSelection = true;
            }
        });

        if (!hasSelection) {
            alert('Silakan pilih minimal satu field yang ingin diubah.');
            return;
        }

        setBulkProcessing(true);
        const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
        router.post(
            `/admin/core/${resourceSlug}/bulk-update`,
            {
                ids: selectedRows.map((r) => r.id),
                values: valuesToUpdate,
                return_url: currentUrl,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setShowBulkEditModal(false);
                    setSelectedRows([]);
                    setBulkSelectedFields({});
                    setBulkFieldValues({});
                    setBulkProcessing(false);
                },
                onError: () => {
                    setBulkProcessing(false);
                },
            },
        );
    };

    const processedData = React.useMemo(() => {
        const rawItems = data?.data || [];
        if (resourceSlug === 'contract-types') {
            return flattenHierarchy(rawItems);
        }
        if (resourceSlug === 'departments') {
            return rawItems.map((item: any) => {
                const lvl = Number(item.idorg_level) || 5;
                const depth = Math.max(0, lvl - 3);
                return {
                    ...item,
                    _depth: depth,
                };
            });
        }
        return rawItems;
    }, [data?.data, resourceSlug]);

    const columnOptions = React.useMemo(() => {
        return (tableSchema || []).map((col: any) => ({
            key: col.name,
            label: col.label,
        }));
    }, [tableSchema]);

    const hasIsUsedCol = React.useMemo(() => (tableSchema || []).some((c: any) => c.name === 'is_used'), [tableSchema]);
    const hasIsActiveCol = React.useMemo(() => (tableSchema || []).some((c: any) => c.name === 'is_active'), [tableSchema]);

    const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const storageKey = `resource_cols_${resourceSlug}`;
                const saved = getCookie(storageKey) || localStorage.getItem(storageKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const validKeys = new Set((tableSchema || []).map((c: any) => c.name));
                        const filtered = parsed.filter((k: string) => validKeys.has(k));
                        if (filtered.length > 0) return filtered;
                    }
                }
            } catch {
                // ignore
            }
        }
        return (tableSchema || []).map((c: any) => c.name);
    });

    const [pinnedColumnKeys, setPinnedColumnKeys] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const storagePinKey = `resource_pinned_${resourceSlug}`;
                const saved = getCookie(storagePinKey) || localStorage.getItem(storagePinKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) {
                        const validKeys = new Set((tableSchema || []).map((c: any) => c.name));
                        return parsed.filter((k: string) => validKeys.has(k));
                    }
                }
            } catch {
                // ignore
            }
        }
        return [];
    });

    React.useEffect(() => {
        try {
            const storageKey = `resource_cols_${resourceSlug}`;
            const saved = getCookie(storageKey) || localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const validKeys = new Set((tableSchema || []).map((c: any) => c.name));
                    const filtered = parsed.filter((k: string) => validKeys.has(k));
                    if (filtered.length > 0) {
                        setVisibleColumnKeys(filtered);
                        return;
                    }
                }
            }
        } catch {
            // ignore
        }
        setVisibleColumnKeys((tableSchema || []).map((c: any) => c.name));
    }, [resourceSlug, tableSchema]);

    React.useEffect(() => {
        try {
            const storagePinKey = `resource_pinned_${resourceSlug}`;
            const saved = getCookie(storagePinKey) || localStorage.getItem(storagePinKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    const validKeys = new Set((tableSchema || []).map((c: any) => c.name));
                    setPinnedColumnKeys(parsed.filter((k: string) => validKeys.has(k)));
                    return;
                }
            }
        } catch {
            // ignore
        }
        setPinnedColumnKeys([]);
    }, [resourceSlug, tableSchema]);

    const filteredTableSchema = React.useMemo(() => {
        return (tableSchema || []).filter((col: any) => visibleColumnKeys.includes(col.name));
    }, [tableSchema, visibleColumnKeys]);

    const COLUMN_WIDTHS: Record<string, number> = {
        nik: 130,
        code: 130,
        name: 200,
        email: 180,
        username: 130,
        org_name: 180,
        department_name: 180,
        division_name: 180,
        jobtitle_name: 180,
        joblevel_name: 150,
        role_name: 130,
        company_name: 200,
        company_group_code: 130,
        company_group_name: 160,
        location_name: 160,
        region_name: 140,
        alias: 120,
        city_name: 140,
        province_name: 140,
        npwp: 160,
        oracle_code: 140,
        is_used: 96,
        is_active: 96,
        contract_type_names: 220,
        role_names: 180,
        division_names: 180,
        department_names: 180,
        users_count: 100,
        show_overview: 140,
        show_overview_contract: 145,
        show_overview_non_contract: 165,
        show_overview_nda: 135,
        show_workload: 120,
        show_master_data: 120,
    };

    let currentPinOffset = 40;
    const pinnedSet = new Set(pinnedColumnKeys);
    const pinnedColsInOrder = filteredTableSchema.filter((c: any) => pinnedSet.has(c.name));
    const lastPinnedKey = pinnedColsInOrder.length > 0 ? pinnedColsInOrder[pinnedColsInOrder.length - 1].name : null;

    const pinOffsetsMap: Record<string, number> = {};
    pinnedColsInOrder.forEach((col: any) => {
        pinOffsetsMap[col.name] = currentPinOffset;
        currentPinOffset += COLUMN_WIDTHS[col.name] || 150;
    });

    const columns = filteredTableSchema.map((col: any) => {
        const isStatusCol = col.type === 'boolean' || col.name === 'is_used' || col.name === 'is_active';
        const isCountCol = col.name.endsWith('_count') || col.name.startsWith('total_');
        const isAlignRight = col.align === 'right' || isStatusCol || isCountCol;
        const isPinned = pinnedSet.has(col.name);
        const pinOffset = isPinned ? pinOffsetsMap[col.name] : undefined;
        const isLastPinned = col.name === lastPinnedKey;

        return {
            header: col.label,
            accessorKey: col.name,
            sortable: col.sortable ?? isStatusCol,
            pinned: isPinned,
            pinOffset,
            isLastPinned,
            width: COLUMN_WIDTHS[col.name],
            align: isAlignRight ? 'right' : col.align || 'left',
            className: isStatusCol
                ? 'w-24 text-right px-2.5 py-1.5 whitespace-nowrap'
                : isCountCol
                  ? 'w-28 text-right px-2.5 py-1.5 whitespace-nowrap'
                  : 'whitespace-nowrap px-3 py-1.5 text-xs',
            cell: (row: any) => {
                let val = col.name.split('.').reduce((acc: any, part: string) => {
                    if (!acc) return undefined;
                    if (acc[part] !== undefined) return acc[part];
                    const snakePart = part.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
                    return acc[snakePart];
                }, row);

                if (val === undefined || val === null || val === '') {
                    if (col.name === 'role_name') val = row.role_relation?.name || row.roleRelation?.name || row.role?.name;
                    else if (col.name === 'contractFilterTemplate.name' || col.name === 'contract_filter_template.name')
                        val = row.contract_filter_template?.name || row.contractFilterTemplate?.name;
                    else if (col.name === 'company_group_code')
                        val = row.company_group_code || row.company_group?.code || row.companyGroup?.code || row.company?.company_group?.code;
                    else if (col.name === 'company_group_name')
                        val = row.company_group_name || row.company_group?.name || row.companyGroup?.name || row.group?.name;
                    else if (col.name === 'region_name') val = row.region?.name || row.region_name;
                    else if (col.name === 'division_name') val = row.division?.name || row.division_name;
                    else if (col.name === 'org_name' || col.name === 'department_name') val = row.org_name || row.department?.name;
                    else if (col.name === 'location_name') val = row.location_name || row.location?.name;
                    else if (col.name === 'company_name') val = row.company_name || row.company?.name;
                    else if (col.name === 'location_group_name') val = row.location_group_name || row.location_group?.name;
                }

                if (col.name === 'name' && (resourceSlug === 'contract-types' || resourceSlug === 'departments')) {
                    const depth = row._depth || 0;
                    return (
                        <div
                            className="flex items-center"
                            style={{
                                paddingLeft: `${depth * 20}px`,
                            }}
                        >
                            {depth > 0 && (
                                <span className="text-text-muted/60 mr-2 flex items-center select-none">
                                    <span className="inline-block h-3.5 w-3.5 border-b-2 border-l-2 border-slate-300 dark:border-zinc-600" />
                                </span>
                            )}
                            <span className="text-text-main text-xs font-semibold whitespace-nowrap">{val || '—'}</span>
                        </div>
                    );
                }

                if (col.name === 'nik' || col.name === 'code' || col.name === 'oracle_code' || col.name === 'npwp') {
                    return <span className="text-text-main font-mono text-xs font-semibold whitespace-nowrap">{val || '—'}</span>;
                }

                if (col.name === 'username') {
                    return <span className="text-text-main font-mono text-xs font-medium whitespace-nowrap">{val ? `@${val}` : '—'}</span>;
                }

                if (col.name === 'email') {
                    return <span className="text-text-muted text-xs whitespace-nowrap">{val || '—'}</span>;
                }

                if (col.name === 'name') {
                    if (resourceSlug === 'dashboard-types') {
                        return (
                            <div className="flex flex-col py-0.5">
                                <span className="text-text-main max-w-[240px] truncate text-xs font-semibold" title={val}>
                                    {val || '—'}
                                </span>
                                {row.description && (
                                    <span className="text-text-desc max-w-[240px] truncate text-[10px]" title={row.description}>
                                        {row.description}
                                    </span>
                                )}
                            </div>
                        );
                    }
                    return <span className="text-text-main text-xs font-semibold whitespace-nowrap">{val || '—'}</span>;
                }

                if (col.name === 'job_level_name' || col.name === 'job_level') {
                    let display = val || '—';
                    if (row.job_level && row.job_level.name) {
                        display = row.job_level.code ? `(${row.job_level.code}) ${row.job_level.name}` : row.job_level.name;
                    }
                    return <span className="text-text-main text-xs whitespace-nowrap">{display}</span>;
                }

                if (col.name.endsWith('_count') || col.name.startsWith('total_')) {
                    const num = Number(val || 0);
                    const linkInfo = num > 0 ? getCountColumnLink(resourceSlug, col.name, row) : null;

                    if (linkInfo) {
                        return (
                            <div className="flex justify-end">
                                <Link
                                    href={linkInfo.url}
                                    onClick={(e) => e.stopPropagation()}
                                    title={linkInfo.tooltip}
                                    className="bg-primary/10 text-primary border-primary/25 hover:bg-primary/25 hover:border-primary/45 dark:bg-primary/20 dark:hover:bg-primary/30 group inline-flex min-w-[34px] cursor-pointer items-center justify-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold shadow-2xs transition-all hover:scale-105 active:scale-95"
                                >
                                    <span>{num.toLocaleString('id-ID')}</span>
                                </Link>
                            </div>
                        );
                    }

                    return (
                        <div className="flex justify-end">
                            <span
                                className={cn(
                                    'inline-flex min-w-[34px] items-center justify-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold shadow-2xs',
                                    num > 0
                                        ? 'bg-primary/10 text-primary border-primary/25 dark:bg-primary/20'
                                        : 'border-slate-200/80 bg-slate-100 text-slate-400 dark:border-zinc-700/80 dark:bg-zinc-800 dark:text-zinc-500',
                                )}
                            >
                                {num.toLocaleString('id-ID')}
                            </span>
                        </div>
                    );
                }

                if (col.type === 'boolean') {
                    const isToggling = updatingRowId === row.id;
                    const isTrue = Boolean(val === true || val === 1 || val === '1' || val === 'true');

                    if (col.name === 'is_used') {
                        return (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    disabled={isToggling}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSingleToggle(row.id, 'is_used', isTrue);
                                    }}
                                    title={`Klik untuk mengubah status sistem (${isTrue ? 'Ya -> Tidak' : 'Tidak -> Ya'})`}
                                    className={cn(
                                        'inline-flex min-w-[50px] cursor-pointer items-center justify-center rounded-md border px-2 py-0.5 text-[10.5px] font-bold tracking-wider shadow-2xs transition-all hover:scale-105 active:scale-95',
                                        isTrue
                                            ? 'bg-primary/15 text-primary border-primary/30 hover:bg-primary/25'
                                            : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700',
                                        isToggling && 'pointer-events-none opacity-50',
                                    )}
                                >
                                    {isToggling ? <RefreshCw className="text-primary h-3 w-3 animate-spin" /> : isTrue ? 'Ya' : 'Tidak'}
                                </button>
                            </div>
                        );
                    }

                    if (col.name === 'is_active') {
                        return (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    disabled={isToggling}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSingleToggle(row.id, 'is_active', isTrue);
                                    }}
                                    title={`Klik untuk mengubah status portal (${isTrue ? 'Aktif -> Nonaktif' : 'Nonaktif -> Aktif'})`}
                                    className={cn(
                                        'inline-flex min-w-[58px] cursor-pointer items-center justify-center rounded-md border px-2 py-0.5 text-[10.5px] font-bold tracking-wider shadow-2xs transition-all hover:scale-105 active:scale-95',
                                        isTrue
                                            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300'
                                            : 'border-rose-500/25 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400',
                                        isToggling && 'pointer-events-none opacity-50',
                                    )}
                                >
                                    {isToggling ? <RefreshCw className="h-3 w-3 animate-spin text-emerald-600" /> : isTrue ? 'Aktif' : 'Nonaktif'}
                                </button>
                            </div>
                        );
                    }

                    return (
                        <div className="flex justify-end">
                            <button
                                type="button"
                                disabled={isToggling}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSingleToggle(row.id, col.name, isTrue);
                                }}
                                title={`Klik untuk mengubah status (${isTrue ? 'True -> False' : 'False -> True'})`}
                                className={cn(
                                    'inline-flex min-w-[54px] cursor-pointer items-center justify-center rounded-md border px-2 py-0.5 text-[10.5px] font-bold tracking-wide shadow-2xs transition-all hover:scale-105 active:scale-95',
                                    isTrue
                                        ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300'
                                        : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700',
                                    isToggling && 'pointer-events-none opacity-50',
                                )}
                            >
                                {isToggling ? <RefreshCw className="h-3 w-3 animate-spin text-emerald-600" /> : isTrue ? 'True' : 'False'}
                            </button>
                        </div>
                    );
                }

                if (col.name === 'holiday_date' && resourceSlug === 'holidays') {
                    const d = parseDateInput(val);
                    if (!d) return <span className="text-text-muted font-mono text-xs">—</span>;
                    const dayName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][d.getDay()];
                    const dayNum = String(d.getDate()).padStart(2, '0');
                    const monthName = MONTH_NAMES[d.getMonth()];
                    const year = d.getFullYear();

                    return (
                        <div className="flex items-center gap-2 py-0.5">
                            <span className="text-text-main font-mono text-xs font-semibold">
                                {dayNum} {monthName} {year}
                            </span>
                            <span className="text-text-muted bg-surface-muted border-surface-border rounded border px-1.5 py-0.5 text-[10px] font-medium">
                                {dayName}
                            </span>
                        </div>
                    );
                }

                return <span className="text-text-main text-xs whitespace-nowrap">{val || '—'}</span>;
            },
        };
    });

    const resourceIcons: Record<string, React.ComponentType<any>> = {
        departments: Building2,
        'company-groups': Layers,
        divisions: GitBranch,
        regions: MapPin,
        companies: Building,
        users: Users,
        vendors: Handshake,
        'contract-types': FileText,
        locations: MapPin,
        'business-units': Layers,
        holidays: Calendar,
    };
    const HeaderIcon = resourceIcons[resourceSlug] || Database;

    const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const renderResourceSubHeader = React.useCallback(
        (row: any, prevRow: any | null) => {
            if (resourceSlug === 'holidays') {
                const currentDate = parseDateInput(row.holiday_date);
                if (!currentDate) return null;

                const currentMonthYear = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
                const prevDate = prevRow ? parseDateInput(prevRow.holiday_date) : null;
                const prevMonthYear = prevDate ? `${prevDate.getFullYear()}-${prevDate.getMonth()}` : null;

                if (currentMonthYear !== prevMonthYear) {
                    const monthName = MONTH_NAMES[currentDate.getMonth()];
                    const year = currentDate.getFullYear();

                    return (
                        <div className="flex items-center gap-2 py-1">
                            <div className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold shadow-2xs">
                                <Calendar size={13} className="text-primary shrink-0" />
                                <span>
                                    {monthName} {year}
                                </span>
                            </div>
                            <div className="from-surface-border h-px flex-1 bg-gradient-to-r to-transparent" />
                        </div>
                    );
                }
                return null;
            }

            if (resourceSlug === 'departments') {
                const currentGroup = row.org_group_name ? String(row.org_group_name).trim() : 'TANPA GROUP';
                const prevGroup = prevRow ? (prevRow.org_group_name ? String(prevRow.org_group_name).trim() : 'TANPA GROUP') : null;

                if (currentGroup !== prevGroup) {
                    return (
                        <div className="flex items-center gap-2.5 py-1">
                            <div className="flex items-center gap-1.5 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-bold tracking-wide text-indigo-700 shadow-2xs dark:text-indigo-300">
                                <LucideIcons.FolderClosed size={13} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
                                <span>{currentGroup}</span>
                            </div>
                            <div className="from-surface-border h-px flex-1 bg-gradient-to-r to-transparent" />
                        </div>
                    );
                }
                return null;
            }

            return null;
        },
        [resourceSlug],
    );

    return (
        <>
            <Head title={title} />
            <MasterPageLayout>
                <FloatingPanel className="flex min-w-0 flex-1 flex-col">
                    <PageTable
                        standalone={false}
                        resourceKey={resourceSlug}
                        title={title}
                        subtitle={`Kelola daftar data master ${title.toLowerCase()} dalam sistem`}
                        icon={HeaderIcon}
                        searchValue={activeFilters.search || ''}
                        onSearchChange={(v) =>
                            router.get(
                                `/admin/core/${resourceSlug}`,
                                { ...activeFilters, search: v, page: 1 },
                                { preserveState: true, replace: true },
                            )
                        }
                        filters={filters}
                        activeFilters={activeFilters}
                        onFilterChange={(keyOrObj, val) => {
                            let nextFilters = { ...activeFilters, page: 1 };
                            if (typeof keyOrObj === 'object') {
                                nextFilters = { ...nextFilters, ...keyOrObj };
                            } else {
                                nextFilters = { ...nextFilters, [keyOrObj]: val };
                            }
                            router.get(`/admin/core/${resourceSlug}`, nextFilters, { preserveState: true, replace: true });
                        }}
                        onResetFilters={() => {
                            const storageKey = `saved_filter_${resourceSlug}`;
                            if (typeof document !== 'undefined') {
                                document.cookie = `${storageKey}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
                                localStorage.removeItem(storageKey);
                            }
                            const clear = Object.keys(activeFilters).reduce((acc, key) => ({ ...acc, [key]: [] }), {});
                            router.get(
                                `/admin/core/${resourceSlug}`,
                                { ...clear, is_used: '', is_active: '', page: 1 },
                                { preserveState: true, replace: true },
                            );
                        }}
                        totalResults={data.total}
                        actions={
                            <div className="flex items-center gap-2">
                                <ColumnVisibilityDropdown
                                    columns={columnOptions}
                                    visibleKeys={visibleColumnKeys}
                                    onChange={setVisibleColumnKeys}
                                    pinnedKeys={pinnedColumnKeys}
                                    onPinnedChange={setPinnedColumnKeys}
                                    storageKey={`resource_cols_${resourceSlug}`}
                                    storagePinKey={`resource_pinned_${resourceSlug}`}
                                />

                                {(hasExport ||
                                    hasImport ||
                                    hasPortalSync ||
                                    [
                                        'regions',
                                        'companies',
                                        'departments',
                                        'company-groups',
                                        'company_groups',
                                        'locations',
                                        'business-units',
                                        'users',
                                        'job-levels',
                                        'job-titles',
                                    ].includes(resourceSlug)) && (
                                    <ExcelActions
                                        exportRoute={hasExport ? `/admin/core/${resourceSlug}/export` : undefined}
                                        importRoute={hasImport ? `/admin/core/${resourceSlug}/import` : undefined}
                                        onSyncPortal={
                                            hasPortalSync ||
                                            [
                                                'regions',
                                                'companies',
                                                'departments',
                                                'company-groups',
                                                'company_groups',
                                                'locations',
                                                'business-units',
                                                'users',
                                                'job-levels',
                                                'job-titles',
                                            ].includes(resourceSlug)
                                                ? () => setShowSyncConfirm(true)
                                                : undefined
                                        }
                                        isSyncingPortal={isSyncing}
                                        label={title}
                                    />
                                )}

                                {resourceSlug === 'contract-sla-configs' && (
                                    <Button
                                        type="button"
                                        variant="white"
                                        className="border-border hover:bg-surface-muted text-primary h-9 gap-1.5 text-xs font-semibold"
                                        onClick={() => setIsSlaSimOpen(true)}
                                    >
                                        <Calculator size={15} className="text-primary" /> Simulasi SLA
                                    </Button>
                                )}

                                {DIALOG_RESOURCES.includes(resourceSlug) ? (
                                    <Button
                                        variant="primary"
                                        className="h-9 gap-2 text-xs font-semibold"
                                        onClick={() => {
                                            setLocalAccessTypes({});
                                            deptForm.setData(initialFormData);
                                            setEditDataId(null);
                                            setIsDeptDialogOpen(true);
                                        }}
                                    >
                                        <Plus size={16} /> Tambah Baru
                                    </Button>
                                ) : resourceSlug !== 'vendors' ? (
                                    <Link
                                        href={`/admin/core/${resourceSlug}/create${typeof window !== 'undefined' && window.location.search ? `?return_url=${encodeURIComponent(window.location.pathname + window.location.search)}` : ''}`}
                                    >
                                        <Button variant="primary" className="h-9 gap-2 text-xs font-semibold">
                                            <Plus size={16} /> Tambah Baru
                                        </Button>
                                    </Link>
                                ) : null}
                            </div>
                        }
                        pagination={{
                            currentPage: data.current_page || 1,
                            lastPage: data.last_page || 1,
                            total: data.total || 0,
                            from: data.from,
                            to: data.to,
                            perPage: data.per_page,
                            onPageChange: (page) => router.get(`/admin/core/${resourceSlug}`, { ...activeFilters, page }, { preserveState: true }),
                            onPerPageChange: (perPage) =>
                                router.get(`/admin/core/${resourceSlug}`, { ...activeFilters, page: 1, per_page: perPage }, { preserveState: true }),
                        }}
                    >
                        <DataTable
                            columns={columns}
                            borderless={true}
                            data={processedData}
                            renderSubHeader={renderResourceSubHeader}
                            sortBy={activeFilters.sort_by}
                            sortDir={activeFilters.sort_dir as 'asc' | 'desc'}
                            onSortChange={(sortBy, sortDir) =>
                                router.get(
                                    `/admin/core/${resourceSlug}`,
                                    { ...activeFilters, sort_by: sortBy, sort_dir: sortDir },
                                    { preserveState: true, replace: true },
                                )
                            }
                            isRowSelectable={() => true}
                            onSelectionChange={(selected: any[]) => setSelectedRows(selected)}
                            selectedRows={selectedRows}
                            bulkActions={(selected: any[]) =>
                                resourceSlug === 'vendors' ? null : (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="primary"
                                            size="sm"
                                            onClick={() => setShowBulkEditModal(true)}
                                            className="h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold shadow-xs"
                                        >
                                            <LucideIcons.Edit2 size={13} /> Ubah ({selected.length})
                                        </Button>

                                        {/* Quick bulk action for is_used (Sistem) */}
                                        {hasIsUsedCol && (
                                            <div className="bg-surface-muted/40 border-surface-border flex items-center gap-1 rounded-lg border p-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickBulkToggle('is_used', true)}
                                                    className="flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition-all hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                                                    title="Set is_used ke Ya (Aktif di Sistem)"
                                                >
                                                    <LucideIcons.CheckCircle2 size={12} className="text-emerald-500" />
                                                    <span>Aktifkan Sistem ({selected.length})</span>
                                                </button>
                                                <div className="bg-surface-border h-3.5 w-px" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickBulkToggle('is_used', false)}
                                                    className="flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-all hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                                                    title="Set is_used ke Tidak (Nonaktif di Sistem)"
                                                >
                                                    <LucideIcons.XCircle size={12} className="text-slate-400" />
                                                    <span>Nonaktifkan Sistem ({selected.length})</span>
                                                </button>
                                            </div>
                                        )}

                                        {/* Quick bulk action for is_active (Portal) */}
                                        {hasIsActiveCol && (
                                            <div className="bg-surface-muted/40 border-surface-border flex items-center gap-1 rounded-lg border p-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickBulkToggle('is_active', true)}
                                                    className="flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold text-sky-700 transition-all hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/40"
                                                    title="Set is_active ke Ya (Aktif di Portal)"
                                                >
                                                    <LucideIcons.CheckCircle2 size={12} className="text-sky-500" />
                                                    <span>Aktifkan Portal ({selected.length})</span>
                                                </button>
                                                <div className="bg-surface-border h-3.5 w-px" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickBulkToggle('is_active', false)}
                                                    className="flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-all hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                                                    title="Set is_active ke Tidak (Nonaktif di Portal)"
                                                >
                                                    <LucideIcons.XCircle size={12} className="text-slate-400" />
                                                    <span>Nonaktifkan Portal ({selected.length})</span>
                                                </button>
                                            </div>
                                        )}

                                        <Button
                                            type="button"
                                            variant="white"
                                            size="sm"
                                            onClick={() => setShowBulkDeleteConfirm(true)}
                                            className="h-8 gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-medium text-rose-600 shadow-xs hover:bg-rose-50 hover:text-rose-700 dark:border-zinc-700"
                                        >
                                            <Trash2 size={13} /> Hapus ({selected.length})
                                        </Button>
                                    </div>
                                )
                            }
                            onRowClick={(row) => handleOpenEdit(row)}
                            rowActions={
                                resourceSlug === 'vendors'
                                    ? undefined
                                    : (row) => (
                                          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                              <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                      <button
                                                          type="button"
                                                          className="text-text-muted hover:text-text-main hover:bg-surface-muted hover:border-surface-border flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-transparent transition-colors focus:outline-none"
                                                          title="Opsi & Aksi"
                                                      >
                                                          <MoreVertical size={15} />
                                                      </button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent
                                                      align="end"
                                                      className="border-surface-border bg-surface-base z-[9999] w-44 rounded-xl p-1 shadow-xl backdrop-blur-xl"
                                                  >
                                                      <DropdownMenuItem
                                                          onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleOpenEdit(row);
                                                          }}
                                                          className="text-text-main hover:text-primary hover:bg-primary/[0.06] flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
                                                      >
                                                          <Edit2 size={13} className="text-primary" />
                                                          <span>Ubah Data</span>
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem
                                                          onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleDuplicate(row);
                                                          }}
                                                          className="text-text-main flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-amber-500/[0.08] hover:text-amber-600"
                                                      >
                                                          <Copy size={13} className="text-amber-500" />
                                                          <span>Duplikat Data</span>
                                                      </DropdownMenuItem>
                                                      <div className="bg-surface-border/40 my-1 h-px" />
                                                      <DropdownMenuItem
                                                          onClick={(e) => {
                                                              e.stopPropagation();
                                                              setDeleteId(row.id);
                                                          }}
                                                          className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                                                      >
                                                          <Trash2 size={13} className="text-rose-500" />
                                                          <span>Hapus Data</span>
                                                      </DropdownMenuItem>
                                                  </DropdownMenuContent>
                                              </DropdownMenu>
                                          </div>
                                      )
                            }
                        />
                    </PageTable>
                </FloatingPanel>
            </MasterPageLayout>

            {/* Single Delete Confirmation Modal */}
            <ConfirmationModal
                open={!!deleteId}
                onClose={() => !isDeleting && setDeleteId(null)}
                onConfirm={handleDelete}
                title={`Hapus Data ${title}`}
                description="Apakah Anda yakin ingin menghapus data ini dari sistem? Data yang dihapus tidak akan dapat diakses kembali."
                confirmText={isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                cancelText={isDeleting ? '' : 'Batal'}
                variant="danger"
                processing={isDeleting}
            />

            {/* Bulk Delete Confirmation Modal */}
            <ConfirmationModal
                open={showBulkDeleteConfirm}
                onClose={() => !isBulkDeleting && setShowBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title={`Hapus ${selectedRows.length} Data ${title}`}
                description={`Apakah Anda yakin ingin menghapus sekaligus ${selectedRows.length} data terpilih? Tindakan ini tidak dapat dibatalkan.`}
                confirmText={isBulkDeleting ? 'Menghapus...' : 'Ya, Hapus Semua'}
                cancelText={isBulkDeleting ? '' : 'Batal'}
                variant="danger"
                processing={isBulkDeleting}
            />

            {/* Portal Sync Confirmation Modal */}
            <ConfirmationModal
                open={showSyncConfirm}
                onClose={() => !isSyncing && setShowSyncConfirm(false)}
                onConfirm={() => {
                    setIsSyncing(true);
                    showProgress('portal_sync', `Sedang menyinkronkan data ${title} dari Portal...`, 40);
                    router.post(
                        `/admin/core/${resourceSlug}/sync-portal`,
                        {
                            is_used_mode: 'keep',
                        },
                        {
                            preserveScroll: true,
                            onFinish: () => {
                                setIsSyncing(false);
                                setShowSyncConfirm(false);
                                hideProgress('portal_sync');
                            },
                        },
                    );
                }}
                title="Sinkronisasi Data Portal"
                description={
                    isSyncing
                        ? `Sedang memproses sinkronisasi data ${title} dari Portal... Mohon tunggu sejenak.`
                        : `Apakah Anda yakin ingin menyinkronkan data master ${title} terbaru dari Portal API?`
                }
                confirmText={isSyncing ? 'Menyinkronkan...' : 'Ya, Sinkronkan Sekarang'}
                cancelText={isSyncing ? '' : 'Batal'}
                variant="info"
                processing={isSyncing}
                className="max-w-md"
                icon={<RefreshCw size={24} className={isSyncing ? 'text-primary animate-spin' : 'text-primary'} />}
            />

            {/* Bulk Edit Modal */}
            <ResourceBulkEditModal
                open={showBulkEditModal}
                onClose={() => setShowBulkEditModal(false)}
                title={title}
                selectedCount={selectedRows.length}
                flattenedFields={flattenedFields}
                bulkSelectedFields={bulkSelectedFields}
                setBulkSelectedFields={setBulkSelectedFields}
                bulkFieldValues={bulkFieldValues}
                setBulkFieldValues={setBulkFieldValues}
                onSave={handleBulkSave}
                processing={bulkProcessing}
            />

            {/* Reusable Form Dialog for fast master CRUD */}
            {DIALOG_RESOURCES.includes(resourceSlug) && (
                <ResourceQuickDialog
                    open={isDeptDialogOpen}
                    onOpenChange={setIsDeptDialogOpen}
                    resourceSlug={resourceSlug}
                    title={title}
                    editDataId={editDataId}
                    formSchema={formSchema}
                    deptForm={deptForm}
                    onSubmit={handleDeptSubmit}
                    localAccessTypes={localAccessTypes}
                    setLocalAccessTypes={setLocalAccessTypes}
                />
            )}

            {resourceSlug === 'contract-sla-configs' && (
                <SlaSimulationModal
                    open={isSlaSimOpen}
                    onOpenChange={setIsSlaSimOpen}
                    slaConfigs={Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []}
                />
            )}
        </>
    );
}
