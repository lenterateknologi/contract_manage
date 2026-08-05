import { Button } from '@/components/ui/buttons/Button';
import { Input } from '@/components/ui/inputs/Input';
import { Label } from '@/components/ui/forms/Label';
import { ChevronDown, ChevronRight, Columns, Layout, Maximize2, Ruler } from 'lucide-react';
import React from 'react';
import { parseNumber, parseNumberOrUndefined } from './utils';

interface LayoutSettingsProps {
    selectedField: any;
    selectedIds: string[];
    bulkUpdateOptions: (ids: string[], optionsUpdate: any) => void;
    templateData: any;
}

export const LayoutSettings: React.FC<LayoutSettingsProps> = ({ selectedField, selectedIds, bulkUpdateOptions, templateData }) => {
    const [showIndividualPadding, setShowIndividualPadding] = React.useState(false);
    const [showIndividualMargin, setShowIndividualMargin] = React.useState(false);

    return (
        <div className="space-y-4">
            {/* Group Settings */}
            {selectedField.type === 'group' && (
                <div className="border-border space-y-4 border-t pt-4">
                    <div className="flex items-center gap-2">
                        <Layout size={12} className="text-muted-foreground" />
                        <h4 className="font-sans text-[9px] font-semibold uppercase">Group Layout</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Align Horizontal (X)</Label>
                            <select
                                value={selectedField.options?.justify_content || 'flex-start'}
                                onChange={(e) =>
                                    bulkUpdateOptions(selectedIds, {
                                        justify_content: e.target.value,
                                    })
                                }
                                className="border-input bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 py-1 font-sans text-[10px] font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                            >
                                <option value="flex-start">Kiri (Left)</option>
                                <option value="center">Tengah (Center)</option>
                                <option value="flex-end">Kanan (Right)</option>
                                <option value="space-between">Space Between</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Align Vertical (Y)</Label>
                            <select
                                value={selectedField.options?.align_items || 'flex-start'}
                                onChange={(e) =>
                                    bulkUpdateOptions(selectedIds, {
                                        align_items: e.target.value,
                                    })
                                }
                                className="border-input bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 py-1 font-sans text-[10px] font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                            >
                                <option value="flex-start">Atas (Top)</option>
                                <option value="center">Tengah (Center)</option>
                                <option value="flex-end">Bawah (Bottom)</option>
                                <option value="stretch">Penuh (Stretch)</option>
                                <option value="baseline">Garis Bawah Teks (Baseline)</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Grid X Settings */}
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



                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Align Horizontal (X)</Label>
                            <select
                                value={selectedField.options?.justify_content || 'stretch'}
                                onChange={(e) =>
                                    bulkUpdateOptions(selectedIds, {
                                        justify_content: e.target.value,
                                    })
                                }
                                className="border-input bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 py-1 font-sans text-[10px] font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                            >
                                <option value="stretch">Penuh (Stretch)</option>
                                <option value="start">Kiri (Start)</option>
                                <option value="center">Tengah (Center)</option>
                                <option value="end">Kanan (End)</option>
                                <option value="space-between">Space Between</option>
                                <option value="space-around">Space Around</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Align Vertical (Y)</Label>
                            <select
                                value={selectedField.options?.align_items || 'stretch'}
                                onChange={(e) =>
                                    bulkUpdateOptions(selectedIds, {
                                        align_items: e.target.value,
                                    })
                                }
                                className="border-input bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 py-1 font-sans text-[10px] font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                            >
                                <option value="stretch">Penuh (Stretch)</option>
                                <option value="start">Atas (Top)</option>
                                <option value="center">Tengah (Center)</option>
                                <option value="end">Bawah (Bottom)</option>
                                <option value="baseline">Baseline</option>
                            </select>
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

            {/* Grid Y Settings */}
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

            {/* Sizing (Width & Height) */}
            <div className="border-border space-y-4 border-t pt-4">
                <div className="flex items-center gap-2">
                    <Ruler size={12} className="text-muted-foreground" />
                    <h4 className="font-sans text-[9px] font-semibold uppercase">Sizing (Width & Height)</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Custom Width</Label>
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
                        <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Custom Height</Label>
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

            {/* Combined Spacing & Border Section */}
            <div className="border-border space-y-3 border-t pt-3">
                <div className="flex items-center gap-2">
                    <Ruler size={12} className="text-muted-foreground" />
                    <h4 className="font-sans text-[9px] font-semibold uppercase">Spacing & Border</h4>
                </div>

                {/* Padding LRTB */}
                <div className="space-y-1">
                    <Label className="text-muted-foreground font-sans text-[7px] font-medium uppercase">Padding (mm)</Label>
                    <div className="grid grid-cols-4 gap-1">
                        {[
                            { key: 'padding_top', label: 'Top' },
                            { key: 'padding_bottom', label: 'Bottom' },
                            { key: 'padding_left', label: 'Left' },
                            { key: 'padding_right', label: 'Right' },
                        ].map((p) => (
                            <div key={p.key} className="space-y-0.5">
                                <span className="text-muted-foreground block text-center font-sans text-[7px] uppercase">{p.label}</span>
                                <Input
                                    type="number"
                                    value={selectedField.options?.[p.key] ?? 0}
                                    onChange={(e) =>
                                        bulkUpdateOptions(selectedIds, {
                                            [p.key]: parseNumber(e.target.value, 0),
                                        })
                                    }
                                    className="h-6 text-center font-sans text-[10px] px-1"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Margin LRTB */}
                <div className="space-y-1">
                    <Label className="text-muted-foreground font-sans text-[7px] font-medium uppercase">Margin (mm)</Label>
                    <div className="grid grid-cols-4 gap-1">
                        {[
                            { key: 'margin_top', label: 'Top' },
                            { key: 'margin_bottom', label: 'Bottom' },
                            { key: 'margin_left', label: 'Left' },
                            { key: 'margin_right', label: 'Right' },
                        ].map((m) => (
                            <div key={m.key} className="space-y-0.5">
                                <span className="text-muted-foreground block text-center font-sans text-[7px] uppercase">{m.label}</span>
                                <Input
                                    type="number"
                                    value={selectedField.options?.[m.key] ?? 0}
                                    onChange={(e) =>
                                        bulkUpdateOptions(selectedIds, {
                                            [m.key]: parseNumber(e.target.value, 0),
                                        })
                                    }
                                    className="h-6 text-center font-sans text-[10px] px-1"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Border Options */}
                {['group', 'grid_x', 'grid_y', 'static_text', 'labeled_value'].includes(selectedField.type) && (
                    <div className="space-y-1.5 pt-1">
                        <Label className="text-muted-foreground font-sans text-[7px] font-medium uppercase">Border Style & Color</Label>
                        <div className="grid grid-cols-3 gap-1.5 items-center">
                            <select
                                value={selectedField.options?.border_style || 'none'}
                                onChange={(e) =>
                                    bulkUpdateOptions(selectedIds, {
                                        border_style: e.target.value,
                                    })
                                }
                                className="border-input bg-background h-7 rounded-md border px-1.5 font-sans text-[10px] outline-none"
                            >
                                <option value="none">None</option>
                                <option value="solid">Solid</option>
                                <option value="dashed">Dashed</option>
                                <option value="dotted">Dotted</option>
                            </select>
                            <Input
                                type="number"
                                value={selectedField.options?.border_width ?? 1}
                                onChange={(e) =>
                                    bulkUpdateOptions(selectedIds, {
                                        border_width: parseNumber(e.target.value, 0),
                                    })
                                }
                                className="h-7 text-center font-sans text-[10px] px-1"
                                placeholder="Width px"
                            />
                            <Input
                                type="color"
                                value={selectedField.options?.border_color || '#000000'}
                                onChange={(e) =>
                                    bulkUpdateOptions(selectedIds, {
                                        border_color: e.target.value,
                                    })
                                }
                                className="h-7 w-full p-0.5 cursor-pointer rounded-md border"
                                title="Border Color"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
