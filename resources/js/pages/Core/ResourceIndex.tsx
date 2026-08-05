import React, { useState } from 'react';
import { Head, router, Link, useForm } from '@inertiajs/react';
import { DataTable } from '@/components/ui/tables/DataTable';
import { Button } from '@/components/ui/buttons/Button';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { Plus, Edit2, Trash2, Eye, Database, Building2, Layers, GitBranch, MapPin, Building, Users, Handshake, FileText, Shield } from 'lucide-react';
import LucideIcons from '@/lib/lucide-dynamic';
import { ConfirmationModal } from '@/components/ui/dialogs/ConfirmationModal';
import { ExcelActions } from '@/components/ui/tables/ExcelActions';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { Label } from '@/components/ui/forms/Label';
import { Input } from '@/components/ui/inputs/Input';
import { Textarea } from '@/components/ui/inputs/Textarea';
import { SearchableSelect } from '@/components/ui/selection/SearchableSelect';
import { SearchableMultiSelect } from '@/components/ui/selection/SearchableMultiSelect';
import { Checkbox } from '@/components/ui/selection/Checkbox';

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

const DIALOG_RESOURCES = ['departments', 'company-groups', 'divisions', 'regions', 'companies', 'roles', 'contract-filter-templates', 'dashboard-types'];

