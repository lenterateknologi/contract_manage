<?php

namespace App\Mail;

use App\Models\ContractMessage;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewMessageNotificationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public ContractMessage $contractMessage,
        public User $user
    ) {
    }

    public function envelope(): Envelope
    {
        $subject = 'Pesan Baru di Diskusi Kontrak: ' . ($this->contractMessage->contract->title ?? $this->contractMessage->contract->form_no);
        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.new-message-notification',
            with: [
                'contractMessage' => $this->contractMessage,
                'user' => $this->user,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
