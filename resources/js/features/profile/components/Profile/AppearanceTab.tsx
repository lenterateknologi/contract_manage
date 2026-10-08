import React from 'react';
import { Palette } from 'lucide-react';
import AppearanceToggleTab from '@/layouts/app/components/AppearanceTabs';
import { Section } from './Section';

export function AppearanceTab() {
    return (
        <div className="max-w-sm">
            <Section title="Tema Antarmuka" icon={Palette}>
                <AppearanceToggleTab />
            </Section>
        </div>
    );
}
