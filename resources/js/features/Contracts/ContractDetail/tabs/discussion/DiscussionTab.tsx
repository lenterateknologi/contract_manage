import { Contract } from '@/features/Contracts/types';
import React, { lazy, Suspense } from 'react';

const ContractChat = lazy(() => import('@/features/chat').then((m) => ({ default: m.ContractChatThread })));
const ContractMembers = lazy(() => import('@/features/members').then((m) => ({ default: m.ContractMembers })));

interface DiscussionTabProps {
    contract: Contract;
    discSubTab?: string;
    meId?: string;
    users?: any[];
    onNewMessage?: (c: Contract) => void;
}

export function DiscussionTab({
    contract,
    discSubTab = 'chat',
    meId,
    users = [],
    onNewMessage,
}: DiscussionTabProps) {
    const activeSub = ['chat', 'members'].includes(discSubTab) ? discSubTab : 'chat';

    return (
        <Suspense
            fallback={
                <div className="flex h-48 w-full items-center justify-center">
                    <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
                </div>
            }
        >
            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                {activeSub === 'chat' && (
                    <ContractChat
                        contract={contract}
                        meId={meId}
                        users={users || []}
                        onNewMessage={onNewMessage}
                    />
                )}
                {activeSub === 'members' && <ContractMembers contract={contract} users={users || []} />}
            </div>
        </Suspense>
    );
}

export default DiscussionTab;
