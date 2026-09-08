<?php

namespace App\Console\Commands;

use App\Models\Contract;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CleanupSubmissionsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'submissions:cleanup
                            {--force : Force deletion without confirmation prompt}
                            {--clean-storage : Also delete files in storage/app/public/contracts and attachments}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Bersihkan semua data transaksi pengajuan kontrak, approval, riwayat, form submission, dan relasinya';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $contractsCount = DB::table('t_contracts')->count();

        if ($contractsCount === 0) {
            $this->info('Tidak ada data pengajuan kontrak yang perlu dibersihkan.');

            return self::SUCCESS;
        }

        $this->warn("Ditemukan {$contractsCount} data pengajuan kontrak.");

        if (! $this->option('force')) {
            if (! $this->confirm('Apakah Anda yakin ingin menghapus SEMUA data pengajuan kontrak dan transaksinya? Tindakan ini tidak dapat dibatalkan.')) {
                $this->info('Operasi dibatalkan.');

                return self::SUCCESS;
            }
        }

        $this->info('Memulai pembersihan data pengajuan...');

        DB::beginTransaction();

        try {
            // 1. Ambil list file path sebelum data dihapus jika flag clean-storage aktif
            $attachmentFiles = [];
            $versionFiles = [];

            if ($this->option('clean-storage')) {
                $attachmentFiles = DB::table('t_attachments')
                    ->whereNotNull('file_path')
                    ->pluck('file_path')
                    ->filter()
                    ->toArray();

                $versionFiles = DB::table('t_contract_versions')
                    ->whereNotNull('file_path')
                    ->pluck('file_path')
                    ->filter()
                    ->toArray();
            }

            // 2. Hapus data transaksi terkait secara berurutan
            $counts = [];

            $counts['t_form_submission_h'] = DB::table('t_form_submission_h')->delete();
            $counts['t_form_submissions'] = DB::table('t_form_submissions')->delete();
            $counts['t_contract_h'] = DB::table('t_contract_h')->delete();
            $counts['t_contract_meta'] = DB::table('t_contract_meta')->delete();
            $counts['t_contract_versions'] = DB::table('t_contract_versions')->delete();
            $counts['t_messages'] = DB::table('t_messages')->delete();
            $counts['t_approvals'] = DB::table('t_approvals')->delete();
            $counts['t_attachments'] = DB::table('t_attachments')->delete();
            $counts['t_contracts'] = DB::table('t_contracts')->delete();

            DB::commit();

            // 3. Refresh materialized view untuk dashboard
            Contract::refreshMaterializedView();

            // 4. Hapus file fisik dari storage jika diminta
            if ($this->option('clean-storage')) {
                $deletedFilesCount = 0;
                $allFiles = array_unique(array_merge($attachmentFiles, $versionFiles));

                foreach ($allFiles as $filePath) {
                    if (Storage::disk('public')->exists($filePath)) {
                        Storage::disk('public')->delete($filePath);
                        $deletedFilesCount++;
                    } elseif (Storage::exists($filePath)) {
                        Storage::delete($filePath);
                        $deletedFilesCount++;
                    }
                }

                $this->info("Menghapus {$deletedFilesCount} file fisik dari storage.");
            }

            $this->newLine();
            $this->table(
                ['Tabel Transaksi', 'Jumlah Data Dihapus'],
                collect($counts)->map(fn ($cnt, $tbl) => [$tbl, number_format($cnt)])->values()->all()
            );

            $this->info('Semua data pengajuan kontrak dan transaksinya berhasil dibersihkan!');

            return self::SUCCESS;
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error('Terjadi kesalahan saat membersihkan data: '.$e->getMessage());

            return self::FAILURE;
        }
    }
}
