import { cn } from '@/lib/utils';
import { ContractMessage } from '@/pages/contracts/types';
import { usePage } from '@inertiajs/react';
import { File as FileIcon, Download } from 'lucide-react';

interface MsgBubbleProps {
    msg: ContractMessage;
    isMe: boolean;
    highlight?: string;
    onPreview: (url: string, name: string) => void;
    knownUsers?: Array<{ id?: string; name?: string }>;
}

export function MsgBubble({
    msg,
    isMe,
    highlight,
    onPreview,
    knownUsers,
}: MsgBubbleProps) {
    const time = msg.created_at.split(' ')[1]?.substring(0, 5) ?? '';
    const name = msg.user?.name ?? 'Unknown';
    const role = msg.user?.role ?? '';
    let attachmentUrl = (msg as any).attachment_url || (msg as any).attachment_path;
    if (attachmentUrl && !attachmentUrl.startsWith('http') && !attachmentUrl.startsWith('/')) {
        attachmentUrl = `/storage/${attachmentUrl}`;
    }
    const attachmentName = (msg as any).attachment_name || (msg as any).file_name || 'Berkas';
    let upload_configs: any = null;
    try {
        upload_configs = usePage().props;
    } catch (e) {
        // Safe fallback for standalone previews (like Cosmos)
        upload_configs = null;
    }

    const imageMimes = upload_configs?.upload_configs?.user_avatar?.allowed_mimes ?? ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

    const getExtension = (path: string) => {
        if (!path) return '';
        const parts = path.split('.');
        return parts.length > 1 ? parts.pop()?.toLowerCase() ?? '' : '';
    };

    const ext = getExtension(attachmentUrl);
    const isImage = imageMimes.includes(ext);

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

        const mentionBadgeClass = isMe
            ? 'inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md text-[11px] font-bold tracking-tight bg-white/20 text-white border border-white/30 shadow-2xs backdrop-blur-xs select-none'
            : 'inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md text-[11px] font-bold tracking-tight bg-primary/10 text-primary border border-primary/20 shadow-2xs hover:bg-primary/15 select-none';

        const formatMentions = (str: string) => {
            // 1. Format atomic tags
            let res = str.replace(
                /<span[^>]*?(?:class="[^"]*mention-tag[^"]*"|data-name="([^"]*)")[^>]*?>.*?@([^<]+)<\/span>/gi,
                (_match, dataName, innerName) => {
                    const nameToUse = (dataName || innerName || '').trim();
                    return `<span class="${mentionBadgeClass}">@${nameToUse}</span>`;
                },
            );

            // 2. Format <strong>@Name</strong> tags
            res = res.replace(
                /<strong>(@[^<]+)<\/strong>/gi,
                `<span class="${mentionBadgeClass}">$1</span>`,
            );

            // 3. Format against known user names
            if (Array.isArray(knownUsers) && knownUsers.length > 0) {
                const sortedNames = Array.from(
                    new Set(
                        knownUsers
                            .map((u) => u?.name?.trim())
                            .filter((n): n is string => Boolean(n && n.length > 1)),
                    ),
                ).sort((a, b) => b.length - a.length);

                for (const uname of sortedNames) {
                    const escaped = uname
                        .split(/\s+/)
                        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                        .join('[\\s\\u00A0]+');
                    const regex = new RegExp(`(?<![a-zA-Z0-9_>])@(${escaped})(?=[^a-zA-Z0-9_.-]|$)`, 'gi');
                    res = res.replace(regex, `<span class="${mentionBadgeClass}">@$1</span>`);
                }
            }

            // 4. Format single token @mentions
            res = res.replace(
                /(?<![a-zA-Z0-9_>])(@[a-zA-Z0-9_.-]+)(?=[^a-zA-Z0-9_.-]|$)/g,
                `<span class="${mentionBadgeClass}">$1</span>`,
            );
            return res;
        };

        if (typeof content === 'string') {
            return (
                <span
                    dangerouslySetInnerHTML={{
                        __html: formatMentions(content),
                    }}
                />
            );
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
