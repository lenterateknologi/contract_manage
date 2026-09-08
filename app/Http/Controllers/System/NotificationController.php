<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\Contract;
use App\Models\ContractHistory;
use App\Models\ContractMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get recent notifications combined.
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json([], 401);
        }

        // Get contracts the user is involved in
        $involvedContractIds = Contract::query()
            ->where(function ($query) use ($user) {
                $query->where('created_by', $user->id)
                    ->orWhere('initiated_by_id', $user->id)
                    ->orWhere('assigned_pic_id', $user->id)
                    ->orWhere('assigned_by_id', $user->id)
                    ->orWhereHas('approvals', function ($q) use ($user) {
                        $q->where('user_id', $user->id);
                    })
                    ->orWhereHas('messages', function ($q) use ($user) {
                        $q->where('user_id', $user->id);
                    });
            })
            ->pluck('id')
            ->toArray();

        // 1. Contract updates (History)
        $updates = ContractHistory::query()
            ->whereIn('contract_id', $involvedContractIds)
            ->where('actor_id', '!=', $user->id)
            ->with(['contract', 'actor'])
            ->latest()
            ->limit(20)
            ->get()
            ->map(function ($h) {
                $actorName = $h->actor->name ?? 'Sistem';
                $contractTitle = $h->contract->title ?? $h->contract->form_no ?? 'Kontrak';
                
                // Format action type for instant clarity
                $actionLabel = match ($h->action) {
                    'APPROVAL_APPROVED' => 'Disetujui',
                    'APPROVAL_REJECTED' => 'Ditolak / Perlu Revisi',
                    'WORKFLOW_ADVANCED' => 'Lanjut Tahap Berikutnya',
                    'CONTRACT_APPROVED' => 'Kontrak Selesai & Disetujui',
                    'CONTRACT_COMPLETED' => 'Kontrak Diarsipkan',
                    'WORKFLOW_ASSIGNED' => 'Penugasan PIC',
                    'SIGNING_SETUP' => 'Penandatanganan Disiapkan',
                    'SIGNING_STEP_COMPLETE' => 'Selesai Ditandatangani',
                    'CONTRACT_SENT' => 'Pengajuan Dikirim',
                    'DOC_REVISED' => 'Dokumen Direvisi',
                    default => 'Aktivitas Kontrak',
                };

                return [
                    'id' => 'update-'.$h->id,
                    'type' => 'contract_update',
                    'category' => $h->action,
                    'badge' => $actionLabel,
                    'title' => $contractTitle,
                    'actor_name' => $actorName,
                    'description' => $h->description,
                    'contract_id' => $h->contract_id,
                    'contract_title' => $contractTitle,
                    'contract_no' => $h->contract->form_no ?? $h->contract->contract_no ?? '',
                    'created_at' => $h->created_at->toIso8601String(),
                    'created_at_formatted' => $h->created_at->diffForHumans(),
                    'created_at_exact' => $h->created_at->format('d M Y, H:i'),
                ];
            });

        // 2. Pending approvals (Action Required)
        $approvals = Approval::query()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->with(['contract.initiator', 'workflowStep'])
            ->latest()
            ->get()
            ->map(function ($a) {
                $contractTitle = $a->contract->title ?? $a->contract->form_no ?? 'Kontrak';
                $stepName = $a->workflowStep ? "Tahap {$a->workflowStep->step} ({$a->workflowStep->description})" : ($a->role ?? 'Persetujuan');

                return [
                    'id' => 'approval-'.$a->id,
                    'type' => 'approval_required',
                    'category' => 'ACTION_REQUIRED',
                    'badge' => 'Perlu Persetujuan',
                    'title' => $contractTitle,
                    'actor_name' => $a->contract->initiator->name ?? 'Pemohon',
                    'description' => "Menunggu respon Anda sebagai {$a->role} pada {$stepName}",
                    'contract_id' => $a->contract_id,
                    'contract_title' => $contractTitle,
                    'contract_no' => $a->contract->form_no ?? $a->contract->contract_no ?? '',
                    'created_at' => $a->created_at->toIso8601String(),
                    'created_at_formatted' => $a->created_at->diffForHumans(),
                    'created_at_exact' => $a->created_at->format('d M Y, H:i'),
                ];
            });

        // 3. Unread messages (Chat/Discussion)
        $messages = ContractMessage::query()
            ->whereIn('contract_id', $involvedContractIds)
            ->where('user_id', '!=', $user->id)
            ->whereJsonDoesntContain('read_by', $user->id)
            ->with(['contract', 'user'])
            ->latest()
            ->get()
            ->map(function ($m) {
                $senderName = $m->user->name ?? 'Pengguna';
                $contractTitle = $m->contract->title ?? $m->contract->form_no ?? 'Kontrak';

                return [
                    'id' => 'message-'.$m->id,
                    'type' => 'new_message',
                    'category' => 'NEW_MESSAGE',
                    'badge' => 'Pesan Diskusi',
                    'title' => $contractTitle,
                    'actor_name' => $senderName,
                    'description' => $m->message ?: ($m->attachment_name ? 'Mengirim lampiran: '.$m->attachment_name : 'Mengirim pesan'),
                    'contract_id' => $m->contract_id,
                    'contract_title' => $contractTitle,
                    'contract_no' => $m->contract->form_no ?? $m->contract->contract_no ?? '',
                    'created_at' => $m->created_at->toIso8601String(),
                    'created_at_formatted' => $m->created_at->diffForHumans(),
                    'created_at_exact' => $m->created_at->format('d M Y, H:i'),
                ];
            });

        // Merge and sort by time desc
        $all = collect()
            ->concat($approvals)
            ->concat($updates)
            ->concat($messages)
            ->sortByDesc('created_at')
            ->values()
            ->all();

        return response()->json($all);
    }

    /**
     * Mark all as read.
     */
    public function markAllRead(): JsonResponse
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json([], 401);
        }

        $involvedContractIds = Contract::query()
            ->where(function ($query) use ($user) {
                $query->where('created_by', $user->id)
                    ->orWhere('initiated_by_id', $user->id)
                    ->orWhere('assigned_pic_id', $user->id)
                    ->orWhere('assigned_by_id', $user->id)
                    ->orWhereHas('approvals', function ($q) use ($user) {
                        $q->where('user_id', $user->id);
                    });
            })
            ->pluck('id')
            ->toArray();

        $unreadMessages = ContractMessage::query()
            ->whereIn('contract_id', $involvedContractIds)
            ->whereJsonDoesntContain('read_by', $user->id)
            ->get();

        foreach ($unreadMessages as $m) {
            $readBy = $m->read_by ?? [];
            if (! in_array($user->id, $readBy)) {
                $readBy[] = $user->id;
                $m->update(['read_by' => $readBy]);
            }
        }

        return response()->json(['status' => 'success']);
    }
}
