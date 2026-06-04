<?php

namespace App\Enums;

enum WorkflowPhase: string
{
    case F1Request = 'f1_request';
    case F2Review = 'f2_review';
    case Signing = 'signing';
    case Completion = 'completion';

    public function label(): string
    {
        return match ($this) {
            self::F1Request => 'Permintaan F1',
            self::F2Review => 'Review F2',
            self::Signing => 'Penandatanganan',
            self::Completion => 'Penyelesaian',
        };
    }

    public function documentType(): string
    {
        return match ($this) {
            self::F1Request => 'f1',
            self::F2Review, self::Signing, self::Completion => 'f2',
        };
    }
}
