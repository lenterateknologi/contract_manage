import React from 'react';

interface TypingIndicatorProps {
    userName?: string;
}

export function TypingIndicator({ userName = 'Seseorang' }: TypingIndicatorProps) {
    return (
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-500 animate-pulse">
            <span className="font-medium text-slate-700 dark:text-slate-300">{userName}</span>
            <span>sedang mengetik...</span>
            <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
    );
}
