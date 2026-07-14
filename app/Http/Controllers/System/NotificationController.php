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

        // 1. Contract updates
        $updates = ContractHistory::query()
            ->whereIn('contract_id', $involvedContractIds)
            ->where('actor_id', '!=', $user->id)
            ->with(['contract', 'actor'])
            ->latest()
            ->limit(15)
            ->get()
            ->map(fn ($h) => [
                'id' => 'update-'.$h->id,
                'type' => 'contract_update',
                'title' => 'Pembaruan Kontrak',
                'description' => ($h->actor->name ?? 'System').' '.$h->description,
                'contract_id' => $h->contract_id,
                'contract_title' => $h->contract->title ?? '—',
                'created_at' => $h->created_at->toIso8601String(),
                'created_at_formatted' => $h->created_at->format('d/m/Y H:i'),
            ]);

        // 2. Pending approvals
        $approvals = Approval::query()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->with('contract')
            ->latest()
            ->get()
            ->map(fn ($a) => [
                'id' => 'approval-'.$a->id,
                'type' => 'approval_required',
                'title' => 'Persetujuan Diperlukan',
                'description' => 'Kontrak "'.($a->contract->title ?? '—').'" memerlukan persetujuan Anda.',
                'contract_id' => $a->contract_id,
                'contract_title' => $a->contract->title ?? '—',
                'created_at' => $a->created_at->toIso8601String(),
                'created_at_formatted' => $a->created_at->format('d/m/Y H:i'),
            ]);

        // 3. Unread messages
        $messages = ContractMessage::query()
            ->whereIn('contract_id', $involvedContractIds)
            ->where('user_id', '!=', $user->id)
            ->whereJsonDoesntContain('read_by', $user->id)
            ->with(['contract', 'user'])
            ->latest()
            ->get()
            ->map(fn ($m) => [
                'id' => 'message-'.$m->id,
                'type' => 'new_message',
                'title' => 'Pesan Baru',
                'description' => ($m->user->name ?? 'Pengguna').': '.$m->message,
                'contract_id' => $m->contract_id,
                'contract_title' => $m->contract->title ?? '—',
                'created_at' => $m->created_at->toIso8601String(),
                'created_at_formatted' => $m->created_at->format('d/m/Y H:i'),
            ]);

        // Merge and sort by time desc
        $all = collect()
            ->concat($updates)
            ->concat($approvals)
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
