import { UserAvatarIcon } from '@/components/profile/UserAvatar';
import {
    Bubble,
    BubbleContent,
    BubbleGroup,
    BubbleReactions,
    Message,
    MessageAvatar,
    MessageContent,
    MessageHeader,
} from '@/components/ui/user/Message';
import { cn } from '@/lib/utils';
import { ContractMessage } from '@/pages/contracts/types';
import { discussionsApi } from '@/api';
import { usePage } from '@inertiajs/react';
import { Check, Copy, Download, Eye, File as FileIcon, Smile } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ReactionContextBar } from './ReactionContextBar';

interface MessageBubbleProps {
    msg: ContractMessage;
    isMe: boolean;
    highlight?: string;
    onPreview: (url: string, name: string) => void;
    knownUsers?: Array<{ id?: string; name?: string }>;
    isFirstInGroup?: boolean;
    isLastInGroup?: boolean;
}

export function MessageBubble({ msg, isMe, highlight, onPreview, knownUsers, isFirstInGroup = true, isLastInGroup = true }: MessageBubbleProps) {
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
            const res: any = await discussionsApi.messages.react(msg.id, emoji);
            const reactions = res?.reactions || res?.data?.reactions;
            if (reactions && Array.isArray(reactions)) {
                setLocalReactions(reactions);
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
        return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? '') : '';
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

        const mentionBadgeClass = isMe
            ? 'inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md text-[11px] font-bold tracking-tight bg-white/20 text-white border border-white/30 shadow-2xs backdrop-blur-xs select-none'
            : 'inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md text-[11px] font-bold tracking-tight bg-primary/10 text-primary border border-primary/20 shadow-2xs hover:bg-primary/15 select-none';

        // 1. Format atomic tags: <span class="mention-tag" ...>@Name</span> or <span data-name="Name">...</span>
        formatted = formatted.replace(
            /<span[^>]*?(?:class="[^"]*mention-tag[^"]*"|data-name="([^"]*)")[^>]*?>.*?@([^<]+)<\/span>/gi,
            (_match, dataName, innerName) => {
                const nameToUse = (dataName || innerName || '').trim();
                return `<span class="${mentionBadgeClass}">@${nameToUse}</span>`;
            },
        );

        // 2. Format explicit <strong>@Name</strong> tags (exact boundary preserved)
        formatted = formatted.replace(/<strong>(@[^<]+)<\/strong>/gi, `<span class="${mentionBadgeClass}">$1</span>`);

        // 3. Format against known user names (sorted length desc so full names e.g. "RENDY CHRISTIAN CHANDRA" match before substrings)
        if (Array.isArray(knownUsers) && knownUsers.length > 0) {
            const sortedNames = Array.from(
                new Set(knownUsers.map((u) => u?.name?.trim()).filter((n): n is string => Boolean(n && n.length > 1))),
            ).sort((a, b) => b.length - a.length);

            for (const uname of sortedNames) {
                const escaped = uname
                    .split(/\s+/)
                    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                    .join('[\\s\\u00A0]+');
                const regex = new RegExp(`(?<![a-zA-Z0-9_>])@(${escaped})(?=[^a-zA-Z0-9_.-]|$)`, 'gi');
                formatted = formatted.replace(regex, `<span class="${mentionBadgeClass}">@$1</span>`);
            }
        }

        // 4. Format remaining raw single-token @mentions (e.g. @user, @john.doe) without eating subsequent words
        formatted = formatted.replace(/(?<![a-zA-Z0-9_>])(@[a-zA-Z0-9_.-]+)(?=[^a-zA-Z0-9_.-]|$)/g, `<span class="${mentionBadgeClass}">$1</span>`);

        if (term && term.trim()) {
            const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            formatted = formatted.replace(
                new RegExp(`(${escapedTerm})`, 'gi'),
                '<mark class="bg-yellow-300 text-slate-900 font-semibold px-1 rounded shadow-xs">$1</mark>',
            );
        }

        return (
            <div
                className="prose dark:prose-invert max-w-none text-[13.5px] leading-relaxed break-words [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: formatted }}
            />
        );
    };

    const authUser = (pageProps.auth as any)?.user;
    const isCurrentUser = isMe || (currentUserId && String(msg.user_id || (msg.user as any)?.id || '') === String(currentUserId));
    const effectiveUser = msg.user && msg.user.initials !== 'ME' ? msg.user : (isCurrentUser ? authUser : msg.user);
    const effectiveInitials = effectiveUser?.initials || (msg.user?.initials && msg.user.initials !== 'ME' ? msg.user.initials : (isCurrentUser ? authUser?.initials : undefined));
    const effectiveAvatar = msg.user?.avatar || (isCurrentUser ? authUser?.avatar || authUser?.avatar_url || authUser?.image_src : '');
    const activeReactions = Object.entries(computedReactions).filter(([_, count]) => count > 0);

    return (
        <Message align={isMe ? 'end' : 'start'} className={cn('group/msg transition-all', isLastInGroup ? 'mb-2.5' : 'mb-1')}>
            <MessageAvatar className="shrink-0 self-end">
                {isLastInGroup ? (
                    <UserAvatarIcon
                        user={effectiveUser}
                        src={effectiveAvatar}
                        name={isCurrentUser ? (authUser?.name || name) : name}
                        initials={effectiveInitials}
                        className="h-7 w-7 text-[10px]"
                    />
                ) : (
                    <div className="h-7 w-7 shrink-0" />
                )}
            </MessageAvatar>
            <MessageContent className={cn('relative flex max-w-[85%] flex-col', isMe ? 'items-end' : 'items-start')}>
                {isFirstInGroup && (
                    <MessageHeader className={isMe ? 'justify-end' : 'justify-start'}>
                        <span className="text-foreground text-xs font-semibold">{isMe ? 'Anda' : name}</span>
                        {role && (
                            <span className="bg-primary/10 border-primary/20 text-primary py-0.2 rounded-full border px-1.5 text-[8.5px] font-bold tracking-tight uppercase">
                                {role}
                            </span>
                        )}
                    </MessageHeader>
                )}

                <div
                    className={cn('group/bubble relative flex max-w-full items-center', isMe ? 'justify-end' : 'justify-start')}
                    onContextMenu={handleContextMenu}
                >
                    <BubbleGroup className={cn('flex flex-col', isMe ? 'items-end' : 'items-start')}>
                        <Bubble
                            variant={isMe ? 'sent' : 'received'}
                            className="relative w-fit min-w-[70px] rounded-2xl px-3.5 py-2 shadow-2xs transition-shadow hover:shadow-xs"
                        >
                            <BubbleContent className="p-0">
                                {msg.message && renderMessage(msg.message, highlight)}

                                {attachmentUrl && (
                                    <div
                                        className={cn(
                                            'border-border/40 mt-2 overflow-hidden rounded-xl border',
                                            isMe ? 'bg-black/10 dark:bg-white/10' : 'bg-muted/40',
                                        )}
                                    >
                                        {isImage ? (
                                            <div
                                                className="group/img relative flex max-h-60 cursor-pointer items-center justify-center overflow-hidden bg-black/5"
                                                onClick={() => onPreview(attachmentUrl, attachmentName)}
                                            >
                                                <img
                                                    src={attachmentUrl}
                                                    alt={attachmentName}
                                                    className="h-auto max-h-60 w-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30 text-white opacity-0 transition-opacity group-hover/img:opacity-100">
                                                    <Eye size={18} />
                                                    <span className="text-xs font-semibold">Lihat</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between gap-3 p-2.5">
                                                <div className="flex min-w-0 items-center gap-2.5">
                                                    <div
                                                        className={cn(
                                                            'shrink-0 rounded-lg p-2',
                                                            isMe ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary',
                                                        )}
                                                    >
                                                        <FileIcon size={16} />
                                                    </div>
                                                    <div className="flex min-w-0 flex-col">
                                                        <span
                                                            className={cn(
                                                                'max-w-[200px] truncate text-xs font-semibold',
                                                                isMe ? 'text-primary-foreground' : 'text-foreground',
                                                            )}
                                                            title={attachmentName}
                                                        >
                                                            {attachmentName}
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                'font-mono text-[10px] uppercase',
                                                                isMe ? 'text-primary-foreground/80' : 'text-muted-foreground',
                                                            )}
                                                        >
                                                            {ext || 'FILE'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-1">
                                                    {isPdf && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onPreview(attachmentUrl, attachmentName)}
                                                            className={cn(
                                                                'cursor-pointer rounded-lg p-1.5 transition-colors',
                                                                isMe
                                                                    ? 'text-white hover:bg-white/20'
                                                                    : 'text-foreground hover:bg-black/10 dark:hover:bg-white/10',
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
                                                            'cursor-pointer rounded-lg p-1.5 transition-colors',
                                                            isMe
                                                                ? 'text-white hover:bg-white/20'
                                                                : 'text-foreground hover:bg-black/10 dark:hover:bg-white/10',
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

                                {/* In-Bubble Timestamp & Delivery/Read Status */}
                                <div
                                    className={cn(
                                        'mt-1 flex items-center gap-1 select-none',
                                        isMe ? 'text-primary-foreground/80 justify-end' : 'text-muted-foreground/75 justify-end',
                                    )}
                                >
                                    <span className="text-[9.5px] leading-none font-medium">{time}</span>
                                    {isMe &&
                                        (msg.read_by && msg.read_by.length > 0 ? (
                                            <span title="Dibaca" className="text-[10px] leading-none font-bold tracking-tighter text-white">
                                                ✓✓
                                            </span>
                                        ) : (
                                            <span title="Terkirim" className="text-[10px] leading-none text-white/70">
                                                ✓
                                            </span>
                                        ))}
                                </div>
                            </BubbleContent>
                        </Bubble>

                        {activeReactions.length > 0 && (
                            <BubbleReactions className={cn('relative z-10 mt-1.5 flex flex-wrap gap-1', isMe ? 'justify-end' : 'justify-start')}>
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
                                                'inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-[11px] transition-all select-none',
                                                isMyReact
                                                    ? 'bg-primary/20 border-primary/40 text-primary border font-bold shadow-2xs'
                                                    : 'bg-muted/90 hover:bg-muted border-border text-foreground border',
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

                    {/* Floating Action Buttons (Positioned high above bubble, no overlap) */}
                    <div
                        className={cn(
                            'pointer-events-none absolute -top-7 z-30 flex items-center gap-1 opacity-0 transition-all duration-150 group-hover/bubble:pointer-events-auto group-hover/bubble:opacity-100',
                            isMe ? 'right-0' : 'left-0',
                        )}
                    >
                        <div className="border-border/80 bg-background/95 flex items-center gap-0.5 rounded-full border p-0.5 shadow-xs backdrop-blur-xs">
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(msg.message || '');
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 1500);
                                }}
                                title="Salin Pesan"
                                className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-6 w-6 cursor-pointer items-center justify-center rounded-full transition-colors"
                            >
                                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowReactionPicker((prev) => !prev);
                                }}
                                title="Tambah Reaksi"
                                className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-6 w-6 cursor-pointer items-center justify-center rounded-full transition-colors"
                            >
                                <Smile size={12} />
                            </button>
                        </div>
                    </div>

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
            </MessageContent>
        </Message>
    );
}
