import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    containerClassName?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
    ({ className, containerClassName, ...props }, ref) => {
        return (
            <div className={cn("relative w-full", containerClassName)}>
                <Search
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sidebar-foreground/40"
                    strokeWidth={3}
                />
                <input
                    className={cn(
                        "w-full h-10 pl-10 pr-4 border border-primary/20 dark:border-white/20 bg-card text-card-foreground focus:border-primary dark:focus:border-white rounded-xl text-xs font-semibold placeholder:text-sidebar-foreground/40 transition-all outline-none shadow-sm",
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
