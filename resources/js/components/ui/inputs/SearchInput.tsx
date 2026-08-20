import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/inputs/Input";

export interface SearchInputProps extends React.ComponentProps<typeof Input> {
    containerClassName?: string;
    expandable?: boolean;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
    ({ className, containerClassName, value, expandable = false, ...props }, ref) => {
        const [isFocused, setIsFocused] = React.useState(false);
        const inputRef = React.useRef<HTMLInputElement>(null);
        React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

        const hasValue = Boolean(value || props.defaultValue);
        const isExpanded = !expandable || isFocused || hasValue;

        if (!expandable) {
            return (
                <div className={cn("relative w-full group", containerClassName)}>
                    <Search
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-desc group-focus-within:text-primary dark:text-zinc-300 dark:group-focus-within:text-white transition-colors z-10"
                        strokeWidth={2.2}
                    />
                    <Input
                        className={cn(
                            "pl-10 pr-4 h-10 rounded-xl text-xs font-medium text-text-main placeholder:text-text-soft",
                            "bg-white border border-surface-border transition-all",
                            "focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary focus-visible:ring-offset-0",
                            "dark:text-white dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-400",
                            className
                        )}
                        ref={ref}
                        value={value}
                        {...props}
                    />
                </div>
            );
        }

        return (
            <div
                className={cn(
                    "relative transition-all duration-300 ease-in-out ml-auto",
                    isExpanded ? "w-full" : "w-10",
                    containerClassName
                )}
            >
                <div
                    onClick={() => {
                        if (!isExpanded) {
                            inputRef.current?.focus();
                        }
                    }}
                    className={cn(
                        "relative flex items-center h-10 rounded-xl transition-all duration-300 border border-surface-border bg-white dark:bg-zinc-900 dark:border-zinc-700 overflow-hidden",
                        isExpanded
                            ? "w-full px-3 focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary"
                            : "w-10 justify-center cursor-pointer hover:bg-surface-muted hover:border-surface-border/90"
                    )}
                >
                    <Search
                        className={cn(
                            "h-4 w-4 shrink-0 transition-colors pointer-events-none z-10",
                            isExpanded ? "text-primary mr-2" : "text-text-desc dark:text-zinc-300"
                        )}
                        strokeWidth={2.2}
                    />

                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        className={cn(
                            "h-full w-full bg-transparent text-xs font-medium text-text-main dark:text-white placeholder:text-text-soft outline-none border-none p-0 focus:ring-0",
                            isExpanded ? "block" : "hidden"
                        )}
                        onFocus={(e) => {
                            setIsFocused(true);
                            props.onFocus?.(e as any);
                        }}
                        onBlur={(e) => {
                            setIsFocused(false);
                            props.onBlur?.(e as any);
                        }}
                        {...(props as any)}
                    />
                </div>
            </div>
        );
    }
);

SearchInput.displayName = "SearchInput";

export { SearchInput };
