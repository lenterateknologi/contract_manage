import { Button } from '@/components/ui/buttons/Button';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { Head, router } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Database, Download, Play, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface BackupFile {
    filename: string;
    size: number;
    formatted_size: string;
    last_modified: string;
    timestamp: number;
}

interface Props {
    backups: BackupFile[];
    breadcrumbs: any[];
    errors: Record<string, string>;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Index({ backups, errors, flash }: Props) {
    const [runningScript, setRunningScript] = useState<string | null>(null);
    const [restoringFile, setRestoringFile] = useState<string | null>(null);

    const triggerScript = (scriptKey: string) => {
        setRunningScript(scriptKey);
        router.post(
            '/admin/backups/run',
            { script: scriptKey },
            {
                onFinish: () => setRunningScript(null),
            },
        );
    };

    const handleDelete = (filename: string) => {
        if (confirm(`Apakah Anda yakin ingin menghapus file backup "${filename}"?`)) {
            router.delete(`/admin/backups/delete/${filename}`);
        }
    };

    const handleRestore = (filename: string) => {
        if (
            confirm(
                `PERINGATAN: Apakah Anda yakin ingin melakukan restore database menggunakan file "${filename}"?\nTindakan ini akan menimpa data database Anda saat ini.`,
            )
        ) {
            setRestoringFile(filename);
            router.post(
                '/admin/backups/restore',
                { filename },
                {
                    onFinish: () => setRestoringFile(null),
                },
            );
        }
    };

    const scripts = [
        { key: 'db', name: 'Export DB', description: 'Ekspor skema & data lengkap database' },
        { key: 'data', name: 'Export Data Only', description: 'Ekspor semua data saja (tanpa skema)' },
        { key: 'master', name: 'Export Master Only', description: 'Ekspor data master saja (tabel m_*)' },
        { key: 'transaction', name: 'Export Transaction Only', description: 'Ekspor data transaksi saja (tabel t_*)' },
    ];

    return (
        <>
            <Head title="Backup & Restore" />
            <PageTable title="Backup & Restore" subtitle="Manajemen ekspor dan impor data database sistem secara manual" icon={Database}>
                <div className="flex-1 space-y-6 overflow-auto p-6">
                    {/* Flash messages */}
                    {flash?.success && (
                        <div className="animate-in fade-in flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-500">
                            <CheckCircle2 size={16} />
                            <span>{flash.success}</span>
                        </div>
                    )}
                    {(errors?.error || flash?.error) && (
                        <div className="animate-in fade-in flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-500">
                            <AlertCircle size={16} />
                            <span>{errors?.error || flash?.error}</span>
                        </div>
                    )}

                    {/* Trigger Scripts Cards */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {scripts.map((script) => {
                            const isRunning = runningScript === script.key;
                            return (
                                <div
                                    key={script.key}
                                    className="border-surface-border bg-card/40 hover:border-primary/40 flex flex-col justify-between rounded-2xl border p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
                                >
                                    <div className="space-y-1">
                                        <h3 className="text-foreground text-xs font-bold tracking-wider uppercase">{script.name}</h3>
                                        <p className="text-muted-foreground text-[11px] leading-relaxed">{script.description}</p>
                                    </div>
                                    <div className="border-surface-border/40 mt-4 flex justify-end border-t pt-3">
                                        <Button
                                            variant={isRunning ? 'white' : 'primary'}
                                            onClick={() => triggerScript(script.key)}
                                            disabled={runningScript !== null || restoringFile !== null}
                                            className="h-8 gap-1.5 rounded-lg px-3 text-[11px] font-medium tracking-wider uppercase"
                                        >
                                            {isRunning ? (
                                                <>
                                                    <RefreshCw size={12} className="animate-spin" /> Menjalankan...
                                                </>
                                            ) : (
                                                <>
                                                    <Play size={11} fill="currentColor" /> Trigger
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Backups List */}
                    <div className="bg-card border-surface-border flex flex-col overflow-hidden rounded-2xl border">
                        <div className="border-surface-border flex items-center justify-between border-b px-5 py-4">
                            <h3 className="text-foreground text-xs font-bold tracking-wider uppercase">Daftar File SQL Dump</h3>
                            <span className="bg-primary/10 text-primary border-primary/20 rounded-full border px-2 py-0.5 text-[10px] font-medium">
                                {backups.length} file ditemukan
                            </span>
                        </div>
                        <div className="p-0">
                            {backups.length === 0 ? (
                                <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 p-8 text-center text-xs">
                                    <Database size={24} className="text-muted-foreground/40" />
                                    <span>Belum ada file backup database (.sql) ditemukan di folder root.</span>
                                </div>
                            ) : (
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-surface-border bg-muted/20 text-muted-foreground border-b text-[10px] font-bold tracking-wider uppercase">
                                            <th className="px-5 py-3">Nama File</th>
                                            <th className="px-5 py-3">Ukuran</th>
                                            <th className="px-5 py-3">Waktu Backup</th>
                                            <th className="px-5 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-surface-border/40 divide-y">
                                        {backups.map((row) => (
                                            <tr key={row.filename} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <Database size={14} className="text-primary/70 shrink-0" />
                                                        <span className="text-foreground text-xs font-medium">{row.filename}</span>
                                                    </div>
                                                </td>
                                                <td className="text-muted-foreground px-5 py-3.5 text-xs">{row.formatted_size}</td>
                                                <td className="text-muted-foreground px-5 py-3.5 text-xs">{row.last_modified}</td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="white"
                                                            size="icon"
                                                            onClick={() => handleRestore(row.filename)}
                                                            disabled={runningScript !== null || restoringFile !== null}
                                                            title="Restore Database"
                                                            className="text-muted-foreground border-surface-border h-8 w-8 rounded-lg border hover:border-amber-200 hover:text-amber-500"
                                                        >
                                                            {restoringFile === row.filename ? (
                                                                <RefreshCw size={14} className="animate-spin" />
                                                            ) : (
                                                                <RefreshCw size={14} />
                                                            )}
                                                        </Button>
                                                        <a href={`/admin/backups/download/${row.filename}`}>
                                                            <Button
                                                                variant="white"
                                                                size="icon"
                                                                className="hover:text-primary border-surface-border h-8 w-8 rounded-lg border"
                                                                title="Download File"
                                                            >
                                                                <Download size={14} />
                                                            </Button>
                                                        </a>
                                                        <Button
                                                            variant="white"
                                                            size="icon"
                                                            onClick={() => handleDelete(row.filename)}
                                                            className="text-muted-foreground border-surface-border h-8 w-8 rounded-lg border hover:border-red-200 hover:text-red-500"
                                                            title="Hapus File"
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </PageTable>
        </>
    );
}
