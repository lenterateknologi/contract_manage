<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use App\Models\ContractApproval;
use App\Models\ContractHistory;
use App\Models\ContractVersion;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ContractController extends Controller
{
    public function index(): JsonResponse
    {
        $contracts = Contract::with(['creator', 'versions', 'approvals.approver', 'histories.actor', 'messages.user'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($c) => $this->formatContract($c));

        return response()->json($contracts);
    }

    public function show(string $id): JsonResponse
    {
        $contract = Contract::with(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user'])
            ->findOrFail($id);

        return response()->json($this->formatContract($contract));
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title'     => 'required|string|max:255',
            'changelog' => 'nullable|string',
            'file'      => 'nullable|file|mimes:docx|max:10240',
        ]);

        $year     = date('Y');
        $count    = Contract::count() + 1;
        $no       = sprintf('CTR-%s-%03d', $year, $count);
        $hash     = Str::random(12) . '...';
        $userId   = Auth::id();

        $contract = Contract::create([
            'contract_no'     => $no,
            'title'           => $request->title,
            'description'     => $request->description ?? '—',
            'created_by'      => $userId,
            'status'          => 'draft',
            'current_version' => 1,
        ]);

        $fileName = "{$no}_v1_initial.docx";
        $filePath = null;
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->storeAs("contracts/{$contract->id}", "v1_{$fileName}", 'local');
        }

        ContractVersion::create([
            'contract_id' => $contract->id,
            'version_no'  => 1,
            'file_name'   => $fileName,
            'file_path'   => $filePath,
            'change_log'  => $request->changelog ?? 'Draft awal',
            'uploaded_by' => $userId,
            'is_final'    => false,
            'file_hash'   => $hash,
        ]);

        // Create default approval sequence (lookup users by role dynamically)
        $roleSequence = [
            ['role' => 'Legal',      'sequence' => 1, 'status' => 'pending'],
            ['role' => 'Tax',        'sequence' => 2, 'status' => 'waiting'],
            ['role' => 'Management', 'sequence' => 3, 'status' => 'waiting'],
            ['role' => 'Direksi',    'sequence' => 4, 'status' => 'waiting'],
        ];
        foreach ($roleSequence as $rs) {
            $approver = User::where('role', $rs['role'])->first();
            if ($approver) {
                ContractApproval::create([
                    'contract_id' => $contract->id,
                    'approver_id' => $approver->id,
                    'role'        => $rs['role'],
                    'sequence'    => $rs['sequence'],
                    'status'      => $rs['status'],
                ]);
            }
        }

        ContractHistory::create(['contract_id' => $contract->id, 'action' => 'CONTRACT_CREATED', 'description' => 'Kontrak dibuat', 'actor_id' => $userId]);
        ContractHistory::create(['contract_id' => $contract->id, 'action' => 'FILE_UPLOADED',    'description' => 'Upload v1',      'actor_id' => $userId]);

        $contract->load(['creator', 'versions', 'approvals.approver', 'histories.actor', 'messages.user']);

        return response()->json($this->formatContract($contract), 201);
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        $request->validate(['note' => 'nullable|string']);

        $contract = Contract::with('approvals')->findOrFail($id);
        $pending  = $contract->approvals()->where('status', 'pending')->first();

        if (! $pending) {
            return response()->json(['message' => 'No pending approval found.'], 422);
        }

        $pending->update([
            'status'      => 'approved',
            'note'        => $request->note ?? 'Disetujui.',
            'approved_at' => now()->toDateString(),
        ]);

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action'      => 'APPROVAL_APPROVED',
            'description' => "Disetujui oleh {$pending->role}",
            'actor_id'    => Auth::id(),
        ]);

        // Advance next approver
        $next = $contract->approvals()->where('sequence', $pending->sequence + 1)->where('status', 'waiting')->first();
        if ($next) {
            $next->update(['status' => 'pending']);
        } else {
            $contract->update(['status' => 'approved']);
            ContractHistory::create([
                'contract_id' => $contract->id,
                'action'      => 'CONTRACT_APPROVED',
                'description' => 'Semua approval selesai. Kontrak APPROVED.',
                'actor_id'    => Auth::id(),
            ]);
        }

        $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user']);
        return response()->json($this->formatContract($contract));
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string']);

        $contract = Contract::with('approvals')->findOrFail($id);
        $pending  = $contract->approvals()->where('status', 'pending')->first();

        if (! $pending) {
            return response()->json(['message' => 'No pending approval found.'], 422);
        }

        $pending->update([
            'status'      => 'rejected',
            'note'        => $request->reason,
            'approved_at' => now()->toDateString(),
        ]);

        $contract->update(['status' => 'revision']);

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action'      => 'APPROVAL_REJECTED',
            'description' => "Ditolak oleh {$pending->role} – {$request->reason}",
            'actor_id'    => Auth::id(),
        ]);

        $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user']);
        return response()->json($this->formatContract($contract));
    }

    public function uploadRevision(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'changelog' => 'required|string',
            'file'      => 'nullable|file|mimes:docx|max:10240',
        ]);

        $contract = Contract::with('versions')->findOrFail($id);
        $newVer   = $contract->current_version + 1;
        $userId   = Auth::id();
        $hash     = Str::random(12) . '...';
        $fileName = "{$contract->contract_no}_v{$newVer}_revision.docx";
        $filePath = null;

        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->storeAs("contracts/{$contract->id}", "v{$newVer}_{$fileName}", 'local');
        }

        ContractVersion::create([
            'contract_id' => $contract->id,
            'version_no'  => $newVer,
            'file_name'   => $fileName,
            'file_path'   => $filePath,
            'change_log'  => $request->changelog,
            'uploaded_by' => $userId,
            'is_final'    => false,
            'file_hash'   => $hash,
        ]);

        $contract->update([
            'current_version' => $newVer,
            'status'          => 'in_review',
        ]);

        // Reset approvals
        $approvals = $contract->approvals()->orderBy('sequence')->get();
        foreach ($approvals as $i => $a) {
            $a->update(['status' => $i === 0 ? 'pending' : 'waiting', 'note' => null, 'approved_at' => null]);
        }

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action'      => 'FILE_UPLOADED',
            'description' => "Upload revisi v{$newVer}",
            'actor_id'    => $userId,
        ]);

        $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user']);
        return response()->json($this->formatContract($contract));
    }

    public function download(string $id): mixed
    {
        $contract = Contract::findOrFail($id);
        $version  = $contract->currentVersionModel();

        if ($version && $version->file_path && Storage::disk('local')->exists($version->file_path)) {
            return Storage::disk('local')->download($version->file_path, $version->file_name);
        }

        return response()->json(['message' => 'File not found.'], 404);
    }

    public function fileContent(string $id, int $versionNo): mixed
    {
        $contract = Contract::findOrFail($id);
        $version  = $contract->versions()->where('version_no', $versionNo)->firstOrFail();

        if ($version->file_path && Storage::disk('local')->exists($version->file_path)) {
            return Storage::disk('local')->download($version->file_path, $version->file_name);
        }

        return response()->json(['message' => 'File not found.'], 404);
    }

    // ── Format helper ──────────────────────────────────────────────────
    private function formatContract(Contract $c): array
    {
        $progress = $c->progressData();
        return [
            'id'              => $c->id,
            'contract_no'     => $c->contract_no,
            'title'           => $c->title,
            'description'     => $c->description,
            'created_by'      => $c->created_by,
            'status'          => $c->status,
            'current_version' => $c->current_version,
            'created_at'      => $c->created_at->toDateString(),
            'creator'         => $this->formatUser($c->creator),
            'progress'        => $progress,
            'versions'        => $c->versions->map(fn($v) => [
                'version_no' => $v->version_no,
                'file_name'  => $v->file_name,
                'change_log' => $v->change_log,
                'uploaded_by'=> $v->uploaded_by,
                'is_final'   => (bool) $v->is_final,
                'file_hash'  => $v->file_hash,
                'created_at' => $v->created_at->toDateString(),
                'uploader'   => $this->formatUser($v->uploader),
            ])->sortByDesc('version_no')->values(),
            'approvals'  => $c->approvals->map(fn($a) => [
                'id'          => $a->id,
                'approver_id' => $a->approver_id,
                'role'        => $a->role,
                'sequence'    => $a->sequence,
                'status'      => $a->status,
                'note'        => $a->note,
                'approved_at' => $a->approved_at?->toDateString(),
                'approver'    => $this->formatUser($a->approver),
            ]),
            'histories' => $c->histories->map(fn($h) => [
                'action'      => $h->action,
                'description' => $h->description,
                'actor_id'    => $h->actor_id,
                'created_at'  => $h->created_at->format('Y-m-d H:i'),
                'actor'       => $this->formatUser($h->actor),
            ])->sortByDesc('created_at')->values(),
            'messages' => $c->messages->map(fn($m) => [
                'id'         => $m->id,
                'user_id'    => $m->user_id,
                'message'    => $m->message,
                'read_by'    => $m->read_by ?? [],
                'created_at' => $m->created_at->format('Y-m-d H:i'),
                'user'       => $this->formatUser($m->user),
            ]),
        ];
    }

    private function formatUser($user): ?array
    {
        if (! $user) return null;
        return [
            'id'         => $user->id,
            'name'       => $user->name,
            'initials'   => $user->initials,
            'role'       => $user->role,
            'bg_color'   => $user->bg_color,
            'text_color' => $user->text_color,
        ];
    }
}
