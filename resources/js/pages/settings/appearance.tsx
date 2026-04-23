import { Head } from '@inertiajs/react';
import { Palette } from 'lucide-react';

import AppearanceTabs from '@/components/appearance-tabs';
import SettingsLayout from '@/layouts/settings/layout';

export default function Appearance() {
    return (
        <>
            <Head title="Tampilan" />

            <SettingsLayout>
                <div className="space-y-6">
                    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="border-b border-border bg-muted/30 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Tema & Tampilan</h3>
                            <Palette size={16} className="text-muted-foreground/60" />
                        </div>
                        
                        <div className="p-8">
                            <div className="mb-6">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Mode Tampilan</p>
                                <p className="text-[11px] text-muted-foreground/60 font-medium">Pilih preferensi tema yang paling nyaman untuk mata Anda.</p>
                            </div>
                            <AppearanceTabs />
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </>
    );
}
