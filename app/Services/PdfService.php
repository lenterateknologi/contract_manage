<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class PdfService
{
    /**
     * Convert a file to PDF using LibreOffice.
     */
    public function convertToPdf(string $sourcePath, string $pdfDir, string $pdfPath, string $uniqueId): bool
    {
        if (! file_exists($pdfDir)) {
            mkdir($pdfDir, 0755, true);
        }

        if (file_exists($pdfPath)) {
            return true;
        }

        $soffice = config('services.libreoffice.path');
        $userDir = 'file://'.sys_get_temp_dir().'/soffice_user_'.$uniqueId;

        $safeSoffice = escapeshellarg($soffice);
        $safeUserDir = escapeshellarg($userDir);
        $safePdfDir = escapeshellarg($pdfDir);
        $safeSourcePath = escapeshellarg($sourcePath);

        $command = "export HOME=/tmp && {$safeSoffice} -env:UserInstallation={$safeUserDir} --headless --convert-to pdf --outdir {$safePdfDir} {$safeSourcePath} 2>&1";
        $output = shell_exec($command);

        if (! file_exists($pdfPath)) {
            Log::error('PDF Generation Failed', [
                'unique_id' => $uniqueId,
                'output' => $output,
            ]);

            return false;
        }

        return true;
    }
}
