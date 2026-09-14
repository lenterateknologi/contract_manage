import React, { useState } from 'react';
import {
    Bold,
    Code,
    File as FileIcon,
    Heading1,
    Heading2,
    Italic,
    List,
    ListOrdered,
    Paperclip,
    Plus,
    Quote,
    RefreshCw,
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
}: ChatEditorProps) {
    const [showTools, setShowTools] = useState(false);
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
            handleEditorInput();
        }
        setShowEmojiPicker(false);
    };

    return (
        <div className="p-3 border-t border-border bg-background relative">
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

            {/* Single Unified Card Container */}
            <div className="rounded-2xl border border-border bg-muted/30 transition-all duration-200 focus-within:border-primary/50 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/10 overflow-hidden shadow-2xs">
                {/* Selected File Chips Preview (inside card) */}
                {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2.5 border-b border-border/50 bg-muted/20">
                        {selectedFiles.map((file, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/20 text-foreground text-xs animate-in fade-in duration-150"
                            >
                                <FileIcon size={13} className="text-primary shrink-0" />
                                <span className="truncate max-w-[150px] font-medium text-[11px]">{file.name}</span>
                                <span className="text-[10px] text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
                                <button
                                    type="button"
                                    onClick={() => onRemoveFile(idx)}
                                    className="text-muted-foreground hover:text-rose-500 transition-colors p-0.5 cursor-pointer"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Extended Tools Panel (Revealed inside card when + is clicked) */}
                {showTools && (
                    <div className="flex flex-wrap items-center gap-1 px-2.5 py-1.5 border-b border-border/50 bg-muted/20 text-muted-foreground animate-in fade-in slide-in-from-top-1 duration-150">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={onFileSelect}
                            multiple
                            className="hidden"
                            accept="*/*"
                        />

                        {/* File Attachment Button */}
                        <button
                            type="button"
                            title="Lampirkan Berkas / Dokumen"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-muted text-foreground transition-all cursor-pointer"
                        >
                            <Paperclip size={14} className="text-primary" />
                            <span className="font-medium text-[11px]">Berkas</span>
                        </button>

                        {/* Emoji Button */}
                        <div className="relative">
                            <button
                                type="button"
                                title="Pilih Emoji"
                                onClick={() => setShowEmojiPicker((prev) => !prev)}
                                className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all cursor-pointer",
                                    showEmojiPicker
                                        ? "bg-primary/20 text-primary font-semibold"
                                        : "hover:bg-muted text-foreground"
                                )}
                            >
                                <Smile size={14} className="text-amber-500" />
                                <span className="font-medium text-[11px]">Emoji</span>
                            </button>

                            <EmojiPickerPopover
                                isOpen={showEmojiPicker}
                                onClose={() => setShowEmojiPicker(false)}
                                onSelectEmoji={handleSelectEmoji}
                            />
                        </div>

                        <div className="h-3.5 w-px bg-border/60 mx-1" />

                        {/* Text Formatting Toolbar */}
                        <div className="flex items-center gap-0.5">
                            <button
                                type="button"
                                title="Tebal (Ctrl+B)"
                                onClick={() => execFormat('bold')}
                                className={cn(
                                    "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
                                    activeFormats.bold ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted text-muted-foreground hover:text-foreground"
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
                                    activeFormats.italic ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted text-muted-foreground hover:text-foreground"
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
                                    activeFormats.strikethrough ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Strikethrough size={13} />
                            </button>
                            <button
                                type="button"
                                title="Heading 1"
                                onClick={() => execFormat('formatBlock', '<h1>')}
                                className={cn(
                                    "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
                                    activeFormats.h1 ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted text-muted-foreground hover:text-foreground"
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
                                    activeFormats.h2 ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Heading2 size={13} />
                            </button>
                            <button
                                type="button"
                                title="Daftar Poin"
                                onClick={() => execFormat('insertUnorderedList')}
                                className={cn(
                                    "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
                                    activeFormats.unorderedList ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <List size={13} />
                            </button>
                            <button
                                type="button"
                                title="Daftar Angka"
                                onClick={() => execFormat('insertOrderedList')}
                                className={cn(
                                    "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
                                    activeFormats.orderedList ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <ListOrdered size={13} />
                            </button>
                            <button
                                type="button"
                                title="Kutipan"
                                onClick={() => execFormat('formatBlock', '<blockquote>')}
                                className="p-1.5 rounded-lg text-xs hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                            >
                                <Quote size={13} />
                            </button>
                            <button
                                type="button"
                                title="Blok Kode"
                                onClick={() => execFormat('formatBlock', '<pre>')}
                                className="p-1.5 rounded-lg text-xs hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
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
                                className="p-1.5 rounded-lg text-xs hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                            >
                                <Table size={13} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Single-Line Row Inside Card: [+] [Input Field] [Send] */}
                <div className="flex items-end gap-1.5 p-1.5">
                    {/* Plus (+) Toggle Button */}
                    <button
                        type="button"
                        title={showTools ? "Tutup menu alat" : "Buka lampiran, format teks & emoji"}
                        onClick={() => setShowTools((prev) => !prev)}
                        className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer",
                            showTools
                                ? "bg-primary text-primary-foreground rotate-45 shadow-xs"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Plus size={18} strokeWidth={2.5} />
                    </button>

                    {/* ContentEditable Text Input Area */}
                    <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleEditorInput}
                        onKeyDown={handleEditorKeyDown}
                        onKeyUp={updateActiveFormats}
                        onMouseUp={updateActiveFormats}
                        onPaste={handlePaste}
                        data-placeholder="Ketik pesan... (Ketik @ untuk tag pengguna)"
                        className="flex-1 min-h-[36px] max-h-[140px] overflow-y-auto px-2.5 py-2 text-sm text-foreground focus:outline-none leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 empty:before:pointer-events-none select-text [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-2 [&_blockquote]:italic [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded [&_pre]:text-xs [&_pre]:font-mono [&_table]:w-full [&_table]:text-xs [&_td]:border [&_td]:border-border [&_td]:p-1.5"
                    />

                    {/* Send Button */}
                    <button
                        type="button"
                        className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer',
                            input.trim() || selectedFiles.length > 0
                                ? 'bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95 shadow-xs'
                                : 'text-muted-foreground/30 hover:bg-muted/40 cursor-not-allowed',
                        )}
                        onClick={onSend}
                        disabled={(!input.trim() && selectedFiles.length === 0) || sending}
                        title="Kirim Pesan (Enter)"
                    >
                        {sending ? (
                            <RefreshCw size={14} className="animate-spin" />
                        ) : (
                            <Send size={15} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
