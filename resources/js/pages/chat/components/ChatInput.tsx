import { cn } from '@/lib/utils';
import { RefreshCw, Send, Paperclip, X, FileIcon } from 'lucide-react';
import React from 'react';
import { MentionDropdown } from '@/pages/contracts/components/parts/MentionDropdown';

interface ChatInputProps {
    input: string;
    setInput: (val: string) => void;
    onSend: () => void;
    sending: boolean;
    selectedFile: File | null;
    setSelectedFile: (file: File | null) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    showMentions: boolean;
    filteredUsers: any[];
    mentionIndex: number;
    setMentionIndex: (idx: number) => void;
    insertMention: (user: any) => void;
}

export function ChatInput({
    input,
    onSend,
    sending,
    selectedFile,
    setSelectedFile,
    fileInputRef,
    textareaRef,
    handleInputChange,
    handleKeyDown,
    showMentions,
    filteredUsers,
    mentionIndex,
    setMentionIndex,
    insertMention,
}: ChatInputProps) {
    return (
        <div className="border-surface-border border-t pt-3">
            {selectedFile && (
                <div className="bg-surface-muted animate-in slide-in-from-bottom-1 mb-3 flex items-center justify-between rounded-lg p-2.5 duration-300">
                    <div className="flex items-center gap-2.5">
                        <FileIcon size={14} strokeWidth={2.5} />
                        <div className="flex flex-col">
                            <span className="text-text-main mb-1 text-[9px] leading-none font-semibold tracking-tight uppercase">
                                {selectedFile?.name}
                            </span>
                            <span className="text-text-soft text-[7.5px] font-semibold uppercase tabular-nums opacity-40">
                                {((selectedFile?.size || 0) / 1024).toFixed(1)} KB
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setSelectedFile(null)}
                        className="hover:bg-surface-muted flex h-7 w-7 items-center justify-center rounded-lg transition-all active:scale-90"
                    >
                        <X size={14} strokeWidth={2.5} />
                    </button>
                </div>
            )}

            <div className="group relative flex items-end gap-2">
                <MentionDropdown
                    isOpen={showMentions}
                    users={filteredUsers}
                    mentionIndex={mentionIndex}
                    setMentionIndex={setMentionIndex}
                    insertMention={insertMention}
                />

                <div className="border-surface-border bg-surface-muted/30 focus-within:border-primary/30 focus-within:bg-surface-muted relative flex flex-1 items-end rounded-2xl border transition-all duration-300">
                    <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-text-soft hover:text-text-main flex h-10 w-10 shrink-0 items-center justify-center transition-colors"
                    >
                        <Paperclip size={16} />
                    </button>
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Ketik pesan..."
                        rows={1}
                        className="text-text-main placeholder:text-text-soft/30 max-h-[120px] min-h-[40px] flex-1 resize-none bg-transparent py-2.5 pr-4 text-[13px] leading-relaxed font-medium tracking-tight transition-all outline-none"
                    />
                </div>
                <button
                    className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all',
                        input.trim() || selectedFile
                            ? 'bg-primary hover:bg-primary/90 text-white shadow-lg active:scale-95'
                            : 'bg-surface-muted text-text-soft/40',
                    )}
                    onClick={onSend}
                    disabled={(!input.trim() && !selectedFile) || sending}
                >
                    {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={16} />}
                </button>
            </div>
        </div>
    );
}
