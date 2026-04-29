import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { Hash, Info, Save } from 'lucide-react';
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
    formats: NumberingFormat[];
}

export default function NumberingFormatManagement({ formats }: Props) {
    return (
        <div className="animate-in fade-in flex flex-col gap-10 duration-500">
            <div className="flex items-center justify-between border-b border-black/[0.05] pb-8 dark:border-white/[0.05]">
                <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-black p-3 text-white shadow-xl shadow-black/10 dark:bg-white dark:text-black dark:shadow-white/5">
                        <Hash size={24} />
                    </div>
                    <div>
                        <h2 className="text-[10px] font-black tracking-[0.3em] text-black/40 uppercase dark:text-white/40">Sistem Penomoran</h2>
                        <p className="mt-0.5 text-[16px] font-bold tracking-tight text-black dark:text-white">Konfigurasi Serial & Format Otomatis</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {formats.map((format) => (
                    <FormatCard key={format.id} format={format} />
                ))}

                {formats.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/[0.1] bg-black/[0.02] py-32 dark:border-white/[0.1] dark:bg-white/[0.02]">
                        <Hash className="mb-4 h-12 w-12 text-black/10 dark:text-white/10" />
                        <p className="text-[11px] font-black tracking-[0.4em] text-black/30 uppercase dark:text-white/30">
                            Struktur Penomoran Kosong
                        </p>
                    </div>
                )}
            </div>

            <div className="flex gap-8 rounded-lg border border-black/[0.05] bg-black/[0.03] p-8 shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="shrink-0 self-start rounded-lg bg-black p-3 text-white shadow-xl shadow-black/10 dark:bg-white dark:text-black dark:shadow-white/5">
                    <Info size={20} />
                </div>
                <div className="flex flex-col gap-4">
                    <span className="text-[11px] font-black tracking-[0.2em] text-black uppercase dark:text-white">Panduan Sintaks Placeholder</span>
                    <div className="grid grid-cols-1 gap-x-12 gap-y-4 text-[10px] leading-relaxed font-bold tracking-widest text-black/40 uppercase md:grid-cols-2 lg:grid-cols-3 dark:text-white/40">
                        <div className="flex items-center gap-3">
                            <code className="rounded-lg border border-black/[0.05] bg-black/[0.05] px-3 py-1 font-bold text-black dark:border-white/[0.05] dark:bg-white/[0.05] dark:text-white">
                                {'{{nomor}}'}
                            </code>{' '}
                            <span>Nomor urut otomatis</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <code className="rounded-lg border border-black/[0.05] bg-black/[0.05] px-3 py-1 font-bold text-black dark:border-white/[0.05] dark:bg-white/[0.05] dark:text-white">
                                {'{{tanggal}}'}
                            </code>{' '}
                            <span>Hari (01-31)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <code className="rounded-lg border border-black/[0.05] bg-black/[0.05] px-3 py-1 font-bold text-black dark:border-white/[0.05] dark:bg-white/[0.05] dark:text-white">
                                {'{{bulan}}'}
                            </code>{' '}
                            <span>Bulan (01-12)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <code className="rounded-lg border border-black/[0.05] bg-black/[0.05] px-3 py-1 font-bold text-black dark:border-white/[0.05] dark:bg-white/[0.05] dark:text-white">
                                {'{{tahun}}'}
                            </code>{' '}
                            <span>Tahun (YYYY)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <code className="rounded-lg border border-black/[0.05] bg-black/[0.05] px-3 py-1 font-bold text-black dark:border-white/[0.05] dark:bg-white/[0.05] dark:text-white">
                                {'{{kode_departemen}}'}
                            </code>{' '}
                            <span>Kode Unit</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <code className="rounded-lg border border-black/[0.05] bg-black/[0.05] px-3 py-1 font-bold text-black dark:border-white/[0.05] dark:bg-white/[0.05] dark:text-white">
                                {'{{kode_perjanjian}}'}
                            </code>{' '}
                            <span>Kode Tipe</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FormatCard({ format }: { format: NumberingFormat }) {
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
            onSuccess: () => setIsEditing(false),
        });
    };

    return (
        <div className="overflow-hidden rounded-lg border border-black/[0.05] bg-white shadow-sm transition-all duration-300 hover:shadow-md dark:border-white/[0.05] dark:bg-black">
            <div className="flex items-center justify-between border-b border-black/[0.05] bg-black/[0.02] px-8 py-5 dark:border-white/[0.05] dark:bg-white/[0.02]">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-black/[0.05] bg-black/[0.03] text-black/40 dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-white/40">
                        <Hash size={18} />
                    </div>
                    <div>
                        <h3 className="text-[12px] font-bold tracking-widest text-black uppercase dark:text-white">Modul: {format.module}</h3>
                        <div className="mt-1 flex items-center gap-2">
                            <div
                                className={cn(
                                    'h-1.5 w-1.5 rounded-full',
                                    format.is_active ? 'bg-black dark:bg-white' : 'bg-black/10 dark:bg-white/10',
                                )}
                            />
                            <span className="text-[9px] font-black tracking-[0.2em] text-black/30 uppercase dark:text-white/30">
                                {format.is_active ? 'SISTEM AKTIF' : 'NON-AKTIF'}
                            </span>
                        </div>
                    </div>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="h-9 rounded-lg border border-black/[0.1] px-6 text-[10px] font-black tracking-widest text-black/60 uppercase shadow-sm transition-all hover:bg-black hover:text-white active:scale-95 dark:border-white/[0.1] dark:text-white/60 dark:hover:bg-white dark:hover:text-black"
                    >
                        Ubah Konfigurasi
                    </button>
                )}
            </div>

            <div className="p-8">
                {isEditing ? (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="format_pattern" className="text-[10px] font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                    Pola Format (Pattern)
                                </label>
                                <input
                                    id="format_pattern"
                                    type="text"
                                    value={data.format_pattern}
                                    onChange={(e) => setData('format_pattern', e.target.value)}
                                    className="h-10 rounded-lg border border-black/[0.08] bg-black/[0.02] px-5 text-[11px] font-black tracking-widest text-black uppercase transition-all outline-none focus:border-black focus:bg-white dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-white dark:focus:border-white dark:focus:bg-black"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="current_number" className="text-[10px] font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                    Index Terakhir
                                </label>
                                <input
                                    id="current_number"
                                    type="number"
                                    value={data.current_number}
                                    onChange={(e) => setData('current_number', Number.parseInt(e.target.value))}
                                    className="h-10 rounded-lg border border-black/[0.08] bg-black/[0.02] px-5 text-[12px] font-bold text-black transition-all outline-none focus:border-black focus:bg-white dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-white dark:focus:border-white dark:focus:bg-black"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="padding" className="text-[10px] font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                    Padding Digit
                                </label>
                                <input
                                    id="padding"
                                    type="number"
                                    value={data.padding}
                                    onChange={(e) => setData('padding', Number.parseInt(e.target.value))}
                                    className="h-10 rounded-lg border border-black/[0.08] bg-black/[0.02] px-5 text-[12px] font-bold text-black transition-all outline-none focus:border-black focus:bg-white dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-white dark:focus:border-white dark:focus:bg-black"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-4 border-t border-black/[0.05] pt-8 dark:border-white/[0.05]">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false);
                                    reset();
                                }}
                                className="h-10 rounded-lg px-8 text-[11px] font-black tracking-widest text-black/30 uppercase transition-all hover:text-black dark:text-white/30 dark:hover:text-white"
                            >
                                Batalkan Perubahan
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex h-10 items-center gap-3 rounded-lg border-none bg-black px-10 text-[11px] font-black tracking-widest text-white uppercase shadow-xl shadow-black/10 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-black dark:shadow-white/5"
                            >
                                {processing ? <Save className="h-4 w-4 animate-spin" /> : <Save size={16} />}
                                Simpan Konfigurasi
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
                        <div>
                            <span className="mb-4 block text-[10px] font-black tracking-widest text-black/30 uppercase dark:text-white/30">
                                Aktual Preview Format
                            </span>
                            <div className="group relative flex items-center gap-4 overflow-hidden rounded-xl border-none bg-black p-6 font-mono text-[14px] text-white shadow-xl shadow-black/10 dark:bg-white dark:text-black dark:shadow-white/5">
                                <div className="absolute top-0 right-0 p-2 opacity-5">
                                    <Hash size={64} />
                                </div>
                                <span className="text-2xl font-black opacity-30 select-none">#</span>
                                <span className="relative z-10 truncate font-bold tracking-[0.2em] uppercase">{format.format_pattern}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="rounded-xl border border-black/[0.05] bg-black/[0.02] p-6 shadow-sm dark:border-white/[0.05] dark:bg-white/[0.02]">
                                <span className="mb-3 block text-[9px] font-black tracking-[0.2em] text-black/30 uppercase dark:text-white/30">
                                    Urutan Terakhir
                                </span>
                                <span className="text-3xl leading-none font-bold tracking-tighter text-black tabular-nums dark:text-white">
                                    {format.current_number}
                                </span>
                            </div>
                            <div className="rounded-xl border border-black/[0.05] bg-black/[0.02] p-6 shadow-sm dark:border-white/[0.05] dark:bg-white/[0.02]">
                                <span className="mb-3 block text-[9px] font-black tracking-[0.2em] text-black/30 uppercase dark:text-white/30">
                                    Digit Padding
                                </span>
                                <span className="text-3xl leading-none font-bold tracking-tighter text-black tabular-nums dark:text-white">
                                    {format.padding} <span className="ml-1 text-[12px] font-black tracking-widest uppercase opacity-30">Digit</span>
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Mock route helper if not defined (though it should be from Ziggy)
declare var route: any;
