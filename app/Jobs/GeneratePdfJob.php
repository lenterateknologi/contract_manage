<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Spatie\Browsershot\Browsershot;

class GeneratePdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300; // 5 minutes

    protected string $jobId;

    protected string $printUrl;

    protected string $fileName;

    /**
     * Create a new job instance.
     */
    public function __construct(string $jobId, string $printUrl, string $fileName)
    {
        $this->jobId = $jobId;
        $this->printUrl = $printUrl;
        $this->fileName = $fileName;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Cache::put('pdf_status_' . $this->jobId, ['status' => 'processing', 'progress' => 30], 1800);

            // High-Fidelity PDF rendering via Browsershot (Overhaul Optimized)
            $pdfContent = Browsershot::url($this->printUrl)
                ->setNodeBinary('/opt/homebrew/bin/node')
                ->setNpmBinary('/opt/homebrew/bin/npm')
                ->setChromePath('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
                ->noSandbox()
                ->addChromiumArguments([
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                    '--disable-setuid-sandbox',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-extensions',
                ])
                ->console(function ($message) {
                    Log::info('[CHROME CONSOLE] ' . $message);
                })
                ->timeout(300)
                ->paperSize(210, 297, 'mm')
                ->margins(0, 0, 0, 0)
                ->showBackground()
                ->waitForSelector('#pdf-render-complete')
                ->setDelay(1000)
                ->preventUnsuccessfulResponse()
                ->pdf();

            // Save to public storage
            $path = 'pdfs/' . $this->fileName;
            Storage::disk('public')->put($path, $pdfContent);

            Cache::put('pdf_status_' . $this->jobId, [
                'status' => 'completed',
                'url' => Storage::url($path),
                'progress' => 100,
            ], 1800);

        } catch (\Exception $e) {
            Log::error('Queue PDF Export Failed: ' . $e->getMessage());
            Cache::put('pdf_status_' . $this->jobId, [
                'status' => 'failed',
                'error' => $e->getMessage(),
            ], 1800);
        }
    }
}
