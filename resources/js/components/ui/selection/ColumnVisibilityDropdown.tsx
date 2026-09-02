import * as React from 'react';
import { Popover, PopoverButton, PopoverPanel, Portal } from '@headlessui/react';
import { Columns3, Check, RotateCcw, Search, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColumnOption {
    key: string;
    label: string;
    disabled?: boolean;
}

interface ColumnVisibilityDropdownProps {
    columns: ColumnOption[];
    visibleKeys: string[];
    onChange: (keys: string[]) => void;
    pinnedKeys?: string[];
    onPinnedChange?: (keys: string[]) => void;
    onReset?: () => void;
    storageKey?: string;
    storagePinKey?: string;
    className?: string;
}

function setCookie(name: string, value: string, days: number = 365) {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export function ColumnVisibilityDropdown({
    columns,
    visibleKeys,
    onChange,
    pinnedKeys = [],
    onPinnedChange,
    onReset,
    storageKey,
    storagePinKey,
    className,
}: ColumnVisibilityDropdownProps) {
    const [search, setSearch] = React.useState('');

    const filteredColumns = React.useMemo(() => {
        if (!search.trim()) return columns;
        return columns.filter((col) =>
            col.label.toLowerCase().includes(search.toLowerCase()) ||
            col.key.toLowerCase().includes(search.toLowerCase())
        );
    }, [columns, search]);

    const handleToggle = (key: string) => {
        if (visibleKeys.includes(key)) {
            if (visibleKeys.length <= 1) return;
            const updated = visibleKeys.filter((k) => k !== key);
            onChange(updated);
            if (storageKey) {
                try {
                    const str = JSON.stringify(updated);
                    setCookie(storageKey, str, 365);
                    localStorage.setItem(storageKey, str);
                } catch {}
            }
        } else {
            const updated = [...visibleKeys, key];
            onChange(updated);
            if (storageKey) {
                try {
                    const str = JSON.stringify(updated);
                    setCookie(storageKey, str, 365);
                    localStorage.setItem(storageKey, str);
                } catch {}
            }
        }
    };

    const handleTogglePin = (e: React.MouseEvent, key: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!onPinnedChange) return;

        let updated: string[];
        if (pinnedKeys.includes(key)) {
            updated = pinnedKeys.filter((k) => k !== key);
        } else {
            updated = [...pinnedKeys, key];
            // Ensure pinned column is also visible
            if (!visibleKeys.includes(key)) {
                const newVis = [...visibleKeys, key];
                onChange(newVis);
                if (storageKey) {
                    try {
                        const str = JSON.stringify(newVis);
                        setCookie(storageKey, str, 365);
                        localStorage.setItem(storageKey, str);
                    } catch {}
                }
            }
        }
        onPinnedChange(updated);
        if (storagePinKey) {
            try {
                const str = JSON.stringify(updated);
                setCookie(storagePinKey, str, 365);
                localStorage.setItem(storagePinKey, str);
            } catch {}
        }
    };

    const handleToggleAll = (show: boolean) => {
        const updated = show ? columns.map((c) => c.key) : [columns[0]?.key || ''];
        onChange(updated);
        if (storageKey) {
            try {
                const str = JSON.stringify(updated);
                setCookie(storageKey, str, 365);
                localStorage.setItem(storageKey, str);
            } catch {}
        }
    };

    const handleReset = () => {
        if (onReset) {
            onReset();
        } else {
            const defaultKeys = columns.map((c) => c.key);
            onChange(defaultKeys);
            if (storageKey) {
                try {
                    deleteCookie(storageKey);
                    localStorage.removeItem(storageKey);
                } catch {}
            }
            if (onPinnedChange) {
                onPinnedChange([]);
                if (storagePinKey) {
                    try {
                        deleteCookie(storagePinKey);
                        localStorage.removeItem(storagePinKey);
                    } catch {}
                }
            }
        }
    };

    return (
        <Popover className={cn("relative inline-block", className)}>
            {({ open }) => (
                <>
                    <PopoverButton
                        type="button"
                        className={cn(
                            "inline-flex items-center justify-center h-9 gap-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer border border-border bg-surface-base hover:bg-surface-muted transition-all select-none focus:outline-none focus:ring-1 focus:ring-primary",
                            (visibleKeys.length < columns.length || pinnedKeys.length > 0) && "border-primary/50 text-primary bg-primary/10",
                        )}
                        title="Atur Kolom dan Pin"
                    >
                        <Columns3 size={13} className="shrink-0" />
                        <span>Kolom</span>
                        {pinnedKeys.length > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-primary text-primary-foreground">
                                <Pin size={8} /> {pinnedKeys.length}
                            </span>
                        )}
                        <span className="text-[10px] font-bold opacity-80 rounded-md bg-muted px-1.5 py-0.2">
                            {visibleKeys.length}/{columns.length}
                        </span>
                    </PopoverButton>

                    <Portal>
                        <PopoverPanel
                            anchor={{ to: 'bottom end', gap: 4, offset: 0 }}
                            className="w-80 p-0 border border-surface-border bg-surface-base shadow-2xl rounded-2xl overflow-hidden z-[9999] focus:outline-none"
                        >
                            {/* Header */}
                            <div className="p-3 border-b border-surface-border bg-surface-muted/30 flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold text-text-main flex items-center gap-1.5">
                                        Tampilan & Pin Kolom
                                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground">
                                            {visibleKeys.length} Aktif
                                        </span>
                                    </h4>
                                    <p className="text-[9px] text-text-desc mt-0.5">Centang untuk tampilkan, klik ikon pin untuk membekukan</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="flex items-center gap-1 text-[9px] font-bold text-text-desc hover:text-primary transition-colors cursor-pointer"
                                    title="Kembalikan Kolom Bawaan"
                                >
                                    <RotateCcw size={10} />
                                    <span>Reset</span>
                                </button>
                            </div>

                            {/* Search Bar */}
                            {columns.length > 5 && (
                                <div className="p-2 border-b border-surface-border/60">
                                    <div className="relative">
                                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-soft pointer-events-none" />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Cari kolom..."
                                            className="w-full h-7 pl-7 pr-2 text-xs bg-surface-muted/50 border border-surface-border rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Quick Toggle All */}
                            <div className="flex items-center justify-between px-3 py-1.5 bg-surface-muted/20 border-b border-surface-border/40 text-[10px] font-semibold">
                                <button
                                    type="button"
                                    onClick={() => handleToggleAll(true)}
                                    className="text-primary hover:underline cursor-pointer"
                                >
                                    Pilih Semua
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleToggleAll(false)}
                                    className="text-text-desc hover:text-rose-500 hover:underline cursor-pointer"
                                >
                                    Sembunyikan Lainnya
                                </button>
                            </div>

                            {/* Options List */}
                            <div className="p-1.5 max-h-64 overflow-y-auto space-y-0.5 custom-scrollbar">
                                {filteredColumns.length === 0 ? (
                                    <div className="py-4 text-center text-xs text-text-muted">
                                        Kolom tidak ditemukan
                                    </div>
                                ) : (
                                    filteredColumns.map((col) => {
                                        const isChecked = visibleKeys.includes(col.key);
                                        const isPinned = pinnedKeys.includes(col.key);

                                        return (
                                            <div
                                                key={col.key}
                                                onClick={() => handleToggle(col.key)}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-1.5 rounded-lg text-left transition-all text-xs font-semibold cursor-pointer select-none group",
                                                    isChecked
                                                        ? "bg-primary/10 text-text-main hover:bg-primary/15"
                                                        : "text-text-desc hover:bg-surface-muted/50 opacity-60"
                                                )}
                                            >
                                                <div className="flex items-center gap-2 truncate pr-1">
                                                    <div
                                                        className={cn(
                                                            "h-4 w-4 rounded border flex items-center justify-center transition-all shrink-0",
                                                            isChecked
                                                                ? "border-primary bg-primary text-white"
                                                                : "border-surface-border bg-surface-base"
                                                        )}
                                                    >
                                                        {isChecked && <Check size={11} strokeWidth={3} />}
                                                    </div>
                                                    <span className="truncate">{col.label}</span>
                                                </div>

                                                {onPinnedChange && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleTogglePin(e, col.key)}
                                                        title={isPinned ? "Lepas Pin Kolom" : "Pin Kolom (Sticky Kiri)"}
                                                        className={cn(
                                                            "p-1 rounded-md transition-all shrink-0 cursor-pointer ml-1",
                                                            isPinned
                                                                ? "bg-primary text-primary-foreground shadow-xs scale-105"
                                                                : "text-text-desc hover:bg-surface-muted hover:text-primary opacity-40 group-hover:opacity-100"
                                                        )}
                                                    >
                                                        <Pin size={11} className={cn(isPinned ? "rotate-0" : "-rotate-45")} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </PopoverPanel>
                    </Portal>
                </>
            )}
        </Popover>
    );
}

