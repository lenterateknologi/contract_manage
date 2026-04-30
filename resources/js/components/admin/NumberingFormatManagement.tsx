import { ManagementForm, FormSection } from '@/components/admin/ManagementForm';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { Hash, Info, Save, Settings2, FileText, LayoutGrid, CalendarDays } from 'lucide-react';
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
        <div className="animate-in fade-in flex flex-col gap-12 duration-500 bg-white dark:bg-black p-4">
            <div className="flex items-center justify-between border-b border-primary/10 dark:border-white/10 pb-10">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/20 dark:bg-white dark:text-black dark:shadow-white/5">
                        <Hash size={28} />
                    </div>
                    <div>
                        <h2 className="text-[11px] font-black tracking-[0.4em] text-primary/40 dark:text-white/40 uppercase mb-1">Serial Architecture</h2>
                        <p className="text-2xl font-black tracking-tight text-primary dark:text-white uppercase italic">Sistem Penomoran Otomatis</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-10">
                {formats.map((format) => (
                    <FormatCard key={format.id} format={format} />
                ))}

                {formats.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-[2.5rem] border-4 border-dashed border-primary/5 bg-primary/[0.01] py-32 dark:border-white/5 dark:bg-white/[0.01]">
                        <Hash className="mb-6 h-16 w-16 text-primary/10 dark:text-white/10" />
                        <span className="text-[13px] font-black tracking-[0.5em] text-primary/20 uppercase dark:text-white/20">
                            Konfigurasi Belum Terdaftar
                        </span>
                    </div>
                )}
            </div>

            <div className="rounded-[2rem] border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] p-10 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Info size={120} strokeWidth={1} />
                </div>
                <div className="flex items-start gap-6 relative z-10">
                    <div className="h-12 w-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg dark:bg-white dark:text-black shrink-0">
                        <Info size={20} />
                    </div>
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black tracking-[0.3em] text-primary dark:text-white uppercase mb-2">Panduan Sintaks Placeholder</span>
                            <p className="text-[9px] font-bold text-primary/40 dark:text-white/40 uppercase tracking-widest">Gunakan tag di bawah ini untuk membangun pola penomoran dokumen yang dinamis</p>
                        </div>
                        <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                { tag: '{{nomor}}', desc: 'Nomor urut otomatis (Incremental)', icon: Hash },
                                { tag: '{{tanggal}}', desc: 'Hari (DD) format 01-31', icon: CalendarDays },
                                { tag: '{{bulan}}', desc: 'Bulan (MM) format 01-12', icon: CalendarDays },
                                { tag: '{{tahun}}', desc: 'Tahun (YYYY) format lengkap', icon: CalendarDays },
                                { tag: '{{kode_departemen}}', desc: 'Kode Unit / Departemen Penanggung Jawab', icon: LayoutGrid },
                                { tag: '{{kode_perjanjian}}', desc: 'Kode Klasifikasi Tipe Perjanjian', icon: FileText },
                            ].map(item => (
                                <div key={item.tag} className="flex items-center gap-4 group/tag">
                                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/[0.05] dark:bg-white/[0.05] text-primary dark:text-white group-hover/tag:bg-primary group-hover/tag:text-white dark:group-hover/tag:bg-white dark:group-hover/tag:text-black transition-all">
                                        <item.icon size={12} />
                                    </div>
                                    <div className="flex flex-col">
                                        <code className="text-[10px] font-black text-primary dark:text-white tracking-widest uppercase">{item.tag}</code>
                                        <span className="text-[8px] font-bold text-primary/30 dark:text-white/30 uppercase mt-0.5">{item.desc}</span>
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
        <div className={cn(
            "rounded-[2.5rem] border transition-all duration-500 overflow-hidden",
            isEditing 
                ? "border-primary dark:border-white shadow-2xl ring-8 ring-primary/5 dark:ring-white/5" 
                : "border-primary/10 dark:border-white/10 bg-white dark:bg-black hover:border-primary/30 dark:hover:border-white/30"
        )}>
            <div className="px-10 py-8 flex items-center justify-between border-b border-primary/10 dark:border-white/10 bg-primary/[0.01] dark:bg-white/[0.01]">
                <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-2xl bg-primary/[0.03] dark:bg-white/[0.03] border border-primary/10 dark:border-white/10 flex items-center justify-center text-primary dark:text-white shadow-inner">
                        <Settings2 size={20} />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-[11px] font-black tracking-[0.3em] text-primary dark:text-white uppercase mb-1">Modul: {format.module}</h3>
                        <div className="flex items-center gap-2">
                            <div className={cn('h-1.5 w-1.5 rounded-full', format.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-primary/20 dark:bg-white/20')} />
                            <span className="text-[9px] font-black tracking-[0.1em] text-primary/40 dark:text-white/40 uppercase">
                                {format.is_active ? 'Sistem Aktif & Terpantau' : 'Sistem Penomoran Non-Aktif'}
                            </span>
                        </div>
                    </div>
                </div>
                {!isEditing && (
                    <Button
                        variant="primary"
                        onClick={() => setIsEditing(true)}
                        className="h-10 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95"
                    >
                        Konfigurasi Serial
                    </Button>
                )}
            </div>

            <div className="p-10">
                {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            <div className="md:col-span-6">
                                <CompactInput 
                                    label="Pola Format Penomoran (Pattern)"
                                    value={data.format_pattern}
                                    onChange={e => setData('format_pattern', e.target.value)}
                                    placeholder="CONTOH: {{nomor}}/KONTRAK/{{tahun}}"
                                    icon={FileText}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <CompactInput 
                                    label="Index Terakhir"
                                    type="number"
                                    value={String(data.current_number)}
                                    onChange={e => setData('current_number', Number(e.target.value))}
                                    icon={Hash}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <CompactInput 
                                    label="Padding Digit"
                                    type="number"
                                    value={String(data.padding)}
                                    onChange={e => setData('padding', Number(e.target.value))}
                                    icon={Hash}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-primary/10 dark:border-white/10 pt-8">
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/[0.03] dark:bg-white/[0.03] border border-primary/10 dark:border-white/10 cursor-pointer group hover:bg-primary/[0.05] dark:hover:bg-white/[0.05] transition-colors" onClick={() => setData('is_active', !data.is_active)}>
                                <Checkbox 
                                    checked={data.is_active}
                                    onCheckedChange={() => {}}
                                />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary dark:text-white">Aktivasi Sistem</span>
                                    <span className="text-[8px] font-bold text-primary/30 dark:text-white/30 uppercase mt-0.5">Aktifkan generator nomor otomatis</span>
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
                                    className="h-12 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest text-primary/30 hover:text-rose-500 transition-all"
                                >
                                    Batalkan
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="h-12 px-12 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl active:scale-95 group"
                                >
                                    {processing ? <Save className="h-4 w-4 animate-spin mr-2" /> : <Save size={16} className="mr-2 group-hover:rotate-12 transition-transform" />}
                                    Simpan Konfigurasi
                                </Button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12">
                        <div className="lg:col-span-7">
                            <span className="mb-4 block text-[10px] font-black tracking-[0.3em] text-primary/30 dark:text-white/30 uppercase italic px-1">
                                Preview Aktual Pattern
                            </span>
                            <div className="group relative flex items-center gap-6 overflow-hidden rounded-[2rem] bg-primary dark:bg-white p-8 shadow-2xl shadow-primary/20 dark:shadow-white/5 min-h-[100px]">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all group-hover:scale-110">
                                    <Hash size={120} strokeWidth={3} />
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-white/10 dark:bg-black/10 flex items-center justify-center shrink-0">
                                    <span className="text-2xl font-black text-white/40 dark:text-black/40 italic">#</span>
                                </div>
                                <span className="relative z-10 font-mono text-[18px] lg:text-[22px] font-black tracking-[0.1em] text-white dark:text-black uppercase truncate">
                                    {format.format_pattern.replace('{{nomor}}', '0'.repeat(format.padding - 1) + '1')}
                                </span>
                            </div>
                        </div>
                        <div className="lg:col-span-5 grid grid-cols-2 gap-6">
                            <div className="rounded-[1.5rem] border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] p-6 shadow-sm hover:shadow-md transition-all">
                                <span className="mb-4 block text-[9px] font-black tracking-[0.2em] text-primary/30 dark:text-white/30 uppercase">
                                    Index Terakhir
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl leading-none font-black tracking-tighter text-primary dark:text-white tabular-nums">
                                        {format.current_number}
                                    </span>
                                    <span className="text-[9px] font-black text-primary/20 dark:text-white/20 uppercase tracking-widest italic">Serial</span>
                                </div>
                            </div>
                            <div className="rounded-[1.5rem] border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] p-6 shadow-sm hover:shadow-md transition-all">
                                <span className="mb-4 block text-[9px] font-black tracking-[0.2em] text-primary/30 dark:text-white/30 uppercase">
                                    Padding Digit
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl leading-none font-black tracking-tighter text-primary dark:text-white tabular-nums">
                                        {format.padding}
                                    </span>
                                    <span className="text-[9px] font-black text-primary/20 dark:text-white/20 uppercase tracking-widest italic">Digit</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

declare var route: any;
