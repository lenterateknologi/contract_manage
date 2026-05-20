import { Head } from '@inertiajs/react';
import { Palette } from 'lucide-react';

import AppearanceTabs from '@/components/layout/AppearanceTabs';
import SettingsLayout from '@/layouts/settings/layout';

export default function Appearance() {
    return (
        <>
            <Head title="Tampilan" />

            <SettingsLayout>
                <div className="space-y-6">
                    <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
                        <div className="border-border bg-muted/30 flex items-center justify-between border-b px-6 py-4">
                            <h3 className="text-foreground text-sm font-black uppercase">Tema & Tampilan</h3>
                            <Palette size={16} className="text-muted-foreground/60" />
                        </div>

                        <div className="p-8">
                            <div className="mb-6">
                                <p className="text-muted-foreground mb-1.5 text-xs font-bold uppercase">Mode Tampilan</p>
                                <p className="text-muted-foreground/60 text-[11px] font-medium">
                                    Pilih preferensi tema yang paling nyaman untuk mata Anda.
                                </p>
                            </div>
                            <AppearanceTabs />
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </>
    );
}
