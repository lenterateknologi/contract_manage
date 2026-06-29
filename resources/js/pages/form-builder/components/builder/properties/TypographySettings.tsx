import { Button } from '@/components/ui/buttons/Button';
import { Input } from '@/components/ui/inputs/Input';
import { Label } from '@/components/ui/forms/Label';
import { AlignCenter, AlignLeft, AlignRight, List, Type } from 'lucide-react';
import React from 'react';
import { parseNumber } from './utils';

interface TypographySettingsProps {
    selectedField: any;
    selectedIds: string[];
    bulkUpdateOptions: (ids: string[], optionsUpdate: any) => void;
    templateData: any;
}

export const TypographySettings: React.FC<TypographySettingsProps> = ({ selectedField, selectedIds, bulkUpdateOptions, templateData }) => {
    const isTypographySupported = [
        'static_text',
        'labeled_value',
        'textfield',
        'textarea',
        'searchable_select',
        'number',
        'date',
        'signature_box',
        'f1_header',
    ].includes(selectedField.type);

    if (!isTypographySupported) return null;

    return (
        <div className="space-y-6">
            {/* Typography */}
            <div className="border-border space-y-4 border-t pt-4">
                <div className="flex items-center gap-2">
                    <Type size={12} className="text-muted-foreground" />
                    <h4 className="font-sans text-[9px] font-semibold uppercase">Typography</h4>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Font Family</Label>
                    <select
                        value={selectedField.options?.font_family || "'Times New Roman', serif"}
                        onChange={(e) =>
                            bulkUpdateOptions(selectedIds, {
                                font_family: e.target.value,
                            })
                        }
                        className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-2 py-1 text-[11px] font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                        style={{ fontFamily: selectedField.options?.font_family || "'Times New Roman', serif" }}
                    >
                        <option value="'Montserrat', sans-serif" style={{ fontFamily: 'Montserrat' }}>
                            Montserrat — Tema Aplikasi
                        </option>
                        <option value="'Inter', sans-serif" style={{ fontFamily: 'Inter' }}>
                            Inter — Modern UI
                        </option>
                        <option value="'Open Sans', sans-serif" style={{ fontFamily: 'Open Sans' }}>
                            Open Sans — Clean & Professional
                        </option>
                        <option value="'Roboto', sans-serif" style={{ fontFamily: 'Roboto' }}>
                            Roboto — Modern Sans
                        </option>
                        <option value="'Lato', sans-serif" style={{ fontFamily: 'Lato' }}>
                            Lato — Geometric Sans
                        </option>
                        <option value="'Playfair Display', serif" style={{ fontFamily: 'Playfair Display' }}>
                            Playfair Display — Elegant Serif
                        </option>
                        <option value="sans-serif" style={{ fontFamily: 'Arial' }}>
                            Arial / Sans-Serif
                        </option>
                        <option value="'Times New Roman', serif" style={{ fontFamily: 'Times New Roman' }}>
                            Times New Roman — Formal
                        </option>
                        <option value="serif" style={{ fontFamily: 'Georgia' }}>
                            Georgia / Serif
                        </option>
                        <option value="monospace" style={{ fontFamily: 'Courier New' }}>
                            Courier — Monospace
                        </option>
                    </select>
                    {/* Live font preview */}
                    <div
                        className="border-muted-foreground/20 text-muted-foreground/70 rounded-md border border-dashed px-3 py-2 text-[12px]"
                        style={{
                            fontFamily: selectedField.options?.font_family || "'Times New Roman', serif",
                            color: selectedField.options?.color || 'inherit',
                            fontWeight: selectedField.options?.font_weight || 'normal',
                            fontStyle: selectedField.options?.font_style || undefined,
                            textDecoration: selectedField.options?.text_decoration || undefined,
                            textAlign: (selectedField.options?.text_align || selectedField.options?.alignment || 'left') as any,
                        }}
                    >
                        Pratinjau: Teks Kontrak
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Font Size (px)</Label>
                        <Input
                            type="number"
                            value={selectedField.options?.font_size ?? ''}
                            onChange={(e) =>
                                bulkUpdateOptions(selectedIds, {
                                    font_size: parseNumber(e.target.value, 12),
                                })
                            }
                            className="h-8 font-sans text-[11px]"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Weight (Selection / Value)</Label>
                        <div className="flex gap-1">
                            {[
                                { l: 'N', v: 'normal' },
                                { l: 'B', v: 'bold' },
                                { l: 'BL', v: '900' },
                            ].map((w) => (
                                <Button
                                    key={w.v}
                                    type="button"
                                    variant={(selectedField.options?.font_weight || 'normal') === w.v ? 'default' : 'outline'}
                                    className="h-8 w-8 font-sans text-[10px] font-semibold"
                                    onClick={() =>
                                        bulkUpdateOptions(selectedIds, {
                                            font_weight: w.v,
                                        })
                                    }
                                >
                                    {w.l}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Gaya Teks (Style)</Label>
                        <div className="flex gap-1">
                            <Button
                                type="button"
                                variant={selectedField.options?.font_style === 'italic' ? 'default' : 'outline'}
                                className="h-8 px-2 font-sans text-[10px] font-semibold italic"
                                onClick={() =>
                                    bulkUpdateOptions(selectedIds, {
                                        font_style: selectedField.options?.font_style === 'italic' ? 'normal' : 'italic',
                                    })
                                }
                            >
                                Italic
                            </Button>
                            <Button
                                type="button"
                                variant={selectedField.options?.text_decoration === 'underline' ? 'default' : 'outline'}
                                className="h-8 px-2 font-sans text-[10px] font-semibold underline"
                                onClick={() =>
                                    bulkUpdateOptions(selectedIds, {
                                        text_decoration: selectedField.options?.text_decoration === 'underline' ? 'none' : 'underline',
                                    })
                                }
                            >
                                Underline
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Text Color</Label>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <div
                                className="border-border h-8 w-8 rounded-md border"
                                style={{ backgroundColor: selectedField.options?.color || '#000000' }}
                            />
                            <Input
                                type="color"
                                value={selectedField.options?.color || '#000000'}
                                onChange={(e) =>
                                    bulkUpdateOptions(selectedIds, {
                                        color: e.target.value,
                                    })
                                }
                                className="h-8 w-full p-0.5"
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            {[
                                { label: 'P', color: templateData.letterhead_json?.palette?.primary || '#0f172a', title: 'Primary' },
                                { label: 'S', color: templateData.letterhead_json?.palette?.secondary || '#475569', title: 'Secondary' },
                                { label: 'A', color: templateData.letterhead_json?.palette?.accent || '#3b82f6', title: 'Accent' },
                            ].map((p) => (
                                <button
                                    key={p.label}
                                    type="button"
                                    onClick={() => bulkUpdateOptions(selectedIds, { color: p.color })}
                                    className="border-border flex h-5 w-5 items-center justify-center rounded border text-[8px] font-semibold transition-transform hover:scale-110"
                                    style={{ backgroundColor: p.color, color: '#fff', textShadow: '0 0 2px rgba(0,0,0,0.5)' }}
                                    title={`Gunakan ${p.title}`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Text Alignment</Label>
                    <div className="grid grid-cols-4 gap-1">
                        {[
                            { label: 'Left', value: 'left', icon: AlignLeft },
                            { label: 'Center', value: 'center', icon: AlignCenter },
                            { label: 'Right', value: 'right', icon: AlignRight },
                            { label: 'Justify', value: 'justify', icon: List },
                        ].map((a) => (
                            <Button
                                key={a.value}
                                type="button"
                                variant={
                                    (selectedField.options?.text_align || selectedField.options?.alignment || 'left') === a.value
                                        ? 'default'
                                        : 'outline'
                                }
                                className="h-8 gap-1.5 p-0 font-sans text-[7px] font-semibold uppercase"
                                onClick={() =>
                                    bulkUpdateOptions(selectedIds, {
                                        text_align: a.value,
                                        alignment: a.value,
                                    })
                                }
                            >
                                <a.icon size={10} />
                                {a.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List & Numbering */}
            {selectedField.type === 'static_text' && (
                <div className="border-border space-y-4 border-t pt-4">
                    <div className="flex items-center gap-2">
                        <List size={12} className="text-muted-foreground" />
                        <h4 className="font-sans text-[9px] font-semibold text-emerald-600 uppercase">List & Numbering</h4>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">List Type</Label>
                        <select
                            value={selectedField.options?.list_type || 'none'}
                            onChange={(e) =>
                                bulkUpdateOptions(selectedIds, {
                                    list_type: e.target.value,
                                    number_format: e.target.value === 'legal' ? 'Pasal {n}' : e.target.value === 'number' ? '{n}.' : '',
                                })
                            }
                            className="border-input bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 py-1 font-sans text-[10px] font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                        >
                            <option value="none">None</option>
                            <option value="number">Number</option>
                            <option value="bullet">Bullet</option>
                            <option value="legal">Legal</option>
                        </select>
                    </div>

                    {(selectedField.options?.list_type === 'number' || selectedField.options?.list_type === 'legal') && (
                        <div className="animate-in slide-in-from-top-1 space-y-1.5">
                            <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Format (use {'{n}'})</Label>
                            <Input
                                value={selectedField.options?.number_format || ''}
                                onChange={(e) =>
                                    bulkUpdateOptions(selectedIds, {
                                        number_format: e.target.value,
                                    })
                                }
                                className="h-8 font-sans text-[11px]"
                                placeholder="e.g. Pasal {n}"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
