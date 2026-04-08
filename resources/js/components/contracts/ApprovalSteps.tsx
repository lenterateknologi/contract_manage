import React from 'react';
import { ContractApproval } from '@/types/contracts';
import { Avatar, StatusBadge } from './ui';

interface Props { approvals: ContractApproval[] }

export default function ApprovalSteps({ approvals }: Props) {
    const iconMap: Record<string, string> = {
        approved: 'fa-check', pending: 'fa-ellipsis', rejected: 'fa-xmark', waiting: 'fa-minus',
    };
    const dotCls: Record<string, string> = {
        approved: 'bg-green-50 text-green-600 border-green-200',
        pending: 'bg-amber-50 text-amber-600 border-amber-200',
        rejected: 'bg-red-50 text-red-600 border-red-200',
        waiting: 'bg-gray-50 text-gray-400 border-gray-200',
    };
    const noteCls: Record<string, string> = {
        approved: 'border-l-green-400', rejected: 'border-l-red-400',
        pending: 'border-l-gray-200', waiting: 'border-l-gray-200',
    };

    // Use only the latest approval per sequence
    const bySeq: Record<number, ContractApproval> = {};
    approvals.forEach(a => { bySeq[a.sequence] = a; });
    const steps = Object.values(bySeq).sort((a, b) => a.sequence - b.sequence);

    return (
        <div>
            {steps.map((a, i) => (
                <div key={a.id} className={`flex gap-2.5 ${i < steps.length - 1 ? 'pb-4 relative' : ''}`}>
                    {i < steps.length - 1 && (
                        <div className="absolute left-3 top-7 bottom-0 w-px bg-gray-200" />
                    )}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border flex-shrink-0 relative z-10 ${dotCls[a.status] ?? dotCls.waiting}`}>
                        <i className={`fa-solid ${iconMap[a.status] ?? 'fa-minus'}`} style={{ fontSize: 8 }} />
                    </div>
                    <div className="flex-1 pt-0.5">
                        <div className="text-[12px] font-semibold">
                            {a.role} <span className="text-[10px] font-normal text-gray-400">· Seq {a.sequence}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                            <Avatar user={a.approver} size="sm" /> {a.approver?.name}
                        </div>
                        {a.note && (
                            <div className={`text-[11px] text-gray-500 mt-1.5 px-2.5 py-1.5 bg-gray-50 rounded border-l-2 ${noteCls[a.status] ?? 'border-l-gray-200'}`}>
                                {a.note}
                            </div>
                        )}
                        <div className="text-[10px] text-gray-400 mt-1">
                            {a.approved_at ?? <StatusBadge status={a.status} />}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
