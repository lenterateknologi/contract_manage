import { useSyncExternalStore } from 'react';
import { type LucideIcon } from 'lucide-react';

export interface DetailSidebarTabChild {
    id: string;
    label: string;
    icon?: LucideIcon;
}

export interface DetailSidebarTabItem {
    id: string;
    label: string;
    icon: LucideIcon;
    children?: DetailSidebarTabChild[];
}

export interface DetailSidebarState {
    isActive: boolean;
    contract?: any;
    contractTitle?: string;
    contractNumber?: string;
    activeTab: string;
    activeSubTab?: string;
    tabs: DetailSidebarTabItem[];
    onSelectTab: (tabId: string, subtabId?: string) => void;
    onClose: () => void;
}

let currentState: DetailSidebarState | null = null;
const listeners = new Set<() => void>();

function emitChange() {
    listeners.forEach((listener) => listener());
}

export const detailSidebarStore = {
    getState: () => currentState,
    setState: (state: DetailSidebarState | null) => {
        currentState = state;
        emitChange();
    },
    subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
};

export function useDetailSidebar() {
    return useSyncExternalStore(
        detailSidebarStore.subscribe,
        detailSidebarStore.getState,
        detailSidebarStore.getState,
    );
}
