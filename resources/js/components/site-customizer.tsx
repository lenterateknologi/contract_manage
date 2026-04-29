import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Settings2, Check, Palette, Type } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const fonts = [
    { name: 'Inter', value: "'Inter', sans-serif" },
    { name: 'Roboto', value: "'Roboto', sans-serif" },
    { name: 'System', value: "system-ui, -apple-system, sans-serif" },
];

export function SiteCustomizer() {
    const [activeFont, setActiveFont] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('site-font') || "'Inter', sans-serif";
        }
        return "'Inter', sans-serif";
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            document.documentElement.style.setProperty('--font-sans', activeFont);
            // Since we have a global override in app.css using !important, we might need to inject a style tag
            const styleId = 'dynamic-site-styles';
            let styleTag = document.getElementById(styleId);
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = styleId;
                document.head.appendChild(styleTag);
            }
            styleTag.innerHTML = `* { font-family: ${activeFont} !important; }`;
            localStorage.setItem('site-font', activeFont);
        }
    }, [activeFont]);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-primary hover:bg-sidebar-accent transition-all group">
                    <Settings2 className="h-[1.2rem] w-[1.2rem] transition-transform group-hover:rotate-90" />
                    <span className="sr-only">Site Settings</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[350px] sm:w-[400px]">
                <SheetHeader className="pb-6">
                    <SheetTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                        <Palette className="h-5 w-5 text-sidebar-primary" />
                        Site Customizer
                    </SheetTitle>
                    <SheetDescription>
                        Personalize the platform's look and feel to your preference.
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-8">
                    {/* Typography Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Type className="h-4 w-4 text-sidebar-foreground/40" />
                            <h3 className="text-sm font-bold uppercase tracking-widest text-sidebar-foreground/60">Tipografi</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {fonts.map((font) => (
                                <button
                                    key={font.name}
                                    onClick={() => setActiveFont(font.value)}
                                    className={cn(
                                        "flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left group",
                                        activeFont === font.value
                                            ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary shadow-md"
                                            : "bg-sidebar-accent/50 border-sidebar-border hover:bg-sidebar-accent text-sidebar-foreground"
                                    )}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold" style={{ fontFamily: font.value }}>{font.name}</span>
                                        <span className={cn("text-[10px] uppercase tracking-wider opacity-60", activeFont === font.value ? "text-white/70" : "")}>
                                            {font.name === 'Inter' ? 'Standard' : 'Alternative'}
                                        </span>
                                    </div>
                                    {activeFont === font.value && <Check className="h-4 w-4" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-sidebar-accent/30 border border-dashed border-sidebar-border">
                        <p className="text-[11px] text-sidebar-foreground/60 leading-relaxed italic">
                            * Pengaturan ini akan disimpan di perangkat Anda secara otomatis untuk kenyamanan penggunaan.
                        </p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
