<?php

namespace App\Jobs;

use App\Services\Utils\PdfService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

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
            Cache::put('pdf_status_'.$this->jobId, ['status' => 'processing', 'progress' => 30], 1800);

            $pdfContent = PdfService::browsershotUrl($this->printUrl, 300)
                ->waitForSelector('#pdf-render-complete')
                ->preventUnsuccessfulResponse()
                ->pdf();

            // Save to public storage
            $path = 'pdfs/'.$this->fileName;
            Storage::disk('public')->put($path, $pdfContent);

            Cache::put('pdf_status_'.$this->jobId, [
                'status' => 'completed',
                'url' => Storage::url($path),
                'progress' => 100,
            ], 1800);

        } catch (\Exception $e) {
            Log::error('Queue PDF Export Failed: '.$e->getMessage());
            Cache::put('pdf_status_'.$this->jobId, [
                'status' => 'failed',
                'error' => $e->getMessage(),
            ], 1800);
        }
    }
}
