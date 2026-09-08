import { Button } from '@/components/ui/buttons/Button';
import { usePermissions } from '@/hooks/use-permissions';
import {
    Bot,
    ChevronDown,
    Expand,
    Minimize2,
    Send,
    Sparkles,
    Trash2,
    User,
    X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface ChatMessage {
    id: string;
    sender: 'user' | 'assistant';
    text: string;
    timestamp: string;
}

const QUICK_PROMPTS = [
    'Berapa kontrak yang berstatus pending approval?',
    'Tampilkan ringkasan kontrak terbaru yang ditugaskan ke Staff Legal',
    'Bagaimana cara mendaftarkan vendor baru pada kontrak?',
    'Cek daftar template yang belum memiliki workflow',
];

export function FloatingAiChat() {
    const { isAdmin } = usePermissions();
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        try {
            const stored = localStorage.getItem('admin_ai_chat_history');
            if (stored) return JSON.parse(stored);
        } catch {}
        return [
            {
                id: 'welcome',
                sender: 'assistant',
                text: 'Halo Admin! 👋 Saya adalah AI Assistant untuk sistem Contract Management. Ada yang bisa saya bantu terkait analisis kontrak, ringkasan pengajuan, atau pencarian data dokumen?',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
        ];
    });
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Save chat history
    useEffect(() => {
        localStorage.setItem('admin_ai_chat_history', JSON.stringify(messages));
    }, [messages]);

    // Auto scroll on new messages
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping, isOpen]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen]);

    // Only render for Admin / Super Admin
    if (!isAdmin) {
        return null;
    }

    const handleSendMessage = (textToSend?: string) => {
        const query = (textToSend || input).trim();
        if (!query || isTyping) return;

        const userMsg: ChatMessage = {
            id: 'user-' + Date.now(),
            sender: 'user',
            text: query,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulated AI response processing with realistic answer
        setTimeout(() => {
            let reply = '';
            const lower = query.toLowerCase();

            if (lower.includes('pending') || lower.includes('approval') || lower.includes('persetujuan')) {
                reply = 'Berdasarkan data sistem saat ini, terdapat beberapa kontrak yang sedang menunggu review dan approval dari pihak terkait. Anda dapat memeriksa tab **Persetujuan** pada menu Notifikasi atas atau membuka menu [Daftar Kontrak](/contracts) dengan filter *Pending Review*.';
            } else if (lower.includes('template') || lower.includes('form')) {
                reply = 'Seluruh template kontrak dan formulir dapat dikelola terpusat di menu [Contract Templates](/admin/templates) dan [Form Templates](/admin/form-templates). Hak akses baca/tulis/unduh dapat diatur melalui Access Mapping.';
            } else if (lower.includes('vendor')) {
                reply = 'Untuk mendaftarkan atau mengecek data Vendor/Partner, Anda dapat menginput data pada sub-dokumen Form F1 Permohonan Kontrak atau melalui modul Master Data Vendor.';
            } else {
                reply = `Saya telah mencatat pertanyaan Anda: "${query}". \n\nSaat ini saya terhubung dengan basis pengetahuan Contract Management untuk membantu Anda mencari klausul, status alur kerja (workflow), dan rekapitulasi data legal.`;
            }

            const aiMsg: ChatMessage = {
                id: 'ai-' + Date.now(),
                sender: 'assistant',
                text: reply,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            setMessages((prev) => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1200);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const clearChat = () => {
        const resetMsg: ChatMessage[] = [
            {
                id: 'welcome-' + Date.now(),
                sender: 'assistant',
                text: 'Riwayat obrolan telah dibersihkan. Apa yang ingin Anda diskusikan selanjutnya?',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
        ];
        setMessages(resetMsg);
    };

    return (
        <div className="fixed bottom-12 right-12 z-[99998] flex flex-col items-end print:hidden">
            {/* AI Dialog Window */}
            {isOpen && (
                <div
                    className={`mb-5 flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
                        isExpanded
                            ? 'w-[92vw] sm:w-[840px] h-[90vh] max-h-[920px]'
                            : 'w-[92vw] sm:w-[500px] h-[780px] max-h-[88vh] min-h-[540px]'
                    }`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3.5">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                                <Sparkles className="h-4.5 w-4.5" />
                                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h3 className="text-xs font-bold text-foreground">AI Contract Assistant</h3>
                                    <span className="rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.2 text-[9px] font-semibold text-primary">
                                        Admin Only
                                    </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground">Smart Copilot & Contract Insights</p>
                            </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={clearChat}
                                title="Bersihkan obrolan"
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsExpanded(!isExpanded)}
                                title={isExpanded ? 'Kecilkan jendela' : 'Perbesar jendela'}
                                className="hidden sm:flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                            >
                                {isExpanded ? (
                                    <Minimize2 className="h-4 w-4" />
                                ) : (
                                    <Expand className="h-4 w-4" />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                title="Tutup"
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4.5 space-y-3.5 bg-muted/20">
                        {messages.map((msg) => {
                            const isUser = msg.sender === 'user';
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    <div
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${
                                            isUser
                                                ? 'bg-primary text-primary-foreground shadow-xs'
                                                : 'bg-card border border-border shadow-xs text-primary'
                                        }`}
                                    >
                                        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                    </div>

                                    <div
                                        className={`group relative max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed shadow-xs select-text ${
                                            isUser
                                                ? 'bg-primary text-primary-foreground rounded-tr-xs'
                                                : 'bg-card text-card-foreground border border-border/70 rounded-tl-xs'
                                        }`}
                                    >
                                        <div className="whitespace-pre-wrap">{msg.text}</div>
                                        <div
                                            className={`mt-1 text-[9px] tabular-nums text-right ${
                                                isUser ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
                                            }`}
                                        >
                                            {msg.timestamp}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Typing indicator */}
                        {isTyping && (
                            <div className="flex items-start gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card border border-border text-primary shadow-xs">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="rounded-2xl rounded-tl-xs border border-border/70 bg-card px-4 py-3 shadow-xs">
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Prompts Suggestions */}
                    {messages.length <= 2 && (
                        <div className="border-t border-border/40 bg-card px-4 py-2.5">
                            <p className="mb-1.5 text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-amber-500" />
                                Saran Cepat:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {QUICK_PROMPTS.map((prompt, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSendMessage(prompt)}
                                        className="rounded-xl border border-border/80 bg-muted/50 hover:bg-primary/10 hover:border-primary/30 px-3 py-1.5 text-[11px] text-foreground transition-colors text-left truncate max-w-full cursor-pointer"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer Input Bar */}
                    <div className="border-t border-border/60 bg-card p-4">
                        <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-background p-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary shadow-xs">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Tanyakan apapun seputar kontrak atau data sistem..."
                                rows={1}
                                className="max-h-32 min-h-[42px] flex-1 resize-none bg-transparent px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-hidden"
                            />
                            <Button
                                type="button"
                                size="icon"
                                onClick={() => handleSendMessage()}
                                disabled={!input.trim() || isTyping}
                                className="h-9 w-9 shrink-0 rounded-xl shadow-xs cursor-pointer disabled:opacity-40"
                            >
                                <Send className="h-4 w-4" />
                                <span className="sr-only">Kirim</span>
                            </Button>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground px-1">
                            <span>Tekan Enter untuk mengirim</span>
                            <span className="flex items-center gap-1">
                                <Bot className="h-3 w-3" /> AI Model Ready
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Trigger Button (Elevated higher with extra bottom margin) */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="group relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-primary to-indigo-600 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer ring-4 ring-primary/20 hover:ring-primary/40"
                aria-label="Buka AI Chat Assistant"
            >
                {isOpen ? (
                    <ChevronDown className="h-7 w-7 transition-transform group-hover:translate-y-0.5" />
                ) : (
                    <>
                        <Bot className="h-7 w-7 transition-transform group-hover:scale-110" />
                        <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
                        </span>
                    </>
                )}
            </button>
        </div>
    );
}
