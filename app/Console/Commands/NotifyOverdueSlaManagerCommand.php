<?php

namespace App\Console\Commands;

use App\Models\Transaction\Contract;
use App\Models\Transaction\ContractHistory;
use App\Notifications\ContractSlaOverdueNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotifyOverdueSlaManagerCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'contract:notify-overdue-sla {--dry-run : Only check and display overdue contracts without sending notifications}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Periksa pengajuan kontrak yang melewati batas SLA Lead Time (3 hari) atau Processing Time (10 hari) dan kirim notifikasi ke Ditugaskan Oleh (Manager).';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Memulai pengecekan SLA Overdue pengajuan kontrak...');
        $now = Carbon::now();
        $isDryRun = (bool) $this->option('dry-run');

        $leadTimeLimit = (int) config('master.sla.default_lead_time_days', 3);
        $processingTimeLimit = (int) config('master.sla.default_processing_time_days', 10);

        $this->line("• Batas SLA Lead Time (Total Pengajuan) : {$leadTimeLimit} hari");
        $this->line("• Batas SLA Processing Time (PIC)      : {$processingTimeLimit} hari");

        // 1. Ambil seluruh kontrak yang masih aktif/belum selesai
        $contracts = Contract::whereNotIn(DB::raw('UPPER(status)'), [
            'COMPLETED', 'SIGNED', 'REJECTED', 'ARCHIVED', 'CANCELLED', 'CLOSED',
        ])
            ->whereNull('closed_at')
            ->whereNull('finished_at')
            ->with([
                'assignedBy:id,name,email,role_id,department_id',
                'assignedPic:id,name,email,department_id',
                'creator.supervisor:id,name,email',
                'statusDetail',
            ])
            ->get();

        $this->info("Ditemukan {$contracts->count()} pengajuan kontrak dalam status aktif.");

        $overdueList = [];
        $notifiedCount = 0;

        foreach ($contracts as $contract) {
            // A. Lead Time Calculation
            $leadTimeStart = $contract->submitted_at ? Carbon::parse($contract->submitted_at) : Carbon::parse($contract->created_at);
            $leadTimeElapsedDays = (int) $leadTimeStart->diffInDays($now);
            $isLeadTimeOverdue = $leadTimeElapsedDays >= $leadTimeLimit;

            // B. Processing Time Calculation
            $assignedAt = $contract->assigned_at ? Carbon::parse($contract->assigned_at) : null;
            $processingTimeElapsedDays = $assignedAt ? (int) $assignedAt->diffInDays($now) : null;
            $isProcessingTimeOverdue = $processingTimeElapsedDays !== null && $processingTimeElapsedDays >= $processingTimeLimit;

            if (! $isLeadTimeOverdue && ! $isProcessingTimeOverdue) {
                continue;
            }

            // C. Resolusi Manager ("Ditugaskan Oleh")
            $manager = $contract->assignedBy ?: ($contract->creator?->supervisor ?: null);

            $overdueType = ($isLeadTimeOverdue && $isProcessingTimeOverdue)
                ? 'both'
                : ($isProcessingTimeOverdue ? 'processing_time' : 'lead_time');

            $slaDetails = [
                'lead_time_days_limit' => $leadTimeLimit,
                'lead_time_elapsed_days' => $leadTimeElapsedDays,
                'processing_time_days_limit' => $processingTimeLimit,
                'processing_time_elapsed_days' => $processingTimeElapsedDays,
            ];

            $overdueList[] = [
                'ID' => $contract->id,
                'Nomor' => $contract->contract_no ?: $contract->form_no ?: '-',
                'Judul' => substr($contract->title ?: 'Tanpa Judul', 0, 30),
                'PIC' => $contract->assignedPic?->name ?? 'Belum Ditugaskan',
                'Manager' => $manager?->name ?? 'Tidak Ditemukan',
                'Tipe Overdue' => $overdueType,
                'Durasi Lead Time' => "{$leadTimeElapsedDays} / {$leadTimeLimit} hari",
                'Durasi PIC' => $processingTimeElapsedDays !== null ? "{$processingTimeElapsedDays} / {$processingTimeLimit} hari" : '-',
            ];

            if (! $manager) {
                $this->warn("Kontrak '{$contract->title}' overdue tapi tidak memiliki data Manager (Ditugaskan Oleh).");

                continue;
            }

            if (! $isDryRun) {
                try {
                    $manager->notify(new ContractSlaOverdueNotification($contract, $overdueType, $slaDetails));

                    ContractHistory::create([
                        'contract_id' => $contract->id,
                        'action' => 'SLA_OVERDUE_NOTIFICATION_SENT',
                        'description' => "Cronjob otomatis mengirimkan notifikasi SLA Overdue ({$overdueType}) ke Manager: {$manager->name} ({$manager->email}).",
                        'actor_id' => null,
                    ]);

                    $notifiedCount++;
                } catch (\Throwable $e) {
                    Log::error("Gagal mengirimkan notifikasi SLA Overdue ke {$manager->email}: ".$e->getMessage());
                    $this->error("Error mengirim notifikasi ke {$manager->email}: {$e->getMessage()}");
                }
            }
        }

        if (! empty($overdueList)) {
            $this->newLine();
            $this->table(
                ['ID', 'Nomor', 'Judul', 'PIC', 'Manager', 'Tipe Overdue', 'Durasi Lead Time', 'Durasi PIC'],
                $overdueList
            );
        }

        if ($isDryRun) {
            $this->warn('[DRY RUN] Ditemukan '.count($overdueList).' pengajuan overdue. Tidak ada notifikasi yang dikirimkan.');
        } else {
            $this->info("Selesai. Berhasil mengirim notifikasi SLA Overdue ke {$notifiedCount} Manager.");
        }

        return self::SUCCESS;
    }
}
