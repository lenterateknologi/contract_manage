import { UserAvatarIcon } from '@/components/profile/UserAvatar';
import {
    Bubble,
    BubbleContent,
    BubbleGroup,
    Message,
    MessageAvatar,
    MessageContent,
    MessageHeader,
} from '@/components/ui/user/Message';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { Check, Copy, Download, Eye, File as FileIcon, Smile } from 'lucide-react';
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ChatMessage } from '../../types/message.types';
import {
    computeReactionCounts,
    formatMessageTime,
    getAttachmentExtension,
    isImageAttachment,
    normalizeAttachmentUrl,
} from '../../utils/messageUtils';

interface MessageItemProps {
    msg: ChatMessage;
    isMe: boolean;
    highlight?: string;
    onPreview: (url: string, name: string) => void;
    onToggleReaction?: (emoji: string) => void;
    isFirstInGroup?: boolean;
    isLastInGroup?: boolean;
}

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '👏', '🎉', '😮', '😢', '🙏'];

export function MessageItem({
    msg,
    isMe,
    highlight,
    onPreview,
    onToggleReaction,
    isFirstInGroup = true,
    isLastInGroup = true,
}: MessageItemProps) {
    const pageProps = usePage().props;
    const currentUserId = (pageProps.auth as any)?.user?.id;
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);

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

    const computedReactions = useMemo(
        () => computeReactionCounts(msg.reactions),
        [msg.reactions],
    );

    const time = formatMessageTime(msg.created_at);
    const name = msg.user?.name ?? 'Unknown';
    const role = msg.user?.role ?? '';

    const rawAttachmentUrl = msg.attachment_url || msg.attachment_path;
    const attachmentUrl = normalizeAttachmentUrl(rawAttachmentUrl);
    const attachmentName = msg.attachment_name || msg.file_name || 'Berkas';

    const isImage = isImageAttachment(attachmentUrl);
    const ext = getAttachmentExtension(attachmentUrl);

    const renderTextContent = (text: string) => {
        if (!highlight || !text) return text;
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === highlight.toLowerCase() ? (
                <mark key={i} className="rounded bg-amber-200 px-0.5 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
                    {part}
                </mark>
            ) : (
                part
            ),
        );
    };

    const handleCopyText = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (msg.message) {
            navigator.clipboard.writeText(msg.message);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const authUser = (pageProps.auth as any)?.user;
    const isCurrentUser = isMe || (currentUserId && String(msg.user_id || '') === String(currentUserId));
    const effectiveUser = msg.user && msg.user.initials !== 'ME' ? msg.user : isCurrentUser ? authUser : msg.user;
    const effectiveInitials =
        effectiveUser?.initials ||
        (msg.user?.initials && msg.user.initials !== 'ME' ? msg.user.initials : isCurrentUser ? authUser?.initials : undefined);
    const effectiveAvatar = msg.user?.avatar || (isCurrentUser ? authUser?.avatar || authUser?.avatar_url || authUser?.image_src : '');
    const activeReactions = Object.entries(computedReactions).filter(([, count]) => count > 0);

    return (
        <Message align={isMe ? 'end' : 'start'} className={cn('group/msg transition-all', isLastInGroup ? 'mb-2.5' : 'mb-1')}>
            <MessageAvatar className="shrink-0 self-end">
                {isLastInGroup ? (
                    <UserAvatarIcon
                        user={effectiveUser}
                        src={effectiveAvatar}
                        name={isCurrentUser ? authUser?.name || name : name}
                        initials={effectiveInitials}
                        className="h-7 w-7 rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                    />
                ) : (
                    <div className="w-7" />
                )}
            </MessageAvatar>

            <MessageContent className="max-w-[85%] sm:max-w-[70%]">
                {isFirstInGroup && !isMe && (
                    <MessageHeader className="mb-1 flex items-baseline gap-2">
                        <span className="text-[11px] font-semibold text-slate-900 dark:text-slate-100">{name}</span>
                        {role && <span className="text-[10px] text-slate-400 capitalize">({role})</span>}
                        <span className="text-[9px] text-slate-400">{time}</span>
                    </MessageHeader>
                )}

                <div className="relative group/bubble flex items-center gap-1.5" onContextMenu={handleContextMenu}>
                    <Bubble
                        variant={isMe ? 'sent' : 'received'}
                        className={cn(
                            'relative rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm transition-all',
                            isMe
                                ? 'bg-primary text-primary-foreground font-medium selection:bg-white/30'
                                : 'bg-white text-slate-800 border border-slate-100 dark:bg-slate-800 dark:border-slate-700/50 dark:text-slate-100',
                            !isFirstInGroup && (isMe ? 'rounded-tr-md' : 'rounded-tl-md'),
                            !isLastInGroup && (isMe ? 'rounded-br-md' : 'rounded-bl-md'),
                        )}
                    >
                        {/* Attachment Area */}
                        {attachmentUrl && (
                            <div className="mb-2">
                                {isImage ? (
                                    <div
                                        onClick={() => onPreview(attachmentUrl, attachmentName)}
                                        className="group/img relative cursor-pointer overflow-hidden rounded-xl border border-black/5 bg-black/5 transition-transform hover:opacity-95"
                                    >
                                        <img src={attachmentUrl} alt={attachmentName} className="max-h-60 w-full object-cover" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover/img:opacity-100">
                                            <Eye className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => onPreview(attachmentUrl, attachmentName)}
                                        className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-black/10 bg-black/5 p-2 transition-colors hover:bg-black/10 dark:border-white/10 dark:bg-white/5"
                                    >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                                            <FileIcon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold">{attachmentName}</p>
                                            <p className="text-[10px] text-slate-400 uppercase">{ext || 'FILE'}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <a
                                                href={attachmentUrl}
                                                download={attachmentName}
                                                onClick={(e) => e.stopPropagation()}
                                                className="rounded-lg p-1.5 hover:bg-black/10 dark:hover:bg-white/10"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Text Message */}
                        {msg.message && <BubbleContent className="whitespace-pre-wrap">{renderTextContent(msg.message)}</BubbleContent>}

                        {/* Timestamp & Status (For sender) */}
                        <div className={cn('mt-1 flex items-center justify-end gap-1 text-[9px]', isMe ? 'text-primary-foreground/70' : 'text-slate-400')}>
                            <span>{time}</span>
                        </div>
                    </Bubble>

                    {/* Quick Reaction Bar on Hover */}
                    <div
                        className={cn(
                            'opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-0.5 rounded-full bg-white border border-slate-200 px-1.5 py-0.5 shadow-sm dark:bg-slate-800 dark:border-slate-700',
                            isMe ? 'order-first' : 'order-last',
                        )}
                    >
                        <button
                            type="button"
                            onClick={() => setShowReactionPicker((p) => !p)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 dark:hover:bg-slate-700"
                            title="Beri Reaksi"
                        >
                            <Smile className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={handleCopyText}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 dark:hover:bg-slate-700"
                            title="Salin Teks"
                        >
                            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                    </div>

                    {/* Emoji Picker Popover */}
                    {showReactionPicker && (
                        <div
                            ref={pickerRef}
                            className={cn(
                                'absolute z-30 bottom-full mb-1 flex items-center gap-1 rounded-full bg-white p-1 shadow-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 animate-in fade-in zoom-in-95',
                                isMe ? 'right-0' : 'left-0',
                            )}
                        >
                            {COMMON_EMOJIS.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => {
                                        onToggleReaction?.(emoji);
                                        setShowReactionPicker(false);
                                    }}
                                    className="h-7 w-7 rounded-full text-sm hover:scale-125 transition-transform flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reaction Badges */}
                {activeReactions.length > 0 && (
                    <BubbleGroup className={cn('mt-1 flex flex-wrap gap-1', isMe ? 'justify-end' : 'justify-start')}>
                        {activeReactions.map(([emoji, count]) => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => onToggleReaction?.(emoji)}
                                className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 px-2 py-0.5 text-[11px] shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                            >
                                <span>{emoji}</span>
                                <span className="font-semibold text-slate-600 dark:text-slate-300">{count}</span>
                            </button>
                        ))}
                    </BubbleGroup>
                )}
            </MessageContent>
        </Message>
    );
}
