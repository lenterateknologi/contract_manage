import { getInitials } from '@/lib/avatar-utils';

export function useInitials() {
    return (fullName: string): string => getInitials(fullName, '');
}
