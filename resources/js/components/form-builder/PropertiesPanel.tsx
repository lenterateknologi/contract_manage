import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/base/Label';
import { Input } from '@/components/ui/base/Input';
import { Textarea } from '@/components/ui/base/Textarea';
import { Button } from '@/components/ui/base/Button';
import { 
    Edit3, 
    Layout, 
    Move, 
    Type, 
    AlignLeft, 
    AlignCenter, 
    AlignRight, 
    List,
    Image as ImageIcon
} from 'lucide-react';

interface PropertiesPanelProps {
    selectedField: any | null;
    updateField: (id: string, key: any, value: any) => void;
    templateData: any;
    setTemplateData: (key: string, value: any) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
    selectedField,
    updateField,
    templateData,
    setTemplateData
}) => {
    if (!selectedField) {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
                <div className="bg-primary/10 flex items-center gap-3 rounded-xl p-4">
                    <div className="bg-primary text-white rounded-lg p-2">
                        <Layout size={20} />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-semibold font-sans tracking-widest uppercase">Konfigurasi Halaman</h3>
                        <p className="text-muted-foreground text-[8px] font-medium">Atur ukuran dan margin dokumen A4</p>
                    </div>
                </div>

                <div className="border-border space-y-4 border-t pt-6">
                    <div className="flex items-center gap-2">
                        <Move size={12} className="text-muted-foreground" />
                        <h4 className="text-[9px] font-semibold font-sans tracking-widest uppercase">Margin Dokumen (mm)</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground text-[8px] font-medium font-sans uppercase">Margin Atas</Label>
                            <Input
                                type="number"
                                value={templateData.letterhead_json?.margins?.top ?? 15}
                                onChange={(e) => setTemplateData('letterhead_json', {
                                    ...templateData.letterhead_json,
                                    margins: { ...(templateData.letterhead_json?.margins ?? { top: 15, bottom: 15, left: 15, right: 15 }), top: parseInt(e.target.value) || 0 }
                                })}
                                className="h-9 text-[11px] font-sans"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground text-[8px] font-medium font-sans uppercase">Margin Bawah</Label>
                            <Input
                                type="number"
                                value={templateData.letterhead_json?.margins?.bottom ?? 15}
                                onChange={(e) => setTemplateData('letterhead_json', {
                                    ...templateData.letterhead_json,
                                    margins: { ...(templateData.letterhead_json?.margins ?? { top: 15, bottom: 15, left: 15, right: 15 }), bottom: parseInt(e.target.value) || 0 }
                                })}
                                className="h-9 text-[11px] font-sans"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground text-[8px] font-medium font-sans uppercase">Margin Kiri</Label>
                            <Input
                                type="number"
                                value={templateData.letterhead_json?.margins?.left ?? 15}
                                onChange={(e) => setTemplateData('letterhead_json', {
                                    ...templateData.letterhead_json,
                                    margins: { ...(templateData.letterhead_json?.margins ?? { top: 15, bottom: 15, left: 15, right: 15 }), left: parseInt(e.target.value) || 0 }
                                })}
                                className="h-9 text-[11px] font-sans"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground text-[8px] font-medium font-sans uppercase">Margin Kanan</Label>
                            <Input
                                type="number"
                                value={templateData.letterhead_json?.margins?.right ?? 15}
                                onChange={(e) => setTemplateData('letterhead_json', {
                                    ...templateData.letterhead_json,
                                    margins: { ...(templateData.letterhead_json?.margins ?? { top: 15, bottom: 15, left: 15, right: 15 }), right: parseInt(e.target.value) || 0 }
                                })}
                                className="h-9 text-[11px] font-sans"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-muted/30 mt-8 rounded-lg p-4 text-center">
                    <p className="text-muted-foreground/60 text-[9px] font-medium leading-relaxed">
                        Pilih elemen di canvas untuk mengatur properti spesifik elemen tersebut.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
            {/* Header ID */}
            <div className="bg-muted/30 flex items-center justify-between rounded-lg p-3">
                <div>
                    <span className="text-muted-foreground block text-[8px] font-medium font-sans uppercase">Element ID</span>
                    <code className="text-primary text-[10px] font-semibold font-sans">{selectedField.name}</code>
                </div>
                <div className="bg-primary/20 text-primary flex h-6 w-6 items-center justify-center rounded-full">
                    <Edit3 size={12} />
                </div>
            </div>

            {/* MAIN PROPS */}
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold font-sans tracking-widest uppercase">Internal Key</Label>
                    <Input
                        value={selectedField.name}
                        onChange={(e) => updateField(selectedField.id, 'name', e.target.value)}
                        className="h-9 font-mono text-[11px]"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold font-sans tracking-widest uppercase">Label Content</Label>
                    <Input
                        value={selectedField.label}
                        onChange={(e) => updateField(selectedField.id, 'label', e.target.value)}
                        className="h-9 text-[11px] font-sans"
                    />
                </div>
            </div>

            {/* DYNAMIC OPTIONS */}
            <div className="border-border mt-8 border-t pt-6">
                <div className="mb-4 flex items-center gap-2">
                    <div className="bg-primary h-1 w-4 rounded-full" />
                    <h3 className="text-[10px] font-semibold font-sans tracking-[0.2em] uppercase">Visual Options</h3>
                </div>

                <div className="space-y-6">
                    {/* Common Styling: Spacing & Layout */}
                    <div className="border-border space-y-4 border-t pt-4">
                        <div className="flex items-center gap-2">
                            <Move size={12} className="text-muted-foreground" />
                            <h4 className="text-[9px] font-semibold font-sans tracking-widest uppercase">Spacing & Layout</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground text-[8px] font-medium font-sans uppercase">
                                    Margin Top (mm)
                                </Label>
                                <Input
                                    type="number"
                                    value={selectedField.options?.margin_top ?? 0}
                                    onChange={(e) =>
                                        updateField(selectedField.id, 'options', {
                                            ...selectedField.options,
                                            margin_top: parseInt(e.target.value) || 0,
                                        })
                                    }
                                    className="h-8 text-[11px] font-sans"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground text-[8px] font-medium font-sans uppercase">
                                    Margin Bottom (mm)
                                </Label>
                                <Input
                                    type="number"
                                    value={selectedField.options?.margin_bottom ?? 0}
                                    onChange={(e) =>
                                        updateField(selectedField.id, 'options', {
                                            ...selectedField.options,
                                            margin_bottom: parseInt(e.target.value) || 0,
                                        })
                                    }
                                    className="h-8 text-[11px] font-sans"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground text-[8px] font-medium font-sans uppercase">
                                    Margin Left (mm)
                                </Label>
                                <Input
                                    type="number"
                                    value={selectedField.options?.margin_left ?? 0}
                                    onChange={(e) =>
                                        updateField(selectedField.id, 'options', {
                                            ...selectedField.options,
                                            margin_left: parseInt(e.target.value) || 0,
                                        })
                                    }
                                    className="h-8 text-[11px] font-sans"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground text-[8px] font-medium font-sans uppercase">
                                    Margin Right (mm)
                                </Label>
                                <Input
                                    type="number"
                                    value={selectedField.options?.margin_right ?? 0}
                                    onChange={(e) =>
                                        updateField(selectedField.id, 'options', {
                                            ...selectedField.options,
                                            margin_right: parseInt(e.target.value) || 0,
                                        })
                                    }
                                    className="h-8 text-[11px] font-sans"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground group-hover:text-primary text-[8px] font-medium font-sans uppercase transition-colors">
                                    Spacing Before (mm)
                                </Label>
                                <Input
                                    type="number"
                                    value={selectedField.options?.spacing_before ?? 0}
                                    onChange={(e) =>
                                        updateField(selectedField.id, 'options', {
                                            ...selectedField.options,
                                            spacing_before: parseInt(e.target.value) || 0,
                                        })
                                    }
                                    className="focus:ring-primary/20 h-8 text-[11px] font-bold"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground group-hover:text-primary text-[8px] font-medium font-sans uppercase transition-colors">
                                    Spacing After (mm)
                                </Label>
                                <Input
                                    type="number"
                                    value={selectedField.options?.spacing_after ?? 0}
                                    onChange={(e) =>
                                        updateField(selectedField.id, 'options', {
                                            ...selectedField.options,
                                            spacing_after: parseInt(e.target.value) || 0,
                                        })
                                    }
                                    className="focus:ring-primary/20 h-8 text-[11px] font-bold"
                                />
                            </div>
                        </div>

                        {['static_text', 'labeled_value'].includes(selectedField.type) && (
                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground text-[8px] font-medium font-sans uppercase">
                                    First Line Indent (mm)
                                </Label>
                                <Input
                                    type="number"
                                    value={selectedField.options?.first_line_indent ?? 0}
                                    onChange={(e) =>
                                        updateField(selectedField.id, 'options', {
                                            ...selectedField.options,
                                            first_line_indent: parseInt(e.target.value) || 0,
                                        })
                                    }
                                    className="h-8 text-[11px] font-sans"
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-semibold font-sans tracking-widest uppercase">Block Width</Label>
                            <select
                                value={selectedField.width || '100'}
                                onChange={(e) => updateField(selectedField.id, 'width', e.target.value)}
                                className="border-input bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 py-1 text-[10px] font-medium font-sans shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                            >
                                {['20', '25', '35', '50', '65', '75', '100'].map((w) => (
                                    <option key={w} value={w}>
                                        {w}% Width
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedField.type === 'labeled_value' && (
                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground text-[8px] font-medium font-sans uppercase">
                                    Value Input Type
                                </Label>
                                <select
                                    value={selectedField.options?.value_type || 'textfield'}
                                    onChange={(e) =>
                                        updateField(selectedField.id, 'options', {
                                            ...selectedField.options,
                                            value_type: e.target.value,
                                        })
                                    }
                                    className="border-input bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 py-1 text-[10px] font-medium font-sans shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                                >
                                    <option value="textfield">Text</option>
                                    <option value="number">Number</option>
                                    <option value="date">Date</option>
                                    <option value="searchable_select">Dropdown</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Typography */}
                    {['static_text', 'labeled_value', 'textfield', 'number', 'date', 'signature_box'].includes(
                        selectedField.type,
                    ) && (
                        <div className="border-border space-y-4 border-t pt-4">
                            <div className="flex items-center gap-2">
                                <Type size={12} className="text-muted-foreground" />
                                <h4 className="text-[9px] font-semibold font-sans tracking-widest uppercase">Typography</h4>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground text-[8px] font-medium font-sans uppercase">
                                    Font Family
                                </Label>
                                <select
                                    value={selectedField.options?.font_family || "'Montserrat', sans-serif"}
                                    onChange={(e) =>
                                        updateField(selectedField.id, 'options', {
                                            ...selectedField.options,
                                            font_family: e.target.value,
                                        })
                                    }
                                    className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-2 py-1 text-[11px] font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                                    style={{ fontFamily: selectedField.options?.font_family || "'Montserrat', sans-serif" }}
                                >
                                    <option value="'Montserrat', sans-serif" style={{ fontFamily: 'Montserrat' }}>Montserrat — Tema Aplikasi</option>
                                    <option value="'Inter', sans-serif" style={{ fontFamily: 'Inter' }}>Inter — Modern UI</option>
                                    <option value="sans-serif" style={{ fontFamily: 'Arial' }}>Arial / Sans-Serif</option>
                                    <option value="'Times New Roman', serif" style={{ fontFamily: 'Times New Roman' }}>Times New Roman — Formal</option>
                                    <option value="serif" style={{ fontFamily: 'Georgia' }}>Georgia / Serif</option>
                                    <option value="monospace" style={{ fontFamily: 'Courier New' }}>Courier — Monospace</option>
                                </select>
                                {/* Live font preview */}
                                <div
                                    className="rounded-md border border-dashed border-muted-foreground/20 px-3 py-2 text-[12px] text-muted-foreground/70"
                                    style={{ fontFamily: selectedField.options?.font_family || "'Montserrat', sans-serif" }}
                                >
                                    Pratinjau: Teks Kontrak
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground text-[8px] font-medium font-sans uppercase">
                                        Font Size (px)
                                    </Label>
                                    <Input
                                        type="number"
                                        value={selectedField.options?.font_size ?? 14}
                                        onChange={(e) =>
                                            updateField(selectedField.id, 'options', {
                                                ...selectedField.options,
                                                font_size: parseInt(e.target.value) || 14,
                                            })
                                        }
                                        className="h-8 text-[11px] font-sans"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground text-[8px] font-medium font-sans uppercase">
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
                                                variant={
                                                    (selectedField.options?.font_weight || 'normal') === w.v
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                className="h-8 w-8 text-[10px] font-semibold font-sans"
                                                onClick={() =>
                                                    updateField(selectedField.id, 'options', {
                                                        ...selectedField.options,
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

                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground text-[8px] font-medium font-sans uppercase">
                                    Text Alignment
                                </Label>
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
                                            className="h-8 gap-1.5 p-0 text-[7px] font-semibold font-sans uppercase"
                                            onClick={() =>
                                                updateField(selectedField.id, 'options', {
                                                    ...selectedField.options,
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

                            {/* List & Numbering */}
                            {selectedField.type === 'static_text' && (
                                <div className="border-border space-y-4 border-t pt-4">
                                    <div className="flex items-center gap-2">
                                        <List size={12} className="text-muted-foreground" />
                                        <h4 className="text-[9px] font-semibold font-sans tracking-widest text-emerald-600 uppercase">
                                            List & Numbering
                                        </h4>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-muted-foreground text-[8px] font-medium font-sans uppercase">
                                            List Type
                                        </Label>
                                        <select
                                            value={selectedField.options?.list_type || 'none'}
                                            onChange={(e) =>
                                                updateField(selectedField.id, 'options', {
                                                    ...selectedField.options,
                                                    list_type: e.target.value,
                                                    number_format:
                                                        e.target.value === 'legal'
                                                            ? 'Pasal {n}'
                                                            : e.target.value === 'number'
                                                              ? '{n}.'
                                                              : '',
                                                })
                                            }
                                            className="border-input bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 py-1 text-[10px] font-medium font-sans shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
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
                                            <Label className="text-muted-foreground text-[8px] font-medium font-sans uppercase">
                                                Format (use {'{n}'})
                                            </Label>
                                            <Input
                                                value={selectedField.options?.number_format || ''}
                                                onChange={(e) =>
                                                    updateField(selectedField.id, 'options', {
                                                        ...selectedField.options,
                                                        number_format: e.target.value,
                                                    })
                                                }
                                                className="h-8 text-[11px] font-sans"
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
                                        <h4 className="text-[9px] font-semibold font-sans tracking-widest uppercase">
                                            Image & Branding
                                        </h4>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-muted-foreground text-[8px] font-medium font-sans uppercase">
                                            Logo / Image URL
                                        </Label>
                                        <Input
                                            value={selectedField.options?.logo_url || selectedField.options?.url || ''}
                                            onChange={(e) =>
                                                updateField(selectedField.id, 'options', {
                                                    ...selectedField.options,
                                                    logo_url: e.target.value,
                                                    url: e.target.value,
                                                })
                                            }
                                            className="h-8 text-[10px] font-medium font-sans"
                                            placeholder="https://..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-muted-foreground text-[8px] font-medium font-sans uppercase">
                                                Width (px)
                                            </Label>
                                            <Input
                                                type="number"
                                                value={selectedField.options?.width || selectedField.options?.size || selectedField.options?.logo_size || 120}
                                                onChange={(e) =>
                                                    updateField(selectedField.id, 'options', {
                                                        ...selectedField.options,
                                                        width: parseInt(e.target.value) || 0,
                                                        size: parseInt(e.target.value) || 0, // Sync legacy
                                                    })
                                                }
                                                className="h-8 text-[11px] font-sans"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-muted-foreground text-[8px] font-medium font-sans uppercase">
                                                Height (px)
                                            </Label>
                                            <Input
                                                type="number"
                                                value={selectedField.options?.height || 0}
                                                onChange={(e) =>
                                                    updateField(selectedField.id, 'options', {
                                                        ...selectedField.options,
                                                        height: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                                className="h-8 text-[11px] font-sans"
                                                placeholder="Auto"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Borders & Styling */}
                            {['group', 'grid_x', 'grid_y', 'static_text'].includes(selectedField.type) && (
                                <div className="border-border space-y-4 border-t pt-4">
                                    <div className="flex items-center gap-2">
                                        <Layout size={12} className="text-muted-foreground" />
                                        <h4 className="text-[9px] font-semibold font-sans tracking-widest uppercase">Borders & Style</h4>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-muted-foreground text-[8px] font-medium font-sans uppercase">Border Style</Label>
                                            <select
                                                value={selectedField.options?.border_style || 'none'}
                                                onChange={(e) => updateField(selectedField.id, 'options', { ...selectedField.options, border_style: e.target.value })}
                                                className="border-input bg-background h-8 w-full rounded-md border px-2 text-[10px] font-medium font-sans"
                                            >
                                                <option value="none">None</option>
                                                <option value="solid">Solid</option>
                                                <option value="dashed">Dashed</option>
                                                <option value="dotted">Dotted</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-muted-foreground text-[8px] font-medium font-sans uppercase">Border Width (px)</Label>
                                            <Input
                                                type="number"
                                                value={selectedField.options?.border_width || 0}
                                                onChange={(e) => updateField(selectedField.id, 'options', { ...selectedField.options, border_width: parseInt(e.target.value) || 0 })}
                                                className="h-8 text-[11px] font-sans"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
