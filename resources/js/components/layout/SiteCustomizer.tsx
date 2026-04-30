import { Button } from '@/components/ui/base/Button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/overlays/Sheet';
import { Settings2, Check, Palette, Type, Maximize2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/base/ScrollArea';

const fonts = [
    { name: 'Inter', value: "'Inter', sans-serif" },
    { name: 'Roboto', value: "'Roboto', sans-serif" },
    { name: 'System', value: "system-ui, -apple-system, sans-serif" },
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
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-primary hover:bg-sidebar-accent transition-all group">
                    <Settings2 className="h-4 w-4 transition-transform group-hover:rotate-90" />
                    <span className="sr-only">Site Settings</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[320px] p-0 flex flex-col border-l border-sidebar-border/50 bg-white dark:bg-[#09090b] shadow-2xl overflow-hidden">
                {/* Compact Header */}
                <div className="p-5 pb-6 bg-gradient-to-br from-sidebar-primary/[0.02] to-transparent dark:from-white/[0.02] border-b border-sidebar-border/30">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary dark:bg-white text-white dark:text-sidebar-primary shadow-lg shadow-sidebar-primary/20">
                            <Palette size={16} strokeWidth={2.5} />
                        </div>
                        <div>
                            <SheetTitle className="text-sm font-black tracking-tight text-sidebar-primary dark:text-white">Customizer</SheetTitle>
                            <p className="text-[8px] font-black tracking-[0.2em] text-sidebar-foreground/30 uppercase mt-0.5">Personalisasi</p>
                        </div>
                    </div>
                    <p className="text-[10px] font-bold text-sidebar-foreground/40 leading-relaxed uppercase tracking-wider">
                        Sesuaikan tampilan platform Anda.
                    </p>
                </div>

                {/* Categories - Compact Layout */}
                <ScrollArea className="flex-1 px-5 py-4">
                    <div className="space-y-6 pb-6">
                        {/* Typography Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <Type className="h-3 w-3 text-sidebar-foreground/30" />
                                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-sidebar-foreground/50">Jenis Font</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-1.5">
                                {fonts.map((font) => (
                                    <button
                                        key={font.name}
                                        onClick={() => setActiveFont(font.value)}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-left group active:scale-[0.98]",
                                            activeFont === font.value
                                                ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary shadow-lg shadow-sidebar-primary/10"
                                                : "bg-sidebar-accent/20 border-sidebar-border/30 hover:border-sidebar-primary/30 text-sidebar-foreground"
                                        )}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black tracking-tight" style={{ fontFamily: font.value }}>{font.name}</span>
                                            <span className={cn("text-[8px] font-bold uppercase tracking-widest opacity-30", activeFont === font.value ? "text-white/60" : "")}>
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
                                <Maximize2 className="h-3 w-3 text-sidebar-foreground/30" />
                                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-sidebar-foreground/50">Ukuran Tampilan</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                                {fontSizes.map((size) => (
                                    <button
                                        key={size.name}
                                        onClick={() => setActiveFontSize(size.value)}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center group active:scale-[0.95]",
                                            activeFontSize === size.value
                                                ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary shadow-lg shadow-sidebar-primary/10"
                                                : "bg-sidebar-accent/20 border-sidebar-border/30 hover:border-sidebar-primary/30 text-sidebar-foreground"
                                        )}
                                    >
                                        <span className={cn(
                                            "font-black tracking-tight mb-0.5",
                                            size.name === 'Small' ? "text-[10px]" : size.name === 'Normal' ? "text-xs" : "text-base"
                                        )}>Aa</span>
                                        <span className="text-[9px] font-black uppercase tracking-tighter leading-none">{size.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-sidebar-primary/[0.03] border border-dashed border-sidebar-primary/10">
                            <p className="text-[9px] font-bold text-sidebar-foreground/40 leading-tight italic text-center">
                                Pengaturan disimpan otomatis.
                            </p>
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
