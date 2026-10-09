import { Button } from '@/components/ui/buttons/Button';
import { MentionDropdown } from '@/features/Contracts/components/parts/MentionDropdown';
import { cn } from '@/lib/utils';
import {
    Bold,
    File as FileIcon,
    Italic,
    Paperclip,
    Send,
    X,
} from 'lucide-react';
import React, { useRef, useState } from 'react';

interface MessageComposerProps {
    onSendMessage: (text: string, file?: File | null) => Promise<void>;
    isSending?: boolean;
    placeholder?: string;
    users?: Array<{ id: string; name: string; email?: string }>;
}

export function MessageComposer({
    onSendMessage,
    isSending,
    placeholder = 'Tulis pesan diskusi...',
    users = [],
}: MessageComposerProps) {
    const [text, setText] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [mentionSearch, setMentionSearch] = useState('');
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionIndex, setMentionIndex] = useState(0);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter users based on query
    const filteredMentionUsers = React.useMemo(() => {
        if (!showMentionDropdown || !users || users.length === 0) return [];
        const q = mentionSearch.toLowerCase().trim();
        if (!q) return users.slice(0, 8);
        return users
            .filter((u) => {
                const name = (u.name || '').toLowerCase();
                const email = (u.email || '').toLowerCase();
                const role = (u.role || '').toLowerCase();
                const dept = (u.department?.name || u.department_name || '').toLowerCase();
                return name.includes(q) || email.includes(q) || role.includes(q) || dept.includes(q);
            })
            .slice(0, 8);
    }, [users, showMentionDropdown, mentionSearch]);

    const handleSend = async () => {
        if ((!text.trim() && !selectedFile) || isSending) return;
        const currentText = text;
        const currentFile = selectedFile;
        setText('');
        setSelectedFile(null);
        setShowMentionDropdown(false);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        try {
            await onSendMessage(currentText, currentFile);
        } catch (err) {
            // Restore text if failed
            setText(currentText);
            setSelectedFile(currentFile);
            console.error('Failed to send:', err);
        }
    };

    const handleSelectMention = (user: { id: string; name: string }) => {
        if (!textareaRef.current) return;
        const cursor = textareaRef.current.selectionStart || text.length;
        const textBefore = text.slice(0, cursor);
        const textAfter = text.slice(cursor);
        const lastAt = textBefore.lastIndexOf('@');
        if (lastAt === -1) return;

        const mentionText = `@${user.name} `;
        const updated = `${textBefore.slice(0, lastAt)}${mentionText}${textAfter}`;
        const nextCursor = lastAt + mentionText.length;
        setText(updated);
        setShowMentionDropdown(false);
        setMentionSearch('');
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(nextCursor, nextCursor);
            }
        }, 50);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showMentionDropdown && filteredMentionUsers.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionIndex((prev) => (prev + 1) % filteredMentionUsers.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionIndex((prev) => (prev - 1 + filteredMentionUsers.length) % filteredMentionUsers.length);
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                const selectedUser = filteredMentionUsers[mentionIndex] || filteredMentionUsers[0];
                if (selectedUser) {
                    handleSelectMention(selectedUser);
                }
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setShowMentionDropdown(false);
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setText(val);

        // Auto-expand textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
        }

        // Mention detector
        const cursor = e.target.selectionStart;
        const textBeforeCursor = val.slice(0, cursor);
        const lastAt = textBeforeCursor.lastIndexOf('@');
        if (lastAt !== -1 && (lastAt === 0 || /\s/.test(textBeforeCursor[lastAt - 1]))) {
            const query = textBeforeCursor.slice(lastAt + 1);
            if (!/\s/.test(query)) {
                setMentionSearch(query);
                setMentionIndex(0);
                setShowMentionDropdown(true);
                return;
            }
        }
        setShowMentionDropdown(false);
    };

    const applyFormat = (wrapper: string) => {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const selected = text.substring(start, end);
        const updated = `${text.substring(0, start)}${wrapper}${selected || 'teks'}${wrapper}${text.substring(end)}`;
        setText(updated);
        setTimeout(() => {
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(
                start + wrapper.length,
                end + wrapper.length + (selected ? 0 : 4),
            );
        }, 50);
    };

    return (
        <div className="relative border-t border-border bg-card p-3">
            {/* Mention Dropdown */}
            {showMentionDropdown && filteredMentionUsers.length > 0 && (
                <div className="absolute bottom-full left-4 mb-2 z-50">
                    <MentionDropdown
                        isOpen={showMentionDropdown}
                        users={filteredMentionUsers}
                        mentionIndex={mentionIndex}
                        setMentionIndex={setMentionIndex}
                        insertMention={handleSelectMention}
                    />
                </div>
            )}

            {/* Selected File Attachment Badge */}
            {selectedFile && (
                <div className="mb-2 flex items-center gap-2 w-fit rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <FileIcon className="h-4 w-4 text-primary" />
                    <span className="max-w-[200px] truncate font-medium">{selectedFile.name}</span>
                    <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="ml-1 rounded-full p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/50 p-2 focus-within:border-primary focus-within:bg-white focus-within:ring-1 focus-within:ring-primary dark:border-slate-700 dark:bg-slate-800/50 dark:focus-within:bg-slate-800">
                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    rows={1}
                    className="w-full resize-none bg-transparent px-2 py-1 text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
                />

                {/* Toolbar */}
                <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-700"
                            title="Lampirkan Dokumen"
                        >
                            <Paperclip className="h-4 w-4" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) setSelectedFile(f);
                                e.target.value = '';
                            }}
                        />

                        <button
                            type="button"
                            onClick={() => applyFormat('**')}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-700"
                            title="Tebal (Bold)"
                        >
                            <Bold className="h-3.5 w-3.5" />
                        </button>

                        <button
                            type="button"
                            onClick={() => applyFormat('*')}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-700"
                            title="Miring (Italic)"
                        >
                            <Italic className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <Button
                        size="sm"
                        onClick={handleSend}
                        disabled={(!text.trim() && !selectedFile) || isSending}
                        className={cn(
                            'h-7 px-3 text-xs gap-1.5 rounded-lg shadow-xs font-semibold',
                            (!text.trim() && !selectedFile) ? 'opacity-50' : 'opacity-100',
                        )}
                    >
                        <span>Kirim</span>
                        <Send className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
