import { Contract } from '@/features/Contracts/types';
import { usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { AttachmentPreview } from '../AttachmentPreview/AttachmentPreview';
import { ChatHeader } from '../ChatHeader/ChatHeader';
import { MessageComposer } from '../MessageComposer/MessageComposer';
import { MessageList } from '../MessageList/MessageList';

interface ContractChatThreadProps {
    contract: Contract;
    meId?: string;
    users?: any[];
    onNewMessage?: (c: Contract) => void;
}

export function ContractChatThread({
    contract,
    meId,
    users = [],
    onNewMessage,
}: ContractChatThreadProps) {
    const { auth } = usePage<any>().props;
    const currentUserId = meId || auth?.user?.id;

    const [isSearchingInThread, setIsSearchingInThread] = useState(false);
    const [threadSearchQuery, setThreadSearchQuery] = useState('');

    const {
        messages,
        isLoading,
        isSending,
        sendMessage,
        toggleReaction,
        refresh,
    } = useMessages(contract.id, isSearchingInThread ? threadSearchQuery : undefined);

    const [previewModal, setPreviewModal] = useState<{ isOpen: boolean; url: string; title: string }>({
        isOpen: false,
        url: '',
        title: '',
    });

    const handleSendMessage = async (text: string, file?: File | null) => {
        await sendMessage(text, file);
        onNewMessage?.(contract);
    };

    return (
        <div className="flex h-full flex-1 flex-col bg-white dark:bg-slate-900 overflow-hidden">
            {/* Header */}
            <ChatHeader
                conversation={contract}
                isSearchingInThread={isSearchingInThread}
                threadSearchQuery={threadSearchQuery}
                onToggleSearchInThread={() => setIsSearchingInThread((prev) => !prev)}
                onThreadSearchQueryChange={setThreadSearchQuery}
                onRefresh={refresh}
            />

            {/* Message List */}
            <MessageList
                messages={messages}
                isLoading={isLoading}
                currentUserId={currentUserId}
                searchQuery={isSearchingInThread ? threadSearchQuery : undefined}
                onPreviewAttachment={(url, title) => setPreviewModal({ isOpen: true, url, title })}
                onToggleReaction={toggleReaction}
            />

            {/* Message Composer */}
            <MessageComposer
                onSendMessage={handleSendMessage}
                isSending={isSending}
                users={users}
            />

            {/* Preview Modal */}
            <AttachmentPreview
                isOpen={previewModal.isOpen}
                onClose={() => setPreviewModal({ isOpen: false, url: '', title: '' })}
                url={previewModal.url}
                title={previewModal.title}
            />
        </div>
    );
}

export default ContractChatThread;
