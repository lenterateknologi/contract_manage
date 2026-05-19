import { useEffect, useState } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    title: string;
    url: string;
    hasFile: boolean;
}

export default function PreviewModal({ open, onClose, title, url, hasFile }: Props) {
    const [zoom, setZoom] = useState(100);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        setZoom(100);
        setLoading(true);
        // Timeout as fallback for iframe load
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, [open, url]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black dark:bg-black">
            {/* Header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 bg-black px-5 py-3 text-white shadow-lg">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-white/10"
                    >
                        <i className="fa-solid fa-arrow-left text-[13px]" />
                    </button>
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10">
                        <i className="fa-regular fa-file-pdf text-white" />
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold" title={title}>
                            {title}
                        </div>
                        <div className="text-[10px] tracking-wider text-gray-400 uppercase">Adobe PDF Render v2.0</div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-2 py-1 md:flex">
                        <button
                            onClick={() => setZoom((z) => Math.max(50, z - 10))}
                            className="flex h-6 w-6 items-center justify-center rounded text-[11px] text-gray-300 hover:bg-white/10"
                        >
                            <i className="fa-solid fa-minus" />
                        </button>
                        <span className="min-w-[36px] px-1 text-center font-mono text-[11px] text-gray-300">{zoom}%</span>
                        <button
                            onClick={() => setZoom((z) => Math.min(200, z + 10))}
                            className="flex h-6 w-6 items-center justify-center rounded text-[11px] text-gray-300 hover:bg-white/10"
                        >
                            <i className="fa-solid fa-plus" />
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[13px] text-gray-400 transition-all hover:bg-white hover:text-black"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="relative flex-1 overflow-hidden">
                {loading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black text-white">
                        <i className="fa-solid fa-spinner fa-spin text-3xl text-white" />
                        <span className="text-[10px] font-black uppercase">Generating PDF Preview...</span>
                    </div>
                )}

                {!hasFile ? (
                    <div className="mx-auto flex h-full max-w-sm flex-col items-center justify-center gap-4 px-6 text-center text-gray-300">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/5">
                            <i className="fa-solid fa-file-circle-exclamation text-3xl text-white" />
                        </div>
                        <div>
                            <h3 className="mb-1 text-lg font-semibold">File Tidak Ditemukan</h3>
                            <p className="text-sm leading-relaxed text-gray-400">
                                Dokumen ini mungkin berasal dari data dummy (seeder) yang tidak memiliki file fisik di disk. Silakan{' '}
                                <b>Upload Dokumen Baru</b> untuk mencoba fitur PDF preview.
                            </p>
                        </div>
                    </div>
                ) : url ? (
                    <iframe
                        src={`${url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=${zoom}`}
                        className="h-full w-full border-none"
                        title="PDF Preview"
                        onLoad={() => setLoading(false)}
                    />
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-white/40">
                        <i className="fa-solid fa-triangle-exclamation text-3xl text-white/20" />
                        <span className="text-[11px] font-black uppercase">Gagal memuat preview PDF</span>
                    </div>
                )}
            </div>
        </div>
    );
}
