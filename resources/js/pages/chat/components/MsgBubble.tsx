import { cn } from '@/lib/utils';
import { ContractMessage } from '@/types/contracts';
import { FileIcon, Download } from 'lucide-react';

interface MsgBubbleProps {
    msg: ContractMessage;
    isMe: boolean;
    highlight?: string;
    onPreview: (url: string, name: string) => void;
}

export function MsgBubble({
    msg,
    isMe,
    highlight,
    onPreview,
}: MsgBubbleProps) {
    const time = msg.created_at.split(' ')[1]?.substring(0, 5) ?? '';
    const name = msg.user?.name ?? 'Unknown';
    const role = msg.user?.role ?? '';
    let attachmentUrl = (msg as any).attachment_url || (msg as any).attachment_path;
    if (attachmentUrl && !attachmentUrl.startsWith('http') && !attachmentUrl.startsWith('/')) {
        attachmentUrl = `/storage/${attachmentUrl}`;
    }
    const attachmentName = (msg as any).attachment_name || (msg as any).file_name || 'Berkas';
    const isImage =
        attachmentUrl?.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) ||
        attachmentName?.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) ||
        (typeof attachmentName === 'string' &&
            ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'].some((ext) => attachmentName.toLowerCase().includes(ext)));

    const renderMessage = (text: string, term?: string) => {
        let content: any = text;

        if (term && term.trim()) {
            const parts = text.split(new RegExp(`(${term})`, 'gi'));
            content = parts.map((part, i) =>
                part.toLowerCase() === term.toLowerCase() ? (
                    <span key={i} className="text-primary bg-primary/10 rounded px-0.5 font-bold">
                        {part}
                    </span>
                ) : (
                    part
                ),
            );
        }

        if (typeof content === 'string') {
            const mentionParts = content.split(/(@[\w\s.-]+(?:\s|$))/g);
            return mentionParts.map((part, i) => {
                if (part.startsWith('@')) {
                    return (
                        <span
                            key={i}
                            className={cn('font-bold tracking-tight underline underline-offset-2', isMe ? 'text-primary-foreground' : 'text-primary')}
                        >
                            {part}
                        </span>
                    );
                }
                return part;
            });
        } else if (Array.isArray(content)) {
            return content.map((item, idx) => {
                if (typeof item === 'string') {
                    const subParts = item.split(/(@[\w\s.-]+(?:\s|$))/g);
                    return subParts.map((sp, i) => {
                        if (sp.startsWith('@')) {
                            return (
                                <span
                                    key={`${idx}-${i}`}
                                    className={cn(
                                        'font-bold tracking-tight underline underline-offset-2',
                                        isMe ? 'text-primary-foreground' : 'text-primary',
                                    )}
                                >
                                    {sp}
                                </span>
                            );
                        }
                        return sp;
                    });
                }
                return item;
            });
        }

        return content;
    };

    return (
        <div className={cn('animate-in slide-in-from-bottom-1 mb-4 flex flex-col gap-1.5 duration-300', isMe ? 'items-end' : 'items-start')}>
            <div className={cn('flex items-center gap-2 px-1', isMe ? 'flex-row-reverse' : 'flex-row')}>
                <span className={cn('text-text-main text-[11px] font-bold', isMe ? '' : 'opacity-80')}>{isMe ? 'Anda' : name}</span>
                {role && (
                    <span className="bg-surface-muted text-text-desc rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-tight uppercase">
                        {role}
                    </span>
                )}
                <span className="text-text-soft/60 text-[10px] tabular-nums">{time}</span>
            </div>

            <div className={cn('group relative max-w-[82%] min-w-[65px]', isMe ? 'text-right' : 'text-left')}>
                <div
                    className={cn(
                        'rounded-2xl shadow-sm transition-all duration-300',
                        isMe ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-text-main',
                    )}
                >
                    {attachmentUrl && isImage && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onPreview(attachmentUrl, attachmentName);
                            }}
                            className="group/img bg-surface-muted relative cursor-pointer overflow-hidden rounded-t-2xl border-b border-inherit"
                        >
                            <img
                                src={attachmentUrl}
                                alt={attachmentName || 'Image'}
                                className="h-auto max-h-[250px] w-full cursor-pointer object-cover transition-transform duration-500 group-hover/img:scale-105"
                            />
                        </div>
                    )}

                    <div className="p-3.5">
                        {msg.message && (
                            <div
                                className={cn(
                                    'text-[13px] leading-relaxed tracking-tight',
                                    attachmentUrl && !isImage ? 'mb-2 border-b border-inherit pb-2 opacity-80' : '',
                                )}
                            >
                                {renderMessage(msg.message, highlight)}
                            </div>
                        )}

                        {attachmentUrl && !isImage && (
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onPreview(attachmentUrl, attachmentName);
                                }}
                                className={cn(
                                    'group/file flex cursor-pointer items-center gap-2.5 rounded-xl border p-2 transition-all',
                                    isMe
                                        ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                                        : 'border-surface-border bg-surface-base/50 text-text-main hover:bg-surface-base',
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-sm transition-transform group-hover/file:scale-110',
                                        isMe ? 'border-white/10 bg-white/10 text-white' : 'border-surface-border bg-surface-base text-text-soft',
                                    )}
                                >
                                    <FileIcon size={14} />
                                </div>
                                <div className="min-w-0 flex-1 text-left">
                                    <div className="mb-0.5 truncate text-[10px] leading-none font-bold tracking-tight uppercase">
                                        {attachmentName}
                                    </div>
                                    <div className="text-[8px] font-bold uppercase opacity-40">PREVIEW</div>
                                </div>
                                <Download size={12} className="opacity-0 transition-opacity group-hover/file:opacity-40" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
