// Components
export { Chat } from './components/Chat/Chat';
export { ContractChatThread } from './components/Chat/ContractChatThread';
export { ConversationList } from './components/ConversationList/ConversationList';
export { ConversationItem } from './components/ConversationItem/ConversationItem';
export { MessageList } from './components/MessageList/MessageList';
export { MessageItem } from './components/MessageItem/MessageItem';
export { MessageComposer } from './components/MessageComposer/MessageComposer';
export { AttachmentPreview } from './components/AttachmentPreview/AttachmentPreview';
export { ChatHeader } from './components/ChatHeader/ChatHeader';
export { TypingIndicator } from './components/TypingIndicator/TypingIndicator';

// Hooks
export { useChat } from './hooks/useChat';
export { useConversations } from './hooks/useConversations';
export { useMessages } from './hooks/useMessages';
export { useChatRealtime } from './hooks/useChatRealtime';

// Services
export { chatService } from './services/chatService';
export { chatRealtimeService } from './services/chatRealtimeService';

// Types
export * from './types/chat.types';
export * from './types/conversation.types';
export * from './types/message.types';

// Utils
export * from './utils/conversationUtils';
export * from './utils/messageUtils';

// Default export
export { default } from './components/Chat/Chat';
