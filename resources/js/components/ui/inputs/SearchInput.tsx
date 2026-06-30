import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/inputs/Input";

export interface SearchInputProps extends React.ComponentProps<typeof Input> {
    containerClassName?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
    ({ className, containerClassName, ...props }, ref) => {
        return (
            <div className={cn("relative w-full group", containerClassName)}>
                <Search
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-desc/40 dark:text-white/60 group-focus-within:text-primary dark:group-focus-within:text-white transition-colors z-10"
                    strokeWidth={2}
                />
                <Input
                    className={cn(
                        "pl-10 pr-4 h-10 rounded-xl text-xs font-medium text-text-main placeholder:text-text-soft",
                        "bg-surface-base/40 backdrop-blur-md border border-surface-border transition-all",
                        "focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary focus-visible:ring-offset-0",
                        "dark:text-white dark:border dark:border-white dark:placeholder:text-white dark:bg-transparent dark:focus-within:border-white",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
            </div>
        );
    }
);

SearchInput.displayName = "SearchInput";

export { SearchInput };
