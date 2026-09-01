import React, { useState } from 'react';
import { Head, router, Link, useForm } from '@inertiajs/react';
import { DataTable } from '@/components/ui/tables/DataTable';
import { Button } from '@/components/ui/buttons/Button';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { MasterPageLayout } from '@/components/ui/navigation/MasterPageLayout';
import { FloatingPanel } from '@/components/ui/navigation/FloatingPanel';
import { Plus, Edit2, Trash2, Eye, Database, Building2, Layers, GitBranch, MapPin, Building, Users, Handshake, FileText, Shield, RefreshCw, MoreVertical } from 'lucide-react';
import LucideIcons from '@/lib/lucide-dynamic';
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

const DIALOG_RESOURCES = ['departments', 'company-groups', 'divisions', 'regions', 'companies', 'roles', 'contract-filter-templates', 'dashboard-types', 'locations', 'business-units'];

export default function ResourceIndex({ resourceSlug, title, tableSchema, formSchema, data, filters, activeFilters = {}, hasExport = false, hasImport = false }: Props) {
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
        if (resourceSlug === 'vendors') {
            router.visit(`/admin/core/${resourceSlug}/${row.id}/edit`);
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
            router.visit(`/admin/core/${resourceSlug}/${row.id}/edit`);
        }
    };

    const handleDeptSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editDataId) {
            deptForm.put(`/admin/core/${resourceSlug}/${editDataId}`, {
                onSuccess: () => {
                    setIsDeptDialogOpen(false);
                    deptForm.reset();
                }
            });
        } else {
            deptForm.post(`/admin/core/${resourceSlug}`, {
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
    }, [resourceSlug]);

    const handleDelete = () => {
        if (!deleteId) return;
        setIsDeleting(true);
        router.delete(`/admin/core/${resourceSlug}/${deleteId}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeleteId(null);
            },
        });
    };

    const handleBulkDelete = () => {
        if (selectedRows.length === 0) return;
        setIsBulkDeleting(true);
        router.post(`/admin/core/${resourceSlug}/bulk-delete`, {
            ids: selectedRows.map((r: any) => r.id)
        }, {
            preserveScroll: true,
            onFinish: () => {
                setIsBulkDeleting(false);
                setShowBulkDeleteConfirm(false);
                setSelectedRows([]);
            }
        });
    };

    // Quick bulk update for is_used toggle
    const handleQuickBulkToggleIsUsed = (active: boolean) => {
        if (selectedRows.length === 0) return;
        setIsBulkDeleting(true); // show loader indicator
        router.post(`/admin/core/${resourceSlug}/bulk-update`, {
            ids: selectedRows.map(r => r.id),
            values: { is_used: active }
        }, {
            preserveScroll: true,
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
        router.post(`/admin/core/${resourceSlug}/bulk-update`, {
            ids: selectedRows.map(r => r.id),
            values: valuesToUpdate
        }, {
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

    // Map schema to DataTable columns
    const columns = tableSchema.map((col: any) => {
        const isStatusCol = col.type === 'boolean' || col.name === 'is_used' || col.name === 'is_active';
        return {
            header: col.label,
            accessorKey: col.name,
            sortable: col.sortable,
            className: isStatusCol ? 'w-20 text-center px-2 py-2 whitespace-nowrap' : undefined,
            cell: (row: any) => {
            const val = col.name.split('.').reduce((acc: any, part: string) => acc && acc[part], row);

            // Render merged username and email column for users resource
            if (resourceSlug === 'users' && (col.name === 'username' || col.name === 'user_identity')) {
                return (
                    <div className="flex flex-col gap-0.5 text-left">
                        <span className="font-semibold text-xs text-text-main">@{row.username || '—'}</span>
                        <span className="text-[11px] text-text-soft font-medium">{row.email || '—'}</span>
                    </div>
                );
            }

            // Render merged role, division, and department column for users resource (3 lines)
            if (resourceSlug === 'users' && (col.name === 'role_unit' || col.name === 'role_relation.name')) {
                const roleName = row.role_relation?.name || row.roleRelation?.name || row.role?.name || '—';
                const divName = row.division?.name;
                const deptName = row.department?.name;

                return (
                    <div className="flex flex-col gap-0.5 text-left">
                        <span className="font-semibold text-xs text-text-main">{roleName}</span>
                        {divName && <span className="text-[11px] text-text-soft font-medium">{divName}</span>}
                        {deptName && <span className="text-[10.5px] text-text-soft/80 font-medium">{deptName}</span>}
                    </div>
                );
            }

            // Render merged company, group, and region column for users resource (3 lines)
            if (resourceSlug === 'users' && (col.name === 'company_entity' || col.name === 'company.name')) {
                const companyName = row.company?.name || '—';
                const groupName = row.company_group?.name || row.companyGroup?.name || row.company?.company_group?.name || row.company?.companyGroup?.name;
                const regionName = row.region?.name;

                return (
                    <div className="flex flex-col gap-0.5 text-left">
                        <span className="font-semibold text-xs text-text-main">{companyName}</span>
                        {groupName && <span className="text-[11px] text-text-soft font-medium">{groupName}</span>}
                        {regionName && <span className="text-[10.5px] text-primary/90 font-medium">{regionName}</span>}
                    </div>
                );
            }

            // Custom render for name column if resource is contract-types (showing tree structure)
            if (col.name === 'name' && resourceSlug === 'contract-types') {
                const depth = row._depth || 0;
                return (
                    <span 
                        style={{ paddingLeft: `${depth * 20}px` }} 
                        className="flex items-center gap-1.5 font-normal text-text-main"
                    >
                        {depth > 0 && (
                            <span className="text-text-main font-mono select-none">
                                └─
                            </span>
                        )}
                        {row.code && (
                            <span className="text-[10px] bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 text-text-main font-normal uppercase tracking-wider">
                                {row.code}
                            </span>
                        )}
                        <span>{val}</span>
                    </span>
                );
            }

            // ponytail: custom render for compact merged user columns
            if (resourceSlug === 'users') {
                if (col.name === 'name') {
                    return (
                        <div className="flex flex-col gap-0.5 text-left py-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-xs text-text-main">{row.name || '—'}</span>
                                {row.nik && (
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono border border-slate-200/60 dark:border-slate-700">
                                        {row.nik}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                                {row.email && <span>{row.email}</span>}
                                {row.username && row.username !== row.nik && (
                                    <span className="text-[10px] text-slate-400">(@{row.username})</span>
                                )}
                            </div>
                        </div>
                    );
                }
                if (col.name === 'jobtitle_name') {
                    const roleName = row.role_relation?.name || row.roleRelation?.name || row.role?.name;
                    return (
                        <div className="flex flex-col gap-0.5 text-left py-0.5">
                            <span className="font-medium text-xs text-text-main">
                                {row.jobtitle_name || '—'}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {row.joblevel_name && (
                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium border border-primary/20">
                                        {row.joblevel_name}
                                    </span>
                                )}
                                {roleName && (
                                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-medium border border-emerald-200 dark:border-emerald-800/40">
                                        {roleName}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                }
                if (col.name === 'company_name') {
                    return (
                        <div className="flex flex-col gap-0.5 text-left py-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-xs text-text-main">
                                    {row.company_name || row.company?.name || '—'}
                                </span>
                                {row.location_name && (
                                    <span className="text-[10px] text-text-muted bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/40 dark:border-slate-700 font-medium">
                                        {row.location_name}
                                    </span>
                                )}
                            </div>
                            {row.org_name && (
                                <span className="text-[11px] text-text-muted">
                                    Org: {row.org_name}
                                </span>
                            )}
                        </div>
                    );
                }
            }

            // ponytail: custom render for compact merged company columns
            if (resourceSlug === 'companies') {
                if (col.name === 'company_identity') {
                    return (
                        <div className="flex flex-col gap-0.5 text-left py-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-xs text-text-main">{row.name || '—'}</span>
                                {row.alias && (
                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium border border-primary/20">
                                        {row.alias}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-text-muted">
                                {row.code && <span className="font-mono text-slate-500 dark:text-slate-400">Kode: {row.code}</span>}
                            </div>
                        </div>
                    );
                }
                if (col.name === 'org_structure') {
                    const groupName = row.company_group_name || row.group?.name;
                    const regionName = row.region_name || row.region?.name;
                    return (
                        <div className="flex flex-col gap-0.5 text-left py-0.5">
                            <span className="font-semibold text-xs text-text-main">
                                {groupName || '—'}
                            </span>
                            <span className="text-[11px] text-text-muted">
                                Region: {regionName || '—'}
                            </span>
                        </div>
                    );
                }
                if (col.name === 'legal_integration') {
                    const npwp = row.npwp;
                    const city = row.city_name;
                    const oracle = row.oracle_code;
                    return (
                        <div className="flex flex-col gap-0.5 text-left py-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap text-xs text-text-main font-medium">
                                {npwp && <span>NPWP: {npwp}</span>}
                                {npwp && city && <span className="text-slate-300 dark:text-slate-700">•</span>}
                                {city && <span className="text-text-muted">{city}</span>}
                                {!npwp && !city && <span>—</span>}
                            </div>
                            {oracle && (
                                <div className="text-[11px] text-text-muted font-mono">
                                    Oracle: {oracle}
                                </div>
                            )}
                        </div>
                    );
                }
            }

            // ponytail: custom render for compact merged location columns
            if (resourceSlug === 'locations') {
                if (col.name === 'location_identity') {
                    return (
                        <div className="flex flex-col gap-0.5 text-left py-0.5">
                            <span className="font-semibold text-xs text-text-main">{row.name || '—'}</span>
                            <div className="flex items-center gap-2 text-[11px] text-text-muted">
                                {row.code && <span className="font-mono text-slate-500 dark:text-slate-400">Kode: {row.code}</span>}
                                {row.code && row.oracle_code && <span className="text-slate-300 dark:text-slate-700">•</span>}
                                {row.oracle_code && <span className="font-mono">Oracle: {row.oracle_code}</span>}
                            </div>
                        </div>
                    );
                }
                if (col.name === 'company_group_name') {
                    const companyGroup = row.company_group_name || row.group?.name;
                    return (
                        <div className="flex flex-col gap-0.5 text-left py-0.5">
                            <span className="font-semibold text-xs text-text-main">
                                {companyGroup || '—'}
                            </span>
                        </div>
                    );
                }
                if (col.name === 'location_group' || col.name === 'region_group') {
                    const locationGroup = row.location_group_name;
                    const locationArea = [row.city_name, row.province_name].filter(Boolean).join(', ');
                    return (
                        <div className="flex flex-col gap-0.5 text-left py-0.5">
                            <span className="font-semibold text-xs text-text-main">
                                {locationGroup || '—'}
                            </span>
                            {locationArea && (
                                <span className="text-[11px] text-text-muted">
                                    {locationArea}
                                </span>
                            )}
                        </div>
                    );
                }
            }

            // ponytail: custom render for compact merged business units columns
            if (resourceSlug === 'business-units') {
                if (col.name === 'bu_identity') {
                    return (
                        <div className="flex flex-col gap-0.5 text-left py-0.5">
                            <span className="font-semibold text-xs text-text-main">{row.name || '—'}</span>
                            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-text-muted">
                                {row.code && <span className="font-mono text-slate-500 dark:text-slate-400">Kode: {row.code}</span>}
                                {row.komoditi_name && (
                                    <>
                                        <span className="text-slate-300 dark:text-slate-700">•</span>
                                        <span>{row.komoditi_name}</span>
                                    </>
                                )}
                                {row.kebun && (
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                        Kebun: {row.kebun}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                }
                if (col.name === 'company_placement') {
                    return (
                        <div className="flex flex-col gap-0.5 text-left py-0.5">
                            <span className="font-semibold text-xs text-text-main">
                                {row.company_name || '—'}
                            </span>
                            <span className="text-[11px] text-text-muted">
                                Lokasi: {row.location_name || '—'}
                            </span>
                        </div>
                    );
                }
                if (col.name === 'org_structure') {
                    return (
                        <div className="flex flex-col gap-0.5 text-left py-0.5">
                            <span className="font-semibold text-xs text-text-main">
                                {row.company_group_name || '—'}
                            </span>
                            <span className="text-[11px] text-text-muted">
                                Region: {row.region_name || '—'}
                            </span>
                        </div>
                    );
                }
            }

            // ponytail: custom render for merged mechanism and template details in contract-types
            if (resourceSlug === 'contract-types') {
                if (col.name === 'f1_details') {
                    if (!row.f1_input_mechanism || row.f1_input_mechanism === 'none') {
                        return <span className="text-text-main">—</span>;
                    }
                    const isManual = row.f1_input_mechanism === 'manual';
                    const mech = isManual ? 'Manual (Form)' : 'Digital (Upload)';
                    const templateName = row.f1_form_template?.name || row.f1FormTemplate?.name;
                    return (
                        <div className="flex flex-col gap-0.5 text-left">
                            <span className="font-normal text-xs text-text-main">{mech}</span>
                            {isManual && (
                                templateName ? (
                                    <span className="text-[10px] text-text-main font-normal">{templateName}</span>
                                ) : (
                                    <span className="text-[10px] text-rose-500 font-normal uppercase tracking-wider">Belum Pilih Template</span>
                                )
                            )}
                        </div>
                    );
                }
                if (col.name === 'f2_details') {
                    if (!row.f2_input_mechanism || row.f2_input_mechanism === 'none') {
                        return <span className="text-text-main">—</span>;
                    }
                    const isManual = row.f2_input_mechanism === 'manual';
                    const mech = isManual ? 'Manual (Form)' : 'Digital (Upload)';
                    const templateName = row.f2_form_template?.name || row.f2FormTemplate?.name;
                    return (
                        <div className="flex flex-col gap-0.5 text-left">
                            <span className="font-normal text-xs text-text-main">{mech}</span>
                            {isManual && (
                                templateName ? (
                                    <span className="text-[10px] text-text-main font-normal">{templateName}</span>
                                ) : (
                                    <span className="text-[10px] text-rose-500 font-normal uppercase tracking-wider">Belum Pilih Template</span>
                                )
                            )}
                        </div>
                    );
                }
                if (col.name === 'agreement_details') {
                    if (!row.contract_input_mechanism || row.contract_input_mechanism === 'none') {
                        return <span className="text-text-main">—</span>;
                    }
                    const isManual = row.contract_input_mechanism === 'manual';
                    const mech = isManual ? 'Manual (Form)' : 'Digital (Upload)';
                    const templateName = row.contract_form_template?.name || row.contractFormTemplate?.name;
                    return (
                        <div className="flex flex-col gap-0.5 text-left">
                            <span className="font-normal text-xs text-text-main">{mech}</span>
                            {isManual && (
                                templateName ? (
                                    <span className="text-[10px] text-text-main font-normal">{templateName}</span>
                                ) : (
                                    <span className="text-[10px] text-rose-500 font-normal uppercase tracking-wider">Belum Pilih Template</span>
                                )
                            )}
                        </div>
                    );
                }
            }

            if (col.name === 'label' && resourceSlug === 'contract-statuses') {
                const IconComp = row.icon && (LucideIcons as any)[row.icon]
                    ? (LucideIcons as any)[row.icon]
                    : null;
                return (
                    <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-normal uppercase tracking-wider shadow-xs border"
                        style={{ 
                            color: row.color || '#ffffff', 
                            backgroundColor: row.bg_color || '#4f46e5',
                            borderColor: `${row.color || '#ffffff'}22`
                        }}
                    >
                        {IconComp && <IconComp className="h-3 w-3 mr-1.5 shrink-0" />}
                        {val}
                    </span>
                );
            }

            if (col.name === 'color' || col.name === 'bg_color' || col.name === 'text_color') {
                const colorVal = val || '#ffffff';
                return (
                    <span className="flex items-center gap-2 font-mono text-xs font-normal">
                        <span 
                            className="h-4.5 w-4.5 rounded-md border border-surface-border/80 shadow-xs shrink-0" 
                            style={{ backgroundColor: colorVal }}
                        />
                        <span>{val || '—'}</span>
                    </span>
                );
            }

            if (col.name.endsWith('_status') && resourceSlug === 'contract-filter-templates') {
                // null = Sesuai Data User, [] = Semua (full access), [...names] = custom list
                if (val === null || val === undefined || val === 'Sesuai Data User') {
                    return (
                        <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200/20 uppercase tracking-wider">
                            Sesuai User
                        </span>
                    );
                }
                if (Array.isArray(val) && val.length === 0) {
                    return (
                        <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                            Semua
                        </span>
                    );
                }
                if (Array.isArray(val) && val.length > 0) {
                    const MAX_SHOW = 2;
                    const visible = val.slice(0, MAX_SHOW);
                    const overflow = val.length - MAX_SHOW;
                    return (
                        <div className="flex flex-wrap gap-1">
                            {visible.map((name: string) => (
                                <span key={name} className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                                    {name}
                                </span>
                            ))}
                            {overflow > 0 && (
                                <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200/20">
                                    +{overflow} lainnya
                                </span>
                            )}
                        </div>
                    );
                }
                // fallback: string (legacy)
                return (
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary border border-primary/20">
                        {val}
                    </span>
                );
            }

            if (col.type === 'boolean') {
                if (col.name === 'is_used') {
                    return (
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-semibold rounded-md border tracking-wider ${val ? 'bg-primary/10 text-primary border-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                            {val ? 'Ya' : 'Tidak'}
                        </span>
                    );
                }
                return (
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-semibold rounded-md border tracking-wider ${val ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                        {val ? 'Aktif' : 'Nonaktif'}
                    </span>
                );
            }
            return val;
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
                        title={title}
                        subtitle={`Kelola daftar data master ${title.toLowerCase()} dalam sistem`}
                        icon={HeaderIcon}
                        searchValue={activeFilters.search || ''}
                        onSearchChange={(v) => router.get(`/admin/core/${resourceSlug}`, { ...activeFilters, search: v, page: 1 }, { preserveState: true, replace: true })}
                        filters={filters}
                        activeFilters={activeFilters}
                        onFilterChange={(key, val) => {
                            const nextFilters = { ...activeFilters, [key]: val, page: 1 };
                            router.get(`/admin/core/${resourceSlug}`, nextFilters, { preserveState: true, replace: true });
                        }}
                        onResetFilters={() => {
                            const clear = Object.keys(activeFilters).reduce((acc, key) => ({ ...acc, [key]: [] }), {});
                            router.get(`/admin/core/${resourceSlug}`, { ...clear, page: 1 }, { preserveState: true, replace: true });
                        }}
                        totalResults={data.total}
                        actions={
                            <div className="flex items-center gap-2">
                                {DIALOG_RESOURCES.includes(resourceSlug) ? (
                                    <Button 
                                        variant="primary" 
                                        className="gap-2"
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
                                    <Link href={`/admin/core/${resourceSlug}/create`}>
                                        <Button variant="primary" className="gap-2">
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
                                    {['regions', 'companies', 'departments', 'company-groups', 'company_groups', 'locations', 'business-units', 'users'].includes(resourceSlug) && (
                                        <div className="flex items-center bg-surface-muted/40 p-0.5 rounded-lg border border-surface-border gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleQuickBulkToggleIsUsed(true)}
                                                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                                                title="Set is_used ke Ya (Aktif di Sistem)"
                                            >
                                                <LucideIcons.CheckCircle2 size={12} className="text-emerald-500" />
                                                <span>Aktifkan Sistem ({selected.length})</span>
                                            </button>
                                            <div className="w-px h-3.5 bg-surface-border" />
                                            <button
                                                type="button"
                                                onClick={() => handleQuickBulkToggleIsUsed(false)}
                                                className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                                                title="Set is_used ke Tidak (Nonaktif di Sistem)"
                                            >
                                                <LucideIcons.XCircle size={12} className="text-slate-400" />
                                                <span>Nonaktifkan Sistem ({selected.length})</span>
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

                {((filters && filters.length > 0) || hasExport || hasImport || ['regions', 'companies', 'departments', 'company-groups', 'company_groups', 'locations', 'business-units', 'users'].includes(resourceSlug)) && (
                    <FloatingPanel padded shrink>
                        <SideFilterCard
                            categories={filters || []}
                            activeFilters={activeFilters}
                            actions={
                                <div className="flex flex-col gap-1.5 w-full">
                                    {['regions', 'companies', 'departments', 'company-groups', 'company_groups', 'locations', 'business-units', 'users'].includes(resourceSlug) && (
                                        <button
                                            type="button"
                                            disabled={isSyncing}
                                            onClick={() => setShowSyncConfirm(true)}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-text-main hover:bg-surface-muted rounded-lg transition-all cursor-pointer disabled:opacity-50"
                                        >
                                            <RefreshCw size={15} className={isSyncing ? 'animate-spin text-primary shrink-0' : 'text-primary shrink-0'} />
                                            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkron Portal'}</span>
                                        </button>
                                    )}

                                    {(hasExport || hasImport) ? (
                                        <ExcelActions
                                            exportRoute={`/admin/core/${resourceSlug}/export`}
                                            importRoute={hasImport ? `/admin/core/${resourceSlug}/import` : undefined}
                                            label={title}
                                            inline={true}
                                        />
                                    ) : null}
                                </div>
                            }
                            onFilterChange={(keyOrObj, val) => {
                                let nextFilters = { ...activeFilters, page: 1 };
                                if (typeof keyOrObj === 'object') {
                                    nextFilters = { ...nextFilters, ...keyOrObj };
                                } else {
                                    nextFilters = { ...nextFilters, [keyOrObj]: val };
                                }
                                router.get(`/admin/core/${resourceSlug}`, nextFilters, { preserveState: true, replace: true });
                            }}
                            onReset={() => {
                                const clear = Object.keys(activeFilters).reduce((acc, key) => ({ ...acc, [key]: [] }), {});
                                router.get(`/admin/core/${resourceSlug}`, { ...clear, page: 1 }, { preserveState: true, replace: true });
                            }}
                            totalResults={data.total}
                            defaultExpanded={false}
                        />
                    </FloatingPanel>
                )}
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
                    router.post(`/admin/core/${resourceSlug}/sync-portal`, {}, {
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
                        : `Apakah Anda yakin ingin mengambil dan memperbarui data ${title} langsung dari API Portal? Data yang sudah ada akan diperbarui secara otomatis.`
                }
                confirmText={isSyncing ? "Menyinkronkan..." : "Ya, Sinkron Sekarang"}
                cancelText={isSyncing ? "" : "Batal"}
                variant="info"
                processing={isSyncing}
                icon={<RefreshCw size={24} className={isSyncing ? "animate-spin text-primary" : "text-primary"} />}
            />

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
                                                    if (!e.target.checked) {
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
                                                    {field.type === 'select' && (
                                                        <select
                                                            value={bulkFieldValues[field.name] ?? ''}
                                                            onChange={(e) => setBulkFieldValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                            className="flex h-10 w-full appearance-none rounded-lg border border-surface-border bg-surface-base pl-3 pr-10 py-2 text-xs font-normal focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                                                        >
                                                            <option value="">Pilih...</option>
                                                            {(Array.isArray(field.options) ? field.options : Object.entries(field.options || {})).map((option: any) => {
                                                                const val = Array.isArray(field.options) ? option : option[0];
                                                                const label = Array.isArray(field.options) ? option : option[1];
                                                                return (
                                                                    <option key={val} value={val}>{label}</option>
                                                                );
                                                            })}
                                                        </select>
                                                    )}
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
                    <DialogContent className={`border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 overflow-hidden rounded-[8px] border p-0 shadow-2xl ${resourceSlug === 'contract-filter-templates' ? 'sm:max-w-[850px]' : 'sm:max-w-[600px]'}`}>
                        <form onSubmit={handleDeptSubmit}>
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
                            <div className="space-y-4 p-6 bg-white dark:bg-zinc-900 max-h-[85vh] overflow-y-auto">
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
                                                <div key={field.label} className="space-y-4 w-full animate-in fade-in duration-200">
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
                                            <div key={field.label} className="space-y-3">
                                                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider border-b pb-1">{field.label}</h4>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {field.schema.map((subField: any) => {
                                                        if (subField.type === 'switch' || subField.type === 'toggle') {
                                                            return (
                                                                <div key={subField.name} className="grid gap-1.5">
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
                                                                <div key={subField.name} className="grid gap-1.5">
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
                                            <div key={field.name} className="grid gap-1.5">
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
                            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-b-[8px]">
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
