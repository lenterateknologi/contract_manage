// Recursively builds a flattened tree array with depth indicators
export function flattenHierarchy(items: any[], parentId: string | null = null, depth = 0): any[] {
    if (!items || !items.length) return [];
    if (parentId === null && items.some((item: any) => item.children && item.children.length > 0)) {
        const result: any[] = [];
        for (const parent of items) {
            result.push({ ...parent, _depth: depth });
            if (parent.children && parent.children.length > 0) {
                const sortedChildren = [...parent.children].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                result.push(...flattenHierarchy(sortedChildren, parent.id, depth + 1));
            }
        }
        return result;
    }

    const result: any[] = [];
    const filtered = items.filter((item) => item.parent_id === parentId);
    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    for (const item of filtered) {
        result.push({ ...item, _depth: depth });
        result.push(...flattenHierarchy(items, item.id, depth + 1));
    }

    if (parentId === null) {
        const itemIds = new Set(items.map((i) => i.id));
        const orphans = items.filter((item) => item.parent_id && !itemIds.has(item.parent_id));
        for (const item of orphans) {
            if (!result.some((r) => r.id === item.id)) {
                result.push({ ...item, _depth: 0 });
                result.push(...flattenHierarchy(items, item.id, 1));
            }
        }
        for (const item of items) {
            if (!result.some((r) => r.id === item.id)) {
                result.push({ ...item, _depth: 0 });
            }
        }
    }

    return result;
}

export function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
}
