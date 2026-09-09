<?php

namespace App\Enums;

enum WorkflowAction: string
{
    case APPROVE = 'approve';
    case REJECT = 'reject';
    case ASSIGN = 'assign';
    case SIGN = 'sign';
    case SIGNATURE = 'signature';
    case FORWARD = 'forward';
    case BRANCH = 'branch';
    case AUTO = 'auto';

    public function label(): string
    {
        return match ($this) {
            self::APPROVE => 'Setujui',
            self::REJECT => 'Tolak',
            self::ASSIGN => 'Tugaskan',
            self::SIGN => 'Upload Tanda Tangan',
            self::SIGNATURE => 'Upload Tanda Tangan',
            self::FORWARD => 'Approval Tambahan',
            self::BRANCH => 'Pindah Workflow',
            self::AUTO => 'Otomatis (Auto)',
        };
    }
}
