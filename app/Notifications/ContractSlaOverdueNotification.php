<?php

namespace App\Notifications;

use App\Models\Transaction\Contract;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ContractSlaOverdueNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Contract $contract,
        public string $overdueType,
        public array $slaDetails = [],
    ) {}

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $contractUrl = url('/contracts/'.$this->contract->id);
        $title = $this->contract->title ?: $this->contract->contract_no ?: 'Tanpa Judul';
        $picName = $this->contract->assignedPic?->name ?? 'Belum Ditugaskan';

        $overdueDesc = match ($this->overdueType) {
            'lead_time' => "Total durasi pengajuan telah melebihi batas waktu SLA Lead Time ({$this->slaDetails['lead_time_days_limit']} hari).",
            'processing_time' => "Durasi pengerjaan oleh PIC ({$picName}) telah melebihi batas waktu SLA Processing Time ({$this->slaDetails['processing_time_days_limit']} hari).",
            default => 'Pengajuan kontrak telah melebihi batas waktu SLA yang ditentukan (Lead Time & Processing Time).',
        };

        $mail = (new MailMessage)
            ->subject('[Peringatan SLA Overdue] Kontrak Melebihi Batas Waktu: '.$title)
            ->greeting('Yth. '.$notifiable->name.',')
            ->line('Pemberitahuan bahwa terdapat pengajuan kontrak yang berada di bawah penugasan/pengawasan Anda yang belum diselesaikan dan telah melewati batas SLA:')
            ->line('**Nama Kontrak:** '.$title)
            ->line('**Nomor Pengajuan/Kontrak:** '.($this->contract->form_no ?: $this->contract->contract_no ?: '-'))
            ->line('**Status Saat Ini:** '.($this->contract->statusDetail?->label ?? $this->contract->status))
            ->line('**PIC yang Ditugaskan:** '.$picName)
            ->line('**Keterangan Keterlambatan:** '.$overdueDesc);

        if (! empty($this->slaDetails['lead_time_elapsed_days'])) {
            $mail->line('• Total Durasi Pengajuan: '.$this->slaDetails['lead_time_elapsed_days'].' hari (Batas: '.$this->slaDetails['lead_time_days_limit'].' hari)');
        }
        if (! empty($this->slaDetails['processing_time_elapsed_days'])) {
            $mail->line('• Durasi Pengerjaan PIC: '.$this->slaDetails['processing_time_elapsed_days'].' hari (Batas: '.$this->slaDetails['processing_time_days_limit'].' hari)');
        }

        return $mail
            ->action('Buka & Tinjau Kontrak', $contractUrl)
            ->line('Mohon untuk segera meninjau atau menindaklanjuti pengajuan kontrak tersebut.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        $title = $this->contract->title ?: $this->contract->contract_no ?: 'Tanpa Judul';
        $picName = $this->contract->assignedPic?->name ?? 'Belum Ditugaskan';

        return [
            'type' => 'sla_overdue',
            'contract_id' => $this->contract->id,
            'contract_no' => $this->contract->contract_no ?: $this->contract->form_no,
            'title' => $title,
            'overdue_type' => $this->overdueType,
            'assigned_pic_name' => $picName,
            'sla_details' => $this->slaDetails,
            'message' => "Pengajuan kontrak '{$title}' melebihi batas SLA ({$this->overdueType}).",
            'url' => '/contracts/'.$this->contract->id,
        ];
    }
}
