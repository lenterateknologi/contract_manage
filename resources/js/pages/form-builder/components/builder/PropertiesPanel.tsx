import { Button } from '@/components/ui/buttons/Button';
import { cn } from '@/lib/utils';
import { Edit3, Layout, Settings, Sliders, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
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
    onDuplicateField?: (ids: string | string[]) => void;
    onSaveAsCustomPreset?: (fieldId: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
    selectedFields,
    updateField,
    bulkUpdateOptions,
    templateData,
    setTemplateData,
    onRemoveField,
    onDuplicateField,
    onSaveAsCustomPreset,
}) => {
    const [activeTab, setActiveTab] = useState<'element' | 'template'>('element');
    const isBulk = selectedFields.length > 1;
    const allSameType = isBulk && selectedFields.every((f) => f.type === selectedFields[0].type);
    const selectedField = isBulk ? (allSameType ? selectedFields[0] : null) : selectedFields[0];
    const selectedIds = selectedFields.map((f) => f.id);

    // Switch to element tab automatically if field is selected
    React.useEffect(() => {
        if (selectedFields.length > 0) {
            setActiveTab('element');
        }
    }, [selectedFields.length]);

    return (
        <div className="animate-in fade-in slide-in-from-right-4 space-y-3">
            {/* Header Tabs: Element vs Template */}
            <div className="flex bg-slate-200/60 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200/80 dark:border-zinc-700/60">
                <button
                    type="button"
                    onClick={() => setActiveTab('element')}
                    className={cn(
                        'flex flex-1 items-center justify-center gap-1 rounded-lg py-1 text-[10px] font-semibold transition-all uppercase',
                        activeTab === 'element'
                            ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                    )}
                >
                    <Sliders size={12} />
                    <span>Element</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('template')}
                    className={cn(
                        'flex flex-1 items-center justify-center gap-1 rounded-lg py-1 text-[10px] font-semibold transition-all uppercase',
                        activeTab === 'template'
                            ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                    )}
                >
                    <Settings size={12} />
                    <span>Template</span>
                </button>
            </div>

            {/* TAB CONTENT: ELEMENT */}
            {activeTab === 'element' && (
                selectedFields.length === 0 ? (
                    <div className="text-slate-400 py-10 text-center font-sans text-[10px] font-medium">
                        Pilih elemen di canvas untuk melihat propertinya.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Header / ID Info */}
                        <div className="flex flex-col gap-1.5 border-b border-border/50 pb-2.5">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                    <span className="text-slate-400 dark:text-zinc-500 font-sans text-[8px] font-bold uppercase tracking-wider shrink-0">
                                        {isBulk ? 'Bulk' : 'ID:'}
                                    </span>
                                    {isBulk ? (
                                        <span className="bg-primary/10 text-primary truncate rounded px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase">
                                            {selectedFields.length} Terpilih ({selectedField?.type})
                                        </span>
                                    ) : (
                                        <span className="text-foreground truncate font-mono text-[10px] font-bold uppercase">
                                            #{selectedField?.id}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    {!isBulk && selectedField && onSaveAsCustomPreset && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => onSaveAsCustomPreset(selectedField.id)}
                                            className="flex h-5 items-center gap-1 px-1.5 text-[8px] font-bold uppercase rounded shadow-none transition-all"
                                            title="Simpan sebagai Custom Preset Kustom"
                                        >
                                            + Preset
                                        </Button>
                                    )}
                                    {onDuplicateField && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => onDuplicateField(selectedIds)}
                                            className="flex h-5 items-center gap-1 px-1.5 text-[8px] font-bold uppercase rounded shadow-none transition-all"
                                        >
                                            Duplikat
                                        </Button>
                                    )}
                                    {onRemoveField && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={() => onRemoveField(selectedIds)}
                                            className="flex h-5 items-center gap-1 px-1.5 text-[8px] font-bold uppercase rounded shadow-none transition-all"
                                        >
                                            <Trash2 size={9} /> Hapus
                                        </Button>
                                    )}
                                </div>
                            </div>
                            {!isBulk && selectedField && (
                                <div className="flex items-center gap-3 font-sans text-[9px] text-muted-foreground pt-0.5">
                                    <div>
                                        Tipe: <span className="text-foreground font-bold uppercase">{selectedField.type}</span>
                                    </div>
                                    {selectedField.name && (
                                        <div className="truncate" title={selectedField.name}>
                                            Key: <span className="text-foreground font-mono font-semibold">{selectedField.name}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {isBulk && !allSameType ? (
                            <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border border-dashed p-4 text-center">
                                <h3 className="font-sans text-[10px] font-semibold uppercase">Tipe Berbeda Terpilih</h3>
                                <p className="text-muted-foreground text-[9px]">Pilih elemen dengan tipe yang sama untuk pengeditan massal.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* General Settings */}
                                <GeneralSettings
                                    selectedField={selectedField}
                                    selectedIds={selectedIds}
                                    isBulk={isBulk}
                                    updateField={updateField}
                                    bulkUpdateOptions={bulkUpdateOptions}
                                />

                                {/* Layout Settings */}
                                <LayoutSettings
                                    selectedField={selectedField}
                                    selectedIds={selectedIds}
                                    bulkUpdateOptions={bulkUpdateOptions}
                                    templateData={templateData}
                                />

                                {/* Typography Settings */}
                                <TypographySettings
                                    selectedField={selectedField}
                                    selectedIds={selectedIds}
                                    bulkUpdateOptions={bulkUpdateOptions}
                                    templateData={templateData}
                                />
                            </div>
                        )}
                    </div>
                )
            )}

            {/* TAB CONTENT: TEMPLATE SETTINGS */}
            {activeTab === 'template' && (
                <PageSettings templateData={templateData} setTemplateData={setTemplateData} />
            )}
        </div>
    );
};
