import { Button } from '@/components/ui/base/Button';
import { ScrollArea } from '@/components/ui/base/ScrollArea';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/overlays/Sheet';
import { cn } from '@/lib/utils';
import { Check, Maximize2, Palette, Settings2, Type } from 'lucide-react';
import { useEffect, useState } from 'react';

const fonts = [
    { name: 'Inter', value: "'Inter', sans-serif" },
    { name: 'Roboto', value: "'Roboto', sans-serif" },
    { name: 'System', value: 'system-ui, -apple-system, sans-serif' },
];

const fontSizes = [
    { name: 'Small', value: '92.5%', desc: 'Kompak' },
    { name: 'Normal', value: '100%', desc: 'Standar' },
    { name: 'Large', value: '107.5%', desc: 'Besar' },
];

export function SiteCustomizer() {
    const [activeFont, setActiveFont] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('site-font') || "'Inter', sans-serif";
        }
        return "'Inter', sans-serif";
    });

    const [activeFontSize, setActiveFontSize] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('site-font-size') || '100%';
        }
        return '100%';
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const styleId = 'dynamic-site-styles';
            let styleTag = document.getElementById(styleId);
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = styleId;
                document.head.appendChild(styleTag);
            }

            styleTag.innerHTML = `
                :root { --font-sans: ${activeFont}; }
                * { font-family: ${activeFont} !important; }
                html { font-size: ${activeFontSize} !important; }
            `;

            localStorage.setItem('site-font', activeFont);
            localStorage.setItem('site-font-size', activeFontSize);
        }
    }, [activeFont, activeFontSize]);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-sidebar-foreground/60 hover:text-sidebar-primary hover:bg-sidebar-accent group h-8 w-8 rounded-lg transition-all"
                >
                    <Settings2 className="h-4 w-4 transition-transform group-hover:rotate-90" />
                    <span className="sr-only">Site Settings</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="border-sidebar-border/50 flex w-[320px] flex-col overflow-hidden border-l bg-white p-0 shadow-2xl dark:bg-[#09090b]">
                {/* Compact Header */}
                <div className="from-sidebar-primary/[0.02] border-sidebar-border/30 border-b bg-gradient-to-br to-transparent p-5 pb-6 dark:from-white/[0.02]">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="bg-sidebar-primary dark:text-sidebar-primary shadow-sidebar-primary/20 flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-lg dark:bg-white">
                            <Palette size={16} strokeWidth={2.5} />
                        </div>
                        <div>
                            <SheetTitle className="text-sidebar-primary text-sm font-black tracking-tight dark:text-white">Customizer</SheetTitle>
                            <p className="text-sidebar-foreground/30 mt-0.5 text-[8px] font-black tracking-[0.2em] uppercase">Personalisasi</p>
                        </div>
                    </div>
                    <p className="text-sidebar-foreground/40 text-[10px] leading-relaxed font-bold tracking-wider uppercase">
                        Sesuaikan tampilan platform Anda.
                    </p>
                </div>

                {/* Categories - Compact Layout */}
                <ScrollArea className="flex-1 px-5 py-4">
                    <div className="space-y-6 pb-6">
                        {/* Typography Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <Type className="text-sidebar-foreground/30 h-3 w-3" />
                                <h3 className="text-sidebar-foreground/50 text-[9px] font-black tracking-[0.2em] uppercase">Jenis Font</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-1.5">
                                {fonts.map((font) => (
                                    <button
                                        key={font.name}
                                        onClick={() => setActiveFont(font.value)}
                                        className={cn(
                                            'group flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.98]',
                                            activeFont === font.value
                                                ? 'bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary shadow-sidebar-primary/10 shadow-lg'
                                                : 'bg-sidebar-accent/20 border-sidebar-border/30 hover:border-sidebar-primary/30 text-sidebar-foreground',
                                        )}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black tracking-tight" style={{ fontFamily: font.value }}>
                                                {font.name}
                                            </span>
                                            <span
                                                className={cn(
                                                    'text-[8px] font-bold uppercase opacity-30',
                                                    activeFont === font.value ? 'text-white/60' : '',
                                                )}
                                            >
                                                {font.name === 'Inter' ? 'Recommended' : 'Alternative'}
                                            </span>
                                        </div>
                                        {activeFont === font.value && <Check className="h-3 w-3" strokeWidth={4} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Font Size Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <Maximize2 className="text-sidebar-foreground/30 h-3 w-3" />
                                <h3 className="text-sidebar-foreground/50 text-[9px] font-black tracking-[0.2em] uppercase">Ukuran Tampilan</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                                {fontSizes.map((size) => (
                                    <button
                                        key={size.name}
                                        onClick={() => setActiveFontSize(size.value)}
                                        className={cn(
                                            'group flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all active:scale-[0.95]',
                                            activeFontSize === size.value
                                                ? 'bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary shadow-sidebar-primary/10 shadow-lg'
                                                : 'bg-sidebar-accent/20 border-sidebar-border/30 hover:border-sidebar-primary/30 text-sidebar-foreground',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'mb-0.5 font-black tracking-tight',
                                                size.name === 'Small' ? 'text-[10px]' : size.name === 'Normal' ? 'text-xs' : 'text-base',
                                            )}
                                        >
                                            Aa
                                        </span>
                                        <span className="text-[9px] leading-none font-black tracking-tighter uppercase">{size.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-sidebar-primary/[0.03] border-sidebar-primary/10 rounded-xl border border-dashed p-4">
                            <p className="text-sidebar-foreground/40 text-center text-[9px] leading-tight font-bold italic">
                                Pengaturan disimpan otomatis.
                            </p>
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
