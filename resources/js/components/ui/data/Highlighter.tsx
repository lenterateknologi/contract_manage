export function HighlightingCell({ text, search }: Readonly<{ text: string; search: string }>) {
    if (!search) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) => {
                const key = `${part}-${i}`;
                return part.toLowerCase() === search.toLowerCase() ? (
                    <mark key={key} className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">{part}</mark>

                ) : (
                    <span key={key}>{part}</span>
                );
            })}
        </span>
    );
}
