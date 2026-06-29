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

                    <div className="space-y-2">
                        <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Lebar Kolom (Width)</Label>
                        <div className="bg-muted/20 border-border/50 space-y-2 rounded-lg border p-3">
                            {Array.from({ length: selectedField.options?.grid_cols || 2 }).map((_, idx) => {
                                const currentSizes = selectedField.options?.col_sizes || [];
                                const val = currentSizes[idx] || '1fr';
                                return (
                                    <div key={idx} className="flex items-center gap-2">
                                        <span className="text-muted-foreground w-14 text-[9px] font-semibold uppercase">Klm {idx + 1}:</span>
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
                                            className="h-7 flex-1 px-2 font-sans text-[10px]"
                                            placeholder="Contoh: 1fr, 200px, 50%"
                                        />
                                    </div>
                                );
                            })}
                            <p className="text-muted-foreground/60 mt-1 text-[7px] leading-relaxed">
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
                        className="flex h-6 items-center gap-1 px-2 text-[8px] font-semibold uppercase"
                    >
                        {showIndividualPadding ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        Individual Sides
                    </Button>
                </div>

                {!showIndividualPadding ? (
                    <div className="animate-in fade-in zoom-in-95 grid grid-cols-2 gap-4 duration-200">
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
                    <div className="animate-in fade-in slide-in-from-top-2 grid grid-cols-2 gap-x-4 gap-y-3 duration-200">
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
                        className="flex h-6 items-center gap-1 px-2 text-[8px] font-semibold uppercase"
                    >
                        {showIndividualMargin ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        Individual Sides
                    </Button>
                </div>

                {!showIndividualMargin ? (
                    <div className="animate-in fade-in zoom-in-95 grid grid-cols-2 gap-4 duration-200">
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
                    <div className="animate-in fade-in slide-in-from-top-2 grid grid-cols-2 gap-x-4 gap-y-3 duration-200">
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
                            <Label className="text-muted-foreground font-sans text-[8px] font-medium uppercase">Border Width (px)</Label>
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
                                    className="border-border h-8 w-8 rounded-md border"
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
                </div>
            )}
        </div>
    );
};
