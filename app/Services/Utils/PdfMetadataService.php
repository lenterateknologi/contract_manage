<?php

namespace App\Services\Utils;

use Illuminate\Support\Facades\Auth;

class PdfMetadataService
{
    /**
     * Injects audit metadata into PDF content according to PDF ISO 32000-1 specifications.
     */
    public static function injectMetadata(string $pdfContent, ?string $userName = null, ?string $userId = null, ?string $docNumber = null): string
    {
        if (! str_starts_with($pdfContent, '%PDF-')) {
            return $pdfContent;
        }

        try {
            $user = Auth::user();
            $userName = $userName ?: ($user?->name ?: 'System');
            $userId = $userId ?: ($user?->id ?: 'N/A');
            $docNumber = $docNumber ?: 'N/A';

            $userSafe = str_replace(['(', ')', '\\'], '', $userName);
            $idSafe = str_replace(['(', ')', '\\'], '', $userId);
            $docNoSafe = str_replace(['(', ')', '\\'], '', $docNumber);
            $nowFormatted = now()->format('Y-m-d H:i:s T');
            $pdfDate = 'D:'.date('YmdHisO');

            $newObjNum = 999999;
            if (preg_match_all('/(\d+)\s+0\s+obj/i', $pdfContent, $matches) && ! empty($matches[1])) {
                $newObjNum = max($matches[1]) + 1;
            }

            $infoContent = "{$newObjNum} 0 obj\n<<\n".
                "/Title (Dokumen Kontrak: {$docNoSafe})\n".
                "/Author ({$userSafe} [User ID: {$idSafe}])\n".
                "/Subject (Downloaded by: {$userSafe} [User ID: {$idSafe}] on {$nowFormatted})\n".
                "/Keywords (Contract, CMS, UserID: {$idSafe}, DownloadedAt: {$nowFormatted})\n".
                "/Creator (Contract Management System)\n".
                "/Producer (Contract Management System - Downloaded by {$userSafe} [ID: {$idSafe}])\n".
                "/CreationDate ({$pdfDate})\n".
                "/ModDate ({$pdfDate})\n".
                "/DownloadedBy ({$userSafe})\n".
                "/DownloadedUserID ({$idSafe})\n".
                "/DownloadedAt ({$nowFormatted})\n".
                "/DocumentNumber ({$docNoSafe})\n".
                ">>\nendobj\n";

            $fileLength = strlen($pdfContent);
            $startxrefPos = strrpos($pdfContent, 'startxref');
            $prevXref = 0;
            if ($startxrefPos !== false && preg_match('/startxref\s+(\d+)/s', substr($pdfContent, $startxrefPos), $m)) {
                $prevXref = (int) $m[1];
            }

            $rootObj = '';
            if (preg_match('/\/Root\s+(\d+\s+\d+\s+R)/i', $pdfContent, $mRoot)) {
                $rootObj = "/Root {$mRoot[1]}\n";
            }

            $newXrefPos = $fileLength + strlen($infoContent);
            $xrefOffset = sprintf('%010d', $fileLength);

            $incrementalUpdate = $infoContent.
                "xref\n".
                "0 1\n".
                "0000000000 65535 f \n".
                "{$newObjNum} 1\n".
                "{$xrefOffset} 00000 n \n".
                "trailer\n".
                "<<\n".
                $rootObj.
                "/Info {$newObjNum} 0 R\n".
                ($prevXref > 0 ? "/Prev {$prevXref}\n" : '').
                ">>\n".
                "startxref\n".
                "{$newXrefPos}\n".
                "%%EOF\n";

            return $pdfContent.$incrementalUpdate;
        } catch (\Throwable $e) {
            return $pdfContent;
        }
    }
}
