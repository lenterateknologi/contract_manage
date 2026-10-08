import { X } from 'lucide-react';

interface EmojiPickerPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectEmoji: (emoji: string) => void;
}

const EMOJI_LIST = [
    '👍',
    '❤️',
    '😂',
    '🔥',
    '🎉',
    '👏',
    '🙏',
    '😊',
    '✅',
    '🚀',
    '💡',
    '🤔',
    '👀',
    '💯',
    '🤝',
    '🙌',
    '⭐',
    '📌',
    '⚠️',
    '❌',
    '👌',
    '💬',
    '📝',
    '⚡',
    '🤩',
    '😎',
    '💪',
    '🎯',
    '✨',
    '👋',
];

export function EmojiPickerPopover({ isOpen, onClose, onSelectEmoji }: EmojiPickerPopoverProps) {
    if (!isOpen) return null;

    return (
        <div className="animate-in fade-in zoom-in-95 border-border bg-popover absolute bottom-11 left-0 z-50 w-72 rounded-2xl border p-3 shadow-2xl duration-150">
            <div className="border-border/60 mb-2 flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Pilih Emoji</span>
                <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground cursor-pointer rounded p-0.5">
                    <X size={12} />
                </button>
            </div>
            <div className="grid max-h-48 grid-cols-6 gap-1.5 overflow-y-auto pr-1">
                {EMOJI_LIST.map((emoji) => (
                    <button
                        key={emoji}
                        type="button"
                        onClick={() => onSelectEmoji(emoji)}
                        className="hover:bg-muted flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-base transition-transform active:scale-125"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}
