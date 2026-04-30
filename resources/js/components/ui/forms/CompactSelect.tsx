import * as React from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { Popover, PopoverButton, PopoverPanel, Portal, Transition } from '@headlessui/react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/base/Label';
import { ScrollArea } from '@/components/ui/base/ScrollArea';

export interface CompactSelectOption {
    label: string;
    value: string | number;
}

export interface CompactSelectProps {
    label: string;
    options: CompactSelectOption[];
    value?: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    error?: string;
    containerClassName?: string;
    searchable?: boolean;
    icon?: React.ElementType;
}

export function CompactSelect({
    label,
    options,
    value,
    onChange,
    placeholder = "Pilih...",
    error,
    containerClassName,
    searchable = true,
    icon: Icon,
}: CompactSelectProps) {
    const [searchTerm, setSearchTerm] = React.useState("");

    const selectedOption = options.find((opt) => opt.value === value);

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={cn("space-y-1.5 w-full group", containerClassName)}>
            <div className="flex items-center justify-between px-0.5">
                <Label 
                    className={cn(
                        "text-[9px] font-black uppercase tracking-widest transition-colors",
                        error ? "text-rose-500" : "text-primary/60 dark:text-white/60"
                    )}
                >
                    {label}
                </Label>
                {error && (
                    <span className="text-[8px] font-bold text-rose-500 uppercase">
                        {error}
                    </span>
                )}
            </div>

            <Popover className="relative w-full">
                {({ open, close }) => (
                    <>
                        <PopoverButton
                            className={cn(
                                "flex h-9 w-full items-center justify-between rounded-lg border bg-white dark:bg-white/[0.02] px-3 text-[11px] font-bold transition-all outline-none shadow-sm",
                                error 
                                    ? "border-rose-500 text-rose-500 focus:ring-1 focus:ring-rose-500" 
                                    : "border-primary/5 dark:border-white/5 text-black dark:text-white focus:border-primary/20 dark:focus:border-white/20 focus:bg-primary/[0.01] dark:focus:bg-white/[0.01]",
                                !selectedOption && "text-primary/20 dark:text-white/20"
                            )}
                        >
                            <div className="flex items-center gap-2.5 truncate">
                                {Icon && <Icon size={12} className="text-primary/10 dark:text-white/10" />}
                                <span className="truncate">
                                    {selectedOption ? selectedOption.label : placeholder}
                                </span>
                            </div>
                            <ChevronDown className={cn(
                                "h-3 w-3 transition-transform duration-200",
                                open ? "rotate-180" : "rotate-0",
                                error ? "text-rose-500" : "text-primary/10 dark:text-white/10"
                            )} strokeWidth={3} />
                        </PopoverButton>
                        <Portal>
                            <Transition
                                as={React.Fragment}
                                enter="transition ease-out duration-200"
                                enterFrom="opacity-0 scale-95 -translate-y-2"
                                enterTo="opacity-100 scale-100 translate-y-0"
                                leave="transition ease-in duration-150"
                                leaveFrom="opacity-100 scale-100 translate-y-0"
                                leaveTo="opacity-0 scale-95 -translate-y-2"
                            >
                                <PopoverPanel 
                                    anchor="bottom start"
                                    className="z-[9999] mt-1 w-[var(--button-width)] p-0 overflow-hidden rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-primary backdrop-blur-xl shadow-2xl origin-top"
                                >
                                    {searchable && (
                                        <div className="flex items-center border-b border-primary/5 dark:border-white/5 p-2">
                                            <Search className="mr-2 h-3 w-3 shrink-0 text-primary/20 dark:text-white/20" strokeWidth={3} />
                                            <input
                                                className="flex h-7 w-full bg-transparent text-[10px] font-black outline-none placeholder:text-primary/10 dark:placeholder:text-white/10 uppercase tracking-wider text-black dark:text-white"
                                                placeholder="Filter..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            {searchTerm && (
                                                <button onClick={() => setSearchTerm("")}>
                                                    <X className="h-3 w-3 text-primary/30 hover:text-primary dark:text-white/30 dark:hover:text-white" strokeWidth={3} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <ScrollArea className={cn("max-h-[200px]", filteredOptions.length === 0 && "h-auto")}>
                                        <div className="p-0.5">
                                            {filteredOptions.length === 0 ? (
                                                <div className="py-4 text-center text-[9px] font-black text-primary/10 dark:text-white/10 uppercase tracking-widest">
                                                    Kosong
                                                </div>
                                            ) : (
                                                filteredOptions.map((option) => (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => {
                                                            onChange(option.value);
                                                            close();
                                                        }}
                                                        className={cn(
                                                            "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-[10px] font-black uppercase tracking-tight transition-all text-left",
                                                            option.value === value
                                                                ? "bg-primary dark:bg-white text-white dark:text-black"
                                                                : "hover:bg-primary/5 dark:hover:bg-white/5 text-primary/60 dark:text-white/60"
                                                        )}
                                                    >
                                                        {option.label}
                                                        {option.value === value && <Check className="h-3 w-3" strokeWidth={4} />}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </ScrollArea>
                                </PopoverPanel>
                            </Transition>
                        </Portal>
                    </>
                )}
            </Popover>
        </div>
    );
}
