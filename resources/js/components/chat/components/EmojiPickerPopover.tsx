import React from 'react';
import { X } from 'lucide-react';

interface EmojiPickerPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectEmoji: (emoji: string) => void;
}

const EMOJI_LIST = [
    '👍', '❤️', '😂', '🔥', '🎉', '👏', '🙏', '😊', '✅', '🚀',
    '💡', '🤔', '👀', '💯', '🤝', '🙌', '⭐', '📌', '⚠️', '❌',
    '👌', '💬', '📝', '⚡', '🤩', '😎', '💪', '🎯', '✨', '👋'
];

export function EmojiPickerPopover({ isOpen, onClose, onSelectEmoji }: EmojiPickerPopoverProps) {
    if (!isOpen) return null;

    return (
        <div className="absolute bottom-11 left-0 z-50 animate-in fade-in zoom-in-95 duration-150 rounded-2xl border border-border bg-popover p-3 shadow-2xl w-72">
            <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pilih Emoji</span>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                >
                    <X size={12} />
                </button>
            </div>
            <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {EMOJI_LIST.map((emoji) => (
                    <button
                        key={emoji}
                        type="button"
                        onClick={() => onSelectEmoji(emoji)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-base hover:bg-muted transition-transform active:scale-125 cursor-pointer"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}
