import { cn } from '@/lib/utils';

interface ContextMenuItemProps {
    icon: any;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive';
}

export const ContextMenuItem = ({ icon: Icon, label, onClick, variant = 'default' }: ContextMenuItemProps) => (
    <button
        onClick={(e) => {
            e.stopPropagation();
            onClick();
        }}
        className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 font-sans text-[10px] font-semibold uppercase transition-colors',
            variant === 'destructive' ? 'text-red-500 hover:bg-red-50' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
    >
        <Icon size={12} />
        {label}
    </button>
);
