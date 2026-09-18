<?php

namespace App\Enums;

enum WorkflowAction: string
{
    case APPROVE = 'approve';
    case REJECT = 'reject';
    case ASSIGN = 'assign';
    case ADD_ADHOC = 'add_adhoc';
    case BRANCH = 'branch';
    case AUTO = 'auto';

    public function label(): string
    {
        return match ($this) {
            self::APPROVE => 'Setujui',
            self::REJECT => 'Tolak',
            self::ASSIGN => 'Tugaskan',
            self::ADD_ADHOC => 'Approval Tambahan',
            self::BRANCH => 'Pindah Workflow',
            self::AUTO => 'Otomatis (Auto)',
        };
    }
}
