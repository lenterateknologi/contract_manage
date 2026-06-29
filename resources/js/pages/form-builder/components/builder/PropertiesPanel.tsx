import { Button } from '@/components/ui/buttons/Button';
import { Edit3, Layout, Trash2 } from 'lucide-react';
import React from 'react';
import { GeneralSettings } from './properties/GeneralSettings';
import { LayoutSettings } from './properties/LayoutSettings';
import { PageSettings } from './properties/PageSettings';
import { TypographySettings } from './properties/TypographySettings';

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
    const isBulk = selectedFields.length > 1;
    const allSameType = isBulk && selectedFields.every((f) => f.type === selectedFields[0].type);
    const selectedField = isBulk ? (allSameType ? selectedFields[0] : null) : selectedFields[0];
    const selectedIds = selectedFields.map((f) => f.id);

    // 1. No elements selected: render Document/Page Margins and Theme colors settings
    if (selectedFields.length === 0) {
        return <PageSettings templateData={templateData} setTemplateData={setTemplateData} />;
    }

    // 2. Bulk selection of different element types: render type mismatch warning
    if (isBulk && !allSameType) {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 flex h-[200px] flex-col items-center justify-center space-y-4 rounded-xl border border-dashed p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
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

    // 3. Selection exists (single or same-type bulk): render element property panels
    return (
        <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
            {/* Header / ID Info */}
            <div className="bg-muted/30 flex flex-col gap-2.5 rounded-lg p-3">
                <div className="flex items-center justify-between">
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
                            className="flex h-8 items-center gap-1.5 px-3 text-[9px] font-semibold uppercase shadow-sm transition-all active:scale-95"
                        >
                            <Trash2 size={12} /> Hapus
                        </Button>
                    )}
                </div>
                {!isBulk && (
                    <div className="border-border/50 flex flex-col gap-1 border-t pt-2 font-sans text-[10px]">
                        <div className="text-muted-foreground flex items-center justify-between">
                            <span>Tipe Elemen:</span>
                            <span className="text-foreground font-semibold uppercase">{selectedField.type}</span>
                        </div>
                        {selectedField.label && (
                            <div className="text-muted-foreground flex items-center justify-between">
                                <span>Label Elemen:</span>
                                <span className="text-foreground max-w-[150px] truncate font-semibold" title={selectedField.label}>
                                    {selectedField.label}
                                </span>
                            </div>
                        )}
                        {selectedField.name && (
                            <div className="text-muted-foreground flex items-center justify-between">
                                <span>Key / Name:</span>
                                <span className="text-foreground max-w-[150px] truncate font-mono font-semibold" title={selectedField.name}>
                                    {selectedField.name}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {/* 1. General, Meta Key, Block Width, Image & Labeled Value settings */}
                <GeneralSettings
                    selectedField={selectedField}
                    selectedIds={selectedIds}
                    isBulk={isBulk}
                    updateField={updateField}
                    bulkUpdateOptions={bulkUpdateOptions}
                />

                {/* 2. Grid systems, Spacing (margin/padding), Borders & Sizing */}
                <LayoutSettings
                    selectedField={selectedField}
                    selectedIds={selectedIds}
                    bulkUpdateOptions={bulkUpdateOptions}
                    templateData={templateData}
                />

                {/* 3. Fonts, text styles, alignment, presets and numbering lists */}
                <TypographySettings
                    selectedField={selectedField}
                    selectedIds={selectedIds}
                    bulkUpdateOptions={bulkUpdateOptions}
                    templateData={templateData}
                />
            </div>
        </div>
    );
};
