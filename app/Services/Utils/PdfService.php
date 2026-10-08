<?php

namespace App\Services\Utils;

use Illuminate\Support\Facades\Log;
use Spatie\Browsershot\Browsershot;

class PdfService
{
    /**
     * Get the detected Chrome or Chromium-based browser path on host.
     */
    public static function getChromePath(): string
    {
        if (file_exists('/Applications/Brave Browser.app/Contents/MacOS/Brave Browser')) {
            return '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
        }

        return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    }

    /**
     * Create a pre-configured Browsershot instance from raw HTML.
     */
    public static function browsershotHtml(string $html, int $timeout = 180): Browsershot
    {
        return Browsershot::html($html)
            ->setNodeBinary('/opt/homebrew/bin/node')
            ->setNpmBinary('/opt/homebrew/bin/npm')
            ->setChromePath(self::getChromePath())
            ->noSandbox()
            ->addChromiumArguments([
                'disable-gpu',
                'disable-dev-shm-usage',
                'disable-setuid-sandbox',
                'no-first-run',
                'disable-extensions',
            ])
            ->timeout($timeout)
            ->format('A4')
            ->margins(0, 0, 0, 0)
            ->showBackground()
            ->setDelay(500);
    }

    /**
     * Create a pre-configured Browsershot instance from a URL.
     */
    public static function browsershotUrl(string $url, int $timeout = 180): Browsershot
    {
        return Browsershot::url($url)
            ->setNodeBinary('/opt/homebrew/bin/node')
            ->setNpmBinary('/opt/homebrew/bin/npm')
            ->setChromePath(self::getChromePath())
            ->noSandbox()
            ->addChromiumArguments([
                'disable-gpu',
                'disable-dev-shm-usage',
                'disable-setuid-sandbox',
                'no-first-run',
                'disable-extensions',
            ])
            ->timeout($timeout)
            ->paperSize(210, 297, 'mm')
            ->margins(0, 0, 0, 0)
            ->showBackground()
            ->setDelay(1000);
    }

    /**
     * Convert a document file to PDF using LibreOffice headless mode.
     */
    public function convertToPdf(string $sourcePath, string $pdfDir, string $pdfPath, string $uniqueId): bool
    {
        if (! file_exists($pdfDir)) {
            mkdir($pdfDir, 0755, true);
        }

        if (file_exists($pdfPath)) {
            return true;
        }

        // If the uploaded source file is already a PDF, copy it directly to destination
        if (file_exists($sourcePath)) {
            $ext = strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION));
            if ($ext === 'pdf') {
                if ($sourcePath !== $pdfPath) {
                    copy($sourcePath, $pdfPath);
                }

                return true;
            }
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
