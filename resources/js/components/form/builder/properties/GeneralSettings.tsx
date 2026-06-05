import { Input } from '@/components/ui/base/Input';
import { Label } from '@/components/ui/base/Label';
import { Textarea } from '@/components/ui/base/Textarea';
import { Image as ImageIcon } from 'lucide-react';
import React from 'react';
import { parseNumber } from './utils';

interface GeneralSettingsProps {
    selectedField: any;
    selectedIds: string[];
    isBulk: boolean;
    updateField: (ids: string | string[], key: any, value: any) => void;
    bulkUpdateOptions: (ids: string[], optionsUpdate: any) => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ selectedField, selectedIds, isBulk, updateField, bulkUpdateOptions }) => {
    return (
        <div className="grid grid-cols-1 gap-4">
            {!isBulk && (
                <div className="space-y-1.5">
                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Internal Key (meta_)</Label>
                    <Input
                        value={selectedField.name || ''}
                        onChange={(e) => updateField(selectedField.id, 'name', e.target.value)}
                        className="h-8 font-mono text-[10px]"
                        placeholder="e.g. meta_total_harga"
                    />
                </div>
            )}

            {!isBulk && (
                <div className="space-y-1.5">
                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Label Content</Label>
                    {selectedField.type === 'static_text' ? (
                        <Textarea
                            value={selectedField.label || ''}
                            onChange={(e) => updateField(selectedField.id, 'label', e.target.value)}
                            className="min-h-[100px] font-sans text-[10px] font-medium"
                            placeholder="Masukkan teks statis di sini..."
                        />
                    ) : (
                        <Input
                            value={selectedField.label || ''}
                            onChange={(e) => updateField(selectedField.id, 'label', e.target.value)}
                            className="h-8 font-sans text-[10px] font-medium"
                        />
                    )}
                </div>
            )}

            {selectedField.type === 'static_text' && (
                <div className="space-y-1.5">
                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">First Line Indent (px)</Label>
                    <Input
                        type="number"
                        value={selectedField.options?.first_line_indent ?? ''}
                        onChange={(e) =>
                            bulkUpdateOptions(selectedIds, {
                                first_line_indent: parseNumber(e.target.value, 0),
                            })
                        }
                        className="h-8 font-sans text-[11px]"
                    />
                </div>
            )}

            <div className="space-y-1.5">
                <Label className="font-sans text-[9px] font-semibold uppercase">Block Width</Label>
                <select
                    value={selectedField.width || '100'}
                    onChange={(e) => updateField(selectedIds, 'width', e.target.value)}
                    className="border-input bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 py-1 font-sans text-[10px] font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                >
                    {['20', '25', '35', '50', '65', '75', '100'].map((w) => (
                        <option key={w} value={w}>
                            {w}% Width
                        </option>
                    ))}
                </select>
            </div>

            {selectedField.type === 'labeled_value' && (
                <div className="border-border/50 bg-muted/10 space-y-3 rounded-lg border p-3">
                    <Label className="text-muted-foreground font-sans text-[8px] font-semibold  uppercase">
                        Pengaturan Label : Nilai
                    </Label>

                    {/* Field Style */}
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Gaya Garis (Field Style)</Label>
                        <select
                            value={selectedField.options?.field_style || 'dashed_bottom'}
                            onChange={(e) =>
                                bulkUpdateOptions(selectedIds, {
                                    field_style: e.target.value,
                                })
                            }
                            className="border-input bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 py-1 font-sans text-[10px] font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                        >
                            <option value="dashed_bottom">Garis Bawah Putus-putus</option>
                            <option value="none">Tanpa Garis (Plain Text)</option>
                            <option value="box">Kotak / Box</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Label Width */}
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Lebar Label (px)</Label>
                            <Input
                                type="text"
                                value={selectedField.options?.label_width ?? ''}
                                onChange={(e) =>
                                    bulkUpdateOptions(selectedIds, {
                                        label_width: e.target.value,
                                    })
                                }
                                className="h-8 font-sans text-[11px]"
                                placeholder="e.g. 90, 120px"
                            />
                        </div>

                        {/* Indent */}
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Indent Kiri (px)</Label>
                            <Input
                                type="number"
                                value={selectedField.options?.margin_left ?? ''}
                                onChange={(e) =>
                                    bulkUpdateOptions(selectedIds, {
                                        margin_left: parseNumber(e.target.value, 0),
                                    })
                                }
                                className="h-8 font-sans text-[11px]"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Show Colon toggle */}
                    <div className="flex items-center justify-between">
                        <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Tampilkan Titik Dua (:)</Label>
                        <button
                            type="button"
                            onClick={() =>
                                bulkUpdateOptions(selectedIds, {
                                    show_colon: !selectedField.options?.show_colon,
                                })
                            }
                            className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${selectedField.options?.show_colon !== false ? 'bg-primary' : 'bg-muted-foreground/30'
                                }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${selectedField.options?.show_colon !== false ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Value Input Type */}
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Tipe Input Nilai</Label>
                        <select
                            value={selectedField.options?.value_type || 'textfield'}
                            onChange={(e) =>
                                bulkUpdateOptions(selectedIds, {
                                    value_type: e.target.value,
                                })
                            }
                            className="border-input bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 py-1 font-sans text-[10px] font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                        >
                            <option value="textfield">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="searchable_select">Dropdown</option>
                        </select>
                    </div>
                </div>
            )}

            {['image', 'f1_header'].includes(selectedField.type) && (
                <div className="border-border space-y-4 border-t pt-4">
                    <div className="flex items-center gap-2">
                        <ImageIcon size={12} className="text-muted-foreground" />
                        <h4 className="font-sans text-[9px] font-semibold uppercase">Image & Branding</h4>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Logo / Image URL</Label>
                        <Input
                            value={selectedField.options?.logo_url || selectedField.options?.url || ''}
                            onChange={(e) =>
                                bulkUpdateOptions(selectedIds, {
                                    logo_url: e.target.value,
                                    url: e.target.value,
                                })
                            }
                            className="h-8 font-sans text-[10px] font-medium"
                            placeholder="https://..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Aspect Ratio</Label>
                            <select
                                value={selectedField.options?.aspect_ratio || 'auto'}
                                onChange={(e) =>
                                    bulkUpdateOptions(selectedIds, {
                                        aspect_ratio: e.target.value,
                                    })
                                }
                                className="border-input bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 py-1 font-sans text-[10px] font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                            >
                                <option value="auto">Auto (Otomatis)</option>
                                <option value="1/1">1:1 (Kotak)</option>
                                <option value="16/9">16:9 (Widescreen)</option>
                                <option value="4/3">4:3 (Standard)</option>
                                <option value="3/2">3:2 (Foto)</option>
                                <option value="21/9">21:9 (Ultrawide)</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Object Fit</Label>
                            <select
                                value={selectedField.options?.object_fit || 'contain'}
                                onChange={(e) =>
                                    bulkUpdateOptions(selectedIds, {
                                        object_fit: e.target.value,
                                    })
                                }
                                className="border-input bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 py-1 font-sans text-[10px] font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                            >
                                <option value="contain">Contain (Pas)</option>
                                <option value="cover">Cover (Penuh)</option>
                                <option value="fill">Fill (Regang)</option>
                                <option value="none">Original</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Align Horizontal</Label>
                            <select
                                value={selectedField.options?.alignment || 'left'}
                                onChange={(e) =>
                                    bulkUpdateOptions(selectedIds, {
                                        alignment: e.target.value,
                                    })
                                }
                                className="border-input bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 py-1 font-sans text-[10px] font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                            >
                                <option value="left">Kiri (Left)</option>
                                <option value="center">Tengah (Center)</option>
                                <option value="right">Kanan (Right)</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Align Vertical</Label>
                            <select
                                value={selectedField.options?.v_alignment || 'start'}
                                onChange={(e) =>
                                    bulkUpdateOptions(selectedIds, {
                                        v_alignment: e.target.value,
                                    })
                                }
                                className="border-input bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 py-1 font-sans text-[10px] font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                            >
                                <option value="start">Atas (Top)</option>
                                <option value="middle">Tengah (Middle)</option>
                                <option value="bottom">Bawah (Bottom)</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
