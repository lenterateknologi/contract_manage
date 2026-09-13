import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';
import { Download, Eye, FileIcon, Copy, Check, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContractMessage } from '@/pages/contracts/types';
import { UserAvatarIcon } from '@/components/profile/UserAvatar';
import {
    Bubble,
    BubbleContent,
    BubbleGroup,
    BubbleReactions,
    BubbleActions,
    BubbleAction,
    Message,
    MessageAvatar,
    MessageContent,
    MessageFooter,
    MessageHeader,
} from '@/components/ui/user/Message';
import { ReactionContextBar } from './ReactionContextBar';

interface MessageBubbleProps {
    msg: ContractMessage;
    isMe: boolean;
    highlight?: string;
    onPreview: (url: string, name: string) => void;
}

export function MessageBubble({
    msg,
    isMe,
    highlight,
    onPreview,
}: MessageBubbleProps) {
    const pageProps = usePage().props;
    const currentUserId = (pageProps.auth as any)?.user?.id;
    const [localReactions, setLocalReactions] = useState<any[]>((msg as any).reactions || []);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setLocalReactions((msg as any).reactions || []);
    }, [(msg as any).reactions]);

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowReactionPicker(false);
            }
        };
        if (showReactionPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showReactionPicker]);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowReactionPicker((prev) => !prev);
    };

    const computedReactions = useMemo(() => {
        const counts: Record<string, number> = {};
        if (Array.isArray(localReactions)) {
            localReactions.forEach((r: any) => {
                if (r && r.emoji) {
                    counts[r.emoji] = (counts[r.emoji] || 0) + 1;
                }
            });
        }
        return counts;
    }, [localReactions]);

    const toggleReaction = async (emoji: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        setLocalReactions((prev) => {
            const copy = Array.isArray(prev) ? [...prev] : [];
            const existingIdx = copy.findIndex((r: any) => r && (r.is_me || r.user_id === currentUserId));

            if (existingIdx >= 0) {
                if (copy[existingIdx].emoji === emoji) {
                    copy.splice(existingIdx, 1);
                } else {
                    copy[existingIdx] = {
                        ...copy[existingIdx],
                        emoji,
                        is_me: true,
                    };
                }
            } else {
                copy.push({
                    emoji,
                    user_id: currentUserId || 'me',
                    is_me: true,
                    user: { name: 'Anda' },
                });
            }
            return copy;
        });

        try {
            const res = await axios.post(`/admin/chat/messages/${msg.id}/reaction`, { emoji });
            if (res.data && Array.isArray(res.data.reactions)) {
                setLocalReactions(res.data.reactions);
            }
        } catch (err) {
            console.error('Failed to toggle reaction', err);
        }
    };

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
    } catch {
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
    const isPdf = ext === 'pdf';

    const renderMessage = (text: string, term?: string) => {
        let formatted = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        formatted = formatted.replace(/(?:^|\n)[-*]\s+(.*)/g, '<ul><li>$1</li></ul>');
        formatted = formatted.replace(/(?:^|\n)\d+\.\s+(.*)/g, '<ol><li>$1</li></ol>');

        formatted = formatted
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            .replace(/`(.*?)`/g, '<code class="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs">$1</code>');

        formatted = formatted.replace(
            /(@[\w\s.-]+(?:\s|$))/g,
            `<span class="${isMe ? 'text-primary-foreground font-semibold underline' : 'text-primary font-semibold underline'}">$1</span>`,
        );

        if (term && term.trim()) {
            const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            formatted = formatted.replace(
                new RegExp(`(${escapedTerm})`, 'gi'),
                '<mark class="bg-yellow-300 text-slate-900 font-semibold px-1 rounded shadow-xs">$1</mark>',
            );
        }

        return (
            <div
                className="prose dark:prose-invert max-w-none break-words text-[13.5px] leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_li]:my-0.5"
                dangerouslySetInnerHTML={{ __html: formatted }}
            />
        );
    };

    const activeReactions = Object.entries(computedReactions).filter(([_, count]) => count > 0);

    return (
        <Message align={isMe ? 'end' : 'start'} className="mb-2.5 group/msg">
            <MessageAvatar>
                <UserAvatarIcon
                    src={msg.user?.avatar || ''}
                    name={name}
                    className="h-7 w-7 text-[10px]"
                />
            </MessageAvatar>
            <MessageContent className={cn("max-w-[85%] relative flex flex-col", isMe ? "items-end" : "items-start")}>
                <MessageHeader className={isMe ? 'justify-end' : 'justify-start'}>
                    <span className="font-semibold text-foreground text-xs">{isMe ? 'Anda' : name}</span>
                    {role && (
                        <span className="bg-primary/10 border border-primary/20 text-primary rounded-full px-1.5 py-0.2 text-[8.5px] font-bold tracking-tight uppercase">
                            {role}
                        </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">{time}</span>
                </MessageHeader>

                <div className={cn("relative group/bubble flex items-center max-w-full", isMe ? "justify-end" : "justify-start")} onContextMenu={handleContextMenu}>
                    <BubbleGroup className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                        <Bubble variant={isMe ? 'sent' : 'received'} className="relative shadow-2xs transition-shadow hover:shadow-xs px-3.5 py-2 rounded-2xl w-fit">
                            <BubbleContent className="p-0">
                                {msg.message && renderMessage(msg.message, highlight)}

                                {attachmentUrl && (
                                    <div className={cn("mt-2 rounded-xl overflow-hidden border border-border/40", isMe ? "bg-black/10 dark:bg-white/10" : "bg-muted/40")}>
                                        {isImage ? (
                                            <div
                                                className="group/img relative cursor-pointer overflow-hidden max-h-60 flex items-center justify-center bg-black/5"
                                                onClick={() => onPreview(attachmentUrl, attachmentName)}
                                            >
                                                <img
                                                    src={attachmentUrl}
                                                    alt={attachmentName}
                                                    className="w-full h-auto object-cover max-h-60 transition-transform duration-300 group-hover/img:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                                                    <Eye size={18} />
                                                    <span className="text-xs font-semibold">Lihat</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between p-2.5 gap-3">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className={cn(
                                                        "p-2 rounded-lg shrink-0",
                                                        isMe ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                                                    )}>
                                                        <FileIcon size={16} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className={cn("text-xs font-semibold truncate max-w-[200px]", isMe ? "text-primary-foreground" : "text-foreground")} title={attachmentName}>
                                                            {attachmentName}
                                                        </span>
                                                        <span className={cn("text-[10px] uppercase font-mono", isMe ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                                            {ext || 'FILE'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    {isPdf && (
                                                        <button
                                                             type="button"
                                                             onClick={() => onPreview(attachmentUrl, attachmentName)}
                                                             className={cn(
                                                                 "p-1.5 rounded-lg transition-colors cursor-pointer",
                                                                 isMe ? "hover:bg-white/20 text-white" : "hover:bg-black/10 dark:hover:bg-white/10 text-foreground"
                                                             )}
                                                             title="Pratinjau Dokumen"
                                                         >
                                                             <Eye size={14} />
                                                         </button>
                                                    )}
                                                    <a
                                                        href={attachmentUrl}
                                                        download={attachmentName}
                                                        className={cn(
                                                            "p-1.5 rounded-lg transition-colors cursor-pointer",
                                                            isMe ? "hover:bg-white/20 text-white" : "hover:bg-black/10 dark:hover:bg-white/10 text-foreground"
                                                        )}
                                                        title="Unduh Berkas"
                                                    >
                                                        <Download size={14} />
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </BubbleContent>
                        </Bubble>

                        {activeReactions.length > 0 && (
                            <BubbleReactions className={cn("mt-1.5 flex flex-wrap gap-1 relative z-10", isMe ? "justify-end" : "justify-start")}>
                                {activeReactions.map(([emoji, count]) => {
                                    const isMyReact =
                                        Array.isArray(localReactions) &&
                                        localReactions.some((r: any) => r.emoji === emoji && (r.is_me || r.user_id === currentUserId));

                                    const reactingUsers = (localReactions || [])
                                        .filter((r: any) => r && r.emoji === emoji)
                                        .map((r: any) => r.user?.name || (r.is_me ? 'Anda' : 'Seseorang'))
                                        .join(', ');

                                    return (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={(e) => toggleReaction(emoji, e)}
                                            className={cn(
                                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] transition-all cursor-pointer select-none",
                                                isMyReact
                                                    ? "bg-primary/20 border border-primary/40 text-primary font-bold shadow-2xs"
                                                    : "bg-muted/90 hover:bg-muted border border-border text-foreground"
                                            )}
                                            title={reactingUsers}
                                        >
                                            <span>{emoji}</span>
                                            {count > 1 && <span className="text-[10px] font-semibold opacity-90">{count}</span>}
                                        </button>
                                    );
                                })}
                            </BubbleReactions>
                        )}
                    </BubbleGroup>

                    {/* Floating Action Buttons */}
                    <BubbleActions
                        className={cn(
                            "absolute top-0 opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-1 z-30",
                            isMe ? "-left-16" : "-right-16"
                        )}
                    >
                        <BubbleAction
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(msg.message || '');
                                setCopied(true);
                                setTimeout(() => setCopied(false), 1500);
                            }}
                            title="Salin Pesan"
                            className="p-1 rounded-full bg-background border border-border shadow-xs hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </BubbleAction>
                        <BubbleAction
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowReactionPicker((prev) => !prev);
                            }}
                            title="Tambah Reaksi"
                            className="p-1 rounded-full bg-background border border-border shadow-xs hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                            <Smile size={12} />
                        </BubbleAction>
                    </BubbleActions>

                    <ReactionContextBar
                        show={showReactionPicker}
                        pickerRef={pickerRef}
                        isMe={isMe}
                        localReactions={localReactions}
                        currentUserId={currentUserId}
                        onToggleReaction={toggleReaction}
                        onClose={() => setShowReactionPicker(false)}
                    />
                </div>

                {isMe && (
                    <MessageFooter className="justify-end mt-0.5">
                        {msg.read_by && msg.read_by.length > 0 ? (
                            <span title="Dibaca" className="text-sky-500 text-[10px] font-bold tracking-tighter leading-none">✓✓</span>
                        ) : (
                            <span title="Terkirim" className="text-slate-400 text-[10px] leading-none">✓</span>
                        )}
                    </MessageFooter>
                )}
            </MessageContent>
        </Message>
    );
}
