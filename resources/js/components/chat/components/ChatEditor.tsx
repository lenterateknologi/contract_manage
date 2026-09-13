import React, { useRef, useState } from 'react';
import {
    Bold,
    ChevronDown,
    ChevronUp,
    Code,
    File as FileIcon,
    Heading1,
    Heading2,
    Italic,
    Link,
    List,
    ListOrdered,
    Paperclip,
    Quote,
    RefreshCw,
    Save,
    Send,
    Smile,
    Strikethrough,
    Table,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MentionDropdown } from '@/pages/contracts/components/parts/MentionDropdown';
import { EmojiPickerPopover } from './EmojiPickerPopover';

interface ChatEditorProps {
    input: string;
    setInput: (val: string) => void;
    sending: boolean;
    onSend: () => void;
    selectedFiles: File[];
    onRemoveFile: (index: number) => void;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    editorRef: React.RefObject<HTMLDivElement | null>;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    filteredUsers: any[];
    showMentions: boolean;
    mentionIndex: number;
    setMentionIndex: (idx: number) => void;
    insertMention: (user: any) => void;
    handleEditorInput: () => void;
    handleEditorKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
    handlePaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
    draftSavedTime?: string | null;
    onSaveDraft: () => void;
}

export function ChatEditor({
    input,
    setInput,
    sending,
    onSend,
    selectedFiles,
    onRemoveFile,
    onFileSelect,
    editorRef,
    fileInputRef,
    filteredUsers,
    showMentions,
    mentionIndex,
    setMentionIndex,
    insertMention,
    handleEditorInput,
    handleEditorKeyDown,
    handlePaste,
    draftSavedTime,
    onSaveDraft,
}: ChatEditorProps) {
    const [showFormatting, setShowFormatting] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

    const updateActiveFormats = () => {
        if (!editorRef.current) return;
        setActiveFormats({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            strikethrough: document.queryCommandState('strikeThrough'),
            unorderedList: document.queryCommandState('insertUnorderedList'),
            orderedList: document.queryCommandState('insertOrderedList'),
            h1: document.queryCommandValue('formatBlock') === 'h1',
            h2: document.queryCommandValue('formatBlock') === 'h2',
        });
    };

    const execFormat = (command: string, value: string | undefined = undefined) => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        document.execCommand(command, false, value);
        handleEditorInput();
        updateActiveFormats();
    };

    const handleSelectEmoji = (emoji: string) => {
        if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand('insertText', false, emoji);
            setInput(editorRef.current.innerHTML);
        }
        setShowEmojiPicker(false);
    };

    return (
        <div className="p-3 border-t border-border bg-background">
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

            {/* Selected File Chips Preview */}
            {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 px-1">
                    {selectedFiles.map((file, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-foreground text-xs"
                        >
                            <FileIcon size={13} className="text-primary shrink-0" />
                            <span className="truncate max-w-[150px] font-medium">{file.name}</span>
                            <span className="text-[10px] text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
                            <button
                                type="button"
                                onClick={() => onRemoveFile(idx)}
                                className="text-muted-foreground hover:text-rose-500 transition-colors p-0.5"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="rounded-2xl border border-border bg-muted/40 transition-all focus-within:border-primary/50 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/10">
                {/* Secondary Extended Formatting Toolbar (Collapsible) */}
                {showFormatting && (
                    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/60 bg-muted/20 text-muted-foreground overflow-x-auto">
                        <button
                            type="button"
                            title="Heading 1"
                            onClick={() => execFormat('formatBlock', '<h1>')}
                            className={cn(
                                "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
                                activeFormats.h1 ? "bg-primary text-white font-bold" : "hover:bg-muted text-foreground"
                            )}
                        >
                            <Heading1 size={13} />
                        </button>
                        <button
                            type="button"
                            title="Heading 2"
                            onClick={() => execFormat('formatBlock', '<h2>')}
                            className={cn(
                                "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
                                activeFormats.h2 ? "bg-primary text-white font-bold" : "hover:bg-muted text-foreground"
                            )}
                        >
                            <Heading2 size={13} />
                        </button>
                        <div className="h-3.5 w-px bg-border/60 mx-1" />
                        <button
                            type="button"
                            title="Kutipan (Quote)"
                            onClick={() => execFormat('formatBlock', '<blockquote>')}
                            className="p-1.5 rounded-lg text-xs hover:bg-muted text-foreground transition-all cursor-pointer"
                        >
                            <Quote size={13} />
                        </button>
                        <button
                            type="button"
                            title="Blok Kode (Code)"
                            onClick={() => execFormat('formatBlock', '<pre>')}
                            className="p-1.5 rounded-lg text-xs hover:bg-muted text-foreground transition-all cursor-pointer"
                        >
                            <Code size={13} />
                        </button>
                        <button
                            type="button"
                            title="Tabel Sederhana"
                            onClick={() => {
                                const tableHtml = '<table border="1" style="border-collapse:collapse;width:100%;margin:4px 0;"><tr><td>Kolom 1</td><td>Kolom 2</td></tr><tr><td>Data 1</td><td>Data 2</td></tr></table><p></p>';
                                document.execCommand('insertHTML', false, tableHtml);
                                handleEditorInput();
                            }}
                            className="p-1.5 rounded-lg text-xs hover:bg-muted text-foreground transition-all cursor-pointer"
                        >
                            <Table size={13} />
                        </button>
                    </div>
                )}

                {/* ContentEditable Input Area */}
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleEditorInput}
                    onKeyDown={handleEditorKeyDown}
                    onKeyUp={updateActiveFormats}
                    onMouseUp={updateActiveFormats}
                    onPaste={handlePaste}
                    data-placeholder="Tulis pesan atau tanggapan... (Ketik @ untuk tag pengguna, Shift+Enter untuk baris baru)"
                    className="min-h-[60px] max-h-[160px] overflow-y-auto px-4 py-3 text-sm text-foreground focus:outline-none leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 empty:before:pointer-events-none select-text [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-2 [&_blockquote]:italic [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded [&_pre]:text-xs [&_pre]:font-mono [&_table]:w-full [&_table]:text-xs [&_td]:border [&_td]:border-border [&_td]:p-1.5"
                />

                {/* Bottom Action / Control Toolbar */}
                <div className="flex items-center justify-between px-3 py-2 border-t border-border/40">
                    <div className="flex items-center gap-1 relative">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={onFileSelect}
                            multiple
                            className="hidden"
                            accept="*/*"
                        />
                        <button
                            type="button"
                            title="Lampirkan Dokumen / Berkas"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        >
                            <Paperclip size={15} />
                        </button>

                        <button
                            type="button"
                            title="Buka Pilihan Emoji"
                            onClick={() => setShowEmojiPicker((prev) => !prev)}
                            className={cn(
                                "p-1.5 rounded-lg transition-all cursor-pointer",
                                showEmojiPicker ? "bg-primary/20 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Smile size={15} />
                        </button>

                        <div className="h-4 w-px bg-border/60 mx-1" />

                        {/* Basic Inline Text Formatting Buttons */}
                        <div className="flex items-center gap-0.5">
                            <button
                                type="button"
                                title="Tebal (Ctrl+B)"
                                onClick={() => execFormat('bold')}
                                className={cn(
                                    "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
                                    activeFormats.bold ? "bg-primary text-white font-bold" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Bold size={13} />
                            </button>
                            <button
                                type="button"
                                title="Miring (Ctrl+I)"
                                onClick={() => execFormat('italic')}
                                className={cn(
                                    "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
                                    activeFormats.italic ? "bg-primary text-white font-bold" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Italic size={13} />
                            </button>
                            <button
                                type="button"
                                title="Coret Teks"
                                onClick={() => execFormat('strikeThrough')}
                                className={cn(
                                    "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
                                    activeFormats.strikethrough ? "bg-primary text-white font-bold" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Strikethrough size={13} />
                            </button>
                            <button
                                type="button"
                                title="Daftar Poin (Bullet List)"
                                onClick={() => execFormat('insertUnorderedList')}
                                className={cn(
                                    "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
                                    activeFormats.unorderedList ? "bg-primary text-white font-bold" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <List size={13} />
                            </button>
                            <button
                                type="button"
                                title="Daftar Angka (Numbered List)"
                                onClick={() => execFormat('insertOrderedList')}
                                className={cn(
                                    "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
                                    activeFormats.orderedList ? "bg-primary text-white font-bold" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <ListOrdered size={13} />
                            </button>

                            <button
                                type="button"
                                title={showFormatting ? "Sembunyikan Opsi Lanjutan" : "Tampilkan Opsi Lanjutan"}
                                onClick={() => setShowFormatting((prev) => !prev)}
                                className={cn(
                                    "p-1.5 rounded-lg text-xs transition-all cursor-pointer ml-0.5",
                                    showFormatting ? "bg-muted text-foreground" : "hover:bg-muted text-muted-foreground"
                                )}
                            >
                                {showFormatting ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                        </div>

                        <EmojiPickerPopover
                            isOpen={showEmojiPicker}
                            onClose={() => setShowEmojiPicker(false)}
                            onSelectEmoji={handleSelectEmoji}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        {draftSavedTime && (
                            <span className="text-[10px] font-medium text-muted-foreground italic mr-0.5">
                                {draftSavedTime}
                            </span>
                        )}
                        <button
                            type="button"
                            title="Simpan Draf Pesan"
                            onClick={onSaveDraft}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold transition-all cursor-pointer active:scale-95"
                        >
                            <Save size={13} className="text-muted-foreground" />
                            <span>Draf</span>
                        </button>

                        <button
                            type="button"
                            className={cn(
                                'flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                                input.trim() || selectedFiles.length > 0
                                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95'
                                    : 'bg-muted text-muted-foreground cursor-not-allowed',
                            )}
                            onClick={onSend}
                            disabled={(!input.trim() && selectedFiles.length === 0) || sending}
                        >
                            {sending ? (
                                <>
                                    <RefreshCw size={13} className="animate-spin" />
                                    <span>Mengirim...</span>
                                </>
                            ) : (
                                <>
                                    <span>Kirim</span>
                                    <Send size={13} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
