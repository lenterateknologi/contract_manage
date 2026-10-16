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
        $stepName = $this->approval->workflowStep?->label
            ?: $this->approval->workflowStep?->name 
            ?: $this->approval->workflowStep?->description 
            ?: $this->approval->role 
            ?: 'Persetujuan Kontrak';

        $subject = "{$stepName}: Kontrak " . ($this->approval->contract->title ?? $this->approval->contract->form_no);

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

        $stepName = $this->approval->workflowStep?->label
            ?: $this->approval->workflowStep?->name 
            ?: $this->approval->workflowStep?->description 
            ?: $this->approval->role 
            ?: 'Persetujuan Kontrak';

        // Resolve action label (from approval action alias or last action)
        $actionLabel = $this->approval->action_alias 
            ?? ($contract->metadata['last_action_label'] ?? null)
            ?? null;

        // Resolve attachment if any
        $attachmentPath = $this->approval->attachment_path
            ?? ($contract->metadata['last_attachment_path'] ?? null)
            ?? null;

        $attachmentName = null;
        $attachmentUrl = null;

        if ($attachmentPath) {
            $attachmentName = basename($attachmentPath);
            $matchedAt = $contract->attachments()->where('file_path', $attachmentPath)->first();
            if ($matchedAt) {
                $attachmentName = $matchedAt->file_name;
                $attachmentUrl = url("/api/contracts/{$contract->id}/attachment/{$matchedAt->id}");
            }
        }

        return new Content(
            view: 'emails.contract-action-required',
            with: [
                'approval' => $this->approval,
                'note' => $note,
                'stepTitle' => $stepName,
                'actionLabel' => $actionLabel,
                'attachmentName' => $attachmentName,
                'attachmentUrl' => $attachmentUrl,
            ],
        );
    }

    public function attachments(): array
    {
        $contract = $this->approval->contract;
        $attachmentPath = $this->approval->attachment_path
            ?? ($contract->metadata['last_attachment_path'] ?? null)
            ?? null;

        if ($attachmentPath && \Illuminate\Support\Facades\Storage::disk('local')->exists($attachmentPath)) {
            $fullPath = \Illuminate\Support\Facades\Storage::disk('local')->path($attachmentPath);
            $name = basename($attachmentPath);
            $matchedAt = $contract->attachments()->where('file_path', $attachmentPath)->first();
            if ($matchedAt) {
                $name = $matchedAt->file_name;
            }

            return [
                \Illuminate\Mail\Mailables\Attachment::fromPath($fullPath)->as($name),
            ];
        }

        return [];
    }
}
