import { Button } from '@/components/ui/base/Button';
import { Checkbox } from '@/components/ui/base/Checkbox';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { CalendarDays, FileText, Hash, Info, LayoutGrid, Save, Settings2 } from 'lucide-react';
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
        <div className="animate-in fade-in flex flex-col gap-12 bg-white p-4 duration-500 dark:bg-black">
            <div className="border-primary/10 flex items-center justify-between border-b pb-10 dark:border-white/10">
                <div className="flex items-center gap-5">
                    <div className="bg-primary shadow-primary/20 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-2xl dark:bg-white dark:text-black dark:shadow-white/5">
                        <Hash size={28} />
                    </div>
                    <div>
                        <h2 className="text-primary/40 mb-1 text-[11px] font-black tracking-[0.4em] uppercase dark:text-white/40">
                            Serial Architecture
                        </h2>
                        <p className="text-primary text-2xl font-black tracking-tight uppercase italic dark:text-white">Sistem Penomoran Otomatis</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-10">
                {formats.map((format) => (
                    <FormatCard key={format.id} format={format} />
                ))}

                {formats.length === 0 && (
                    <div className="border-primary/5 bg-primary/[0.01] flex flex-col items-center justify-center rounded-[2.5rem] border-4 border-dashed py-32 dark:border-white/5 dark:bg-white/[0.01]">
                        <Hash className="text-primary/10 mb-6 h-16 w-16 dark:text-white/10" />
                        <span className="text-primary/20 text-[13px] font-black tracking-[0.5em] uppercase dark:text-white/20">
                            Konfigurasi Belum Terdaftar
                        </span>
                    </div>
                )}
            </div>

            <div className="border-primary/10 bg-primary/[0.02] group relative overflow-hidden rounded-[2rem] border p-10 dark:border-white/10 dark:bg-white/[0.02]">
                <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-10">
                    <Info size={120} strokeWidth={1} />
                </div>
                <div className="relative z-10 flex items-start gap-6">
                    <div className="bg-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-lg dark:bg-white dark:text-black">
                        <Info size={20} />
                    </div>
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col">
                            <span className="text-primary mb-2 text-[11px] font-black tracking-[0.3em] uppercase dark:text-white">
                                Panduan Sintaks Placeholder
                            </span>
                            <p className="text-primary/40 text-[9px] font-bold uppercase dark:text-white/40">
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
                                    <div className="bg-primary/[0.05] text-primary group-hover/tag:bg-primary flex h-8 w-8 items-center justify-center rounded-lg transition-all group-hover/tag:text-white dark:bg-white/[0.05] dark:text-white dark:group-hover/tag:bg-white dark:group-hover/tag:text-black">
                                        <item.icon size={12} />
                                    </div>
                                    <div className="flex flex-col">
                                        <code className="text-primary text-[10px] font-black uppercase dark:text-white">{item.tag}</code>
                                        <span className="text-primary/30 mt-0.5 text-[8px] font-bold uppercase dark:text-white/30">{item.desc}</span>
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
                isEditing
                    ? 'border-primary ring-primary/5 shadow-2xl ring-8 dark:border-white dark:ring-white/5'
                    : 'border-primary/10 hover:border-primary/30 bg-white dark:border-white/10 dark:bg-black dark:hover:border-white/30',
            )}
        >
            <div className="border-primary/10 bg-primary/[0.01] flex items-center justify-between border-b px-10 py-8 dark:border-white/10 dark:bg-white/[0.01]">
                <div className="flex items-center gap-5">
                    <div className="bg-primary/[0.03] border-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-2xl border shadow-inner dark:border-white/10 dark:bg-white/[0.03] dark:text-white">
                        <Settings2 size={20} />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-primary mb-1 text-[11px] font-black tracking-[0.3em] uppercase dark:text-white">
                            Modul: {format.module}
                        </h3>
                        <div className="flex items-center gap-2">
                            <div
                                className={cn(
                                    'h-1.5 w-1.5 rounded-full',
                                    format.is_active ? 'animate-pulse bg-emerald-500' : 'bg-primary/20 dark:bg-white/20',
                                )}
                            />
                            <span className="text-primary/40 text-[9px] font-black tracking-[0.1em] uppercase dark:text-white/40">
                                {format.is_active ? 'Sistem Aktif & Terpantau' : 'Sistem Penomoran Non-Aktif'}
                            </span>
                        </div>
                    </div>
                </div>
                {!isEditing && (
                    <Button
                        variant="primary"
                        onClick={() => setIsEditing(true)}
                        className="h-10 rounded-xl px-8 text-[10px] font-black uppercase shadow-xl active:scale-95"
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

                        <div className="border-primary/10 flex items-center justify-between border-t pt-8 dark:border-white/10">
                            <div
                                className="bg-primary/[0.03] border-primary/10 group hover:bg-primary/[0.05] flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
                                onClick={() => setData('is_active', !data.is_active)}
                            >
                                <Checkbox checked={data.is_active} onCheckedChange={() => {}} />
                                <div className="flex flex-col">
                                    <span className="text-primary text-[10px] font-black uppercase dark:text-white">Aktivasi Sistem</span>
                                    <span className="text-primary/30 mt-0.5 text-[8px] font-bold uppercase dark:text-white/30">
                                        Aktifkan generator nomor otomatis
                                    </span>
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
                                    className="text-primary/30 h-12 rounded-2xl px-8 text-[11px] font-black uppercase transition-all hover:text-rose-500"
                                >
                                    Batalkan
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="group h-12 rounded-2xl px-12 text-[11px] font-black uppercase shadow-2xl active:scale-95"
                                >
                                    {processing ? (
                                        <Save className="mr-2 h-4 w-4 animate-spin" />
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
                            <span className="text-primary/30 mb-4 block px-1 text-[10px] font-black tracking-[0.3em] uppercase italic dark:text-white/30">
                                Preview Aktual Pattern
                            </span>
                            <div className="group bg-primary shadow-primary/20 relative flex min-h-[100px] items-center gap-6 overflow-hidden rounded-[2rem] p-8 shadow-2xl dark:bg-white dark:shadow-white/5">
                                <div className="absolute top-0 right-0 p-4 opacity-5 transition-all group-hover:scale-110 group-hover:opacity-10">
                                    <Hash size={120} strokeWidth={3} />
                                </div>
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 dark:bg-black/10">
                                    <span className="text-2xl font-black text-white/40 italic dark:text-black/40">#</span>
                                </div>
                                <span className="relative z-10 truncate font-mono text-[18px] font-black tracking-[0.1em] text-white uppercase lg:text-[22px] dark:text-black">
                                    {format.format_pattern.replace('{{nomor}}', '0'.repeat(format.padding - 1) + '1')}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6 lg:col-span-5">
                            <div className="border-primary/10 bg-primary/[0.02] rounded-[1.5rem] border p-6 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-white/[0.02]">
                                <span className="text-primary/30 mb-4 block text-[9px] font-black tracking-[0.2em] uppercase dark:text-white/30">
                                    Index Terakhir
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-primary text-4xl leading-none font-black tracking-tighter tabular-nums dark:text-white">
                                        {format.current_number}
                                    </span>
                                    <span className="text-primary/20 text-[9px] font-black uppercase italic dark:text-white/20">Serial</span>
                                </div>
                            </div>
                            <div className="border-primary/10 bg-primary/[0.02] rounded-[1.5rem] border p-6 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-white/[0.02]">
                                <span className="text-primary/30 mb-4 block text-[9px] font-black tracking-[0.2em] uppercase dark:text-white/30">
                                    Padding Digit
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-primary text-4xl leading-none font-black tracking-tighter tabular-nums dark:text-white">
                                        {format.padding}
                                    </span>
                                    <span className="text-primary/20 text-[9px] font-black uppercase italic dark:text-white/20">Digit</span>
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
