<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use Inertia\Inertia;

class BackupController extends Controller
{
    private function authorizeSuperAdmin(Request $request): void
    {
        $user = $request->user();
        $isAuthorized = $user && (
            $user->role === 'Super Admin' ||
            $user->role === 'Admin' ||
            $user->is_admin ||
            ($request->hasSession() && $request->session()->has('impersonator_id'))
        );

        if (! $isAuthorized) {
            abort(403, 'Akses ditolak. Halaman ini hanya dapat diakses oleh Administrator.');
        }
    }

    public function index(Request $request)
    {
        $this->authorizeSuperAdmin($request);

        $backupFiles = [];
        $dumpPath = base_path('database_dumps');

        if (! File::exists($dumpPath)) {
            File::makeDirectory($dumpPath, 0755, true);
        }

        $files = File::files($dumpPath);

        foreach ($files as $file) {
            if ($file->getExtension() === 'sql') {
                $backupFiles[] = [
                    'filename' => $file->getFilename(),
                    'size' => $file->getSize(),
                    'formatted_size' => $this->formatBytes($file->getSize()),
                    'last_modified' => date('Y-m-d H:i:s', $file->getMTime()),
                    'timestamp' => $file->getMTime(),
                ];
            }
        }

        // Sort by last modified descending
        usort($backupFiles, fn ($a, $b) => $b['timestamp'] - $a['timestamp']);

        return Inertia::render('admin/Backups/Index', [
            'backups' => $backupFiles,
            'breadcrumbs' => [
                ['title' => 'Pengaturan Sistem', 'href' => '#', 'icon' => 'Settings'],
                ['title' => 'Backup & Restore', 'href' => route('admin.backups.index'), 'icon' => 'Database'],
            ],
        ]);
    }

    public function runScript(Request $request)
    {
        $this->authorizeSuperAdmin($request);

        $request->validate([
            'script' => 'required|in:db,data,master,transaction',
        ]);

        $type = $request->input('script');

        $scriptMap = [
            'db' => 'export_db.sh',
            'data' => 'export_data.sh',
            'master' => 'export_master.sh',
            'transaction' => 'export_transaction.sh',
        ];

        $scriptName = $scriptMap[$type];
        $scriptPath = base_path("script/{$scriptName}");

        if (! File::exists($scriptPath)) {
            return back()->withErrors(['error' => "Skrip export tidak ditemukan di {$scriptPath}"]);
        }

        $result = Process::path(base_path())->run("bash script/{$scriptName}");

        if ($result->successful()) {
            return back()->with('success', "Proses ekspor data [{$type}] berhasil dijalankan.");
        }

        return back()->withErrors(['error' => 'Gagal menjalankan skrip: '.$result->errorOutput()]);
    }

    public function download(Request $request, $filename)
    {
        $this->authorizeSuperAdmin($request);

        $filename = basename($filename);
        $filePath = base_path("database_dumps/{$filename}");

        if (! File::exists($filePath) || File::extension($filePath) !== 'sql') {
            abort(404, 'File backup tidak ditemukan atau tidak valid.');
        }

        return response()->download($filePath);
    }

    public function destroy(Request $request, $filename)
    {
        $this->authorizeSuperAdmin($request);

        $filename = basename($filename);
        $filePath = base_path("database_dumps/{$filename}");

        if (File::exists($filePath) && File::extension($filePath) === 'sql') {
            File::delete($filePath);

            return back()->with('success', "File backup '{$filename}' berhasil dihapus.");
        }

        return back()->withErrors(['error' => 'File backup tidak ditemukan atau tidak valid.']);
    }

    public function restore(Request $request)
    {
        $this->authorizeSuperAdmin($request);

        $request->validate([
            'filename' => 'required|string',
        ]);

        $filename = basename($request->input('filename'));
        $filePath = base_path("database_dumps/{$filename}");

        if (! File::exists($filePath) || File::extension($filePath) !== 'sql') {
            return back()->withErrors(['error' => 'File backup tidak ditemukan atau tidak valid.']);
        }

        $result = Process::path(base_path())->run("bash script/import.sh database_dumps/{$filename}");

        if ($result->successful()) {
            return back()->with('success', "Proses restore database menggunakan file '{$filename}' sukses.");
        }

        return back()->withErrors(['error' => 'Gagal melakukan restore: '.$result->errorOutput()]);
    }

    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1024 ** $pow);

        return round($bytes, $precision).' '.$units[$pow];
    }
}
