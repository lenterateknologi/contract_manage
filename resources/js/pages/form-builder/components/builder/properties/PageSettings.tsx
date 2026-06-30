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
                                className="border-border h-8 w-8 rounded-md border"
                                style={{ backgroundColor: templateData.letterhead_json?.palette?.primary || '#0f172a' }}
                            />
                            <Input
                                type="color"
                                value={templateData.letterhead_json?.palette?.primary || '#0f172a'}
                                onChange={(e) =>
                                    setTemplateData('letterhead_json', {
                                        ...templateData.letterhead_json,
                                        palette: {
                                            ...(templateData.letterhead_json?.palette ?? {
                                                primary: '#0f172a',
                                                secondary: '#475569',
                                                accent: '#3b82f6',
                                            }),
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
                                className="border-border h-8 w-8 rounded-md border"
                                style={{ backgroundColor: templateData.letterhead_json?.palette?.secondary || '#475569' }}
                            />
                            <Input
                                type="color"
                                value={templateData.letterhead_json?.palette?.secondary || '#475569'}
                                onChange={(e) =>
                                    setTemplateData('letterhead_json', {
                                        ...templateData.letterhead_json,
                                        palette: {
                                            ...(templateData.letterhead_json?.palette ?? {
                                                primary: '#0f172a',
                                                secondary: '#475569',
                                                accent: '#3b82f6',
                                            }),
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
                                className="border-border h-8 w-8 rounded-md border"
                                style={{ backgroundColor: templateData.letterhead_json?.palette?.accent || '#3b82f6' }}
                            />
                            <Input
                                type="color"
                                value={templateData.letterhead_json?.palette?.accent || '#3b82f6'}
                                onChange={(e) =>
                                    setTemplateData('letterhead_json', {
                                        ...templateData.letterhead_json,
                                        palette: {
                                            ...(templateData.letterhead_json?.palette ?? {
                                                primary: '#0f172a',
                                                secondary: '#475569',
                                                accent: '#3b82f6',
                                            }),
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
};
