<?php

namespace App\Console\Commands;

use App\Mail\ContractSlaOverdueMail;
use App\Models\Approval;
use App\Models\Contract;
use App\Services\Workflow\SlaNotificationRecipientResolver;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class CheckSlaOverdueCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sla:check-overdue {--dry-run : Only check and display overdue contracts without sending emails}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Periksa pengajuan kontrak yang melewati batas waktu (SLA Overdue) dan kirim notifikasi berdasarkan matriks m_authorities';

    public function __construct(
        protected SlaNotificationRecipientResolver $recipientResolver
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Memulai pengecekan status SLA kontrak...');
        $now = now();
        $isDryRun = (bool) $this->option('dry-run');

        // 1. Ambil kontrak yang masih aktif/berjalan (bukan closed, rejected, approved, cancelled)
        $activeContracts = Contract::whereNotIn('status', ['closed', 'rejected', 'cancelled', 'completed'])
            ->whereNotNull('current_stage_due_at')
            ->with(['initiator', 'contractType', 'workflow'])
            ->get();

        $this->info("Ditemukan {$activeContracts->count()} kontrak dalam status aktif dengan batas SLA.");

        $overdueCount = 0;
        $warningCount = 0;

        foreach ($activeContracts as $contract) {
            $stageDueAt = $contract->current_stage_due_at ? \Carbon\Carbon::parse($contract->current_stage_due_at) : null;
            if (! $stageDueAt) {
                continue;
            }

            // A. Check OVERDUE
            if ($now->greaterThan($stageDueAt)) {
                $overdueCount++;
                $contract->update([
                    'sla_status' => 'overdue',
                ]);

                // Update is_overdue di approvals aktif
                Approval::where('contract_id', $contract->id)
                    ->where('status', 'pending')
                    ->update(['is_overdue' => true]);

                // Cek apakah sudah pernah dinotifikasi dalam 24 jam terakhir untuk menghindari spam
                $lastNotified = $contract->overdue_notified_at ? \Carbon\Carbon::parse($contract->overdue_notified_at) : null;
                $shouldNotify = ! $lastNotified || $now->diffInHours($lastNotified) >= 24;

                if ($shouldNotify) {
                    $recipients = $this->recipientResolver->resolveRecipients($contract, null, 'overdue');

                    $this->warn("[OVERDUE] Kontrak '{$contract->title}' ({$contract->form_no}) - Target: {$stageDueAt->format('d/m/Y H:i')} - Penerima: {$recipients->count()} user");

                    if (! $isDryRun && config('notifications.email.enabled', true)) {
                        foreach ($recipients as $recipient) {
                            if (! empty($recipient->email)) {
                                try {
                                    Mail::to($recipient->email)->queue(new ContractSlaOverdueMail($contract, null, $recipient, 'overdue'));
                                } catch (\Throwable $e) {
                                    Log::error("Gagal mengirim email SLA Overdue ke {$recipient->email}: ".$e->getMessage());
                                }
                            }
                        }

                        $contract->update(['overdue_notified_at' => $now]);
                        Approval::where('contract_id', $contract->id)
                            ->where('status', 'pending')
                            ->update(['overdue_notified_at' => $now]);
                    }
                }
            } else {
                // B. Check WARNING threshold (misal sisa < 25% dari total stage hours)
                $stageHours = $contract->stage_sla_hours ?: 48;
                $hoursLeft = $now->diffInHours($stageDueAt, false);
                $warningThresholdHours = max(4, round($stageHours * 0.25));

                if ($hoursLeft > 0 && $hoursLeft <= $warningThresholdHours) {
                    $warningCount++;
                    if ($contract->sla_status !== 'warning') {
                        $contract->update(['sla_status' => 'warning']);
                    }
                } elseif ($contract->sla_status !== 'on_track') {
                    $contract->update(['sla_status' => 'on_track']);
                }
            }
        }

        $this->info("Pengecekan SLA selesai. Overdue: {$overdueCount}, Warning: {$warningCount}.");

        return Command::SUCCESS;
    }
}
