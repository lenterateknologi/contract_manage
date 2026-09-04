import React, { useState } from 'react';
import { Head, router, Link, useForm } from '@inertiajs/react';
import { DataTable } from '@/components/ui/tables/DataTable';
import { Button } from '@/components/ui/buttons/Button';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { MasterPageLayout } from '@/components/ui/navigation/MasterPageLayout';
import { FloatingPanel } from '@/components/ui/navigation/FloatingPanel';
import { Plus, Edit2, Trash2, Eye, Database, Building2, Layers, GitBranch, MapPin, Building, Users, Handshake, FileText, Shield, RefreshCw, MoreVertical, Copy, LayoutDashboard } from 'lucide-react';
import LucideIcons from '@/lib/lucide-dynamic';
import { cn } from '@/lib/utils';
import { ConfirmationModal } from '@/components/ui/dialogs/ConfirmationModal';
import { ExcelActions } from '@/components/ui/tables/ExcelActions';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/selection/DropdownMenu';
import { Label } from '@/components/ui/forms/Label';
import { Input } from '@/components/ui/inputs/Input';
import { Textarea } from '@/components/ui/inputs/Textarea';
import { SearchableSelect } from '@/components/ui/selection/SearchableSelect';
import { SearchableMultiSelect } from '@/components/ui/selection/SearchableMultiSelect';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { SideFilterCard } from '@/components/ui/selection/SideFilterCard';
import { useToast } from '@/components/ui/feedback/Toast';
import { ColumnVisibilityDropdown } from '@/components/ui/selection/ColumnVisibilityDropdown';

interface Props {
    resourceSlug: string;
    title: string;
    tableSchema: any[];
    formSchema: any[];
    data: any;
    filters: any[];
    activeFilters?: Record<string, any>;
    hasExport?: boolean;
    hasImport?: boolean;
    hasPortalSync?: boolean;
}

// Recursively builds a flattened tree array with depth indicators
function buildTreeFlattened(items: any[], parentId: string | null = null, depth = 0): any[] {
    const result: any[] = [];
    const filtered = items.filter(item => item.parent_id === parentId);
    
    // Sort alphabetically by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    
    for (const item of filtered) {
        result.push({ ...item, _depth: depth });
        const children = buildTreeFlattened(items, item.id, depth + 1);
        result.push(...children);
    }
    
    // Process orphan nodes (whose parent is not found in the list) at root level
    if (parentId === null) {
        const itemIds = new Set(items.map(i => i.id));
        const orphans = items.filter(item => item.parent_id && !itemIds.has(item.parent_id));
        for (const item of orphans) {
            if (!result.some(r => r.id === item.id)) {
                result.push({ ...item, _depth: 0 });
                const children = buildTreeFlattened(items, item.id, 1);
                result.push(...children);
            }
        }
        
        // Append any remaining items that were missed
        for (const item of items) {
            if (!result.some(r => r.id === item.id)) {
                result.push({ ...item, _depth: 0 });
            }
        }
    }
    
    return result;
}

// Recursively flattens parent nodes containing children arrays
function flattenTreeFromParents(parents: any[], depth = 0): any[] {
    const result: any[] = [];
    for (const parent of parents) {
        result.push({ ...parent, _depth: depth });
        if (parent.children && parent.children.length > 0) {
            const sortedChildren = [...parent.children].sort((a, b) => a.name.localeCompare(b.name));
            result.push(...flattenTreeFromParents(sortedChildren, depth + 1));
        }
    }
    return result;
}

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
}

const DIALOG_RESOURCES = ['departments', 'company-groups', 'divisions', 'regions', 'companies', 'roles', 'contract-filter-templates', 'dashboard-types', 'locations', 'business-units', 'job-levels', 'job-titles'];

