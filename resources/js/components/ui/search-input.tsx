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
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30 dark:text-white/30" 
                    strokeWidth={3} 
                />
                <input
                    className={cn(
                        "w-full h-10 pl-10 pr-4 border-none bg-black/[0.03] dark:bg-white/[0.03] focus:bg-black/[0.05] dark:focus:bg-white/[0.05] rounded-lg text-[12px] font-bold text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 transition-all outline-none",
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
