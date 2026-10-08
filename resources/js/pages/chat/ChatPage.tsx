import Chat, { type ChatProps } from '@/features/chat';

export default function ChatPage(props: Readonly<ChatProps>) {
    return <Chat {...props} />;
}
