<?php

namespace App\Notifications;

use App\Models\Contract;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ContractAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $contract;

    public function __construct(Contract $contract)
    {
        $this->contract = $contract;
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = url('/contracts?search=' . $this->contract->contract_no);

        return (new MailMessage())
            ->subject('Kontrak Baru Ditugaskan: ' . $this->contract->title)
            ->line('Tim Legal telah membuatkan draft kontrak untuk Anda.')
            ->line('Nama Kontrak: ' . $this->contract->title)
            ->line('Nomor Kontrak: ' . $this->contract->contract_no)
            ->action('Lihat Kontrak', $url)
            ->line('Silakan tinjau draf kontrak tersebut untuk melanjutkan proses.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'contract_id' => $this->contract->id,
            'contract_no' => $this->contract->contract_no,
            'title' => $this->contract->title,
            'message' => 'Kontrak baru telah dibuatkan untuk Anda oleh Tim Legal.',
            'created_by_name' => $this->contract->creator->name,
        ];
    }
}
