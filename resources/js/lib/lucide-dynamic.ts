import { Icons, getIcon, type LucideIcon } from '@/components/ui/icons';

const LucideIcons: Record<string, LucideIcon> = new Proxy(Icons as Record<string, LucideIcon>, {
    get(target, prop: string) {
        if (typeof prop !== 'string') return target[prop];
        return getIcon(prop, target[prop] || Icons.LayoutGrid);
    },
});

export default LucideIcons;


