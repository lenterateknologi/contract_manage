import { Button } from '@/components/ui/buttons/Button';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { CompactInput } from '@/components/ui/inputs/CompactInput';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { CalendarDays, FileText, Hash, Info, LayoutGrid, Loader2, Save, Settings2 } from 'lucide-react';
import React, { useState } from 'react';

interface NumberingFormat {
    readonly id: string;
    readonly module: string;
    readonly format_pattern: string;
    readonly current_number: number;
    readonly padding: number;
    readonly is_active: boolean;
}

interface Props {
    readonly formats: readonly NumberingFormat[];
}

export function NumberingFormatManagement({ formats }: Readonly<Props>) {
    return (
        <div className="animate-in fade-in bg-card flex flex-col gap-12 p-4 duration-500">
            <div className="border-surface-border flex items-center justify-between border-b pb-10">
                <div className="flex items-center gap-5">
                    <div className="bg-primary shadow-primary/20 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-2xl">
                        <Hash size={28} />
                    </div>
                    <div>
                        <h2 className="text-text-desc mb-1 text-[11px] font-semibold tracking-[0.4em] uppercase">Serial Architecture</h2>
                        <p className="text-text-main text-2xl font-semibold tracking-tight uppercase italic">Sistem Penomoran Otomatis</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-10">
                {formats.map((format) => (
                    <FormatCard key={format.id} format={format} />
                ))}

                {formats.length === 0 && (
                    <div className="border-surface-border bg-surface-muted flex flex-col items-center justify-center rounded-[2.5rem] border-4 border-dashed py-32">
                        <Hash className="text-text-main/10 mb-6 h-16 w-16" />
                        <span className="text-text-main/20 text-[13px] font-semibold tracking-[0.5em] uppercase">Konfigurasi Belum Terdaftar</span>
                    </div>
                )}
            </div>

            <div className="border-surface-border bg-surface-muted group relative overflow-hidden rounded-[2rem] border p-10">
                <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-10">
                    <Info size={120} strokeWidth={1} />
                </div>
                <div className="relative z-10 flex items-start gap-6">
                    <div className="bg-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-lg">
                        <Info size={20} />
                    </div>
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col">
                            <span className="text-text-main mb-2 text-[11px] font-semibold tracking-[0.3em] uppercase">Panduan Sintaks Placeholder</span>
                            <p className="text-text-desc text-[9px] font-bold uppercase">
                                Gunakan tag di bawah ini untuk membangun pola penomoran dokumen yang dinamis
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                { tag: '{{nomor}}', desc: 'Nomor urut otomatis (Incremental)', icon: Hash },
                                { tag: '{{tanggal}}', desc: 'Hari (DD) format 01-31', icon: CalendarDays },
                                { tag: '{{bulan}}', desc: 'Bulan (MM) format 01-12', icon: CalendarDays },
                                { tag: '{{tahun}}', desc: 'Tahun (YYYY) format lengkap', icon: CalendarDays },
                                { tag: '{{kode_departemen}}', desc: 'Kode Unit / Departemen Penanggung Jawab', icon: LayoutGrid },
                                { tag: '{{kode_perjanjian}}', desc: 'Kode Klasifikasi Tipe Perjanjian', icon: FileText },
                            ].map((item) => (
                                <div key={item.tag} className="group/tag flex items-center gap-4">
                                    <div className="bg-primary/[0.05] text-primary group-hover/tag:bg-primary flex h-8 w-8 items-center justify-center rounded-lg transition-all group-hover/tag:text-white">
                                        <item.icon size={12} />
                                    </div>
                                    <div className="flex flex-col">
                                        <code className="text-text-main text-[10px] font-semibold uppercase">{item.tag}</code>
                                        <span className="text-text-main/30 mt-0.5 text-[8px] font-bold uppercase">{item.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FormatCard({ format }: Readonly<{ format: NumberingFormat }>) {
    const { data, setData, put, processing, reset } = useForm({
        format_pattern: format.format_pattern,
        current_number: format.current_number,
        padding: format.padding,
        is_active: format.is_active,
    });

    const [isEditing, setIsEditing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.numbering-formats.update', format.id), {
            onSuccess: () => {
                setIsEditing(false);
                // We'll show a toast in the controller success handler,
                // but let's assume it's handled.
            },
        });
    };

    return (
        <div
            className={cn(
                'overflow-hidden rounded-[2.5rem] border transition-all duration-500',
                isEditing ? 'border-primary ring-primary/5 shadow-2xl ring-8' : 'border-surface-border hover:border-primary/30 bg-card',
            )}
        >
            <div className="border-surface-border bg-surface-muted flex items-center justify-between border-b px-10 py-8">
                <div className="flex items-center gap-5">
                    <div className="bg-primary/[0.03] border-surface-border text-primary flex h-12 w-12 items-center justify-center rounded-2xl border shadow-inner">
                        <Settings2 size={20} />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-text-main mb-1 text-[11px] font-semibold tracking-[0.3em] uppercase">Modul: {format.module}</h3>
                        <div className="flex items-center gap-2">
                            <div className={cn('h-1.5 w-1.5 rounded-full', format.is_active ? 'bg-success animate-pulse' : 'bg-primary/20')} />
                            <span className="text-text-desc text-[9px] font-semibold tracking-[0.1em] uppercase">
                                {format.is_active ? 'Sistem Aktif & Terpantau' : 'Sistem Penomoran Non-Aktif'}
                            </span>
                        </div>
                    </div>
                </div>
                {!isEditing && (
                    <Button
                        variant="primary"
                        onClick={() => setIsEditing(true)}
                        className="h-10 rounded-xl px-8 text-[10px] font-semibold uppercase shadow-xl active:scale-95"
                    >
                        Konfigurasi Serial
                    </Button>
                )}
            </div>

            <div className="p-10">
                {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
                            <div className="md:col-span-6">
                                <CompactInput
                                    label="Pola Format Penomoran (Pattern)"
                                    value={data.format_pattern}
                                    onChange={(e) => setData('format_pattern', e.target.value)}
                                    placeholder="CONTOH: {{nomor}}/KONTRAK/{{tahun}}"
                                    icon={FileText}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <CompactInput
                                    label="Index Terakhir"
                                    type="number"
                                    value={String(data.current_number)}
                                    onChange={(e) => setData('current_number', Number(e.target.value))}
                                    icon={Hash}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <CompactInput
                                    label="Padding Digit"
                                    type="number"
                                    value={String(data.padding)}
                                    onChange={(e) => setData('padding', Number(e.target.value))}
                                    icon={Hash}
                                />
                            </div>
                        </div>

                        <div className="border-surface-border flex items-center justify-between border-t pt-8">
                            <div
                                className="bg-primary/[0.03] border-surface-border group hover:bg-primary/[0.05] flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors"
                                onClick={() => setData('is_active', !data.is_active)}
                            >
                                <Checkbox checked={data.is_active} onCheckedChange={() => { }} />
                                <div className="flex flex-col">
                                    <span className="text-text-main text-[10px] font-semibold uppercase">Aktivasi Sistem</span>
                                    <span className="text-text-main/30 mt-0.5 text-[8px] font-bold uppercase">Aktifkan generator nomor otomatis</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setIsEditing(false);
                                        reset();
                                    }}
                                >
                                    Batalkan
                                </Button>
                                <Button type="submit" disabled={processing} className="px-12">
                                    {processing ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save size={16} className="mr-2 transition-transform group-hover:rotate-12" />
                                    )}
                                    Simpan Konfigurasi
                                </Button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12">
                        <div className="lg:col-span-7">
                            <span className="text-text-main/30 mb-4 block px-1 text-[10px] font-semibold tracking-[0.3em] uppercase italic">
                                Preview Aktual Pattern
                            </span>
                            <div className="group bg-primary shadow-primary/20 relative flex min-h-[100px] items-center gap-6 overflow-hidden rounded-[2rem] p-8 shadow-2xl dark:bg-white dark:shadow-white/5">
                                <div className="absolute top-0 right-0 p-4 opacity-5 transition-all group-hover:scale-110 group-hover:opacity-10">
                                    <Hash size={120} strokeWidth={3} />
                                </div>
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 dark:bg-black/10">
                                    <span className="text-2xl font-semibold text-white/40 italic dark:text-black/40">#</span>
                                </div>
                                <span className="relative z-10 truncate font-mono text-[18px] font-semibold tracking-[0.1em] text-white uppercase lg:text-[22px] dark:text-black">
                                    {format.format_pattern.replace('{{nomor}}', '0'.repeat(format.padding - 1) + '1')}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6 lg:col-span-5">
                            <div className="border-surface-border bg-surface-muted rounded-[1.5rem] border p-6 shadow-sm transition-all hover:shadow-md">
                                <span className="text-text-main/30 mb-4 block text-[9px] font-semibold tracking-[0.2em] uppercase">Index Terakhir</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-text-main text-4xl leading-none font-semibold tracking-tighter tabular-nums">
                                        {format.current_number}
                                    </span>
                                    <span className="text-text-main/20 text-[9px] font-semibold uppercase italic">Serial</span>
                                </div>
                            </div>
                            <div className="border-surface-border bg-surface-muted rounded-[1.5rem] border p-6 shadow-sm transition-all hover:shadow-md">
                                <span className="text-text-main/30 mb-4 block text-[9px] font-semibold tracking-[0.2em] uppercase">Padding Digit</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-text-main text-4xl leading-none font-semibold tracking-tighter tabular-nums">
                                        {format.padding}
                                    </span>
                                    <span className="text-text-main/20 text-[9px] font-semibold uppercase italic">Digit</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

declare let route: any;
