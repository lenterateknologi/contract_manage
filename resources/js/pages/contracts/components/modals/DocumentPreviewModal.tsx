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
            <DialogContent className="flex h-[85vh] w-full max-w-4xl flex-col gap-0 overflow-hidden border border-slate-200/80 dark:border-zinc-700/80 bg-slate-100/90 dark:bg-zinc-800/90 text-slate-800 dark:text-zinc-100 p-0 shadow-2xl">

                {/* Minimal Header */}
                <div className="flex h-10 shrink-0 items-center border-b border-primary/20 dark:border-zinc-700/80 bg-primary dark:bg-zinc-800/90 px-4 pr-12">
                    <DialogTitle className="text-white dark:text-zinc-100 text-xs truncate font-semibold">
                        {fileName}
                    </DialogTitle>
                </div>

                {/* Preview Frame */}
                <div className="flex-1 overflow-hidden bg-surface-muted/30 flex items-center justify-center p-4">
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
                        <iframe
                            src={url}
                            className="h-full w-full border-none bg-surface-base"
                            title="PDF Preview"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
