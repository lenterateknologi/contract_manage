<?php

namespace App\Console\Commands;

use App\Models\Master\FormTemplate;
use App\Services\Utils\PdfService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class ExportAllFormTemplatesPdfCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'templates:export-all
                            {--output= : Direktori tujuan penyimpanan file PDF (default: storage/app/exported_templates)}
                            {--type= : Filter berdasarkan tipe dokumen (f1, f2, dll)}
                            {--open : Buka folder tujuan di Finder/File Manager setelah selesai}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Ekspor semua form template ke format dokumen PDF menggunakan Browsershot';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('====================================================');
        $this->info('  CMS Contract - Ekspor Semua Form Template ke PDF  ');
        $this->info('====================================================');

        $query = FormTemplate::query()->with('fields');

        $typeFilter = $this->option('type');
        if ($typeFilter && strtolower($typeFilter) !== 'all') {
            $query->where('document_type', strtolower($typeFilter));
            $this->line("Memfilter berdasarkan tipe dokumen: <comment>{$typeFilter}</comment>");
        }

        $templates = $query->orderBy('document_type')->orderBy('name')->get();

        if ($templates->isEmpty()) {
            $this->warn('Tidak ada form template yang ditemukan.');

            return self::SUCCESS;
        }

        $this->line("Ditemukan <info>{$templates->count()}</info> form template untuk diekspor.");

        // Resolve output directory
        $outputDir = $this->option('output')
            ? base_path($this->option('output'))
            : storage_path('app/exported_templates');

        if (! File::exists($outputDir)) {
            File::makeDirectory($outputDir, 0755, true);
        }

        $this->line("Folder penyimpanan: <comment>{$outputDir}</comment>\n");

        $bar = $this->output->createProgressBar($templates->count());
        $bar->start();

        $successCount = 0;
        $failedCount = 0;
        $results = [];

        foreach ($templates as $template) {
            $slugName = Str::slug($template->name ?: 'template_'.$template->id);
            $docType = $template->document_type ? strtoupper($template->document_type).'_' : '';
            $fileName = "{$docType}{$slugName}.pdf";
            $targetPath = "{$outputDir}/{$fileName}";

            try {
                $printUrl = URL::temporarySignedRoute(
                    'admin.form-templates.render-print',
                    now()->addMinutes(15),
                    ['template' => $template->id, 'data' => '[]'],
                );

                if (app()->environment('local')) {
                    $printUrl = str_replace('localhost', '127.0.0.1', $printUrl);
                }

                $pdfContent = PdfService::browsershotUrl($printUrl, 180)
                    ->waitForSelector('#pdf-render-complete')
                    ->pdf();

                File::put($targetPath, $pdfContent);
                $fileSizeKb = round(strlen($pdfContent) / 1024, 1);

                $results[] = [
                    'Name' => Str::limit($template->name, 45),
                    'Type' => strtoupper($template->document_type ?: '-'),
                    'Status' => '<info>BERHASIL</info>',
                    'Size' => "{$fileSizeKb} KB",
                    'File' => $fileName,
                ];

                $successCount++;
            } catch (\Exception $e) {
                $results[] = [
                    'Name' => Str::limit($template->name, 45),
                    'Type' => strtoupper($template->document_type ?: '-'),
                    'Status' => '<error>GAGAL</error>',
                    'Size' => '-',
                    'File' => Str::limit($e->getMessage(), 30),
                ];

                $failedCount++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->table(['Nama Template', 'Tipe', 'Status', 'Ukuran', 'File Target'], $results);

        $this->newLine();
        $this->info("Ekspor selesai: <info>{$successCount}</info> berhasil, <comment>{$failedCount}</comment> gagal.");
        $this->line("Semua file tersimpan di: <comment>{$outputDir}</comment>");

        if ($this->option('open') || $this->confirm('Apakah Anda ingin membuka folder hasil ekspor di Finder/File Manager sekarang?', false)) {
            if (PHP_OS_FAMILY === 'Darwin') {
                exec('open '.escapeshellarg($outputDir));
            } elseif (PHP_OS_FAMILY === 'Windows') {
                exec('explorer '.escapeshellarg($outputDir));
            } else {
                exec('xdg-open '.escapeshellarg($outputDir));
            }
        }

        return self::SUCCESS;
    }
}
