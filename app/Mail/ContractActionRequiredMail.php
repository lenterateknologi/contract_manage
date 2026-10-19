<?php

namespace App\Mail;

use App\Models\Master\User;
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

    public function __construct(
        public Approval $approval,
        public ?User $recipientUser = null,
        public bool $isCc = false,
    ) {}

    public function envelope(): Envelope
    {
        $stepName = $this->approval->workflowStep?->label
            ?: $this->approval->workflowStep?->name 
            ?: $this->approval->workflowStep?->description 
            ?: $this->approval->role 
            ?: 'Persetujuan Kontrak';

        $subject = "{$stepName}: Kontrak " . ($this->approval->contract->title ?? $this->approval->contract->form_no);

        $envelope = new Envelope(
            subject: $subject,
        );

        // Resolve CC emails from metadata or histories if this is the main notification
        if (! $this->isCc) {
            $contract = $this->approval->contract;
            $ccUserIds = $contract->metadata['step_cc_user_ids'][$this->approval->workflow_step_id]
                ?? ($contract->metadata['step_cc_user_ids'][$this->approval->id] ?? null)
                ?? ($contract->metadata['last_cc_user_ids'] ?? null);

            $ccEmails = [];
            if (! empty($ccUserIds)) {
                $ccEmails = User::whereIn('id', (array) $ccUserIds)
                    ->where('id', '!=', $this->approval->user_id)
                    ->pluck('email')
                    ->filter()
                    ->values()
                    ->toArray();
            } elseif (! empty($contract->metadata['last_cc_names']) || ! empty($contract->metadata['step_cc'])) {
                $rawNames = $contract->metadata['step_cc'][$this->approval->workflow_step_id]
                    ?? ($contract->metadata['step_cc'][$this->approval->id] ?? null)
                    ?? ($contract->metadata['last_cc_names'] ?? null);

                $namesList = is_array($rawNames) ? $rawNames : array_filter(array_map('trim', explode(',', (string) $rawNames)));
                if (! empty($namesList)) {
                    $ccEmails = User::whereIn('name', $namesList)
                        ->where('id', '!=', $this->approval->user_id)
                        ->pluck('email')
                        ->filter()
                        ->values()
                        ->toArray();
                }
            }

            if (! empty($ccEmails)) {
                $envelope->cc($ccEmails);
            }
        }

        return $envelope;
    }

    public function content(): Content
    {
        $contract = $this->approval->contract;
        $note = $this->approval->comment
            ?? ($contract->metadata['assigned_pic_note'] ?? null)
            ?? ($contract->metadata['last_action_note'] ?? null)
            ?? ($contract->approvals()->whereIn('status', ['approved', 'rejected'])->whereNotNull('comment')->where('comment', '!=', '')->latest('decided_at')->value('comment'))
            ?? null;

        if ($note) {
            $note = trim(preg_replace('/\s*\[CC:\s*[^\]]+\]/i', '', $note));
            if ($note === '') {
                $note = null;
            }
        }

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

        // Resolve CC recipients
        $ccNames = $contract->metadata['step_cc'][$this->approval->id]
            ?? ($contract->metadata['step_cc'][$this->approval->workflow_step_id] ?? null)
            ?? ($contract->metadata['last_cc_names'] ?? null);

        if (empty($ccNames)) {
            $matchingHistory = $contract->histories->first(function ($h) {
                return $h->action === 'APPROVAL_CC';
            });
            if ($matchingHistory && preg_match('/dikirim ke:\s*(.+)$/i', $matchingHistory->description, $hm)) {
                $ccNames = trim($hm[1]);
            }
        }

        return new Content(
            view: 'emails.contract-action-required',
            with: [
                'approval' => $this->approval,
                'recipientUser' => $this->recipientUser,
                'isCc' => $this->isCc,
                'note' => $note,
                'ccNames' => $ccNames,
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
