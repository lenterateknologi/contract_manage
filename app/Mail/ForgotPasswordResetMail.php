<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ForgotPasswordResetMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $user;

    public $resetUrl;

    public $expireAt;

    public function __construct($user, string $resetUrl, $expireAt)
    {
        $this->user = $user;
        $this->resetUrl = $resetUrl;
        $this->expireAt = $expireAt;
    }

    public function build()
    {
        return $this->subject('Password Reset Request')
            ->view('emails.forgot-password')
            ->with([
                'user' => $this->user,
                'resetUrl' => $this->resetUrl,
                'expireAt' => $this->expireAt,
            ]);
    }
}