export default function ResourceIndex({ resourceSlug, title, tableSchema, formSchema, data, filters, activeFilters = {}, hasExport = false, hasImport = false }: Props) {
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [selectedRows, setSelectedRows] = useState<any[]>([]);
    const [showBulkEditModal, setShowBulkEditModal] = useState(false);
    const [bulkSelectedFields, setBulkSelectedFields] = useState<Record<string, boolean>>({});
    const [bulkFieldValues, setBulkFieldValues] = useState<Record<string, any>>({});
    const [bulkProcessing, setBulkProcessing] = useState(false);

    const [isDeptDialogOpen, setIsDeptDialogOpen] = useState(false);
    const [editDataId, setEditDataId] = useState<string | null>(null);
    const [localAccessTypes, setLocalAccessTypes] = useState<Record<string, string>>({});

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
        router.delete(`/admin/core/${resourceSlug}/${deleteId}`, {
            onSuccess: () => setDeleteId(null),
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
                valuesToUpdate[name] = bulkFieldValues[name] ?? '';
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
    const columns = tableSchema.map((col: any) => ({
        header: col.label,
        accessorKey: col.name,
        sortable: col.sortable,
        cell: (row: any) => {
            const val = col.name.split('.').reduce((acc: any, part: string) => acc && acc[part], row);

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
                                    <span className="text-[10px] text-rose-500 font-normal uppercase tracking-wider">⚠️ Belum Pilih Template</span>
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
                                    <span className="text-[10px] text-rose-500 font-normal uppercase tracking-wider">⚠️ Belum Pilih Template</span>
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
                                    <span className="text-[10px] text-rose-500 font-normal uppercase tracking-wider">⚠️ Belum Pilih Template</span>
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
                return (
                    <span className={`px-2 py-1 text-[10px] font-normal uppercase rounded-full ${val ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {val ? 'Aktif' : 'Nonaktif'}
                    </span>
                );
            }
            return val;
        }
    }));

    const resourceIcons: Record<string, React.ComponentType<any>> = {
        departments: Building2,
        'company-groups': Layers,
        divisions: GitBranch,
        regions: MapPin,
        companies: Building,
        users: Users,
        vendors: Handshake,
        'contract-types': FileText,
    };
    const HeaderIcon = resourceIcons[resourceSlug] || Database;

    return (
        <>
            <Head title={title} />
            <PageTable
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
                        {(hasExport || hasImport) && (
                            <ExcelActions
                                exportRoute={`/admin/core/${resourceSlug}/export`}
                                importRoute={`/admin/core/${resourceSlug}/import`}
                                label={title}
                            />
                        )}
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
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="white"
                                size="sm"
                                onClick={() => {
                                    if (confirm(`Hapus ${selected.length} data terpilih? Tindakan ini tidak dapat dibatalkan.`)) {
                                        router.post(`/admin/core/${resourceSlug}/bulk-delete`, {
                                            ids: selected.map((r: any) => r.id)
                                        }, {
                                            onSuccess: () => setSelectedRows([])
                                        });
                                    }
                                }}
                                className="text-xs py-1.5 px-3 h-8 hover:bg-rose-50 hover:border-rose-200 text-rose-500 rounded-xl flex items-center gap-1.5 font-normal uppercase tracking-wider bg-white border border-surface-border shadow-sm animate-in fade-in"
                            >
                                <Trash2 size={13} /> Hapus Terpilih
                            </Button>
                            <Button
                                type="button"
                                variant="white"
                                size="sm"
                                onClick={() => setShowBulkEditModal(true)}
                                className="text-xs py-1.5 px-3 h-8 hover:bg-slate-50 hover:border-slate-300 text-text-main rounded-xl flex items-center gap-1.5 font-normal uppercase tracking-wider bg-white border border-surface-border shadow-sm animate-in fade-in"
                            >
                                <LucideIcons.Edit2 size={13} /> Ubah Massal ({selected.length})
                            </Button>
                        </div>
                    )}
                    rowActions={(row) => (
                        <div className="flex items-center justify-end gap-2">
                            {resourceSlug === 'vendors' ? (
                                <Link href={`/admin/core/${resourceSlug}/${row.id}/edit`}>
                                    <Button variant="white" size="sm" className="h-8 gap-1.5 px-3 text-[11px] font-normal uppercase tracking-wider">
                                        <Eye size={13} className="text-primary" />
                                        Lihat Detail
                                    </Button>
                                </Link>
                            ) : DIALOG_RESOURCES.includes(resourceSlug) ? (
                                <Button 
                                    variant="white" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => {
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
                                    }}
                                >
                                    <Edit2 size={14} className="text-text-main" />
                                </Button>
                            ) : (
                                <Link href={`/admin/core/${resourceSlug}/${row.id}/edit`}>
                                    <Button variant="white" size="icon" className="h-8 w-8">
                                        <Edit2 size={14} className="text-text-main" />
                                    </Button>
                                </Link>
                            )}
                            {resourceSlug !== 'vendors' && (
                                <Button variant="white" size="icon" className="h-8 w-8 hover:bg-rose-50 hover:border-rose-200" onClick={() => setDeleteId(row.id)}>
                                    <Trash2 size={14} className="text-rose-500" />
                                </Button>
                            )}
                        </div>
                    )}
                />
            </PageTable>

            <ConfirmationModal
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Hapus Data"
                description="Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan."
                confirmText="Ya, Hapus"
                cancelText="Batal"
                variant="danger"
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
                                                        <div className="flex items-center h-10">
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
                    <DialogContent className={`border-border bg-card text-card-foreground overflow-hidden rounded-2xl border p-0 shadow-xl ${resourceSlug === 'contract-filter-templates' ? 'sm:max-w-[850px]' : 'sm:max-w-[600px]'}`}>
                        <form onSubmit={handleDeptSubmit}>
                            <div className="px-6 pt-6 pb-4 flex flex-col gap-1 border-b border-border/40">
                                <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                                    {editDataId ? `Ubah ${title}` : `Tambah ${title}`}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    {editDataId ? `Ubah informasi ${title.toLowerCase()} Anda` : `Buat data ${title.toLowerCase()} baru`}
                                </DialogDescription>
                            </div>
                            <div className="space-y-4 p-6 max-h-[85vh] overflow-y-auto">
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
                                        return (
                                            <div key={field.name} className="grid gap-1.5">
                                                <Label className="text-xs font-medium text-foreground">{field.label}</Label>
                                                <div className="border-border bg-muted/40 flex h-10 items-center gap-2.5 rounded-lg border px-3">
                                                    <Checkbox
                                                        id={`dept_${field.name}_check`}
                                                        checked={!!deptForm.data[field.name]}
                                                        onCheckedChange={(checked) => deptForm.setData(field.name as any, !!checked)}
                                                    />
                                                    <Label htmlFor={`dept_${field.name}_check`} className="cursor-pointer text-xs font-medium text-muted-foreground">
                                                        {deptForm.data[field.name] ? 'Aktif' : 'Nonaktif'}
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
                            <div className="flex justify-end gap-2 px-6 pb-6 border-t border-border/40 pt-4 bg-muted/20">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-9 rounded-lg px-4 text-xs font-medium"
                                    onClick={() => setIsDeptDialogOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="h-9 rounded-lg px-5 text-xs font-medium shadow-sm"
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
