import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Transition } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Fragment, useState } from 'react';
import { cn } from '@/lib/utils';

interface Option {
    id: string | number;
    name: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    error?: string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Pilih...',
    className,
    error
}: SearchableSelectProps) {
    const [query, setQuery] = useState('');

    const selectedOption = options.find((opt) => String(opt.id) === String(value));

    const filteredOptions =
        query === ''
            ? options
            : options.filter((opt) =>
                  opt.name.toLowerCase().replace(/\s+/g, '').includes(query.toLowerCase().replace(/\s+/g, ''))
              );

    return (
        <div className={cn("w-full", className)}>
            <Combobox value={String(value)} onChange={(val: any) => {
                onChange(String(val));
                setQuery('');
            }}>
                <div className="relative">
                    <div className={cn(
                        "relative w-full cursor-default overflow-hidden rounded-md border border-border bg-white text-left transition-all duration-200 outline-none focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/20",
                        error && "border-red-500"
                    )}>
                        <ComboboxInput
                            className={cn(
                                "w-full border-none py-2 pl-3 pr-10 text-[12px] leading-5 text-indigo-600 font-bold placeholder:text-muted-foreground/30 focus:ring-0 outline-none bg-transparent"
                            )}
                            displayValue={() => selectedOption?.name || ''}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={placeholder}
                        />
                        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronsUpDown
                                className="h-3.5 w-3.5 text-muted-foreground/50"
                                aria-hidden="true"
                            />
                        </ComboboxButton>
                    </div>
                    
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setQuery('')}
                    >
                        <ComboboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-[12px] shadow-2xl ring-1 ring-black/5 focus:outline-none sm:text-sm border border-border">
                            {filteredOptions.length === 0 && query !== '' ? (
                                <div className="relative cursor-default select-none py-3 px-4 text-muted-foreground text-[11px] italic text-center">
                                    Tidak ada hasil ditemukan.
                                </div>
                            ) : (
                                <div className="p-1 space-y-0.5">
                                    {filteredOptions.map((opt) => (
                                        <ComboboxOption
                                            key={opt.id}
                                            className={({ active }) =>
                                                cn(
                                                    "relative cursor-default select-none py-2 pl-9 pr-4 rounded-lg transition-colors",
                                                    active ? "bg-indigo-50 text-indigo-600" : "text-gray-900"
                                                )
                                            }
                                            value={opt.id}
                                        >
                                            {({ selected, active }) => (
                                                <>
                                                    <span
                                                        className={cn(
                                                            "block truncate",
                                                            selected ? "font-bold text-indigo-600" : "font-medium"
                                                        )}
                                                    >
                                                        {opt.name}
                                                    </span>
                                                    {selected ? (
                                                        <span
                                                            className={cn(
                                                                "absolute inset-y-0 left-0 flex items-center pl-3",
                                                                "text-indigo-600"
                                                            )}
                                                        >
                                                            <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                                                        </span>
                                                    ) : null}
                                                </>
                                            )}
                                        </ComboboxOption>
                                    ))}
                                </div>
                            )}
                        </ComboboxOptions>
                    </Transition>
                </div>
            </Combobox>
        </div>
    );
}
