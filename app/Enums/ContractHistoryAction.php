<?php

namespace App\Enums;

enum ContractHistoryAction: string
{
    case ContractCreated = 'CONTRACT_CREATED';
    case ContractUpdated = 'CONTRACT_UPDATED';
    case ContractSubmitted = 'CONTRACT_SUBMITTED';
    case ContractApproved = 'CONTRACT_APPROVED';
    case ContractRejected = 'CONTRACT_REJECTED';
    case ContractRevised = 'CONTRACT_REVISED';
    case ContractCancelled = 'CONTRACT_CANCELLED';
    case ContractLocked = 'CONTRACT_LOCKED';
    case WorkflowAssigned = 'WORKFLOW_ASSIGNED';
    case StepAdvanced = 'STEP_ADVANCED';
    case DocumentUploaded = 'DOCUMENT_UPLOADED';
    case CommentAdded = 'COMMENT_ADDED';
    case PicAssigned = 'PIC_ASSIGNED';

    public function label(): string
    {
        return match ($this) {
            self::ContractCreated => 'Kontrak dibuat',
            self::ContractUpdated => 'Kontrak diperbarui',
            self::ContractSubmitted => 'Kontrak diajukan',
            self::ContractApproved => 'Kontrak disetujui',
            self::ContractRejected => 'Kontrak ditolak',
            self::ContractRevised => 'Kontrak direvisi',
            self::ContractCancelled => 'Kontrak dibatalkan',
            self::ContractLocked => 'Kontrak dikunci',
            self::WorkflowAssigned => 'Alur kerja ditetapkan',
            self::StepAdvanced => 'Tahap dimajukan',
            self::DocumentUploaded => 'Dokumen diunggah',
            self::CommentAdded => 'Komentar ditambahkan',
            self::PicAssigned => 'PIC ditugaskan',
        };
    }
}
