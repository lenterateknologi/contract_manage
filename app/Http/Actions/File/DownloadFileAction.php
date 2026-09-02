<?php

namespace App\Http\Actions\File;

use App\Models\Contract;
use Illuminate\Support\Facades\Storage;

class DownloadFileAction
{
    public function execute(Contract $contract): mixed
    {
        $version = $contract->currentVersionModel();

        if ($version && $version->file_path && Storage::disk('local')->exists($version->file_path)) {
            $fullPath = Storage::disk('local')->path($version->file_path);
            $downloadName = $version->file_name ?: basename($version->file_path);
            $ext = strtolower(pathinfo($downloadName, PATHINFO_EXTENSION));

            $user = auth()->user();
            $userName = $user?->name ?: 'System';

            // 1. Update Database Download Tracking Metadata
            try {
                $meta = is_array($contract->metadata) ? $contract->metadata : (json_decode($contract->metadata ?? '[]', true) ?: []);
                $meta['last_downloaded_at'] = now()->toIso8601String();
                $meta['last_downloaded_by'] = $userName;
                $meta['last_downloaded_user_id'] = $user?->id;
                $contract->update(['metadata' => $meta]);
            } catch (\Throwable $e) {
                // Ignore tracking failures to not block file download
            }

            // 2. Update Internal .docx File Metadata (docProps/core.xml & docProps/custom.xml)
            if ($ext === 'docx') {
                $docNumber = $contract->contract_no ?: ($contract->form_no ?: $contract->id);
                $this->updateDocxMetadata($fullPath, $userName, $user?->id, $docNumber);
            }

            $mimeTypes = [
                'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'doc' => 'application/msword',
                'pdf' => 'application/pdf',
                'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'xls' => 'application/vnd.ms-excel',
            ];

            $contentType = $mimeTypes[$ext] ?? (mime_content_type($fullPath) ?: 'application/octet-stream');

            if (ob_get_level()) {
                ob_end_clean();
            }

            return response()->download($fullPath, $downloadName, [
                'Content-Type' => $contentType,
                'Content-Length' => filesize($fullPath),
                'Content-Disposition' => 'attachment; filename="'.addslashes($downloadName).'"',
                'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                'Pragma' => 'public',
            ]);
        }

        return response()->json(['message' => 'File not found.'], 404);
    }

