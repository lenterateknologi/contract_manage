import { ToastProvider } from '@/components/ui/feedback/Toast';
import ContractList, { type ContractListProps } from '@/features/Contracts/ContractList/ContractList';
import { UserProfile } from '@/features/Contracts/types';
import { Head, usePage } from '@inertiajs/react';

export default function ContractsIndex(props: Readonly<ContractListProps>) {
    const { auth } = usePage<{ auth: { user: UserProfile | null } }>().props;
    const meId = auth?.user?.id ?? props.meId ?? '';
    const meUser = auth?.user ?? props.meUser ?? null;

    return (
        <>
            <Head title="Contract Manager" />
            <ToastProvider>
                <ContractList
                    {...props}
                    meId={meId}
                    meUser={meUser}
                />
            </ToastProvider>
        </>
    );
}
