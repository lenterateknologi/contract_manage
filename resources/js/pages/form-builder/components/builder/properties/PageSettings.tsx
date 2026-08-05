import { Input } from '@/components/ui/inputs/Input';
import { Label } from '@/components/ui/forms/Label';
import { Layout, Move, Palette } from 'lucide-react';
import React from 'react';
import { parseMargin } from './utils';

interface PageSettingsProps {
    templateData: any;
    setTemplateData: (key: string, value: any) => void;
}

export const PageSettings: React.FC<PageSettingsProps> = ({ templateData, setTemplateData }) => {
    return (
        <div className="space-y-3.5 border-t border-border/50 pt-3">
            {/* Title Header */}
            <div className="flex items-center gap-1.5">
                <Layout size={12} className="text-muted-foreground" />
                <h3 className="font-sans text-[9px] font-semibold uppercase">Template & Margin</h3>
            </div>

            {/* Document Margins LRTB (4 Column Grid) */}
            <div className="space-y-1">
                <Label className="text-muted-foreground font-sans text-[7px] font-medium uppercase">Margin Dokumen (mm)</Label>
                <div className="grid grid-cols-4 gap-1">
                    {[
                        { key: 'top', label: 'Top', def: 15 },
                        { key: 'bottom', label: 'Bottom', def: 15 },
                        { key: 'left', label: 'Left', def: 15 },
                        { key: 'right', label: 'Right', def: 15 },
                    ].map((m) => (
                        <div key={m.key} className="space-y-0.5">
                            <span className="text-muted-foreground block text-center font-sans text-[7px] uppercase">{m.label}</span>
                            <Input
                                type="number"
                                value={templateData.letterhead_json?.margins?.[m.key] !== undefined ? templateData.letterhead_json.margins[m.key] : m.def}
                                onChange={(e) =>
                                    setTemplateData('letterhead_json', {
                                        ...templateData.letterhead_json,
                                        margins: {
                                            ...(templateData.letterhead_json?.margins ?? { top: 15, bottom: 15, left: 15, right: 15 }),
                                            [m.key]: parseMargin(e.target.value, m.def) as any,
                                        },
                                    })
                                }
                                className="h-6 text-center font-sans text-[10px] px-1"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Color Palette (3 Column Grid) */}
            <div className="space-y-1.5 pt-1">
                <Label className="text-muted-foreground font-sans text-[7px] font-medium uppercase">Palet Warna (Primary / Secondary / Accent)</Label>
                <div className="grid grid-cols-3 gap-1.5">
                    {[
                        { key: 'primary', label: 'Primary', def: '#0f172a' },
                        { key: 'secondary', label: 'Secondary', def: '#475569' },
                        { key: 'accent', label: 'Accent', def: '#3b82f6' },
                    ].map((c) => (
                        <div key={c.key} className="flex items-center gap-1 bg-background rounded-md border border-input p-1 h-7">
                            <span className="text-[7px] font-bold uppercase text-muted-foreground px-0.5">{c.label[0]}</span>
                            <Input
                                type="color"
                                value={templateData.letterhead_json?.palette?.[c.key] || c.def}
                                onChange={(e) =>
                                    setTemplateData('letterhead_json', {
                                        ...templateData.letterhead_json,
                                        palette: {
                                            ...(templateData.letterhead_json?.palette ?? {
                                                primary: '#0f172a',
                                                secondary: '#475569',
                                                accent: '#3b82f6',
                                            }),
                                            [c.key]: e.target.value,
                                        },
                                    })
                                }
                                className="h-5 w-full p-0 border-0 cursor-pointer"
                                title={c.label}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
