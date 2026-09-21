<?php

namespace App\Mail;

use App\Models\Approval;
use App\Models\Contract;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContractSlaOverdueMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Contract $contract,
        public ?Approval $approval = null,
        public ?User $recipient = null,
        public string $alertType = 'overdue' // 'overdue' or 'warning'
    ) {}

    public function envelope(): Envelope
    {
        $prefix = $this->alertType === 'warning' ? '⚠️ PERINGATAN SLA MENDEKATI BATAS' : '🚨 PERINGATAN SLA OVERDUE / TERLAMBAT';
        $title = $this->contract->title ?: $this->contract->form_no;

        return new Envelope(
            subject: "{$prefix}: Kontrak {$title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.contract-sla-overdue',
            with: [
                'contract' => $this->contract,
                'approval' => $this->approval,
                'recipient' => $this->recipient,
                'alertType' => $this->alertType,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
