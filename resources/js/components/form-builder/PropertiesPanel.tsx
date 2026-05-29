import { Button } from '@/components/ui/base/Button';
import { Input } from '@/components/ui/base/Input';
import { Label } from '@/components/ui/base/Label';
import { Textarea } from '@/components/ui/base/Textarea';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Columns,
    Edit3,
    Image as ImageIcon,
    Layout,
    List,
    Move,
    Type,
    Trash2,
    Palette,
    Maximize2,
    Ruler,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import React from 'react';

interface PropertiesPanelProps {
    selectedFields: any[];
    updateField: (ids: string | string[], key: any, value: any) => void;
    bulkUpdateOptions: (ids: string[], optionsUpdate: any) => void;
    templateData: any;
    setTemplateData: (key: string, value: any) => void;
    onRemoveField?: (ids: string | string[]) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
    selectedFields,
    updateField,
    bulkUpdateOptions,
    templateData,
    setTemplateData,
    onRemoveField,
}) => {
    const [showIndividualPadding, setShowIndividualPadding] = React.useState(false);
    const [showIndividualMargin, setShowIndividualMargin] = React.useState(false);
    const isBulk = selectedFields.length > 1;
    const allSameType = isBulk && selectedFields.every((f) => f.type === selectedFields[0].type);
    const selectedField = isBulk ? (allSameType ? selectedFields[0] : null) : selectedFields[0];
    const selectedIds = selectedFields.map((f) => f.id);

    const parseNumber = (val: string, fallback: number = 0) => {
        if (val === '') return '';
        const parsed = parseInt(val);
        return isNaN(parsed) ? fallback : parsed;
    };

    const parseNumberOrUndefined = (val: string) => {
        if (val === '') return undefined;
        const parsed = parseInt(val);
        return isNaN(parsed) ? undefined : parsed;
    };

    const parseMargin = (val: string, fallback = 15) => {
        if (val === '') return '';
        const parsed = parseInt(val);
        return isNaN(parsed) ? fallback : parsed;
    };

    if (selectedFields.length === 0) {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
                <div className="bg-primary/10 flex items-center gap-3 rounded-xl p-4">
                    <div className="bg-primary rounded-lg p-2 text-white">
                        <Layout size={20} />
                    </div>
                    <div>
                        <h3 className="font-sans text-[10px] font-semibold uppercase">Konfigurasi Halaman</h3>
                        <p className="text-muted-foreground text-[8px] font-medium">Atur ukuran dan margin dokumen A4</p>
                    </div>
                </div>

                <div className="border-border space-y-4 border-t pt-6">
                    <div className="flex items-center gap-2">
                        <Move size={12} className="text-muted-foreground" />
                        <h4 className="font-sans text-[9px] font-semibold uppercase">Margin Dokumen (mm)</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Margin Atas</Label>
                            <Input
                                type="number"
                                value={templateData.letterhead_json?.margins?.top !== undefined ? templateData.letterhead_json.margins.top : 15}
                                onChange={(e) =>
                                    setTemplateData('letterhead_json', {
                                        ...templateData.letterhead_json,
                                        margins: {
                                            ...(templateData.letterhead_json?.margins ?? { top: 15, bottom: 15, left: 15, right: 15 }),
                                            top: parseMargin(e.target.value, 15) as any,
                                        },
                                    })
                                }
                                className="h-9 font-sans text-[11px]"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Margin Bawah</Label>
                            <Input
                                type="number"
                                value={templateData.letterhead_json?.margins?.bottom !== undefined ? templateData.letterhead_json.margins.bottom : 15}
                                onChange={(e) =>
                                    setTemplateData('letterhead_json', {
                                        ...templateData.letterhead_json,
                                        margins: {
                                            ...(templateData.letterhead_json?.margins ?? { top: 15, bottom: 15, left: 15, right: 15 }),
                                            bottom: parseMargin(e.target.value, 15) as any,
                                        },
                                    })
                                }
                                className="h-9 font-sans text-[11px]"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Margin Kiri</Label>
                            <Input
                                type="number"
                                value={templateData.letterhead_json?.margins?.left !== undefined ? templateData.letterhead_json.margins.left : 15}
                                onChange={(e) =>
                                    setTemplateData('letterhead_json', {
                                        ...templateData.letterhead_json,
                                        margins: {
                                            ...(templateData.letterhead_json?.margins ?? { top: 15, bottom: 15, left: 15, right: 15 }),
                                            left: parseMargin(e.target.value, 15) as any,
                                        },
                                    })
                                }
                                className="h-9 font-sans text-[11px]"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Margin Kanan</Label>
                            <Input
                                type="number"
                                value={templateData.letterhead_json?.margins?.right !== undefined ? templateData.letterhead_json.margins.right : 15}
                                onChange={(e) =>
                                    setTemplateData('letterhead_json', {
                                        ...templateData.letterhead_json,
                                        margins: {
                                            ...(templateData.letterhead_json?.margins ?? { top: 15, bottom: 15, left: 15, right: 15 }),
                                            right: parseMargin(e.target.value, 15) as any,
                                        },
                                    })
                                }
                                className="h-9 font-sans text-[11px]"
                            />
                        </div>
                    </div>
                </div>

                <div className="border-border space-y-4 border-t pt-6">
                    <div className="flex items-center gap-2">
                        <Palette size={12} className="text-muted-foreground" />
                        <h4 className="font-sans text-[9px] font-semibold uppercase">Palet Warna Tema</h4>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Warna Utama (Primary)</Label>
                            <div className="flex items-center gap-2">
                                <div
                                    className="h-8 w-8 rounded-md border border-border"
                                    style={{ backgroundColor: templateData.letterhead_json?.palette?.primary || '#0f172a' }}
                                />
                                <Input
                                    type="color"
                                    value={templateData.letterhead_json?.palette?.primary || '#0f172a'}
                                    onChange={(e) =>
                                        setTemplateData('letterhead_json', {
                                            ...templateData.letterhead_json,
                                            palette: {
                                                ...(templateData.letterhead_json?.palette ?? { primary: '#0f172a', secondary: '#475569', accent: '#3b82f6' }),
                                                primary: e.target.value,
                                            },
                                        })
                                    }
                                    className="h-8 w-full p-0.5"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Warna Sekunder (Secondary)</Label>
                            <div className="flex items-center gap-2">
                                <div
                                    className="h-8 w-8 rounded-md border border-border"
                                    style={{ backgroundColor: templateData.letterhead_json?.palette?.secondary || '#475569' }}
                                />
                                <Input
                                    type="color"
                                    value={templateData.letterhead_json?.palette?.secondary || '#475569'}
                                    onChange={(e) =>
                                        setTemplateData('letterhead_json', {
                                            ...templateData.letterhead_json,
                                            palette: {
                                                ...(templateData.letterhead_json?.palette ?? { primary: '#0f172a', secondary: '#475569', accent: '#3b82f6' }),
                                                secondary: e.target.value,
                                            },
                                        })
                                    }
                                    className="h-8 w-full p-0.5"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Warna Aksen (Accent)</Label>
                            <div className="flex items-center gap-2">
                                <div
                                    className="h-8 w-8 rounded-md border border-border"
                                    style={{ backgroundColor: templateData.letterhead_json?.palette?.accent || '#3b82f6' }}
                                />
                                <Input
                                    type="color"
                                    value={templateData.letterhead_json?.palette?.accent || '#3b82f6'}
                                    onChange={(e) =>
                                        setTemplateData('letterhead_json', {
                                            ...templateData.letterhead_json,
                                            palette: {
                                                ...(templateData.letterhead_json?.palette ?? { primary: '#0f172a', secondary: '#475569', accent: '#3b82f6' }),
                                                accent: e.target.value,
                                            },
                                        })
                                    }
                                    className="h-8 w-full p-0.5"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-muted/30 mt-8 rounded-lg p-4 text-center">
                    <p className="text-muted-foreground/60 text-[9px] leading-relaxed font-medium">
                        Pilih elemen di canvas untuk mengatur properti spesifik elemen tersebut.
                    </p>
                </div>
            </div>
        );
    }

    if (isBulk && !allSameType) {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 flex h-[200px] flex-col items-center justify-center space-y-4 rounded-xl border border-dashed p-6 text-center">
                <div className="bg-amber-50 text-amber-600 flex h-12 w-12 items-center justify-center rounded-full">
                    <Layout size={24} />
                </div>
                <div className="space-y-1">
                    <h3 className="font-sans text-[11px] font-semibold uppercase">Tipe Berbeda Terpilih</h3>
                    <p className="text-muted-foreground text-[10px] font-medium">Pilih elemen dengan tipe yang sama untuk pengeditan massal.</p>
                </div>
                <div className="bg-muted/50 rounded-md px-3 py-1.5">
                    <span className="text-muted-foreground text-[9px] font-semibold uppercase">{selectedFields.length} Elemen Terpilih</span>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
            {/* Header ID */}
            <div className="bg-muted/30 flex items-center justify-between rounded-lg p-3">
                <div className="flex-1 overflow-hidden">
                    <span className="text-muted-foreground block font-sans text-[8px] font-medium uppercase">
                        {isBulk ? 'Bulk Editing' : 'Element ID'}
                    </span>
                    <div className="flex items-center gap-2">
                        {isBulk ? (
                            <span className="bg-primary/10 text-primary truncate rounded px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase">
                                {selectedFields.length} Elemen Terpilih ({selectedField.type})
                            </span>
                        ) : (
                            <span className="bg-primary/10 text-primary truncate rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase">
                                #{selectedField.id}
                            </span>
                        )}
                        <Edit3 size={12} className="text-primary opacity-50" />
                    </div>
                </div>
                {onRemoveField && (
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => onRemoveField(selectedIds)}
                        className="h-8 px-3 text-[9px] font-semibold uppercase flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                    >
                        <Trash2 size={12} /> Hapus
                    </Button>
                )}
            </div>

            <div className="space-y-6">
                {/* Basic Settings */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Move size={12} className="text-muted-foreground" />
                        <h4 className="font-sans text-[9px] font-semibold uppercase">Data & Layout</h4>
                    </div>

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

                        {selectedField.type === 'grid_x' && (
                            <div className="border-border space-y-4 border-t pt-4">
                                <div className="flex items-center gap-2">
                                    <Columns size={12} className="text-muted-foreground" />
                                    <h4 className="font-sans text-[9px] font-semibold uppercase">Grid Layout</h4>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Number of Columns</Label>
                                    <select
                                        value={selectedField.options?.grid_cols || 2}
                                        onChange={(e) => {
                                            const cols = parseInt(e.target.value) || 2;
                                            const currentSizes = selectedField.options?.col_sizes || [];
                                            const newSizes = Array.from({ length: cols }).map((_, idx) => currentSizes[idx] || '1fr');
                                            bulkUpdateOptions(selectedIds, {
                                                grid_cols: cols,
                                                col_sizes: newSizes,
                                            });
                                        }}
                                        className="border-input bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 py-1 font-sans text-[10px] font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                                    >
                                        {[1, 2, 3, 4, 5, 6].map((num) => (
                                            <option key={num} value={num}>
                                                {num} Kolom
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Lebar Kolom (Width)</Label>
                                    <div className="space-y-2 rounded-lg bg-muted/20 p-3 border border-border/50">
                                        {Array.from({ length: selectedField.options?.grid_cols || 2 }).map((_, idx) => {
                                            const currentSizes = selectedField.options?.col_sizes || [];
                                            const val = currentSizes[idx] || '1fr';
                                            return (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <span className="text-[9px] font-semibold text-muted-foreground w-14 uppercase">Klm {idx + 1}:</span>
                                                    <Input
                                                        type="text"
                                                        value={val}
                                                        onChange={(e) => {
                                                            const newSizes = [...currentSizes];
                                                            while (newSizes.length <= idx) {
                                                                newSizes.push('1fr');
                                                            }
                                                            newSizes[idx] = e.target.value || '1fr';
                                                            bulkUpdateOptions(selectedIds, {
                                                                col_sizes: newSizes,
                                                            });
                                                        }}
                                                        className="h-7 text-[10px] font-sans px-2 flex-1"
                                                        placeholder="Contoh: 1fr, 200px, 50%"
                                                    />
                                                </div>
                                            );
                                        })}
                                        <p className="text-[7px] text-muted-foreground/60 leading-relaxed mt-1">
                                            Gunakan satuan CSS seperti <b>1fr</b> (lebar merata), <b>px</b> (pixel), atau <b>%</b>.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Grid Gap (px)</Label>
                                        <Input
                                            type="number"
                                            value={selectedField.options?.gap ?? ''}
                                            onChange={(e) =>
                                                bulkUpdateOptions(selectedIds, {
                                                    gap: parseNumber(e.target.value, 16),
                                                })
                                            }
                                            className="h-8 font-sans text-[11px]"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Height (px)</Label>
                                        <Input
                                            type="number"
                                            value={selectedField.options?.height ?? ''}
                                            onChange={(e) =>
                                                bulkUpdateOptions(selectedIds, {
                                                    height: parseNumberOrUndefined(e.target.value),
                                                })
                                            }
                                            className="h-8 font-sans text-[11px]"
                                            placeholder="Otomatis"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedField.type === 'grid_y' && (
                            <div className="border-border space-y-4 border-t pt-4">
                                <div className="flex items-center gap-2">
                                    <Layout size={12} className="text-muted-foreground" />
                                    <h4 className="font-sans text-[9px] font-semibold uppercase">Vertical Grid Layout</h4>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Grid Gap (px)</Label>
                                        <Input
                                            type="number"
                                            value={selectedField.options?.gap ?? ''}
                                            onChange={(e) =>
                                                bulkUpdateOptions(selectedIds, {
                                                    gap: parseNumber(e.target.value, 16),
                                                })
                                            }
                                            className="h-8 font-sans text-[11px]"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Height (px)</Label>
                                        <Input
                                            type="number"
                                            value={selectedField.options?.height ?? ''}
                                            onChange={(e) =>
                                                bulkUpdateOptions(selectedIds, {
                                                    height: parseNumberOrUndefined(e.target.value),
                                                })
                                            }
                                            className="h-8 font-sans text-[11px]"
                                            placeholder="Otomatis"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Align Horizontal (Items)</Label>
                                        <select
                                            value={selectedField.options?.align_items || 'stretch'}
                                            onChange={(e) =>
                                                bulkUpdateOptions(selectedIds, {
                                                    align_items: e.target.value,
                                                })
                                            }
                                            className="border-input bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 py-1 font-sans text-[10px] font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                                        >
                                            <option value="flex-start">Kiri (Left)</option>
                                            <option value="center">Tengah (Center)</option>
                                            <option value="flex-end">Kanan (Right)</option>
                                            <option value="stretch">Penuh (Stretch)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Align Vertical (Justify)</Label>
                                        <select
                                            value={selectedField.options?.justify_content || 'flex-start'}
                                            onChange={(e) =>
                                                bulkUpdateOptions(selectedIds, {
                                                    justify_content: e.target.value,
                                                })
                                            }
                                            className="border-input bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 py-1 font-sans text-[10px] font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                                        >
                                            <option value="flex-start">Atas (Top)</option>
                                            <option value="center">Tengah (Center)</option>
                                            <option value="flex-end">Bawah (Bottom)</option>
                                            <option value="space-between">Rata Atas-Bawah (Space Between)</option>
                                            <option value="space-around">Rata Renggang (Space Around)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedField.type === 'labeled_value' && (
                            <div className="space-y-3 border border-border/50 rounded-lg p-3 bg-muted/10">
                                <Label className="text-muted-foreground font-sans text-[8px] font-semibold uppercase tracking-wider">Pengaturan Label : Nilai</Label>

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

                    </div>

                    {/* Typography */}
                    {[
                        'static_text',
                        'labeled_value',
                        'textfield',
                        'textarea',
                        'searchable_select',
                        'number',
                        'date',
                        'signature_box',
                        'f1_header',
                    ].includes(selectedField.type) && (
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
                                            textAlign: (selectedField.options?.text_align ||
                                                selectedField.options?.alignment ||
                                                'left') as any,
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
                                        <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">
                                            Weight (Selection / Value)
                                        </Label>
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
                                                className="h-8 px-2 font-sans text-[10px] italic font-semibold"
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
                                                className="h-8 px-2 font-sans text-[10px] underline font-semibold"
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
                                                className="h-8 w-8 rounded-md border border-border"
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
                                                    className="h-5 w-5 rounded border border-border flex items-center justify-center text-[8px] font-semibold hover:scale-110 transition-transform"
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
                                                    (selectedField.options?.text_align ||
                                                        selectedField.options?.alignment ||
                                                        'left') === a.value
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
                        )}

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
                                            number_format:
                                                e.target.value === 'legal'
                                                    ? 'Pasal {n}'
                                                    : e.target.value === 'number'
                                                        ? '{n}.'
                                                        : '',
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

                            {(selectedField.options?.list_type === 'number' ||
                                selectedField.options?.list_type === 'legal') && (
                                    <div className="animate-in slide-in-from-top-1 space-y-1.5">
                                        <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">
                                            Format (use {'{n}'})
                                        </Label>
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

                    {/* Image & Branding */}
                    {['image', 'f1_header'].includes(selectedField.type) && (
                        <div className="border-border space-y-4 border-t pt-4">
                            <div className="flex items-center gap-2">
                                <ImageIcon size={12} className="text-muted-foreground" />
                                <h4 className="font-sans text-[9px] font-semibold uppercase">Image & Branding</h4>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">
                                    Logo / Image URL
                                </Label>
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

                            {/* Sizing is handled in the general section below */}

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
                        </div>
                    )}

                    {/* Sizing (Width & Height) */}
                    <div className="border-border space-y-4 border-t pt-4">
                        <div className="flex items-center gap-2">
                            <Ruler size={12} className="text-muted-foreground" />
                            <h4 className="font-sans text-[9px] font-semibold uppercase">Sizing (Width & Height)</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">
                                    Custom Width
                                </Label>
                                <Input
                                    value={selectedField.options?.width ?? ''}
                                    onChange={(e) =>
                                        bulkUpdateOptions(selectedIds, {
                                            width: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. 100%, 150px, auto"
                                    className="h-8 font-sans text-[11px]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">
                                    Custom Height
                                </Label>
                                <Input
                                    value={selectedField.options?.height ?? ''}
                                    onChange={(e) =>
                                        bulkUpdateOptions(selectedIds, {
                                            height: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. 80px, auto"
                                    className="h-8 font-sans text-[11px]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Spacing & Padding */}
                    <div className="border-border space-y-4 border-t pt-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Maximize2 size={12} className="text-muted-foreground" />
                                <h4 className="font-sans text-[9px] font-semibold uppercase">Spacing & Padding</h4>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowIndividualPadding(!showIndividualPadding)}
                                className="h-6 px-2 text-[8px] font-semibold uppercase flex items-center gap-1"
                            >
                                {showIndividualPadding ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                                Individual Sides
                            </Button>
                        </div>

                        {!showIndividualPadding ? (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Padding X (mm)</Label>
                                    <Input
                                        type="number"
                                        value={selectedField.options?.padding_x ?? ''}
                                        onChange={(e) =>
                                            bulkUpdateOptions(selectedIds, {
                                                padding_x: parseNumber(e.target.value, 0),
                                            })
                                        }
                                        className="h-8 font-sans text-[11px]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Padding Y (mm)</Label>
                                    <Input
                                        type="number"
                                        value={selectedField.options?.padding_y ?? ''}
                                        onChange={(e) =>
                                            bulkUpdateOptions(selectedIds, {
                                                padding_y: parseNumber(e.target.value, 0),
                                            })
                                        }
                                        className="h-8 font-sans text-[11px]"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Padding Top</Label>
                                    <Input
                                        type="number"
                                        value={selectedField.options?.padding_top ?? ''}
                                        onChange={(e) =>
                                            bulkUpdateOptions(selectedIds, {
                                                padding_top: parseNumber(e.target.value, 0),
                                            })
                                        }
                                        className="h-8 font-sans text-[11px]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Padding Bottom</Label>
                                    <Input
                                        type="number"
                                        value={selectedField.options?.padding_bottom ?? ''}
                                        onChange={(e) =>
                                            bulkUpdateOptions(selectedIds, {
                                                padding_bottom: parseNumber(e.target.value, 0),
                                            })
                                        }
                                        className="h-8 font-sans text-[11px]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Padding Left</Label>
                                    <Input
                                        type="number"
                                        value={selectedField.options?.padding_left ?? ''}
                                        onChange={(e) =>
                                            bulkUpdateOptions(selectedIds, {
                                                padding_left: parseNumber(e.target.value, 0),
                                            })
                                        }
                                        className="h-8 font-sans text-[11px]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Padding Right</Label>
                                    <Input
                                        type="number"
                                        value={selectedField.options?.padding_right ?? ''}
                                        onChange={(e) =>
                                            bulkUpdateOptions(selectedIds, {
                                                padding_right: parseNumber(e.target.value, 0),
                                            })
                                        }
                                        className="h-8 font-sans text-[11px]"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Spacing & Margin */}
                    <div className="border-border space-y-4 border-t pt-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layout size={12} className="text-muted-foreground" />
                                <h4 className="font-sans text-[9px] font-semibold uppercase">Spacing & Margin (mm)</h4>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowIndividualMargin(!showIndividualMargin)}
                                className="h-6 px-2 text-[8px] font-semibold uppercase flex items-center gap-1"
                            >
                                {showIndividualMargin ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                                Individual Sides
                            </Button>
                        </div>

                        {!showIndividualMargin ? (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Margin X</Label>
                                    <Input
                                        type="number"
                                        value={selectedField.options?.margin_x ?? ''}
                                        onChange={(e) =>
                                            bulkUpdateOptions(selectedIds, {
                                                margin_x: parseNumber(e.target.value, 0),
                                            })
                                        }
                                        className="h-8 font-sans text-[11px]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Margin Y</Label>
                                    <Input
                                        type="number"
                                        value={selectedField.options?.margin_y ?? ''}
                                        onChange={(e) =>
                                            bulkUpdateOptions(selectedIds, {
                                                margin_y: parseNumber(e.target.value, 0),
                                            })
                                        }
                                        className="h-8 font-sans text-[11px]"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Margin Top</Label>
                                    <Input
                                        type="number"
                                        value={selectedField.options?.margin_top ?? ''}
                                        onChange={(e) =>
                                            bulkUpdateOptions(selectedIds, {
                                                margin_top: parseNumber(e.target.value, 0),
                                            })
                                        }
                                        className="h-8 font-sans text-[11px]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Margin Bottom</Label>
                                    <Input
                                        type="number"
                                        value={selectedField.options?.margin_bottom ?? ''}
                                        onChange={(e) =>
                                            bulkUpdateOptions(selectedIds, {
                                                margin_bottom: parseNumber(e.target.value, 0),
                                            })
                                        }
                                        className="h-8 font-sans text-[11px]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Margin Left</Label>
                                    <Input
                                        type="number"
                                        value={selectedField.options?.margin_left ?? ''}
                                        onChange={(e) =>
                                            bulkUpdateOptions(selectedIds, {
                                                margin_left: parseNumber(e.target.value, 0),
                                            })
                                        }
                                        className="h-8 font-sans text-[11px]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Margin Right</Label>
                                    <Input
                                        type="number"
                                        value={selectedField.options?.margin_right ?? ''}
                                        onChange={(e) =>
                                            bulkUpdateOptions(selectedIds, {
                                                margin_right: parseNumber(e.target.value, 0),
                                            })
                                        }
                                        className="h-8 font-sans text-[11px]"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Borders & Styling */}
                    {['group', 'grid_x', 'grid_y', 'static_text'].includes(selectedField.type) && (
                        <div className="border-border space-y-4 border-t pt-4">
                            <div className="flex items-center gap-2">
                                <Layout size={12} className="text-muted-foreground" />
                                <h4 className="font-sans text-[9px] font-semibold uppercase">Borders & Style</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Border Style</Label>
                                    <select
                                        value={selectedField.options?.border_style || 'none'}
                                        onChange={(e) =>
                                            bulkUpdateOptions(selectedIds, {
                                                border_style: e.target.value,
                                            })
                                        }
                                        className="border-input bg-background h-8 w-full rounded-md border px-2 font-sans text-[10px] font-medium"
                                    >
                                        <option value="none">None</option>
                                        <option value="solid">Solid</option>
                                        <option value="dashed">Dashed</option>
                                        <option value="dotted">Dotted</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">
                                        Border Width (px)
                                    </Label>
                                    <Input
                                        type="number"
                                        value={selectedField.options?.border_width ?? ''}
                                        onChange={(e) =>
                                            bulkUpdateOptions(selectedIds, {
                                                border_width: parseNumber(e.target.value, 0),
                                            })
                                        }
                                        className="h-8 font-sans text-[11px]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Border Color</Label>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="h-8 w-8 rounded-md border border-border"
                                            style={{
                                                backgroundColor: selectedField.options?.border_color || '#000000',
                                            }}
                                        />
                                        <Input
                                            type="color"
                                            value={selectedField.options?.border_color || '#000000'}
                                            onChange={(e) =>
                                                bulkUpdateOptions(selectedIds, {
                                                    border_color: e.target.value,
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
                                                onClick={() => bulkUpdateOptions(selectedIds, { border_color: p.color })}
                                                className="h-5 w-5 rounded border border-border flex items-center justify-center text-[8px] font-semibold hover:scale-110 transition-transform"
                                                style={{ backgroundColor: p.color, color: '#fff', textShadow: '0 0 2px rgba(0,0,0,0.5)' }}
                                                title={`Gunakan ${p.title}`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
