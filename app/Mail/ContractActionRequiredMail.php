<?php

namespace App\Mail;

use App\Models\Transaction\Approval;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContractActionRequiredMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Approval $approval) {}

    public function envelope(): Envelope
    {
        $subject = 'Tindakan Diperlukan: Kontrak '.($this->approval->contract->title ?? $this->approval->contract->form_no);

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        $contract = $this->approval->contract;
        $note = $this->approval->comment
            ?? ($contract->metadata['assigned_pic_note'] ?? null)
            ?? ($contract->metadata['last_action_note'] ?? null)
            ?? ($contract->approvals()->whereIn('status', ['approved', 'rejected'])->whereNotNull('comment')->where('comment', '!=', '')->latest('decided_at')->value('comment'))
            ?? null;

        return new Content(
            view: 'emails.contract-action-required',
            with: [
                'approval' => $this->approval,
                'note' => $note,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
