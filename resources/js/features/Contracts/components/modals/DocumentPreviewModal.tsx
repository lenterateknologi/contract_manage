import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialogs/Dialog';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    fileName: string;
}

const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|svg)/i;

export default function DocumentPreviewModal({ isOpen, onClose, url, fileName }: Props) {
    // ponytail: check both fileName and url to handle cases where filename has no extension
    const isImage = IMAGE_EXT.test(fileName ?? '') || IMAGE_EXT.test(url ?? '');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* ponytail: simplified full preview layout, removed unused docx styles/libraries */}
            <DialogContent className="flex h-[85vh] w-full max-w-4xl flex-col gap-0 overflow-hidden border border-slate-200/80 bg-slate-100/90 p-0 text-slate-800 shadow-2xl dark:border-zinc-700/80 dark:bg-zinc-800/90 dark:text-zinc-100">
                {/* Minimal Header */}
                <div className="border-primary/20 bg-primary flex h-10 shrink-0 items-center border-b px-4 pr-12 dark:border-zinc-700/80 dark:bg-zinc-800/90">
                    <DialogTitle className="truncate text-xs font-semibold text-white dark:text-zinc-100">{fileName}</DialogTitle>
                </div>

                {/* Preview Frame */}
                <div className="bg-surface-muted/30 flex flex-1 items-center justify-center overflow-hidden p-4">
                    {isImage ? (
                        <img
                            src={url}
                            alt={fileName}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('.img-error')) {
                                    const msg = document.createElement('p');
                                    msg.className = 'img-error text-text-main text-xs opacity-60';
                                    msg.textContent = 'Gagal memuat gambar.';
                                    parent.appendChild(msg);
                                }
                            }}
                        />
                    ) : (
                        <iframe src={url} className="bg-surface-base h-full w-full border-none" title="PDF Preview" />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