    private function updateDocxMetadata(string $filePath, ?string $userName, ?string $userId = null, ?string $docNumber = null): void
    {
        if (! class_exists('ZipArchive')) {
            return;
        }

        try {
            $zip = new \ZipArchive;
            if ($zip->open($filePath) === true) {
                $coreXml = $zip->getFromName('docProps/core.xml');
                if ($coreXml) {
                    $nowIso = gmdate('Y-m-d\TH:i:s\Z');
                    $userSafe = htmlspecialchars($userName ?: 'System', ENT_QUOTES | ENT_XML1, 'UTF-8');
                    $idSafe = htmlspecialchars($userId ?: 'N/A', ENT_QUOTES | ENT_XML1, 'UTF-8');
                    $docNoSafe = htmlspecialchars($docNumber ?: 'N/A', ENT_QUOTES | ENT_XML1, 'UTF-8');

                    $commentText = htmlspecialchars("No. Dokumen: {$docNoSafe} | Downloaded by: {$userName} (ID: {$userId}) at ".now()->format('Y-m-d H:i:s T'), ENT_QUOTES | ENT_XML1, 'UTF-8');

                    $keywordsText = htmlspecialchars("NoDokumen: {$docNoSafe}; DownloadedBy: {$userName}; UserID: {$userId}", ENT_QUOTES | ENT_XML1, 'UTF-8');
                    $titleText = htmlspecialchars("Dokumen Kontrak No: {$docNoSafe}", ENT_QUOTES | ENT_XML1, 'UTF-8');
                    $subjectText = htmlspecialchars("Jejak Pengunduhan Kontrak - User: {$userName} [{$idSafe}]", ENT_QUOTES | ENT_XML1, 'UTF-8');

                    // 1. Update <dcterms:modified>
                    if (preg_match('/<dcterms:modified[^>]*>.*?<\/dcterms:modified>/i', $coreXml)) {
                        $coreXml = preg_replace('/<dcterms:modified[^>]*>.*?<\/dcterms:modified>/i', "<dcterms:modified xsi:type=\"dcterms:W3CDTF\">{$nowIso}</dcterms:modified>", $coreXml);
                    } else {
                        $coreXml = str_replace('</cp:coreProperties>', "<dcterms:modified xsi:type=\"dcterms:W3CDTF\">{$nowIso}</dcterms:modified></cp:coreProperties>", $coreXml);
                    }

                    // 2. Update <cp:lastModifiedBy>
                    if (preg_match('/<cp:lastModifiedBy[^>]*>.*?<\/cp:lastModifiedBy>/i', $coreXml)) {
                        $coreXml = preg_replace('/<cp:lastModifiedBy[^>]*>.*?<\/cp:lastModifiedBy>/i', "<cp:lastModifiedBy>{$userSafe} [{$idSafe}]</cp:lastModifiedBy>", $coreXml);
                    } else {
                        $coreXml = str_replace('</cp:coreProperties>', "<cp:lastModifiedBy>{$userSafe} [{$idSafe}]</cp:lastModifiedBy></cp:coreProperties>", $coreXml);
                    }

                    // 3. Update/Inject <dc:description> (Comments field in MS Word File Info)
                    if (preg_match('/<dc:description[^>]*>.*?<\/dc:description>/i', $coreXml)) {
                        $coreXml = preg_replace('/<dc:description[^>]*>.*?<\/dc:description>/i', "<dc:description>{$commentText}</dc:description>", $coreXml);
                    } else {
                        $coreXml = str_replace('</cp:coreProperties>', "<dc:description>{$commentText}</dc:description></cp:coreProperties>", $coreXml);
                    }

                    // 4. Update/Inject <dc:title> (Title field in MS Word File Info)
                    if (preg_match('/<dc:title[^>]*>.*?<\/dc:title>/i', $coreXml)) {
                        $coreXml = preg_replace('/<dc:title[^>]*>.*?<\/dc:title>/i', "<dc:title>{$titleText}</dc:title>", $coreXml);
                    } else {
                        $coreXml = str_replace('</cp:coreProperties>', "<dc:title>{$titleText}</dc:title></cp:coreProperties>", $coreXml);
                    }

                    // 5. Update/Inject <dc:subject> (Subject field in MS Word File Info)
                    if (preg_match('/<dc:subject[^>]*>.*?<\/dc:subject>/i', $coreXml)) {
                        $coreXml = preg_replace('/<dc:subject[^>]*>.*?<\/dc:subject>/i', "<dc:subject>{$subjectText}</dc:subject>", $coreXml);
                    } else {
                        $coreXml = str_replace('</cp:coreProperties>', "<dc:subject>{$subjectText}</dc:subject></cp:coreProperties>", $coreXml);
                    }

                    // 6. Update/Inject <cp:keywords> (Tags/Keywords in MS Word File Info)
                    if (preg_match('/<cp:keywords[^>]*>.*?<\/cp:keywords>/i', $coreXml)) {
                        $coreXml = preg_replace('/<cp:keywords[^>]*>.*?<\/cp:keywords>/i', "<cp:keywords>{$keywordsText}</cp:keywords>", $coreXml);
                    } else {
                        $coreXml = str_replace('</cp:coreProperties>', "<cp:keywords>{$keywordsText}</cp:keywords></cp:coreProperties>", $coreXml);
                    }

                    $zip->addFromString('docProps/core.xml', $coreXml);
                }

                // 7. Inject Custom Document Properties in docProps/custom.xml
                $customXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'.
                    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'.
                    '<property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="2" name="NomorDokumen"><vt:lpwstr>'.$docNoSafe.'</vt:lpwstr></property>'.
                    '<property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="3" name="DownloadedBy"><vt:lpwstr>'.$userSafe.'</vt:lpwstr></property>'.
                    '<property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="4" name="DownloadedUserID"><vt:lpwstr>'.$idSafe.'</vt:lpwstr></property>'.
                    '<property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="5" name="DownloadedAt"><vt:lpwstr>'.now()->format('Y-m-d H:i:s T').'</vt:lpwstr></property>'.
                    '</Properties>';
                $zip->addFromString('docProps/custom.xml', $customXml);

                $zip->close();
            }
        } catch (\Throwable $e) {
            // Silently fail metadata update if zip archive is locked
        }
    }
}
