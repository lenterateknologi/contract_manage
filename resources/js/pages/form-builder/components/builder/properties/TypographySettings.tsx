import { Button } from '@/components/ui/buttons/Button';
import { Input } from '@/components/ui/inputs/Input';
import { Label } from '@/components/ui/forms/Label';
import { cn } from '@/lib/utils';
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
        <div className="space-y-4">
            {/* Typography & Alignment Combined Compact Section */}
            <div className="border-border space-y-3 border-t pt-3">
                <div className="flex items-center gap-2">
                    <Type size={12} className="text-muted-foreground" />
                    <h4 className="font-sans text-[9px] font-semibold uppercase">Tipografi & Alur Teks</h4>
                </div>

                {/* Font Family Select */}
                <div className="space-y-1">
                    <Label className="text-muted-foreground font-sans text-[7px] font-medium uppercase">Font Family</Label>
                    <select
                        value={selectedField.options?.font_family || "'Times New Roman', serif"}
                        onChange={(e) =>
                            bulkUpdateOptions(selectedIds, {
                                font_family: e.target.value,
                            })
                        }
                        className="border-input bg-background focus:ring-1 focus:ring-primary h-7 w-full rounded-md border px-2 py-0.5 text-[10px] font-medium outline-none shadow-xs"
                        style={{ fontFamily: selectedField.options?.font_family || "'Times New Roman', serif" }}
                    >
                        <option value="'Montserrat', sans-serif">Montserrat — Tema Aplikasi</option>
                        <option value="'Inter', sans-serif">Inter — Modern UI</option>
                        <option value="'Open Sans', sans-serif">Open Sans — Clean</option>
                        <option value="'Roboto', sans-serif">Roboto — Sans</option>
                        <option value="'Playfair Display', serif">Playfair Display — Serif</option>
                        <option value="'Times New Roman', serif">Times New Roman — Formal</option>
                    </select>
                </div>

                {/* Row 1: Font Size & Weight (Compact) */}
                <div className="grid grid-cols-2 gap-2 items-end">
                    <div className="space-y-1">
                        <Label className="text-muted-foreground font-sans text-[7px] font-medium uppercase">Ukuran Font (px)</Label>
                        <Input
                            type="number"
                            value={selectedField.options?.font_size ?? ''}
                            onChange={(e) =>
                                bulkUpdateOptions(selectedIds, {
                                    font_size: parseNumber(e.target.value, 12),
                                })
                            }
                            className="h-7 font-sans text-[10px] px-2"
                            placeholder="12"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-muted-foreground font-sans text-[7px] font-medium uppercase">Ketebalan (Weight)</Label>
                        <div className="flex gap-0.5">
                            {[
                                { l: 'Normal', v: 'normal' },
                                { l: 'Bold', v: 'bold' },
                                { l: 'Heavy', v: '900' },
                            ].map((w) => (
                                <Button
                                    key={w.v}
                                    type="button"
                                    variant={(selectedField.options?.font_weight || 'normal') === w.v ? 'default' : 'outline'}
                                    className="h-7 flex-1 p-0 font-sans text-[8px] font-bold"
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

                {/* Row 2: Alignment & Formatting Style & Color */}
                <div className="grid grid-cols-2 gap-2 items-center">
                    {/* Text Alignment (Boxed / Segmented) */}
                    <div className="space-y-1">
                        <Label className="text-muted-foreground font-sans text-[7px] font-medium uppercase">Rata Teks</Label>
                        <div className="bg-muted/40 p-0.5 rounded-lg flex items-center border border-slate-200/80 dark:border-zinc-800">
                            {[
                                { label: 'Left', value: 'left', icon: AlignLeft },
                                { label: 'Center', value: 'center', icon: AlignCenter },
                                { label: 'Right', value: 'right', icon: AlignRight },
                                { label: 'Justify', value: 'justify', icon: List },
                            ].map((a) => {
                                const isActive = (selectedField.options?.text_align || selectedField.options?.alignment || 'left') === a.value;
                                return (
                                    <button
                                        key={a.value}
                                        type="button"
                                        onClick={() =>
                                            bulkUpdateOptions(selectedIds, {
                                                text_align: a.value,
                                                alignment: a.value,
                                            })
                                        }
                                        className={cn(
                                            'flex-1 flex items-center justify-center h-6 rounded-md transition-all text-muted-foreground',
                                            isActive
                                                ? 'bg-background text-foreground shadow-xs font-bold border border-slate-200/60 dark:border-zinc-700'
                                                : 'hover:bg-background/50 hover:text-foreground'
                                        )}
                                        title={a.label}
                                    >
                                        <a.icon size={12} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Style (Italic/Underline) & Color */}
                    <div className="space-y-1">
                        <Label className="text-muted-foreground font-sans text-[7px] font-medium uppercase">Gaya & Warna</Label>
                        <div className="flex gap-1 items-center">
                            <Button
                                type="button"
                                variant={selectedField.options?.font_style === 'italic' ? 'default' : 'outline'}
                                className="h-7 px-1.5 font-sans text-[9px] font-bold italic"
                                onClick={() =>
                                    bulkUpdateOptions(selectedIds, {
                                        font_style: selectedField.options?.font_style === 'italic' ? 'normal' : 'italic',
                                    })
                                }
                            >
                                I
                            </Button>
                            <Button
                                type="button"
                                variant={selectedField.options?.text_decoration === 'underline' ? 'default' : 'outline'}
                                className="h-7 px-1.5 font-sans text-[9px] font-bold underline"
                                onClick={() =>
                                    bulkUpdateOptions(selectedIds, {
                                        text_decoration: selectedField.options?.text_decoration === 'underline' ? 'none' : 'underline',
                                    })
                                }
                            >
                                U
                            </Button>
                            <Input
                                type="color"
                                value={selectedField.options?.color || '#000000'}
                                onChange={(e) =>
                                    bulkUpdateOptions(selectedIds, {
                                        color: e.target.value,
                                    })
                                }
                                className="h-7 w-full p-0.5 cursor-pointer rounded-md border"
                                title="Warna Teks"
                            />
                        </div>
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
