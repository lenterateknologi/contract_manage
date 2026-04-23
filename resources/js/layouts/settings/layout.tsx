import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="h-full flex flex-col w-full">
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                {children}
            </section>
        </div>
    );
}
