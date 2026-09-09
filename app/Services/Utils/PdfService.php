<?php

namespace App\Services\Utils;

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

        // Sanitize & repair source file if it has corrupt bytes/whitespace or missing EOF byte
        if (file_exists($sourcePath)) {
            $ext = strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION));
            if (in_array($ext, ['docx', 'xlsx', 'pptx'])) {
                $content = file_get_contents($sourcePath);
                $modified = false;
                $pkPos = strpos($content, "PK\x03\x04");
                if ($pkPos !== false && $pkPos > 0) {
                    $content = substr($content, $pkPos);
                    $modified = true;
                }
                // Check if missing 1 byte from standard 22-byte End-of-Central-Directory record
                $eocdPos = strrpos($content, "PK\x05\x06");
                if ($eocdPos !== false) {
                    $eocdLen = strlen($content) - $eocdPos;
                    if ($eocdLen === 21) {
                        $content .= "\x00";
                        $modified = true;
                    }
                }
                if ($modified) {
                    file_put_contents($sourcePath, $content);
                }
            }
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
