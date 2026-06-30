import React from 'react';

interface HeadingProps {
    title: string;
    description?: string;
    level?: 2 | 3;
}

export default function Heading({ title, description, level = 2 }: HeadingProps) {
    if (level === 3) {
        return (
            <header className="mb-4">
                <h3 className="mb-0.5 text-base font-semibold tracking-tight font-sans text-sidebar-foreground">{title}</h3>
                {description && <p className="text-muted-foreground font-sans text-sm">{description}</p>}
            </header>
        );
    }

    return (
        <div className="mb-8 space-y-0.5">
            <h2 className="text-2xl font-bold tracking-tight font-sans text-sidebar-foreground">{title}</h2>
            {description && <p className="text-muted-foreground font-sans text-sm">{description}</p>}
        </div>
    );
}
