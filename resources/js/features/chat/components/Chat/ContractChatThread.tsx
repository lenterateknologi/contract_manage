import { Contract } from '@/features/Contracts/types';
import { usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { chatService } from '../../services/chatService';
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
    const [mentionUsers, setMentionUsers] = useState<any[]>(users);

    useEffect(() => {
        if (users && users.length > 0) {
            setMentionUsers(users);
        } else if (contract?.id) {
            let isMounted = true;
            chatService.getMentionableUsers(contract.id).then((list) => {
                if (isMounted) setMentionUsers(list);
            });
            return () => {
                isMounted = false;
            };
        }
    }, [contract?.id, users]);

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
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-card overflow-hidden">
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
                users={mentionUsers}
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
