import { Button } from '@/components/ui/base/Button';
import { useToast } from '@/components/contracts/Toast';
import { router } from '@inertiajs/react';
import {
    Download,
    Upload,
    Database,
    RefreshCw,
    FileJson,
    AlertTriangle,
    Layers,
    MapPin,
    Building2,
    Network,
    CheckSquare,
    FileSpreadsheet,
    Info,
    CheckCircle2
} from 'lucide-react';
import React, { useRef, useState } from 'react';

interface Counts {
    company_groups: number;
    regions: number;
    companies: number;
    departments: number;
    contract_statuses: number;
    contract_types: number;
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
        contract_statuses: 0,
        contract_types: 0,
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

    const handleExport = () => {
        window.location.href = route('admin.master-data-sync.export');
        showToast('Berkas ekspor sedang diunduh', 'success');
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
                setError(errors.error ?? 'Gagal mengimpor data master. Silakan periksa format berkas JSON Anda.');
                setLoading(false);
            },
        });
    };

    const stats = [
        {
            label: 'Holding / Group',
            count: activeCounts.company_groups,
            desc: 'Grup korporasi utama',
            icon: Layers,
        },
        {
            label: 'Regional',
            count: activeCounts.regions,
            desc: 'Wilayah administrasi',
            icon: MapPin,
        },
        {
            label: 'Perusahaan PT',
            count: activeCounts.companies,
            desc: 'Entitas hukum terdaftar',
            icon: Building2,
        },
        {
            label: 'Unit / Departemen',
            count: activeCounts.departments,
            desc: 'Divisi operasional internal',
            icon: Network,
        },
        {
            label: 'Status Alur',
            count: activeCounts.contract_statuses,
            desc: 'Status siklus hidup kontrak',
            icon: CheckSquare,
        },
        {
            label: 'Tipe Kategori',
            count: activeCounts.contract_types,
            desc: 'Templat & alur persetujuan',
            icon: FileSpreadsheet,
        },
    ];

    return (
        <div className="bg-card/40 border-border/60 animate-in fade-in m-5 rounded-2xl border p-6 shadow-sm backdrop-blur-sm duration-200 select-none dark:border-slate-800/60 dark:bg-slate-900/20">
            {/* Header */}
            <div className="border-border/60 mb-6 flex items-center justify-between border-b pb-4 dark:border-slate-800/60">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold shadow-sm backdrop-blur-sm dark:bg-slate-800 dark:text-slate-200">
                        <Database size={18} />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-foreground text-base font-bold tracking-tight">Ekspor Impor Database Master</h1>
                        <p className="text-muted-foreground text-xs font-medium">Sinkronisasi data master antar lingkungan (staging, dev, production)</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6 mb-8">
                {stats.map((item) => (
                    <div
                        key={item.label}
                        className="border border-border/60 bg-muted/20 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-xs dark:border-slate-800/60 dark:bg-slate-900/40"
                    >
                        <div className="flex items-start justify-between">
                            <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">{item.label}</span>
                            <item.icon size={16} className="text-muted-foreground/60" />
                        </div>
                        <div className="mt-3">
                            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{item.count}</span>
                            <span className="mt-0.5 block text-[9px] font-medium text-muted-foreground uppercase leading-tight">
                                {item.desc}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Export Column */}
                <div className="border-border/60 bg-muted/10 flex flex-col justify-between rounded-xl border p-6 dark:border-slate-800/60 dark:bg-slate-900/30 lg:col-span-5">
                    <div>
                        <div className="mb-4 flex items-center gap-3">
                            <div className="bg-muted/60 text-foreground flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 dark:bg-slate-800 dark:text-slate-200">
                                <Download size={15} />
                            </div>
                            <h3 className="text-foreground text-sm font-bold uppercase tracking-wide">
                                Ekspor Master Data
                            </h3>
                        </div>

                        <p className="text-muted-foreground mb-4 text-xs leading-relaxed font-medium">
                            Unduh seluruh konfigurasi data master aktif ke dalam satu berkas JSON terstruktur.
                            Berkas ekspor ini mencakup semua relasi di antara entitas (PT, Departemen, Status Kontrak)
                            sehingga dapat disinkronkan langsung ke lingkungan lain.
                        </p>

                        <div className="bg-muted/40 border-border/60 flex items-start gap-2.5 rounded-xl border p-3.5 text-[10px] font-medium text-muted-foreground dark:border-slate-800/60">
                            <Info size={14} className="shrink-0 text-primary mt-0.5" />
                            <p className="leading-normal">
                                Format ekspor data ini menggunakan Kunci Alami (Natural Keys) yang fleksibel sehingga aman
                                digunakan tanpa memedulikan perbedaan ID UUID antar sistem database.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Button
                            onClick={handleExport}
                            className="w-full h-10 rounded-xl font-semibold shadow-sm text-xs"
                            variant="primary"
                        >
                            <Download size={14} className="mr-2" />
                            Unduh Berkas JSON Master
                        </Button>
                    </div>
                </div>

                {/* Import Column */}
                <div className="border-border/60 bg-muted/10 rounded-xl border p-6 dark:border-slate-800/60 dark:bg-slate-900/30 lg:col-span-7">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="bg-muted/60 text-foreground flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 dark:bg-slate-800 dark:text-slate-200">
                            <Upload size={15} />
                        </div>
                        <h3 className="text-foreground text-sm font-bold uppercase tracking-wide">
                            Impor & Sinkronisasi Data
                        </h3>
                    </div>

                    {/* Drag and Drop Zone */}
                    <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 cursor-pointer ${
                            dragActive
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-muted-foreground/50 hover:bg-muted/10 dark:border-slate-800'
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleChange}
                            className="hidden"
                            disabled={loading}
                        />

                        <div className="bg-muted/60 text-foreground mb-3 rounded-lg p-2.5 border border-border/60 dark:bg-slate-800 dark:text-slate-200">
                            {file ? <FileJson size={18} /> : <Upload size={18} />}
                        </div>

                        <p className="text-foreground mb-0.5 text-xs font-bold uppercase tracking-wide">
                            {file ? file.name : 'Seret & letakkan berkas JSON master data di sini'}
                        </p>
                        <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                            {file ? `Ukuran: ${(file.size / 1024).toFixed(2)} KB` : 'atau klik untuk memilih berkas'}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-rose-500/5 border-rose-500/25 text-rose-600 dark:text-rose-400 mt-4 flex items-start gap-2.5 rounded-xl border p-3.5 text-[10px] font-medium">
                            <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-500" />
                            <p className="leading-normal">{error}</p>
                        </div>
                    )}

                    {!file && !error && (
                        <div className="bg-amber-500/5 border-amber-500/25 text-amber-600 dark:text-amber-400 mt-4 flex items-start gap-2.5 rounded-xl border p-3.5 text-[10px] font-medium">
                            <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-500" />
                            <p className="leading-normal">
                                PERINGATAN: Sinkronisasi akan menimpa data yang memiliki kode unik sama. Pastikan data relasi
                                departemen dan PT pada file ekspor Anda sudah lengkap.
                            </p>
                        </div>
                    )}

                    {file && !error && (
                        <div className="bg-emerald-500/5 border-emerald-500/25 text-emerald-600 dark:text-emerald-400 mt-4 flex items-start gap-2.5 rounded-xl border p-3.5 text-[10px] font-medium">
                            <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-500" />
                            <p className="leading-normal">
                                Berkas siap diimpor. Silakan klik tombol di bawah ini untuk memulai pemrosesan database.
                            </p>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                        {file && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setFile(null);
                                    setError(null);
                                }}
                                disabled={loading}
                                className="h-10 rounded-xl px-5 text-xs font-semibold"
                            >
                                Batalkan
                            </Button>
                        )}
                        <Button
                            type="button"
                            onClick={handleImport}
                            disabled={!file || loading}
                            className="h-10 rounded-xl px-6 text-xs font-semibold shadow-sm"
                            variant="primary"
                        >
                            {loading ? (
                                <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <RefreshCw size={13} className="mr-1.5" />
                            )}
                            Sinkronkan Data Master
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

declare let route: any;
