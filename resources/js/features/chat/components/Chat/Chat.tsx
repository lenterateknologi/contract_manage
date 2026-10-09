import { MasterPageLayout } from '@/components/ui/navigation/MasterPageLayout';
import { cn } from '@/lib/utils';
import { Head, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { ChatProps } from '../../types/chat.types';
import { AttachmentPreview } from '../AttachmentPreview/AttachmentPreview';
import { ChatHeader } from '../ChatHeader/ChatHeader';
import { ConversationList } from '../ConversationList/ConversationList';
import { MessageComposer } from '../MessageComposer/MessageComposer';
import { MessageList } from '../MessageList/MessageList';

export function Chat({ initialContractId, breadcrumbs }: ChatProps) {
    const { auth } = usePage<any>().props;
    const currentUserId = auth?.user?.id;

    // Connect logic via useChat controller hook
    const {
        conversations,
        selectedId,
        selectedConversation,
        isLoading,
        search,
        setSearch,
        activeCategory,
        setActiveCategory,
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        categoryCounts,
        selectConversation,
        refresh,
        messages,
        isLoading: isLoadingMessages,
        isSending,
        sendMessage,
        toggleReaction,
        threadSearchQuery,
        setThreadSearchQuery,
        isSearchingInThread,
        setIsSearchingInThread,
        mentionUsers,
    } = useChat(initialContractId);

    // Attachment Preview Modal state
    const [previewModal, setPreviewModal] = useState<{ isOpen: boolean; url: string; title: string }>({
        isOpen: false,
        url: '',
        title: '',
    });

    const handlePreviewAttachment = (url: string, title: string) => {
        setPreviewModal({ isOpen: true, url, title });
    };

    return (
        <MasterPageLayout>
            <Head title="Chat Diskusi Kontrak" />

            <div className="flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden bg-background">
                {/* Left Sidebar: Conversation List */}
                <div
                    className={cn(
                        'w-full md:w-80 lg:w-96 shrink-0 h-full flex flex-col border-r border-border bg-card',
                        selectedId ? 'hidden md:flex' : 'flex',
                    )}
                >
                    <ConversationList
                        conversations={conversations}
                        selectedId={selectedId}
                        isLoading={isLoading}
                        search={search}
                        onSearchChange={setSearch}
                        activeCategory={activeCategory}
                        onCategoryChange={setActiveCategory}
                        categoryCounts={categoryCounts}
                        dateFrom={dateFrom}
                        onDateFromChange={setDateFrom}
                        dateTo={dateTo}
                        onDateToChange={setDateTo}
                        onSelectConversation={selectConversation}
                    />
                </div>

                {/* Right Panel: Active Conversation Thread */}
                <div
                    className={cn(
                        'flex-1 flex flex-col h-full min-h-0 min-w-0 bg-card overflow-hidden',
                        !selectedId ? 'hidden md:flex' : 'flex',
                    )}
                >
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <ChatHeader
                                conversation={selectedConversation}
                                isSearchingInThread={isSearchingInThread}
                                threadSearchQuery={threadSearchQuery}
                                onToggleSearchInThread={() => setIsSearchingInThread((prev) => !prev)}
                                onThreadSearchQueryChange={setThreadSearchQuery}
                                onRefresh={refresh}
                                onBack={() => selectConversation(null)}
                            />

                            {/* Message List Feed */}
                            <MessageList
                                messages={messages}
                                isLoading={isLoadingMessages}
                                currentUserId={currentUserId}
                                searchQuery={isSearchingInThread ? threadSearchQuery : undefined}
                                onPreviewAttachment={handlePreviewAttachment}
                                onToggleReaction={toggleReaction}
                            />

                            {/* Message Composer */}
                            <MessageComposer
                                onSendMessage={async (text, file) => {
                                    await sendMessage(text, file);
                                }}
                                isSending={isSending}
                                users={mentionUsers}
                            />
                        </>
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
                            <h3 className="text-sm font-semibold text-foreground">
                                Pilih Percakapan
                            </h3>
                            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                                Pilih dokumen kontrak dari daftar di sebelah kiri untuk melihat dan mengirim pesan diskusi.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Document / Image / PDF Preview Modal */}
            <AttachmentPreview
                isOpen={previewModal.isOpen}
                onClose={() => setPreviewModal({ isOpen: false, url: '', title: '' })}
                url={previewModal.url}
                title={previewModal.title}
            />
        </MasterPageLayout>
    );
}

export default Chat;
