import { Button } from '@/components/ui/buttons/Button';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { useToast } from '@/components/ui/feedback/Toast';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    CheckCircle2,
    CheckSquare,
    Database,
    Download,
    FileJson,
    FileSpreadsheet,
    FileText,
    GitBranch,
    Layers,
    Loader2,
    MapPin,
    Network,
    RefreshCw,
    ShieldCheck,
    Upload,
    Users,
} from 'lucide-react';
import React, { useRef, useState } from 'react';

interface Counts {
    company_groups: number;
    regions: number;
    companies: number;
    departments: number;
    divisions?: number;
    contract_statuses: number;
    contract_types: number;
    workflows: number;
    contracts?: number;
    roles: number;
    modules?: number;
    access_mappings: number;
    navigation_mappings: number;
    form_templates: number;
    form_fields: number;
    users?: number;
}

interface Props {
    readonly counts?: Counts;
}

export function MasterDataSync({ counts }: Readonly<Props>) {
    const { showToast } = useToast();
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeCounts = counts ?? {
        company_groups: 0,
        regions: 0,
        companies: 0,
        departments: 0,
        divisions: 0,
        contract_statuses: 0,
        contract_types: 0,
        workflows: 0,
        contracts: 0,
        roles: 0,
        access_mappings: 0,
        navigation_mappings: 0,
        form_templates: 0,
        form_fields: 0,
        users: 0,
    };

    const [selectedEntities, setSelectedEntities] = useState<string[]>([]);

    const groupedEntities = [
        {
            groupName: 'Struktur Organisasi & Korporasi',
            items: [
                { id: 'company_groups', label: 'Holding / Group', count: activeCounts.company_groups, icon: Layers, desc: 'Struktur korporasi utama' },
                { id: 'regions', label: 'Regional', count: activeCounts.regions, icon: MapPin, desc: 'Wilayah administrasi operasional' },
                { id: 'companies', label: 'Perusahaan PT', count: activeCounts.companies, icon: Building2, desc: 'Entitas hukum terdaftar (Bergantung pada Group & Region)' },
                { id: 'departments', label: 'Unit / Departemen', count: activeCounts.departments, icon: Network, desc: 'Unit kerja operasional (Bergantung pada Perusahaan)' },
                { id: 'divisions', label: 'Divisi', count: activeCounts.divisions ?? 0, icon: Users, desc: 'Sub-unit kerja spesifik (Bergantung pada Departemen)' },
            ]
        },
        {
            groupName: 'Konfigurasi Alur & Kategori Kontrak',
            items: [
                { id: 'contract_statuses', label: 'Status Alur', count: activeCounts.contract_statuses, icon: CheckSquare, desc: 'Status siklus hidup kontrak' },
                { id: 'contract_types', label: 'Tipe Kategori Kontrak', count: activeCounts.contract_types, icon: FileSpreadsheet, desc: 'Definisi kategori kontrak (Hierarki Parent-Child)' },
                { id: 'workflows', label: 'Alur Kerja (Workflows)', count: activeCounts.workflows, icon: GitBranch, desc: 'Definisi tahapan persetujuan/approval' },
                { id: 'form_templates', label: 'Custom Formulir (F1 & F2)', count: activeCounts.form_templates, icon: FileJson, desc: 'Templat dan field dinamis untuk input formulir' },
            ]
        },
        {
            groupName: 'Hak Akses & Pengguna',
            items: [
                { id: 'roles', label: 'Peran (Roles)', count: activeCounts.roles, icon: ShieldCheck, desc: 'Definisi jabatan & wewenang sistem' },
                { id: 'access_mappings', label: 'Hak Akses & Menu', count: activeCounts.access_mappings + activeCounts.navigation_mappings, icon: ShieldCheck, desc: 'Otorisasi modul dan struktur menu navigasi per peran' },
                { id: 'users', label: 'Pengguna (Users)', count: activeCounts.users ?? 0, icon: Users, desc: 'Daftar akun pengguna aktif dan helpdesk' },
            ]
        },
        {
            groupName: 'Data Transaksional',
            items: [
                { id: 'contracts', label: 'Transaksi Kontrak', count: activeCounts.contracts ?? 0, icon: FileText, desc: 'Kontrak, riwayat persetujuan, attachment, & versi dokumen' },
            ]
        }
    ];

    const allEntityIds = groupedEntities.flatMap(g => g.items.map(i => i.id));

    const toggleEntity = (id: string) => {
        setSelectedEntities((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
    };

    const toggleAll = () => {
        if (selectedEntities.length === allEntityIds.length) {
            setSelectedEntities([]);
        } else {
            setSelectedEntities(allEntityIds);
        }
    };

    const handleExport = () => {
        if (selectedEntities.length === 0) {
            showToast('Pilih setidaknya satu entitas untuk diekspor', 'danger');
            return;
        }

        // Expand combined entities
        const expandedEntities = [...selectedEntities];
        if (selectedEntities.includes('access_mappings')) {
            if (!expandedEntities.includes('navigation_mappings')) expandedEntities.push('navigation_mappings');
        }
        if (selectedEntities.includes('form_templates')) {
            if (!expandedEntities.includes('form_fields')) expandedEntities.push('form_fields');
        }

        const queryParams = new URLSearchParams({
            entities: expandedEntities.join(','),
        }).toString();

        window.location.href = `${route('admin.master-data-sync.export')}?${queryParams}`;
        showToast(`Mengekspor data master terpilih`, 'success');
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const processFile = (selectedFile: File) => {
        if (selectedFile.type !== 'application/json' && !selectedFile.name.endsWith('.json')) {
            setError('Hanya berkas berformat .json yang diperbolehkan.');
            setFile(null);
            return;
        }
        setError(null);
        setFile(selectedFile);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const handleImport = () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        const formData = new FormData();
        formData.append('file', file);

        router.post(route('admin.master-data-sync.import'), formData, {
            forceFormData: true,
            onSuccess: () => {
                showToast('Data master berhasil disinkronkan', 'success');
                setFile(null);
                setLoading(false);
            },
            onError: (errors: any) => {
                const msg = errors.error ?? 'Gagal mengimpor data master. Periksa format berkas JSON Anda.';
                setError(msg);
                showToast(msg, 'danger');
                setLoading(false);
            },
        });
    };

    const handleCleanData = () => {
        if (selectedEntities.length === 0) {
            showToast('Pilih setidaknya satu entitas untuk dibersihkan', 'danger');
            return;
        }

        if (
            !window.confirm(
                `Apakah Anda yakin ingin menghapus data dari ${selectedEntities.length} entitas terpilih? Tindakan ini akan menghapus data tersebut secara permanen dan tidak dapat dibatalkan.`,
            )
        ) {
            return;
        }

        // Expand combined entities
        const expandedEntities = [...selectedEntities];
        if (selectedEntities.includes('access_mappings')) {
            if (!expandedEntities.includes('navigation_mappings')) expandedEntities.push('navigation_mappings');
        }
        if (selectedEntities.includes('form_templates')) {
            if (!expandedEntities.includes('form_fields')) expandedEntities.push('form_fields');
        }

        setLoading(true);
        setError(null);
        router.post(
            route('admin.master-data-sync.clean'),
            { entities: expandedEntities },
            {
                onSuccess: () => {
                    showToast('Entitas data terpilih berhasil dibersihkan', 'success');
                    setSelectedEntities([]);
                    setLoading(false);
                },
                onError: (errors: any) => {
                    const msg = errors.error ?? 'Gagal membersihkan data terpilih.';
                    setError(msg);
                    showToast(msg, 'danger');
                    setLoading(false);
                },
            },
        );
    };

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-6 select-none">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm backdrop-blur-sm">
                        <Database size={18} />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-text-main text-base font-semibold tracking-tight uppercase italic">Sync & Control Center</h1>
                        <p className="text-text-desc text-[10px] font-medium  uppercase">
                            Manajemen migrasi dan granular export-import data master
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 px-5 select-none lg:grid-cols-12">
                {/* Left: Entity Table */}
                <div className="lg:col-span-8">
                    <div className="overflow-hidden rounded-2xl bg-surface-base/10">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-surface-muted/20 border-surface-border border-b">
                                    <th className="w-12 px-4 py-3.5 text-center">
                                        <Checkbox
                                            className="border-surface-border h-4 w-4 rounded"
                                            checked={selectedEntities.length === allEntityIds.length}
                                            onCheckedChange={toggleAll}
                                        />
                                    </th>
                                    <th className="text-text-desc px-4 py-3.5 text-[11px] font-medium  uppercase">Entitas Data</th>
                                    <th className="text-text-desc px-4 py-3.5 text-center text-[11px] font-medium  uppercase">
                                        Volume
                                    </th>
                                    <th className="text-text-desc px-4 py-3.5 text-[11px] font-medium  uppercase">Deskripsi & Dependensi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-surface-border/30 divide-y">
                                {groupedEntities.map((group) => (
                                    <React.Fragment key={group.groupName}>
                                        <tr className="bg-surface-muted/10 border-surface-border border-y">
                                            <td colSpan={4} className="px-4 py-2 text-[10px] font-bold text-text-desc uppercase tracking-wider">
                                                {group.groupName}
                                            </td>
                                        </tr>
                                        {group.items.map((item) => (
                                            <tr
                                                key={item.id}
                                                onClick={() => toggleEntity(item.id)}
                                                className={cn(
                                                    'hover:bg-surface-muted/30 cursor-pointer transition-colors',
                                                    selectedEntities.includes(item.id) && 'bg-primary/[0.03]',
                                                )}
                                            >
                                                <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox
                                                        className="border-surface-border h-4 w-4 rounded"
                                                        checked={selectedEntities.includes(item.id)}
                                                        onCheckedChange={() => toggleEntity(item.id)}
                                                    />
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <item.icon size={14} className="text-primary opacity-60" />
                                                        <span className="text-text-main text-sm font-medium">{item.label}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <span className="bg-surface-muted text-text-main rounded-lg px-2.5 py-1 font-mono text-[10px] font-semibold">
                                                        {item.count}
                                                    </span>
                                                </td>
                                                <td className="text-text-desc px-4 py-3.5 text-xs font-medium italic">{item.desc}</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>


                {/* Right: Actions */}
                <div className="flex flex-col gap-6 lg:col-span-4">
                    {/* Export Card */}
                    <div className="rounded-2xl bg-surface-base/10 p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-text-main text-[11px] font-semibold  uppercase">Export Configuration</h3>
                            <span className="bg-primary/10 text-primary rounded-lg px-2 py-0.5 text-[10px] font-semibold">
                                {selectedEntities.length} Terpilih
                            </span>
                        </div>
                        <p className="text-text-desc mb-6 text-[11px] leading-relaxed font-medium">
                            Pilih entitas di tabel samping untuk disertakan dalam berkas ekspor JSON.
                        </p>
                        <Button
                            onClick={handleExport}
                            disabled={selectedEntities.length === 0}
                            className="w-full"
                            variant="primary"
                        >
                            <Download size={14} className="mr-2" />
                            EXPORT DATA TERPILIH
                        </Button>
                    </div>

                    {/* Import Card */}
                    <div className="rounded-2xl bg-surface-base/10 p-6">
                        <h3 className="text-text-main mb-4 text-[11px] font-semibold  uppercase">Quick Import</h3>
                        <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                'relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-8 transition-all duration-200 border-surface-border hover:bg-surface-muted/20',
                                dragActive && 'border-primary bg-primary/5',
                            )}
                        >
                            <input ref={fileInputRef} type="file" accept=".json" onChange={handleChange} className="hidden" disabled={loading} />
                            <div className="bg-surface-muted/60 border border-surface-border mb-2 rounded-xl p-2.5">
                                {file ? <FileJson size={20} className="text-primary" /> : <Upload size={20} className="text-text-soft" />}
                            </div>
                            <p className="text-text-main line-clamp-1 text-[11px] font-semibold">{file ? file.name : 'Drop file JSON di sini'}</p>
                        </div>

                        {file && (
                            <div className="mt-4 flex flex-col gap-3">
                                <div className="bg-success/5 border border-success/20 text-success flex items-center gap-2 rounded-xl p-3 text-[10px] font-semibold">
                                    <CheckCircle2 size={12} /> Berkas siap disinkronkan
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="white" onClick={() => setFile(null)} className="flex-1">
                                        RESET
                                    </Button>
                                    <Button onClick={handleImport} disabled={loading} className="flex-[2]" variant="primary">
                                        {loading ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} className="mr-2" />}
                                        SYNC NOW
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Danger Zone: Clean Data Master Card */}
                    <div className="rounded-2xl bg-danger/[0.02] p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={16} className="text-danger" />
                                <h3 className="text-danger text-[11px] font-semibold  uppercase">Danger Zone</h3>
                            </div>
                            <span className="bg-danger/10 text-danger rounded-lg px-2 py-0.5 text-[10px] font-semibold">
                                {selectedEntities.length} Terpilih
                            </span>
                        </div>
                        <p className="text-text-desc mb-6 text-[11px] leading-relaxed font-medium">
                            Bersihkan data dari entitas yang dicentang pada tabel di samping secara permanen dari database. Tindakan ini tidak dapat
                            dibatalkan.
                        </p>
                        <Button
                            onClick={handleCleanData}
                            disabled={loading || selectedEntities.length === 0}
                            variant="destructive"
                            className="w-full"
                        >
                            {loading ? <Loader2 className="animate-spin" size={14} /> : <AlertTriangle size={14} className="mr-2" />}
                            CLEAN DATA TERPILIH
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

declare let route: any;