export default function ResourceIndex({ resourceSlug, title, tableSchema, formSchema, data, filters, activeFilters = {}, hasExport = false, hasImport = false, hasPortalSync = false }: Props) {
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
    const [syncIsUsedMode, setSyncIsUsedMode] = useState<'keep' | 'set_true' | 'set_false'>('keep');
    const [updatingRowId, setUpdatingRowId] = useState<string | null>(null);

    const handleSingleToggle = (rowId: string, colName: string, currentVal: boolean) => {
        setUpdatingRowId(rowId);
        const currentUrl = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '';
        router.post(`/admin/core/${resourceSlug}/bulk-update`, {
            ids: [rowId],
            values: { [colName]: !currentVal },
            return_url: currentUrl
        }, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => {
                setUpdatingRowId(null);
            }
        });
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
        const currentUrl = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '';
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
            DIMENSIONS.forEach(dim => {
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
        const currentUrl = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '';
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
            DIMENSIONS.forEach(dim => {
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
            setEditDataId(null); // Setting editDataId to null ensures form posts as CREATE new record
            setIsDeptDialogOpen(true);
        } else {
            router.visit(`/admin/core/${resourceSlug}/create?duplicate_from=${row.id}${returnParam}`);
        }
    };

    const handleDeptSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const currentUrl = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '';
        deptForm.transform((data) => ({
            ...data,
            return_url: currentUrl
        }));

        if (editDataId) {
            deptForm.put(`/admin/core/${resourceSlug}/${editDataId}`, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setIsDeptDialogOpen(false);
                    deptForm.reset();
                }
            });
        } else {
            deptForm.post(`/admin/core/${resourceSlug}`, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setIsDeptDialogOpen(false);
                    deptForm.reset();
                }
            });
        }
    };

    React.useEffect(() => {
        setSelectedRows([]);
        setBulkSelectedFields({});
        setBulkFieldValues({});

        // Auto-apply saved filter from cookie on initial visit if no custom filter query present in URL
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
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            }
        }
    }, [resourceSlug]);

    const handleDelete = () => {
        if (!deleteId) return;
        setIsDeleting(true);
        const currentUrl = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '';
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
        const currentUrl = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '';
        router.post(`/admin/core/${resourceSlug}/bulk-delete`, {
            ids: selectedRows.map((r: any) => r.id),
            return_url: currentUrl
        }, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => {
                setIsBulkDeleting(false);
                setShowBulkDeleteConfirm(false);
                setSelectedRows([]);
            }
        });
    };

    // Quick bulk update for is_used or is_active toggle
    const handleQuickBulkToggle = (colName: 'is_used' | 'is_active', active: boolean) => {
        if (selectedRows.length === 0) return;
        setIsBulkDeleting(true); // show loader indicator
        const currentUrl = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '';
        router.post(`/admin/core/${resourceSlug}/bulk-update`, {
            ids: selectedRows.map(r => r.id),
            values: { [colName]: active },
            return_url: currentUrl
        }, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => {
                setIsBulkDeleting(false);
                setSelectedRows([]);
            }
        });
    };

    // Helper to get flattened fields for bulk edit
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

    // Handle bulk edit save
    const handleBulkSave = () => {
        const valuesToUpdate: Record<string, any> = {};
        let hasSelection = false;
        Object.keys(bulkSelectedFields).forEach(name => {
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
        const currentUrl = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '';
        router.post(`/admin/core/${resourceSlug}/bulk-update`, {
            ids: selectedRows.map(r => r.id),
            values: valuesToUpdate,
            return_url: currentUrl
        }, {
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
            }
        });
    };

    // Flatten data if it is contract-types to show a tree list
    const processedData = React.useMemo(() => {
        const rawItems = data?.data || [];
        if (resourceSlug === 'contract-types') {
            const hasChildrenArray = rawItems.some((item: any) => item.children && item.children.length > 0);
            if (hasChildrenArray) {
                return flattenTreeFromParents(rawItems);
            }
            return buildTreeFlattened(rawItems);
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
            } catch {}
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
            } catch {}
        }
        if (resourceSlug === 'users') {
            return ['nik'];
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
        } catch {}
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
        } catch {}
        if (resourceSlug === 'users') {
            setPinnedColumnKeys(['nik']);
        } else {
            setPinnedColumnKeys([]);
        }
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
    };

    // Calculate pinning layout for columns
    let currentPinOffset = 40; // Starts after checkbox column
    const pinnedSet = new Set(pinnedColumnKeys);
    const pinnedColsInOrder = filteredTableSchema.filter((c: any) => pinnedSet.has(c.name));
    const lastPinnedKey = pinnedColsInOrder.length > 0 ? pinnedColsInOrder[pinnedColsInOrder.length - 1].name : null;

    const pinOffsetsMap: Record<string, number> = {};
    pinnedColsInOrder.forEach((col: any) => {
        pinOffsetsMap[col.name] = currentPinOffset;
        currentPinOffset += COLUMN_WIDTHS[col.name] || 150;
    });

    // Map schema to DataTable columns
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
            align: isAlignRight ? 'right' : (col.align || 'left'),
            className: isStatusCol 
                ? 'w-24 text-right px-2.5 py-1.5 whitespace-nowrap' 
                : isCountCol
                ? 'w-28 text-right px-2.5 py-1.5 whitespace-nowrap'
                : 'whitespace-nowrap px-3 py-1.5 text-xs',
            cell: (row: any) => {
                let val = col.name.split('.').reduce((acc: any, part: string) => {
                    if (!acc) return undefined;
                    if (acc[part] !== undefined) return acc[part];
                    // Handle camelCase to snake_case transition (e.g. contractFilterTemplate -> contract_filter_template)
                    const snakePart = part.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                    return acc[snakePart];
                }, row);

                // Dynamic fallbacks for relation attributes
                if (val === undefined || val === null || val === '') {
                    if (col.name === 'role_name') val = row.role_relation?.name || row.roleRelation?.name || row.role?.name;
                    else if (col.name === 'contractFilterTemplate.name' || col.name === 'contract_filter_template.name') val = row.contract_filter_template?.name || row.contractFilterTemplate?.name;
                    else if (col.name === 'company_group_code') val = row.company_group_code || row.company_group?.code || row.companyGroup?.code || row.company?.company_group?.code;
                    else if (col.name === 'company_group_name') val = row.company_group_name || row.company_group?.name || row.companyGroup?.name || row.group?.name;
                    else if (col.name === 'region_name') val = row.region?.name || row.region_name;
                    else if (col.name === 'division_name') val = row.division?.name || row.division_name;
                    else if (col.name === 'org_name' || col.name === 'department_name') val = row.org_name || row.department?.name;
                    else if (col.name === 'location_name') val = row.location_name || row.location?.name;
                    else if (col.name === 'company_name') val = row.company_name || row.company?.name;
                    else if (col.name === 'location_group_name') val = row.location_group_name || row.location_group?.name;
                }

                // Tree structure render for contract types
                if (col.name === 'name' && resourceSlug === 'contract-types') {
                    const depth = row._depth || 0;
                    return (
                        <span 
                            style={{ paddingLeft: `${depth * 20}px` }} 
                            className="flex items-center gap-1.5 font-normal text-text-main whitespace-nowrap"
                        >
                            {depth > 0 && (
                                <span className="text-text-main font-mono select-none">
                                    └─
                                </span>
                            )}
                            {row.code && (
                                <span className="text-[10px] bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 text-text-main font-mono uppercase tracking-wider">
                                    {row.code}
                                </span>
                            )}
                            <span>{val || '—'}</span>
                        </span>
                    );
                }

                // Contract type mechanism & template custom badge render
                if ((col.name === 'f1_details' || col.name === 'f2_details' || col.name === 'agreement_details') && resourceSlug === 'contract-types') {
                    const rawVal = String(val || '');
                    if (!rawVal || rawVal === '—') return <span className="text-slate-400">—</span>;

                    const isManual = rawVal.toLowerCase().includes('manual');
                    const isDisable = rawVal.toLowerCase().includes('disable') || rawVal.toLowerCase().includes('none');

                    const parts = rawVal.split('•').map((p) => p.trim());
                    const mechTitle = parts[0] || rawVal;
                    const templateName = parts[1];

                    return (
                        <div className="flex flex-col gap-1 items-start py-0.5">
                            <span
                                className={cn(
                                    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border whitespace-nowrap',
                                    isManual
                                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                        : isDisable
                                          ? 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800'
                                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
                                )}
                            >
                                <span className={cn('size-1.5 rounded-full', isManual ? 'bg-blue-500' : isDisable ? 'bg-slate-400' : 'bg-emerald-500')} />
                                {mechTitle}
                            </span>
                            {templateName && (
                                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 line-clamp-1 max-w-[220px]" title={templateName}>
                                    {templateName}
                                </span>
                            )}
                        </div>
                    );
                }

                // Role, Dashboard Type, and Template Badges
                if (col.name === 'dashboardType.name' || col.name === 'dashboard_type.name' || col.name === 'dashboard_type_name') {
                    return val ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md leading-tight max-w-[200px] whitespace-normal">
                            <LayoutDashboard size={11} className="text-indigo-500/70 shrink-0" />
                            <span className="line-clamp-2">{val}</span>
                        </span>
                    ) : (
                        <span className="inline-flex items-center text-[10.5px] font-normal text-text-muted bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                            — Belum Diatur —
                        </span>
                    );
                }

                if (col.name === 'contractFilterTemplate.name' || col.name === 'contract_filter_template.name' || col.name === 'contract_filter_template_name') {
                    return val ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md leading-tight max-w-[200px] whitespace-normal">
                            <Layers size={11} className="text-primary/70 shrink-0" />
                            <span className="line-clamp-2">{val}</span>
                        </span>
                    ) : (
                        <span className="inline-flex items-center text-[10.5px] font-normal text-text-muted bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                            — Default (Role Fallback) —
                        </span>
                    );
                }

                // Contract status custom badge
                if (col.name === 'label' && resourceSlug === 'contract-statuses') {
                    const IconComp = row.icon && (LucideIcons as any)[row.icon]
                        ? (LucideIcons as any)[row.icon]
                        : null;
                    return (
                        <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-normal uppercase tracking-wider shadow-xs border whitespace-nowrap"
                            style={{ 
                                color: row.color || '#ffffff', 
                                backgroundColor: row.bg_color || '#4f46e5',
                                borderColor: `${row.color || '#ffffff'}22`
                            }}
                        >
                            {IconComp && <IconComp className="h-3 w-3 mr-1.5 shrink-0" />}
                            {val || '—'}
                        </span>
                    );
                }

                // Contract filter template dimension status badges
                if (resourceSlug === 'contract-filter-templates' && col.name.endsWith('_status')) {
                    if (val === null || val === undefined) {
                        return (
                            <span className="inline-flex items-center text-[10.5px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                                Sesuai User
                            </span>
                        );
                    }
                    if (Array.isArray(val) && val.length === 0) {
                        return (
                            <span className="inline-flex items-center text-[10.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20 whitespace-nowrap">
                                Buka Semua
                            </span>
                        );
                    }
                    if (Array.isArray(val) && val.length > 0) {
                        return (
                            <div className="flex flex-wrap gap-1 items-center max-w-[240px]">
                                {val.slice(0, 2).map((item: string, idx: number) => (
                                    <span key={idx} className="inline-flex items-center text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 whitespace-nowrap truncate max-w-[110px]" title={item}>
                                        {item}
                                    </span>
                                ))}
                                {val.length > 2 && (
                                    <span className="text-[10px] text-text-desc font-bold" title={val.join(', ')}>
                                        +{val.length - 2} lagi
                                    </span>
                                )}
                            </div>
                        );
                    }
                    return <span className="text-text-muted">—</span>;
                }

                // Specific badge formats
                if (col.name === 'role_name') {
                    return val ? (
                        <span className="inline-flex items-center text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-medium border border-emerald-200 dark:border-emerald-800/40 whitespace-nowrap">
                            {val}
                        </span>
                    ) : <span className="text-text-muted">—</span>;
                }

                if (col.name === 'joblevel_name' || col.name === 'alias') {
                    return val ? (
                        <span className="inline-flex items-center text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium border border-primary/20 whitespace-nowrap">
                            {val}
                        </span>
                    ) : <span className="text-text-muted">—</span>;
                }

                if (col.name === 'company_group_code') {
                    return val ? (
                        <span className="inline-flex items-center text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded border border-primary/20 font-mono whitespace-nowrap">
                            {val}
                        </span>
                    ) : <span className="text-text-muted">—</span>;
                }

                if (col.name === 'nik' || col.name === 'code' || col.name === 'oracle_code' || col.name === 'npwp') {
                    return (
                        <span className="font-mono text-xs font-semibold text-text-main whitespace-nowrap">
                            {val || '—'}
                        </span>
                    );
                }

                if (col.name === 'username') {
                    return (
                        <span className="font-mono text-xs font-medium text-text-main whitespace-nowrap">
                            {val ? `@${val}` : '—'}
                        </span>
                    );
                }

                if (col.name === 'email') {
                    return (
                        <span className="text-xs text-text-muted whitespace-nowrap">
                            {val || '—'}
                        </span>
                    );
                }

                if (col.name === 'name') {
                    return (
                        <span className="font-semibold text-xs text-text-main whitespace-nowrap">
                            {val || '—'}
                        </span>
                    );
                }

                if (col.name === 'job_level_name' || col.name === 'job_level') {
                    let display = val || '—';
                    if (row.job_level && row.job_level.name) {
                        display = row.job_level.code ? `(${row.job_level.code}) ${row.job_level.name}` : row.job_level.name;
                    }
                    return (
                        <span className="text-xs text-text-main whitespace-nowrap">
                            {display}
                        </span>
                    );
                }

                if (col.name.endsWith('_count') || col.name.startsWith('total_')) {
                    const num = Number(val || 0);
                    return (
                        <div className="flex justify-end">
                            <span className={cn(
                                "inline-flex items-center justify-center min-w-[34px] px-2 py-0.5 text-[11px] font-bold rounded-md border shadow-2xs font-mono",
                                num > 0
                                    ? "bg-primary/10 text-primary border-primary/25 dark:bg-primary/20"
                                    : "bg-slate-100 text-slate-400 border-slate-200/80 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700/80"
                            )}>
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
                                        "inline-flex items-center justify-center min-w-[50px] px-2 py-0.5 text-[10.5px] font-bold rounded-md border tracking-wider transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95",
                                        isTrue 
                                            ? "bg-primary/15 text-primary border-primary/30 hover:bg-primary/25" 
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700",
                                        isToggling && "opacity-50 pointer-events-none"
                                    )}
                                >
                                    {isToggling ? (
                                        <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                                    ) : (
                                        isTrue ? 'Ya' : 'Tidak'
                                    )}
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
                                        "inline-flex items-center justify-center min-w-[58px] px-2 py-0.5 text-[10.5px] font-bold rounded-md border tracking-wider transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95",
                                        isTrue 
                                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25" 
                                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 hover:bg-rose-500/20",
                                        isToggling && "opacity-50 pointer-events-none"
                                    )}
                                >
                                    {isToggling ? (
                                        <RefreshCw className="h-3 w-3 animate-spin text-emerald-600" />
                                    ) : (
                                        isTrue ? 'Aktif' : 'Nonaktif'
                                    )}
                                </button>
                            </div>
                        );
                    }

                    // For can_create_on_behalf and other boolean flags (True/False toggle button)
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
                                    "inline-flex items-center justify-center min-w-[54px] px-2 py-0.5 text-[10.5px] font-bold rounded-md border tracking-wide transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95",
                                    isTrue
                                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700",
                                    isToggling && "opacity-50 pointer-events-none"
                                )}
                            >
                                {isToggling ? (
                                    <RefreshCw className="h-3 w-3 animate-spin text-emerald-600" />
                                ) : (
                                    isTrue ? 'True' : 'False'
                                )}
                            </button>
                        </div>
                    );
                }

                return (
                    <span className="text-xs text-text-main whitespace-nowrap">
                        {val || '—'}
                    </span>
                );
            }
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
    };
    const HeaderIcon = resourceIcons[resourceSlug] || Database;

    return (
        <>
            <Head title={title} />
            <MasterPageLayout>
                <FloatingPanel className="flex-1 min-w-0 flex flex-col">
                    <PageTable
                        standalone={false}
                        resourceKey={resourceSlug}
                        title={title}
                        subtitle={`Kelola daftar data master ${title.toLowerCase()} dalam sistem`}
                        icon={HeaderIcon}
                        searchValue={activeFilters.search || ''}
                        onSearchChange={(v) => router.get(`/admin/core/${resourceSlug}`, { ...activeFilters, search: v, page: 1 }, { preserveState: true, replace: true })}
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
                            router.get(`/admin/core/${resourceSlug}`, { ...clear, is_used: '', is_active: '', page: 1 }, { preserveState: true, replace: true });
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

                                {(hasExport || hasImport || hasPortalSync || ['regions', 'companies', 'departments', 'company-groups', 'company_groups', 'locations', 'business-units', 'users', 'job-levels', 'job-titles'].includes(resourceSlug)) && (
                                    <ExcelActions
                                        exportRoute={hasExport ? `/admin/core/${resourceSlug}/export` : undefined}
                                        importRoute={hasImport ? `/admin/core/${resourceSlug}/import` : undefined}
                                        onSyncPortal={(hasPortalSync || ['regions', 'companies', 'departments', 'company-groups', 'company_groups', 'locations', 'business-units', 'users', 'job-levels', 'job-titles'].includes(resourceSlug)) ? () => setShowSyncConfirm(true) : undefined}
                                        isSyncingPortal={isSyncing}
                                        label={title}
                                    />
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
                                    <Link href={`/admin/core/${resourceSlug}/create${typeof window !== 'undefined' && window.location.search ? `?return_url=${encodeURIComponent(window.location.pathname + window.location.search)}` : ''}`}>
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
                            onPerPageChange: (perPage) => router.get(`/admin/core/${resourceSlug}`, { ...activeFilters, page: 1, per_page: perPage }, { preserveState: true })
                        }}
                    >
                        <DataTable
                            columns={columns}
                            borderless={true}
                            data={processedData}
                            sortBy={activeFilters.sort_by}
                            sortDir={activeFilters.sort_dir as 'asc' | 'desc'}
                            onSortChange={(sortBy, sortDir) => router.get(`/admin/core/${resourceSlug}`, { ...activeFilters, sort_by: sortBy, sort_dir: sortDir }, { preserveState: true, replace: true })}
                            isRowSelectable={(row) => true}
                            onSelectionChange={(selected: any[]) => setSelectedRows(selected)}
                            selectedRows={selectedRows}
                            bulkActions={(selected: any[]) => resourceSlug === 'vendors' ? null : (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Button
                                        type="button"
                                        variant="primary"
                                        size="sm"
                                        onClick={() => setShowBulkEditModal(true)}
                                        className="h-8 gap-1.5 px-3 text-xs font-semibold rounded-lg shadow-xs"
                                    >
                                        <LucideIcons.Edit2 size={13} /> Ubah ({selected.length})
                                    </Button>

                                    {/* Quick bulk action for is_used (Sistem) */}
                                    {hasIsUsedCol && (
                                        <div className="flex items-center bg-surface-muted/40 p-0.5 rounded-lg border border-surface-border gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleQuickBulkToggle('is_used', true)}
                                                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                                                title="Set is_used ke Ya (Aktif di Sistem)"
                                            >
                                                <LucideIcons.CheckCircle2 size={12} className="text-emerald-500" />
                                                <span>Aktifkan Sistem ({selected.length})</span>
                                            </button>
                                            <div className="w-px h-3.5 bg-surface-border" />
                                            <button
                                                type="button"
                                                onClick={() => handleQuickBulkToggle('is_used', false)}
                                                className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                                                title="Set is_used ke Tidak (Nonaktif di Sistem)"
                                            >
                                                <LucideIcons.XCircle size={12} className="text-slate-400" />
                                                <span>Nonaktifkan Sistem ({selected.length})</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Quick bulk action for is_active (Portal) */}
                                    {hasIsActiveCol && (
                                        <div className="flex items-center bg-surface-muted/40 p-0.5 rounded-lg border border-surface-border gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleQuickBulkToggle('is_active', true)}
                                                className="px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                                                title="Set is_active ke Ya (Aktif di Portal)"
                                            >
                                                <LucideIcons.CheckCircle2 size={12} className="text-sky-500" />
                                                <span>Aktifkan Portal ({selected.length})</span>
                                            </button>
                                            <div className="w-px h-3.5 bg-surface-border" />
                                            <button
                                                type="button"
                                                onClick={() => handleQuickBulkToggle('is_active', false)}
                                                className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all flex items-center gap-1 cursor-pointer"
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
                                        className="h-8 gap-1.5 px-3 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 dark:border-zinc-700 rounded-lg shadow-xs"
                                    >
                                        <Trash2 size={13} /> Hapus ({selected.length})
                                    </Button>
                                </div>
                            )}
                            onRowClick={(row) => handleOpenEdit(row)}
                            rowActions={resourceSlug === 'vendors' ? undefined : (row) => (
                                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                className="h-7 w-7 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-surface-muted rounded-md transition-colors cursor-pointer border border-transparent hover:border-surface-border focus:outline-none"
                                                title="Opsi & Aksi"
                                            >
                                                <MoreVertical size={15} />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="border-surface-border bg-surface-base w-44 rounded-xl p-1 shadow-xl backdrop-blur-xl z-[9999]">
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
                                                className="text-text-main hover:text-amber-600 hover:bg-amber-500/[0.08] flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
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
                                                className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
                                            >
                                                <Trash2 size={13} className="text-rose-500" />
                                                <span>Hapus Data</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}
                        />
                    </PageTable>
                </FloatingPanel>
            </MasterPageLayout>

            {/* ponytail: Single Delete Confirmation Modal */}
            <ConfirmationModal
                open={!!deleteId}
                onClose={() => !isDeleting && setDeleteId(null)}
                onConfirm={handleDelete}
                title={`Hapus Data ${title}`}
                description="Apakah Anda yakin ingin menghapus data ini dari sistem? Data yang dihapus tidak akan dapat diakses kembali."
                confirmText={isDeleting ? "Menghapus..." : "Ya, Hapus"}
                cancelText={isDeleting ? "" : "Batal"}
                variant="danger"
                processing={isDeleting}
            />

            {/* ponytail: Bulk Delete Confirmation Modal */}
            <ConfirmationModal
                open={showBulkDeleteConfirm}
                onClose={() => !isBulkDeleting && setShowBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title={`Hapus ${selectedRows.length} Data ${title}`}
                description={`Apakah Anda yakin ingin menghapus sekaligus ${selectedRows.length} data terpilih? Tindakan ini tidak dapat dibatalkan.`}
                confirmText={isBulkDeleting ? "Menghapus..." : "Ya, Hapus Semua"}
                cancelText={isBulkDeleting ? "" : "Batal"}
                variant="danger"
                processing={isBulkDeleting}
            />

            {/* ponytail: Portal Sync Confirmation Modal */}
            <ConfirmationModal
                open={showSyncConfirm}
                onClose={() => !isSyncing && setShowSyncConfirm(false)}
                onConfirm={() => {
                    setIsSyncing(true);
                    showProgress('portal_sync', `Sedang menyinkronkan data ${title} dari Portal...`, 40);
                    router.post(`/admin/core/${resourceSlug}/sync-portal`, {
                        is_used_mode: syncIsUsedMode,
                    }, {
                        preserveScroll: true,
                        onFinish: () => {
                            setIsSyncing(false);
                            setShowSyncConfirm(false);
                            hideProgress('portal_sync');
                        },
                    });
                }}
                title="Sinkronisasi Data Portal"
                description={
                    isSyncing
                        ? `Sedang memproses sinkronisasi data ${title} dari Portal... Mohon tunggu sejenak.`
                        : `Pilih perlakuan status "Is Used" untuk data yang disinkronkan:`
                }
                confirmText={isSyncing ? "Menyinkronkan..." : "Ya, Sinkron Sekarang"}
                cancelText={isSyncing ? "" : "Batal"}
                variant="info"
                processing={isSyncing}
                className="max-w-md"
                icon={<RefreshCw size={24} className={isSyncing ? "animate-spin text-primary" : "text-primary"} />}
            >
                {!isSyncing && (
                    <div className="mt-4 text-left space-y-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3.5 border border-slate-200/60 dark:border-slate-700/50">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                            Opsi Status Is Used
                        </label>
                        <div
                            onClick={() => setSyncIsUsedMode('keep')}
                            className={cn(
                                "flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer border transition-all",
                                syncIsUsedMode === 'keep'
                                    ? "bg-primary/10 border-primary text-slate-900 dark:text-slate-100"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                            )}
                        >
                            <input
                                type="radio"
                                name="syncIsUsedMode"
                                checked={syncIsUsedMode === 'keep'}
                                onChange={() => setSyncIsUsedMode('keep')}
                                className="mt-0.5 text-primary focus:ring-primary h-3.5 w-3.5"
                            />
                            <div>
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Pertahankan Nilai Saat Ini (Default)
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                                    Data lama tetap memakai status is_used yang ada. Data baru otomatis bernilai Tidak (False).
                                </div>
                            </div>
                        </div>

                        <div
                            onClick={() => setSyncIsUsedMode('set_true')}
                            className={cn(
                                "flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer border transition-all",
                                syncIsUsedMode === 'set_true'
                                    ? "bg-primary/10 border-primary text-slate-900 dark:text-slate-100"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                            )}
                        >
                            <input
                                type="radio"
                                name="syncIsUsedMode"
                                checked={syncIsUsedMode === 'set_true'}
                                onChange={() => setSyncIsUsedMode('set_true')}
                                className="mt-0.5 text-primary focus:ring-primary h-3.5 w-3.5"
                            />
                            <div>
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Setel Semua ke Is Used = Ya (True)
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                                    Semua data yang disinkronkan akan ditandai aktif digunakan (Is Used = True).
                                </div>
                            </div>
                        </div>

                        <div
                            onClick={() => setSyncIsUsedMode('set_false')}
                            className={cn(
                                "flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer border transition-all",
                                syncIsUsedMode === 'set_false'
                                    ? "bg-primary/10 border-primary text-slate-900 dark:text-slate-100"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                            )}
                        >
                            <input
                                type="radio"
                                name="syncIsUsedMode"
                                checked={syncIsUsedMode === 'set_false'}
                                onChange={() => setSyncIsUsedMode('set_false')}
                                className="mt-0.5 text-primary focus:ring-primary h-3.5 w-3.5"
                            />
                            <div>
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Setel Semua ke Is Used = Tidak (False)
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                                    Semua data yang disinkronkan akan disetel tidak digunakan (Is Used = False).
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </ConfirmationModal>

            {/* ponytail: Bulk Edit Modal */}
            {showBulkEditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative mx-auto my-auto bg-white dark:bg-slate-900 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-slate-900 dark:text-slate-100 text-base font-normal tracking-tight">
                                    Ubah Massal Data {title}
                                </h3>
                                <p className="text-text-main text-xs font-normal mt-0.5">
                                    Mengubah {selectedRows.length} data terpilih sekaligus. Centang field yang ingin diubah.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowBulkEditModal(false)}
                                className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-text-main hover:text-primary transition-all"
                            >
                                <LucideIcons.X size={16} />
                            </button>
                        </div>

                        {/* Fields Form */}
                        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
                            {flattenedFields.map((field) => {
                                // Don't bulk edit primary keys or password fields or descriptions to avoid mistakes
                                if (field.name === 'id' || field.name === 'code' || field.name === 'password' || field.name === 'description') return null;

                                const isFieldChecked = !!bulkSelectedFields[field.name];

                                return (
                                    <div key={field.name} className="flex gap-4 items-start p-3 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/20 dark:bg-slate-800/10">
                                        <div className="pt-1">
                                            <input
                                                type="checkbox"
                                                checked={isFieldChecked}
                                                onChange={(e) => {
                                                    setBulkSelectedFields(prev => ({ ...prev, [field.name]: e.target.checked }));
                                                    if (e.target.checked) {
                                                        if (field.type === 'switch' || field.type === 'toggle') {
                                                            setBulkFieldValues(prev => ({ ...prev, [field.name]: prev[field.name] ?? true }));
                                                        }
                                                    } else {
                                                        setBulkFieldValues(prev => ({ ...prev, [field.name]: undefined }));
                                                    }
                                                }}
                                                className="h-4 w-4 rounded-sm border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                                            <label className="text-[11px] font-normal text-text-main uppercase tracking-wider">
                                                {field.label}
                                            </label>
                                            {isFieldChecked ? (
                                                <div className="w-full">
                                                    {field.type === 'select' && (() => {
                                                        let selectOptions: { value: string; label: string }[] = [];
                                                        if (field.options) {
                                                            if (Array.isArray(field.options)) {
                                                                selectOptions = field.options.map((opt: any) => ({
                                                                    value: typeof opt === 'object' && opt !== null ? String(opt.value ?? opt.id) : String(opt),
                                                                    label: typeof opt === 'object' && opt !== null ? String(opt.label ?? opt.name) : String(opt),
                                                                }));
                                                            } else {
                                                                selectOptions = Object.entries(field.options).map(([val, label]) => ({
                                                                    value: String(val),
                                                                    label: String(label),
                                                                }));
                                                            }
                                                        }
                                                        return (
                                                            <SearchableSelect
                                                                value={bulkFieldValues[field.name] !== undefined ? String(bulkFieldValues[field.name]) : ''}
                                                                onValueChange={(val) => setBulkFieldValues(prev => ({ ...prev, [field.name]: val }))}
                                                                options={selectOptions}
                                                                placeholder={`Pilih ${field.label}...`}
                                                                searchPlaceholder={`Cari ${field.label.toLowerCase()}...`}
                                                            />
                                                        );
                                                    })()}
                                                    {field.type === 'switch' && (
                                                        <div className="flex items-center gap-3 h-10">
                                                            <button
                                                                type="button"
                                                                role="switch"
                                                                aria-checked={!!bulkFieldValues[field.name]}
                                                                onClick={() => setBulkFieldValues(prev => ({ ...prev, [field.name]: !prev[field.name] }))}
                                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 outline-hidden ${
                                                                    bulkFieldValues[field.name] ? 'bg-primary dark:bg-white' : 'bg-slate-200 dark:bg-slate-800'
                                                                }`}
                                                            >
                                                                <span
                                                                    className={`pointer-events-none block h-4 w-4 rounded-full shadow-lg transition-transform duration-300 ring-0 ${
                                                                        bulkFieldValues[field.name] ? 'translate-x-6 bg-white dark:bg-primary' : 'translate-x-1 bg-white dark:bg-white/50'
                                                                    }`}
                                                                />
                                                            </button>
                                                            <span className="text-xs font-medium text-text-main">
                                                                {bulkFieldValues[field.name] ? 'Ya (Aktif)' : 'Tidak (Nonaktif)'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {field.type === 'text' && (
                                                        <input
                                                            type="text"
                                                            value={bulkFieldValues[field.name] ?? ''}
                                                            onChange={(e) => setBulkFieldValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                            className="flex h-10 w-full rounded-lg border border-surface-border bg-surface-base px-3 py-2 text-xs font-normal focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary"
                                                            placeholder={`Masukkan ${field.label}...`}
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] italic text-text-main">Centang kotak di samping untuk mengubah field ini massal.</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={() => setShowBulkEditModal(false)}
                                disabled={bulkProcessing}
                                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs font-normal text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleBulkSave}
                                disabled={bulkProcessing}
                                className="flex-1 rounded-xl px-4 py-2.5 text-xs font-normal text-white transition-all bg-primary hover:bg-primary/95 disabled:opacity-50 shadow-md flex items-center justify-center gap-1.5"
                            >
                                {bulkProcessing && <LucideIcons.Loader2 size={12} className="animate-spin" />}
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reusable Form Dialog */}
            {DIALOG_RESOURCES.includes(resourceSlug) && (
                <Dialog open={isDeptDialogOpen} onOpenChange={setIsDeptDialogOpen}>
                    <DialogContent className={`border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 overflow-hidden rounded-[8px] border p-0 shadow-2xl flex flex-col ${resourceSlug === 'contract-filter-templates' ? 'sm:max-w-[920px] min-h-[580px]' : 'sm:max-w-[780px] min-h-[460px]'}`}>
                        <form onSubmit={handleDeptSubmit} className="flex flex-col flex-1">
                            <div className="px-6 py-4 border-b border-primary/20 dark:border-zinc-700/80 bg-primary dark:bg-zinc-800/90 text-white dark:text-zinc-200 flex items-center justify-between rounded-t-[8px]">
                                <div className="flex items-center gap-3 z-10 pr-10">
                                    <div className="bg-white/20 text-white border border-white/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30 flex h-9 w-9 items-center justify-center rounded-lg">
                                        <Shield size={18} />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-sm font-bold tracking-tight text-white dark:text-zinc-100">
                                            {editDataId ? `Ubah ${title}` : `Tambah ${title}`}
                                        </DialogTitle>
                                        <DialogDescription className="text-white/80 dark:text-zinc-400 text-xs font-medium mt-0.5">
                                            {editDataId ? `Ubah informasi ${title.toLowerCase()} Anda` : `Buat data ${title.toLowerCase()} baru`}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-white dark:bg-zinc-900 flex-1 max-h-[75vh] min-h-[340px] pb-16 overflow-y-auto">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {formSchema.map((field) => {
                                    if (field.isGroup) {
                                        if (field.label === 'Konfigurasi Filter Kontrak') {
                                            const DIMENSIONS = [
                                                { key: 'company_group', label: 'Grup Perusahaan (Holding)', toggleName: 'can_change_company_group', allowedName: 'allowed_company_groups' },
                                                { key: 'region', label: 'Wilayah (Region)', toggleName: 'can_change_region', allowedName: 'allowed_regions' },
                                                { key: 'company', label: 'Perusahaan (Company)', toggleName: 'can_change_company', allowedName: 'allowed_companies' },
                                                { key: 'division', label: 'Divisi', toggleName: 'can_change_division', allowedName: 'allowed_divisions' },
                                                { key: 'department', label: 'Departemen', toggleName: 'can_change_department', allowedName: 'allowed_departments' },
                                            ];

                                            const getFormattedOptions = (fieldOptions: any) => {
                                                if (!fieldOptions) return [];
                                                if (Array.isArray(fieldOptions)) {
                                                    return fieldOptions.map(opt => ({ value: String(opt), label: String(opt) }));
                                                }
                                                return Object.entries(fieldOptions).map(([k, v]) => ({ value: String(k), label: String(v) }));
                                            };

                                            const nameField = field.schema.find((s: any) => s.name === 'name');

                                            return (
                                                <div key={field.label} className="col-span-full space-y-4 w-full animate-in fade-in duration-200">
                                                    {nameField && (
                                                        <div className="grid gap-1.5">
                                                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{nameField.label}</Label>
                                                            <Input
                                                                type="text"
                                                                required={nameField.required}
                                                                className="border-border bg-background focus:ring-primary h-10 rounded-lg text-xs font-normal"
                                                                placeholder={nameField.placeholder || `Masukkan ${nameField.label}...`}
                                                                value={deptForm.data.name ?? ''}
                                                                onChange={(e) => deptForm.setData('name', e.target.value)}
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800 pt-2">
                                                        <Shield size={14} className="text-primary mr-1" />
                                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                                            Pengaturan Dimensi Organisasi
                                                        </h3>
                                                    </div>

                                                    <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                                                        {DIMENSIONS.map(dim => {
                                                            const dimField = field.schema.find((s: any) => s.name === dim.allowedName);
                                                            if (!dimField) return null;
                                                            
                                                            const isAllowedToChange = deptForm.data[dim.toggleName] === true || deptForm.data[dim.toggleName] === 1 || String(deptForm.data[dim.toggleName]) === 'true';
                                                            const currentValues = deptForm.data[dim.allowedName] || [];
                                                             
                                                            const accessType = localAccessTypes[dim.key] || (isAllowedToChange ? (currentValues.length > 0 ? 'custom' : 'full_access') : 'user_data');

                                                            return (
                                                                <div key={dim.key} className="grid grid-cols-[180px_160px_1fr] items-center gap-4 py-2.5 first:pt-0 last:pb-0">
                                                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{dim.label}</label>
                                                                    
                                                                    <div>
                                                                        <select
                                                                            value={accessType}
                                                                            onChange={(e) => {
                                                                                const type = e.target.value;
                                                                                setLocalAccessTypes(prev => ({
                                                                                    ...prev,
                                                                                    [dim.key]: type
                                                                                }));
                                                                                if (type === 'user_data') {
                                                                                    deptForm.setData((prev: any) => ({
                                                                                        ...prev,
                                                                                        [dim.toggleName]: false,
                                                                                        [dim.allowedName]: []
                                                                                    }));
                                                                                } else if (type === 'full_access') {
                                                                                    deptForm.setData((prev: any) => ({
                                                                                        ...prev,
                                                                                        [dim.toggleName]: true,
                                                                                        [dim.allowedName]: []
                                                                                    }));
                                                                                } else if (type === 'custom') {
                                                                                    deptForm.setData((prev: any) => ({
                                                                                        ...prev,
                                                                                        [dim.toggleName]: true,
                                                                                        [dim.allowedName]: []
                                                                                    }));
                                                                                }
                                                                            }}
                                                                            className="flex h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
                                                                        >
                                                                            <option value="user_data">Sesuai User</option>
                                                                            <option value="full_access">Buka Semua</option>
                                                                            <option value="custom">Pilih Data</option>
                                                                        </select>
                                                                    </div>
                                                                    
                                                                    {accessType === 'custom' ? (
                                                                        <div>
                                                                            <SearchableMultiSelect
                                                                                values={currentValues}
                                                                                onValuesChange={(vals) => {
                                                                                    deptForm.setData(dim.allowedName as any, vals);
                                                                                }}
                                                                                options={getFormattedOptions(dimField.options)}
                                                                                placeholder={`Pilih ${dim.label}...`}
                                                                                disabled={false}
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="opacity-50 pointer-events-none">
                                                                            <SearchableMultiSelect
                                                                                values={[]}
                                                                                onValuesChange={() => {}}
                                                                                options={[]}
                                                                                placeholder={accessType === 'user_data' ? 'Filter Terkunci' : 'Seluruh Data Diizinkan'}
                                                                                disabled={true}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={field.label} className="col-span-full space-y-3">
                                                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider border-b pb-1">{field.label}</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {field.schema.map((subField: any) => {
                                                        const isFullWidth = subField.type === 'textarea';
                                                        if (subField.type === 'switch' || subField.type === 'toggle') {
                                                            return (
                                                                <div key={subField.name} className={cn("grid gap-1.5", isFullWidth && "col-span-full")}>
                                                                    <Label className="text-xs font-medium text-foreground">{subField.label}</Label>
                                                                    <div className="border-border bg-muted/40 flex h-10 items-center gap-2.5 rounded-lg border px-3">
                                                                        <Checkbox
                                                                            id={`dept_${subField.name}_check`}
                                                                            checked={!!deptForm.data[subField.name]}
                                                                            onCheckedChange={(checked) => deptForm.setData(subField.name as any, !!checked)}
                                                                        />
                                                                        <Label htmlFor={`dept_${subField.name}_check`} className="cursor-pointer text-xs font-medium text-muted-foreground">
                                                                            {deptForm.data[subField.name] ? 'Aktif' : 'Nonaktif'}
                                                                        </Label>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        if (subField.type === 'select') {
                                                            const rawOptions = Array.isArray(subField.options) 
                                                                ? subField.options.map((opt: any) => ({ value: String(opt), label: String(opt) }))
                                                                : Object.entries(subField.options || {}).map(([val, label]) => ({ value: String(val), label: String(label) }));

                                                            return (
                                                                <div key={subField.name} className={cn("grid gap-1.5", isFullWidth && "col-span-full")}>
                                                                    <Label className="text-xs font-medium text-foreground">{subField.label}</Label>
                                                                    <SearchableSelect
                                                                        value={deptForm.data[subField.name] ? String(deptForm.data[subField.name]) : ''}
                                                                        onValueChange={(val) => deptForm.setData(subField.name as any, val)}
                                                                        options={rawOptions}
                                                                        placeholder={subField.placeholder || `Pilih ${subField.label}...`}
                                                                        allowClear={!subField.required}
                                                                    />
                                                                </div>
                                                            );
                                                        }

                                                        if (subField.type === 'textarea') {
                                                            return (
                                                                <div key={subField.name} className="col-span-full grid gap-1.5">
                                                                    <Label className="text-xs font-medium text-foreground">{subField.label}</Label>
                                                                    <Textarea
                                                                        required={subField.required}
                                                                        className="border-border bg-background focus:ring-primary h-20 resize-none rounded-lg text-xs leading-relaxed font-normal"
                                                                        placeholder={subField.placeholder || `Masukkan ${subField.label}...`}
                                                                        value={deptForm.data[subField.name] ?? ''}
                                                                        onChange={(e) => deptForm.setData(subField.name as any, e.target.value)}
                                                                    />
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <div key={subField.name} className="grid gap-1.5">
                                                                <Label className="text-xs font-medium text-foreground">{subField.label}</Label>
                                                                <Input
                                                                    type={subField.type || 'text'}
                                                                    required={subField.required}
                                                                    className="border-border bg-background focus:ring-primary h-10 rounded-lg text-xs font-normal"
                                                                    value={deptForm.data[subField.name] ?? ''}
                                                                    onChange={(e) => deptForm.setData(subField.name as any, e.target.value)}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (field.type === 'switch' || field.type === 'toggle') {
                                        const isUsedField = field.name === 'is_used';
                                        const isChecked = !!deptForm.data[field.name];
                                        return (
                                            <div key={field.name} className="grid gap-1.5">
                                                <Label className="text-xs font-medium text-foreground">{field.label}</Label>
                                                <div className="border-border bg-muted/40 flex h-10 items-center gap-2.5 rounded-lg border px-3">
                                                    <Checkbox
                                                        id={`dept_${field.name}_check`}
                                                        checked={isChecked}
                                                        onCheckedChange={(checked) => deptForm.setData(field.name as any, !!checked)}
                                                    />
                                                    <Label htmlFor={`dept_${field.name}_check`} className="cursor-pointer text-xs font-medium text-muted-foreground">
                                                        {isUsedField ? (isChecked ? 'Ya (Digunakan)' : 'Tidak (Tidak Digunakan)') : (isChecked ? 'Aktif' : 'Nonaktif')}
                                                    </Label>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (field.type === 'textarea') {
                                        return (
                                            <div key={field.name} className="col-span-full grid gap-1.5">
                                                <Label className="text-xs font-medium text-foreground">{field.label}</Label>
                                                <Textarea
                                                    required={field.required}
                                                    className="border-border bg-background focus:ring-primary h-20 resize-none rounded-lg text-xs leading-relaxed font-normal"
                                                    placeholder={field.placeholder || `Masukkan ${field.label}...`}
                                                    value={deptForm.data[field.name] ?? ''}
                                                    onChange={(e) => deptForm.setData(field.name as any, e.target.value)}
                                                />
                                            </div>
                                        );
                                    }

                                    if (field.type === 'select') {
                                        const rawOptions = Array.isArray(field.options) 
                                            ? field.options.map((opt: any) => ({ value: String(opt), label: String(opt) }))
                                            : Object.entries(field.options || {}).map(([val, label]) => ({ value: String(val), label: String(label) }));

                                        return (
                                            <div key={field.name} className="grid gap-1.5">
                                                <Label className="text-xs font-medium text-foreground">{field.label}</Label>
                                                <SearchableSelect
                                                    value={deptForm.data[field.name] ? String(deptForm.data[field.name]) : ''}
                                                    onValueChange={(val) => deptForm.setData(field.name as any, val)}
                                                    options={rawOptions}
                                                    placeholder={field.placeholder || `Pilih ${field.label}...`}
                                                    allowClear={!field.required}
                                                />
                                            </div>
                                        );
                                    }

                                    // Default (text/number/etc.)
                                    return (
                                        <div key={field.name} className="grid gap-1.5">
                                            <Label className="text-xs font-medium text-foreground">{field.label}</Label>
                                            <Input
                                                type={field.type || 'text'}
                                                required={field.required}
                                                className="border-border bg-background focus:ring-primary h-10 rounded-lg text-xs font-normal"
                                                placeholder={field.placeholder || `Masukkan ${field.label}...`}
                                                value={deptForm.data[field.name] ?? ''}
                                                onChange={(e) => deptForm.setData(field.name as any, e.target.value)}
                                            />
                                        </div>
                                    );
                                })}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-b-[8px] mt-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-9 rounded-lg px-4 text-xs font-medium border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200"
                                    onClick={() => setIsDeptDialogOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="h-9 rounded-lg px-5 text-xs font-bold shadow-xs"
                                    disabled={deptForm.processing}
                                >
                                    {editDataId ? 'Simpan' : 'Tambah'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
