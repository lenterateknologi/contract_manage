import React from 'react';
import { cn } from '@/lib/utils';

interface ReactionContextBarProps {
    show: boolean;
    pickerRef: React.RefObject<HTMLDivElement | null>;
    isMe: boolean;
    localReactions: any[];
    currentUserId?: string;
    onToggleReaction: (emoji: string, e: React.MouseEvent) => void;
    onClose: () => void;
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉'];

export function ReactionContextBar({
    show,
    pickerRef,
    isMe,
    localReactions,
    currentUserId,
    onToggleReaction,
    onClose,
}: ReactionContextBarProps) {
    if (!show) return null;

    return (
        <div
            ref={pickerRef}
            className={cn(
                "absolute -top-10 z-40 flex items-center gap-1 rounded-full border border-border/80 bg-popover px-2 py-1 shadow-xl animate-in fade-in zoom-in-95 duration-150",
                isMe ? "right-2" : "left-2"
            )}
        >
            {REACTION_EMOJIS.map((emoji) => {
                const isSelected =
                    Array.isArray(localReactions) &&
                    localReactions.some((r: any) => r.emoji === emoji && (r.is_me || r.user_id === currentUserId));

                return (
                    <button
                        key={emoji}
                        type="button"
                        onClick={(e) => {
                            onToggleReaction(emoji, e);
                            onClose();
                        }}
                        className={cn(
                            "p-1 rounded-full transition-all text-sm cursor-pointer hover:scale-125",
                            isSelected
                                ? "bg-primary/20 text-primary font-bold scale-110 ring-1 ring-primary/40"
                                : "hover:bg-muted opacity-80 hover:opacity-100"
                        )}
                        title={isSelected ? `Hapus Reaksi ${emoji}` : `Reaksi ${emoji}`}
                    >
                        {emoji}
                    </button>
                );
            })}
        </div>
    );
}
