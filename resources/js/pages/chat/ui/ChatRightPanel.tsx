import React, { useState, useEffect, useMemo } from 'react';
import { Contract, UserProfile, ContractAttachment } from '@/pages/contracts/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/user/Avatar';
import { getAvatarColor } from '@/lib/avatarColor';
import { Users, FileText, Image as ImageIcon, File, Download, ExternalLink, Paperclip, ChevronRight, X, Info } from 'lucide-react';
import axios from 'axios';

interface ChatRightPanelProps {
    contract: Contract;
    onClose?: () => void;
}

export function ChatRightPanel({ contract, onClose }: ChatRightPanelProps) {
    const [activeTab, setActiveTab] = useState<'members' | 'media'>('members');
    const [fullContractData, setFullContractData] = useState<Contract | null>(null);

    // Fetch full contract details (for approvals, attachments, etc.) if not present
    useEffect(() => {
        let isMounted = true;
        axios.get(`/api/contracts/${contract.id}`)
            .then((res) => {
                if (isMounted && res.data) {
                    setFullContractData(res.data);
                }
            })
            .catch((err) => console.error('Failed to load contract details for right panel', err));
        return () => {
            isMounted = false;
        };
    }, [contract.id]);

    const activeContract = fullContractData || contract;

    // Build unique members list
    const membersList = useMemo(() => {
        const membersMap = new Map<string, { user: UserProfile; roles: string[] }>();

        const addMember = (user: UserProfile | null | undefined, role: string) => {
            if (!user || !user.id) return;
            if (!membersMap.has(user.id)) {
                membersMap.set(user.id, { user, roles: [] });
            }
            const m = membersMap.get(user.id)!;
            if (!m.roles.includes(role)) {
                m.roles.push(role);
            }
        };

        // 1. Creator
        addMember(activeContract.creator, 'Pembuat Kontrak');

        // 2. Initiator
        addMember(activeContract.initiator, 'Inisiator');

        // 3. Approvers
        activeContract.approvals?.forEach((a) => {
            if (a.approver) {
                addMember(a.approver, `Penyetuju`);
            }
        });

        // 4. Assigned PIC
        if (activeContract.assigned_pic) {
            addMember(activeContract.assigned_pic, 'PIC');
        }

        // 5. Assigned By / Manager
        if (activeContract.assigned_by) {
            addMember(activeContract.assigned_by, 'Manager');
        }

        return Array.from(membersMap.values());
    }, [activeContract]);

    // Extract attachments & media from chat messages and contract attachments
    const mediaAndFiles = useMemo(() => {
        const items: Array<{
            id: string;
            name: string;
            url: string;
            type: 'image' | 'file';
            source: 'chat' | 'document';
            date?: string;
        }> = [];

        // 1. Contract Attachments
        if (activeContract.attachments && Array.isArray(activeContract.attachments)) {
            activeContract.attachments.forEach((att: ContractAttachment) => {
                const name = att.file_name || att.label || 'Lampiran Dokumen';
                const ext = name.split('.').pop()?.toLowerCase() ?? '';
                const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
                const url = `/api/contracts/${activeContract.id}/attachment/${att.id}`;

                items.push({
                    id: att.id,
                    name,
                    url,
                    type: isImg ? 'image' : 'file',
                    source: 'document',
                    date: att.created_at,
                });
            });
        }

        // 2. Chat Attachments
        if (activeContract.messages && Array.isArray(activeContract.messages)) {
            activeContract.messages.forEach((msg: any) => {
                if (msg.attachment_url || msg.attachment_path) {
                    let url = msg.attachment_url || msg.attachment_path;
                    if (url && !url.startsWith('http') && !url.startsWith('/')) {
                        url = `/storage/${url}`;
                    }
                    const name = msg.attachment_name || 'Berkas Chat';
                    const ext = name.split('.').pop()?.toLowerCase() ?? '';
                    const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);

                    items.push({
                        id: msg.id,
                        name,
                        url,
                        type: isImg ? 'image' : 'file',
                        source: 'chat',
                        date: msg.created_at,
                    });
                }
            });
        }

        return items;
    }, [activeContract]);

    const images = useMemo(() => mediaAndFiles.filter((f) => f.type === 'image'), [mediaAndFiles]);
    const files = useMemo(() => mediaAndFiles.filter((f) => f.type === 'file'), [mediaAndFiles]);

    return (
        <div className="w-72 flex flex-col border-l border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 h-full overflow-hidden shrink-0">
            {/* Header with Integrated Tabs */}
            <div className="px-3.5 py-3 border-b border-primary/20 bg-primary text-white h-[77px] shrink-0 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Info size={14} className="text-white shrink-0" />
                        <span>Informasi Percakapan</span>
                    </h3>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Integrated Tabs */}
                <div className="flex gap-1 bg-white/10 p-0.5 rounded-lg border border-white/20">
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`flex-1 py-1 px-2 text-[10.5px] font-bold rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            activeTab === 'members'
                                ? 'bg-white text-primary shadow-xs'
                                : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        <Users size={12} />
                        <span>Member ({membersList.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('media')}
                        className={`flex-1 py-1 px-2 text-[10.5px] font-bold rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            activeTab === 'media'
                                ? 'bg-white text-primary shadow-xs'
                                : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        <Paperclip size={12} />
                        <span>Media ({mediaAndFiles.length})</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {activeTab === 'members' ? (
                    <div className="space-y-3">
                        <div className="text-[10.5px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                            Anggota Terlibat
                        </div>
                        <div className="space-y-2">
                            {membersList.map(({ user, roles }) => {
                                const creatorName = user.name || 'User';
                                const initials = user.initials || creatorName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
                                const avatarColorClass = getAvatarColor(creatorName);

                                return (
                                    <div key={user.id} className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/40 hover:bg-slate-100/60 dark:hover:bg-zinc-800/60 transition-colors">
                                        <Avatar className="h-8 w-8 shrink-0 border border-slate-200 dark:border-zinc-700">
                                            <AvatarImage src={user.avatar_url || ''} alt={creatorName} />
                                            <AvatarFallback className={`text-[10px] font-bold ${avatarColorClass}`}>
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                {user.name}
                                            </div>
                                            <div className="flex items-center gap-1 flex-wrap mt-0.5">
                                                {roles.map((r) => (
                                                    <span key={r} className="text-[9px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-medium border border-primary/20">
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Media Grid */}
                        <div>
                            <div className="text-[10.5px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 mb-2">
                                Foto & Gambar ({images.length})
                            </div>
                            {images.length === 0 ? (
                                <div className="p-4 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl text-[11px] text-slate-400">
                                    Tidak ada media gambar
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-1.5">
                                    {images.map((img) => (
                                        <a
                                            key={img.id}
                                            href={img.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800"
                                        >
                                            <img src={img.url} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Files List */}
                        <div>
                            <div className="text-[10.5px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 mb-2">
                                Berkas & Dokumen ({files.length})
                            </div>
                            {files.length === 0 ? (
                                <div className="p-4 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl text-[11px] text-slate-400">
                                    Tidak ada dokumen terlampir
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {files.map((file) => (
                                        <a
                                            key={file.id}
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/40 hover:bg-slate-100/60 dark:hover:bg-zinc-800/60 transition-colors group"
                                        >
                                            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                <FileText size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-primary transition-colors">
                                                    {file.name}
                                                </div>
                                                <div className="text-[9.5px] text-slate-400 capitalize">
                                                    {file.source === 'document' ? 'Dokumen Kontrak' : 'Chat Attachment'}
                                                </div>
                                            </div>
                                            <Download size={13} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 shrink-0" />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
