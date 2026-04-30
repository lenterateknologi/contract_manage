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
                <h3 className="mb-0.5 text-base font-medium">{title}</h3>
                {description && <p className="text-muted-foreground text-sm">{description}</p>}
            </header>
        );
    }

    return (
        <div className="mb-8 space-y-0.5">
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
    );
}
