<?php

namespace App\Enums;

/**
 * Contract status values stored in t_contracts.status.
 * Note: Display labels are managed in the m_contract_statuses table (App\Models\ContractStatus).
 */
enum ContractStatusEnum: string
{
    case Draft = 'draft';
    case InReview = 'in_review';
    case Revision = 'revision';
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Locked = 'locked';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::InReview => 'Dalam Review',
            self::Revision => 'Revisi',
            self::Pending => 'Menunggu',
            self::Approved => 'Disetujui',
            self::Rejected => 'Ditolak',
            self::Locked => 'Terkunci',
            self::Cancelled => 'Dibatalkan',
        };
    }

    /**
     * @return self[]
     */
    public static function inProcess(): array
    {
        return [self::InReview, self::Revision, self::Pending, self::Locked];
    }
}
