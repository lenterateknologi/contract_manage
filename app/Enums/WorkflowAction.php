<?php

namespace App\Enums;

enum WorkflowAction: string
{
    case APPROVE = 'approve';
    case REJECT = 'reject';
    case ASSIGN = 'assign';
    case UPLOAD = 'upload';
    case REVIEW = 'review';
    case RETURN = 'return';
    case SIGN = 'sign';
    case SIGNATURE = 'signature';
    case FORWARD = 'forward';

    public function label(): string
    {
        return match ($this) {
            self::APPROVE => 'Setujui',
            self::REJECT => 'Tolak',
            self::ASSIGN => 'Tugaskan',
            self::UPLOAD => 'Unggah Dokumen',
            self::REVIEW => 'Tinjau',
            self::RETURN => 'Kembalikan',
            self::SIGN => 'Tanda Tangan',
            self::SIGNATURE => 'Tanda Tangan',
            self::FORWARD => 'Approval Tambahan',
        };
    }
}
