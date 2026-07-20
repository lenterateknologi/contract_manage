import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Database, Download, Trash2, Play, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/buttons/Button';
import { PageTable } from '@/components/ui/navigation/PageTable';

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
        router.post('/admin/backups/run', { script: scriptKey }, {
            onFinish: () => setRunningScript(null),
        });
    };

    const handleDelete = (filename: string) => {
        if (confirm(`Apakah Anda yakin ingin menghapus file backup "${filename}"?`)) {
            router.delete(`/admin/backups/delete/${filename}`);
        }
    };

    const handleRestore = (filename: string) => {
        if (confirm(`PERINGATAN: Apakah Anda yakin ingin melakukan restore database menggunakan file "${filename}"?\nTindakan ini akan menimpa data database Anda saat ini.`)) {
            setRestoringFile(filename);
            router.post('/admin/backups/restore', { filename }, {
                onFinish: () => setRestoringFile(null),
            });
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
            <PageTable
                title="Backup & Restore"
                subtitle="Manajemen ekspor dan impor data database sistem secara manual"
                icon={Database}
            >
                <div className="flex-1 overflow-auto p-6 space-y-6">
                    {/* Flash messages */}
                    {flash?.success && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-medium animate-in fade-in">
                            <CheckCircle2 size={16} />
                            <span>{flash.success}</span>
                        </div>
                    )}
                    {(errors?.error || flash?.error) && (
                        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-medium animate-in fade-in">
                            <AlertCircle size={16} />
                            <span>{errors?.error || flash?.error}</span>
                        </div>
                    )}

                    {/* Trigger Scripts Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {scripts.map((script) => {
                            const isRunning = runningScript === script.key;
                            return (
                                <div key={script.key} className="border border-surface-border bg-card/40 rounded-2xl p-4 flex flex-col justify-between hover:border-primary/40 hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
                                    <div className="space-y-1">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{script.name}</h3>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">{script.description}</p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-surface-border/40 flex justify-end">
                                        <Button
                                            variant={isRunning ? "white" : "primary"}
                                            onClick={() => triggerScript(script.key)}
                                            disabled={runningScript !== null || restoringFile !== null}
                                            className="h-8 px-3 gap-1.5 text-[11px] font-medium rounded-lg uppercase tracking-wider"
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
                    <div className="bg-card border border-surface-border rounded-2xl overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Daftar File SQL Dump</h3>
                            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
                                {backups.length} file ditemukan
                            </span>
                        </div>
                        <div className="p-0">
                            {backups.length === 0 ? (
                                <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                                    <Database size={24} className="text-muted-foreground/40" />
                                    <span>Belum ada file backup database (.sql) ditemukan di folder root.</span>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-surface-border bg-muted/20 text-[10px] uppercase text-muted-foreground tracking-wider font-bold">
                                            <th className="px-5 py-3">Nama File</th>
                                            <th className="px-5 py-3">Ukuran</th>
                                            <th className="px-5 py-3">Waktu Backup</th>
                                            <th className="px-5 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-border/40">
                                        {backups.map((row) => (
                                            <tr key={row.filename} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <Database size={14} className="text-primary/70 shrink-0" />
                                                        <span className="font-medium text-foreground text-xs">{row.filename}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-muted-foreground">{row.formatted_size}</td>
                                                <td className="px-5 py-3.5 text-xs text-muted-foreground">{row.last_modified}</td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="white"
                                                            size="icon"
                                                            onClick={() => handleRestore(row.filename)}
                                                            disabled={runningScript !== null || restoringFile !== null}
                                                            title="Restore Database"
                                                            className="h-8 w-8 hover:text-amber-500 text-muted-foreground hover:border-amber-200 rounded-lg border border-surface-border"
                                                        >
                                                            {restoringFile === row.filename ? (
                                                                <RefreshCw size={14} className="animate-spin" />
                                                            ) : (
                                                                <RefreshCw size={14} />
                                                            )}
                                                        </Button>
                                                        <a href={`/admin/backups/download/${row.filename}`}>
                                                            <Button variant="white" size="icon" className="h-8 w-8 hover:text-primary rounded-lg border border-surface-border" title="Download File">
                                                                <Download size={14} />
                                                            </Button>
                                                        </a>
                                                        <Button
                                                            variant="white"
                                                            size="icon"
                                                            onClick={() => handleDelete(row.filename)}
                                                            className="h-8 w-8 hover:text-red-500 text-muted-foreground hover:border-red-200 rounded-lg border border-surface-border"
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
