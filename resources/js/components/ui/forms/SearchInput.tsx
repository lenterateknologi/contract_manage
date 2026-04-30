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
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-black dark:text-white" 
                    strokeWidth={3} 
                />
                <input
                    className={cn(
                        "w-full h-10 pl-10 pr-4 border border-primary/20 dark:border-white/20 bg-black/[0.02] dark:bg-white/[0.02] focus:bg-white dark:focus:bg-white/[0.05] focus:border-primary dark:focus:border-white rounded-xl text-[12px] font-bold text-black dark:text-white placeholder:text-black dark:placeholder:text-white transition-all outline-none shadow-sm",
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
