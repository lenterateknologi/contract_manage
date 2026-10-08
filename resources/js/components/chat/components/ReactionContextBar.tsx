import { cn } from '@/lib/utils';
import React from 'react';

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

export function ReactionContextBar({ show, pickerRef, isMe, localReactions, currentUserId, onToggleReaction, onClose }: ReactionContextBarProps) {
    if (!show) return null;

    return (
        <div
            ref={pickerRef}
            className={cn(
                'border-border/80 bg-popover animate-in fade-in zoom-in-95 absolute -top-12 z-40 flex items-center gap-1 rounded-full border px-2 py-1 whitespace-nowrap shadow-xl duration-150',
                isMe ? 'right-0' : 'left-0',
            )}
        >
            {REACTION_EMOJIS.map((emoji) => {
                const isSelected =
                    Array.isArray(localReactions) && localReactions.some((r: any) => r.emoji === emoji && (r.is_me || r.user_id === currentUserId));

                return (
                    <button
                        key={emoji}
                        type="button"
                        onClick={(e) => {
                            onToggleReaction(emoji, e);
                            onClose();
                        }}
                        className={cn(
                            'cursor-pointer rounded-full p-1 text-sm transition-all hover:scale-125',
                            isSelected
                                ? 'bg-primary/20 text-primary ring-primary/40 scale-110 font-bold ring-1'
                                : 'hover:bg-muted opacity-80 hover:opacity-100',
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
