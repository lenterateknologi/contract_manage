import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/inputs/Input";

export interface SearchInputProps extends React.ComponentProps<typeof Input> {
    containerClassName?: string;
    expandable?: boolean;
    onClear?: () => void;
    expandedWidth?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
    (
        {
            className,
            containerClassName,
            value,
            expandable = false,
            onClear,
            expandedWidth = "w-48 sm:w-56 md:w-64 lg:w-72",
            ...props
        },
        ref
    ) => {
        const [isOpen, setIsOpen] = React.useState(false);
        const [isFocused, setIsFocused] = React.useState(false);
        const inputRef = React.useRef<HTMLInputElement>(null);
        const containerRef = React.useRef<HTMLDivElement>(null);
        React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

        const hasValue = Boolean(value || props.defaultValue);
        const isExpanded = !expandable || isOpen || isFocused || hasValue;

        // Auto-expand if value is present
        React.useEffect(() => {
            if (hasValue) {
                setIsOpen(true);
            }
        }, [hasValue]);

        // Handle click outside to minimize when empty
        React.useEffect(() => {
            if (!expandable) return;
            const handleClickOutside = (event: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                    if (!hasValue) {
                        setIsOpen(false);
                        setIsFocused(false);
                    }
                }
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, [expandable, hasValue]);

        const handleOpen = () => {
            setIsOpen(true);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        };

        const handleClose = () => {
            setIsOpen(false);
            setIsFocused(false);
        };

        const handleClear = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (onClear) {
                onClear();
            } else if (props.onChange) {
                const syntheticEvent = {
                    target: { value: "" },
                    currentTarget: { value: "" },
                } as React.ChangeEvent<HTMLInputElement>;
                props.onChange(syntheticEvent);
            }
            if (!hasValue) {
                handleClose();
            } else {
                inputRef.current?.focus();
            }
        };

        if (!expandable) {
            return (
                <div className={cn("relative w-full group", containerClassName)}>
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-desc group-focus-within:text-primary dark:text-zinc-300 dark:group-focus-within:text-white transition-colors z-10 pointer-events-none"
                        strokeWidth={2.2}
                    />
                    <Input
                        className={cn(
                            "pl-9 pr-8 h-9 rounded-lg text-xs font-medium text-text-main placeholder:text-text-soft",
                            "bg-white border border-surface-border transition-all",
                            "focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary focus-visible:ring-offset-0",
                            "dark:text-white dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-400",
                            className
                        )}
                        ref={ref}
                        value={value}
                        {...props}
                    />
                    {hasValue && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-desc hover:text-text-main dark:hover:text-white p-0.5 rounded-full transition-colors z-10 cursor-pointer"
                            aria-label="Hapus pencarian"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            );
        }

        return (
            <div
                ref={containerRef}
                className={cn(
                    "relative transition-all duration-200 ease-in-out shrink-0",
                    isExpanded ? expandedWidth : "w-9",
                    containerClassName
                )}
            >
                {!isExpanded ? (
                    <button
                        type="button"
                        onClick={handleOpen}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-white text-text-desc shadow-xs transition-colors hover:bg-surface-muted hover:text-text-main dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                        title={(props.placeholder as string) || "Cari data..."}
                        aria-label="Buka pencarian"
                    >
                        <Search className="h-3.5 w-3.5" strokeWidth={2.2} />
                    </button>
                ) : (
                    <div
                        className={cn(
                            "relative flex items-center h-9 w-full rounded-lg border border-surface-border bg-white dark:bg-zinc-900 dark:border-zinc-700 px-2.5 shadow-xs transition-all",
                            isFocused && "ring-1 ring-primary/30 border-primary"
                        )}
                    >
                        <Search
                            className="h-3.5 w-3.5 shrink-0 text-primary mr-2 pointer-events-none"
                            strokeWidth={2.2}
                        />

                        <input
                            ref={inputRef}
                            type="text"
                            value={value}
                            className="h-full w-full bg-transparent text-xs font-medium text-text-main dark:text-white placeholder:text-text-soft outline-none border-none p-0 focus:ring-0"
                            onFocus={(e) => {
                                setIsFocused(true);
                                props.onFocus?.(e as any);
                            }}
                            onBlur={(e) => {
                                setIsFocused(false);
                                props.onBlur?.(e as any);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                    if (hasValue) {
                                        if (onClear) onClear();
                                        else if (props.onChange) {
                                            props.onChange({ target: { value: "" }, currentTarget: { value: "" } } as any);
                                        }
                                    } else {
                                        handleClose();
                                    }
                                }
                                props.onKeyDown?.(e as any);
                            }}
                            {...(props as any)}
                        />

                        {hasValue ? (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="text-text-desc hover:text-text-main dark:hover:text-white p-0.5 ml-1 rounded-full transition-colors shrink-0 cursor-pointer"
                                aria-label="Hapus pencarian"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleClose}
                                className="text-text-desc/60 hover:text-text-main dark:hover:text-white p-0.5 ml-1 rounded-full transition-colors shrink-0 cursor-pointer"
                                aria-label="Tutup pencarian"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    }
);

SearchInput.displayName = "SearchInput";

export { SearchInput };
