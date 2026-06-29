import * as React from 'react';
import { cn } from '@/lib/utils';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { Button } from '../base/Button';

export interface FileUploadProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
    value?: File | File[] | null;
    onChange?: (files: File[] | null) => void;
    multiple?: boolean;
    accept?: string;
    maxSize?: number; // in bytes
}

export function FileUpload({
    className,
    value,
    onChange,
    multiple = false,
    accept,
    maxSize,
    disabled,
    ...props
}: FileUploadProps) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    
    // Normalize value to array for rendering
    const files = React.useMemo(() => {
        if (!value) return [];
        return Array.isArray(value) ? value : [value];
    }, [value]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            // If not multiple, only take the first
            const validFiles = multiple ? newFiles : [newFiles[0]];
            onChange?.(multiple ? validFiles : validFiles);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFiles = Array.from(e.dataTransfer.files);
            const validFiles = multiple ? droppedFiles : [droppedFiles[0]];
            onChange?.(validFiles);
        }
    };

    const removeFile = (index: number) => {
        if (disabled) return;
        const newFiles = [...files];
        newFiles.splice(index, 1);
        onChange?.(newFiles.length > 0 ? newFiles : null);
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className={cn('w-full', className)}>
            <input
                type="file"
                ref={inputRef}
                className="hidden"
                multiple={multiple}
                accept={accept}
                onChange={handleFileChange}
                disabled={disabled}
                {...props}
            />
            
            <div
                className={cn(
                    'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all',
                    isDragging ? 'border-primary bg-primary/5' : 'border-border bg-surface-base',
                    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-muted'
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => !disabled && inputRef.current?.click()}
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-muted-foreground mb-4">
                    <UploadCloud className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                    Klik untuk unggah atau seret file ke sini
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {accept ? `Menerima ${accept}` : 'Semua tipe file didukung'}
                </p>
            </div>

            {files.length > 0 && (
                <div className="mt-4 space-y-2">
                    {files.map((file, i) => (
                        <div key={i} className="flex items-center justify-between rounded-md border border-border bg-surface-base p-3 shadow-sm">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="rounded bg-primary/10 p-2 text-primary">
                                    <FileIcon className="h-4 w-4" />
                                </div>
                                <div className="truncate">
                                    <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-danger shrink-0"
                                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                disabled={disabled}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
