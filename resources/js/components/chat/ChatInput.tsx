import { cn } from '@/lib/utils';
import { RefreshCw, Send, Paperclip, X, File as FileIcon, Plus } from 'lucide-react';
import React, { useState } from 'react';
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
    const [showTools, setShowTools] = useState(false);

    return (
        <div className="border-surface-border border-t pt-3 relative">
            {/* Mention Auto-Suggest Dropdown */}
            <div className="relative">
                <MentionDropdown
                    isOpen={showMentions}
                    users={filteredUsers}
                    mentionIndex={mentionIndex}
                    setMentionIndex={setMentionIndex}
                    insertMention={insertMention}
                />
            </div>

            {/* Single Unified Card */}
            <div className="border-surface-border bg-surface-muted/30 focus-within:border-primary/50 focus-within:bg-surface-muted rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs">
                {selectedFile && (
                    <div className="bg-surface-muted border-b border-surface-border/50 animate-in fade-in flex items-center justify-between p-2.5 duration-200">
                        <div className="flex items-center gap-2.5">
                            <FileIcon size={14} strokeWidth={2.5} />
                            <div className="flex flex-col">
                                <span className="text-text-main mb-0.5 text-[9px] leading-none font-semibold tracking-tight uppercase">
                                    {selectedFile?.name}
                                </span>
                                <span className="text-text-soft text-[7.5px] font-semibold uppercase tabular-nums opacity-40">
                                    {((selectedFile?.size || 0) / 1024).toFixed(1)} KB
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedFile(null)}
                            className="hover:bg-surface-muted flex h-6 w-6 items-center justify-center rounded-lg transition-all active:scale-90 cursor-pointer"
                        >
                            <X size={13} strokeWidth={2.5} />
                        </button>
                    </div>
                )}

                <div className="flex items-end gap-1.5 p-1.5">
                    <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                setSelectedFile(e.target.files[0]);
                                setShowTools(false);
                            }
                        }}
                    />

                    <button
                        type="button"
                        title={showTools ? "Tutup menu" : "Lampirkan berkas"}
                        onClick={() => {
                            fileInputRef.current?.click();
                        }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl hover:bg-surface-muted text-text-soft hover:text-text-main transition-all duration-200 cursor-pointer"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                    </button>

                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Ketik pesan..."
                        rows={1}
                        className="text-text-main placeholder:text-text-soft/30 max-h-[120px] min-h-[36px] flex-1 resize-none bg-transparent py-2 px-2 text-[13px] leading-relaxed font-medium tracking-tight transition-all outline-none border-0"
                    />

                    <button
                        className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer',
                            input.trim() || selectedFile
                                ? 'bg-primary hover:bg-primary/90 text-white shadow-2xs active:scale-95'
                                : 'text-text-soft/30 cursor-not-allowed',
                        )}
                        onClick={onSend}
                        disabled={(!input.trim() && !selectedFile) || sending}
                    >
                        {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={15} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
