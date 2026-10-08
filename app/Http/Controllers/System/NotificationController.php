<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\Transaction\Approval;
use App\Models\Transaction\Contract;
use App\Models\Transaction\ContractHistory;
use App\Models\Transaction\ContractMessage;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class NotificationController extends Controller
{
    use ApiResponse;

    /**
     * Get recent notifications combined with filters, pagination, and unread counters.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (! $user) {
            return $this->errorResponse('Unauthenticated. Token otentikasi diperlukan.', 401);
        }

        $typeFilter = $request->query('type', 'all'); // all, approval_required, contract_update, new_message, mention
        $unreadOnly = filter_var($request->query('unread_only', false), FILTER_VALIDATE_BOOLEAN);
        $search = trim((string) $request->query('search', ''));
        $page = max(1, $request->integer('page', 1));
        $perPage = min(100, max(1, $request->integer('per_page', 20)));

        $userName = trim($user->name ?? '');
        $lowerName = strtolower($userName);
        $nameParts = array_filter(explode(' ', $userName));
        $firstName = $nameParts[0] ?? '';
        $lowerFirst = strtolower($firstName);
        $userIdStr = (string) $user->id;

        // Get contracts the user is involved in
        $involvedContractIds = Contract::query()
            ->where(function ($query) use ($user, $lowerName, $userIdStr) {
                $query->where('created_by', $user->id)
                    ->orWhere('initiated_by_id', $user->id)
                    ->orWhere('assigned_pic_id', $user->id)
                    ->orWhere('assigned_by_id', $user->id)
                    ->orWhereHas('approvals', function ($q) use ($user, $lowerName) {
                        $q->where('user_id', $user->id);
                        if (! empty($lowerName)) {
                            $q->orWhereRaw('LOWER(approver_name) LIKE ?', ['%'.$lowerName.'%']);
                        }
                    })
                    ->orWhereHas('messages', function ($q) use ($user, $lowerName, $userIdStr) {
                        $q->where('user_id', $user->id)
                            ->orWhere('message', 'LIKE', '%data-mention-id="'.$userIdStr.'"%');
                        if (! empty($lowerName)) {
                            $q->orWhereRaw('LOWER(message) LIKE ?', ['%@'.$lowerName.'%'])
                                ->orWhereRaw('LOWER(message) LIKE ?', ['%data-name="'.strtolower($lowerName).'"%']);
                        }
                    });
            })
            ->pluck('id')
            ->toArray();

        // 1. Contract updates (History)
        $updates = empty($involvedContractIds) ? collect() : ContractHistory::query()
            ->select(['id', 'contract_id', 'actor_id', 'action', 'description', 'created_at'])
            ->whereIn('contract_id', $involvedContractIds)
            ->where('actor_id', '!=', $user->id)
            ->with(['contract', 'actor'])
            ->latest()
            ->limit(30)
            ->get()
            ->map(function ($h) {
                $actorName = $h->actor->name ?? 'Sistem';
                $contractTitle = $h->contract->title ?? $h->contract->form_no ?? 'Kontrak';

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
                    'is_read' => false,
                    'created_at' => $h->created_at->toIso8601String(),
                    'created_at_formatted' => $h->created_at->diffForHumans(),
                    'created_at_exact' => $h->created_at->format('d M Y, H:i'),
                ];
            });

        // 2. Pending approvals (Action Required)
        $approvals = Approval::query()
            ->select(['id', 'contract_id', 'user_id', 'status', 'role', 'workflow_step_id', 'created_at'])
            ->where(function ($q) use ($user, $lowerName) {
                $q->where('user_id', $user->id);
                if (! empty($lowerName)) {
                    $q->orWhereRaw('LOWER(approver_name) LIKE ?', ['%'.$lowerName.'%']);
                }
            })
            ->where('status', 'pending')
            ->with(['contract', 'contract.initiator', 'workflowStep'])
            ->latest()
            ->limit(30)
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
                    'is_read' => false,
                    'created_at' => $a->created_at->toIso8601String(),
                    'created_at_formatted' => $a->created_at->diffForHumans(),
                    'created_at_exact' => $a->created_at->format('d M Y, H:i'),
                ];
            });

        // 3. Unread messages (Chat/Discussion & Mentions)
        $rawMessages = ContractMessage::query()
            ->select(['id', 'contract_id', 'user_id', 'message', 'attachment_name', 'read_by', 'created_at'])
            ->where('user_id', '!=', $user->id)
            ->where(function ($query) use ($involvedContractIds, $lowerName, $lowerFirst, $userIdStr) {
                if (! empty($involvedContractIds)) {
                    $query->whereIn('contract_id', $involvedContractIds);
                } else {
                    $query->whereRaw('1 = 0');
                }
                $query->orWhere('message', 'LIKE', '%data-mention-id="'.$userIdStr.'"%');
                if (! empty($lowerName)) {
                    $query->orWhereRaw('LOWER(message) LIKE ?', ['%@'.$lowerName.'%'])
                        ->orWhereRaw('LOWER(message) LIKE ?', ['%data-name="'.strtolower($lowerName).'"%']);
                }
                if (! empty($lowerFirst) && strlen($lowerFirst) >= 3) {
                    $query->orWhereRaw('LOWER(message) LIKE ?', ['%@'.$lowerFirst.'%']);
                }
            })
            ->with(['contract', 'user'])
            ->latest()
            ->limit(50)
            ->get();

        $messages = $rawMessages->map(function ($m) use ($user, $lowerName, $lowerFirst, $userIdStr) {
            $senderName = $m->user->name ?? 'Pengguna';
            $contractTitle = $m->contract->title ?? $m->contract->form_no ?? 'Kontrak';
            $rawMsg = $m->message ?? '';
            $cleanMsg = trim(strip_tags($rawMsg));
            $lowerClean = strtolower($cleanMsg);
            $lowerRaw = strtolower($rawMsg);

            $readBy = $m->read_by;
            if (is_string($readBy)) {
                $readBy = json_decode($readBy, true) ?: [];
            }
            $isRead = is_array($readBy) && (in_array($user->id, $readBy, true) || in_array((string) $user->id, $readBy, true));

            $isMentioned = str_contains($rawMsg, 'data-mention-id="'.$userIdStr.'"') ||
                           (! empty($lowerName) && str_contains($lowerClean, '@'.$lowerName)) ||
                           (! empty($lowerName) && str_contains($lowerRaw, 'data-name="'.$lowerName.'"')) ||
                           (! empty($lowerFirst) && strlen($lowerFirst) >= 3 && str_contains($lowerClean, '@'.$lowerFirst));

            return [
                'id' => 'message-'.$m->id,
                'type' => $isMentioned ? 'mention' : 'new_message',
                'category' => $isMentioned ? 'MENTION' : 'NEW_MESSAGE',
                'badge' => $isMentioned ? 'Menandai Anda (@Mention)' : 'Pesan Diskusi',
                'title' => $contractTitle,
                'actor_name' => $senderName,
                'description' => $cleanMsg ?: ($m->attachment_name ? 'Mengirim lampiran: '.$m->attachment_name : 'Mengirim pesan'),
                'contract_id' => $m->contract_id,
                'contract_title' => $contractTitle,
                'contract_no' => $m->contract->form_no ?? $m->contract->contract_no ?? '',
                'is_read' => $isRead,
                'created_at' => $m->created_at->toIso8601String(),
                'created_at_formatted' => $m->created_at->diffForHumans(),
                'created_at_exact' => $m->created_at->format('d M Y, H:i'),
            ];
        });

        // Merge all
        $all = collect()
            ->concat($approvals)
            ->concat($updates)
            ->concat($messages);

        // Compute summary before filter
        $approvalsCount = $approvals->count();
        $updatesCount = $updates->count();
        $messagesCount = $messages->where('is_read', false)->count();
        $unreadCount = $approvalsCount + $updatesCount + $messagesCount;

        // Apply filters
        $filtered = $all;

        if ($typeFilter !== 'all') {
            $filtered = $filtered->filter(function ($item) use ($typeFilter) {
                if ($typeFilter === 'mention') {
                    return $item['type'] === 'mention' || $item['category'] === 'MENTION';
                }

                return $item['type'] === $typeFilter;
            });
        }

        if ($unreadOnly) {
            $filtered = $filtered->filter(fn ($item) => empty($item['is_read']));
        }

        if (! empty($search)) {
            $s = strtolower($search);
            $filtered = $filtered->filter(function ($item) use ($s) {
                return str_contains(strtolower($item['title']), $s)
                    || str_contains(strtolower($item['description']), $s)
                    || str_contains(strtolower($item['actor_name'] ?? ''), $s)
                    || str_contains(strtolower($item['contract_no'] ?? ''), $s);
            });
        }

        $sorted = $filtered->sortByDesc('created_at')->values();
        $totalItems = $sorted->count();
        $lastPage = max(1, (int) ceil($totalItems / $perPage));
        $paginatedItems = $sorted->slice(($page - 1) * $perPage, $perPage)->values()->all();

        return $this->successResponse([
            'items' => $paginatedItems,
            'summary' => [
                'total_unread' => $unreadCount,
                'approvals_count' => $approvalsCount,
                'updates_count' => $updatesCount,
                'messages_count' => $messagesCount,
            ],
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $totalItems,
                'last_page' => $lastPage,
            ],
        ], 'Notifications retrieved successfully');
    }

    /**
     * Get quick unread count for badge indicators.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (! $user) {
            return $this->errorResponse('Unauthenticated. Token otentikasi diperlukan.', 401);
        }

        $userName = trim($user->name ?? '');
        $lowerName = strtolower($userName);
        $userIdStr = (string) $user->id;

        $approvalsCount = Approval::query()
            ->where(function ($q) use ($user, $lowerName) {
                $q->where('user_id', $user->id);
                if (! empty($lowerName)) {
                    $q->orWhereRaw('LOWER(approver_name) LIKE ?', ['%'.$lowerName.'%']);
                }
            })
            ->where('status', 'pending')
            ->count();

        $unreadMessagesCount = ContractMessage::query()
            ->where('user_id', '!=', $user->id)
            ->where(function ($q) use ($user, $userIdStr) {
                $q->whereJsonDoesntContain('read_by', $user->id)
                    ->whereJsonDoesntContain('read_by', $userIdStr);
            })
            ->whereHas('contract', function ($q) use ($user, $lowerName) {
                $q->where('created_by', $user->id)
                    ->orWhere('initiated_by_id', $user->id)
                    ->orWhere('assigned_pic_id', $user->id)
                    ->orWhereHas('approvals', function ($sq) use ($user, $lowerName) {
                        $sq->where('user_id', $user->id);
                        if (! empty($lowerName)) {
                            $sq->orWhereRaw('LOWER(approver_name) LIKE ?', ['%'.$lowerName.'%']);
                        }
                    });
            })
            ->count();

        $totalUnread = $approvalsCount + $unreadMessagesCount;

        return $this->successResponse([
            'total_unread' => $totalUnread,
            'approvals_count' => $approvalsCount,
            'messages_count' => $unreadMessagesCount,
        ], 'Unread count retrieved successfully');
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllRead(): JsonResponse
    {
        $user = Auth::user();
        if (! $user) {
            return $this->errorResponse('Unauthenticated. Token otentikasi diperlukan.', 401);
        }

        $userName = trim($user->name ?? '');
        $lowerName = strtolower($userName);
        $nameParts = array_filter(explode(' ', $userName));
        $firstName = $nameParts[0] ?? '';
        $lowerFirst = strtolower($firstName);
        $userIdStr = (string) $user->id;

        $involvedContractIds = Contract::query()
            ->where(function ($query) use ($user, $lowerName, $userIdStr) {
                $query->where('created_by', $user->id)
                    ->orWhere('initiated_by_id', $user->id)
                    ->orWhere('assigned_pic_id', $user->id)
                    ->orWhere('assigned_by_id', $user->id)
                    ->orWhereHas('approvals', function ($q) use ($user, $lowerName) {
                        $q->where('user_id', $user->id);
                        if (! empty($lowerName)) {
                            $q->orWhereRaw('LOWER(approver_name) LIKE ?', ['%'.$lowerName.'%']);
                        }
                    })
                    ->orWhereHas('messages', function ($q) use ($user, $lowerName, $userIdStr) {
                        $q->where('user_id', $user->id)
                            ->orWhere('message', 'LIKE', '%data-mention-id="'.$userIdStr.'"%');
                        if (! empty($lowerName)) {
                            $q->orWhereRaw('LOWER(message) LIKE ?', ['%@'.$lowerName.'%'])
                                ->orWhereRaw('LOWER(message) LIKE ?', ['%data-name="'.strtolower($lowerName).'"%']);
                        }
                    });
            })
            ->pluck('id')
            ->toArray();

        $unreadMessages = ContractMessage::query()
            ->where('user_id', '!=', $user->id)
            ->where(function ($query) use ($involvedContractIds, $lowerName, $lowerFirst, $userIdStr) {
                if (! empty($involvedContractIds)) {
                    $query->whereIn('contract_id', $involvedContractIds);
                } else {
                    $query->whereRaw('1 = 0');
                }
                $query->orWhere('message', 'LIKE', '%data-mention-id="'.$userIdStr.'"%');
                if (! empty($lowerName)) {
                    $query->orWhereRaw('LOWER(message) LIKE ?', ['%@'.$lowerName.'%'])
                        ->orWhereRaw('LOWER(message) LIKE ?', ['%data-name="'.strtolower($lowerName).'"%']);
                }
                if (! empty($lowerFirst) && strlen($lowerFirst) >= 3) {
                    $query->orWhereRaw('LOWER(message) LIKE ?', ['%@'.$lowerFirst.'%']);
                }
            })
            ->get();

        $markedCount = 0;
        foreach ($unreadMessages as $m) {
            $readBy = $m->read_by;
            if (is_string($readBy)) {
                $readBy = json_decode($readBy, true) ?: [];
            }
            if (! is_array($readBy)) {
                $readBy = [];
            }
            if (! in_array($user->id, $readBy, true)) {
                $readBy[] = $user->id;
                $m->update(['read_by' => $readBy]);
                $markedCount++;
            }
        }

        Cache::forget("notifications_payload_user_{$user->id}");
        Cache::forget("user_involved_contracts_{$user->id}");

        return $this->successResponse([
            'marked' => true,
            'marked_messages_count' => $markedCount,
            'timestamp' => Carbon::now()->toIso8601String(),
        ], 'All notifications marked as read');
    }

    /**
     * Mark a single notification item as read.
     */
    public function markSingleRead(Request $request, string $id): JsonResponse
    {
        $user = Auth::user();
        if (! $user) {
            return $this->errorResponse('Unauthenticated. Token otentikasi diperlukan.', 401);
        }

        if (str_starts_with($id, 'message-')) {
            $messageId = substr($id, 8);
            $msg = ContractMessage::find($messageId);
            if ($msg) {
                $readBy = $msg->read_by;
                if (is_string($readBy)) {
                    $readBy = json_decode($readBy, true) ?: [];
                }
                if (! is_array($readBy)) {
                    $readBy = [];
                }
                if (! in_array($user->id, $readBy, true)) {
                    $readBy[] = $user->id;
                    $msg->update(['read_by' => $readBy]);
                }
            }
        }

        Cache::forget("notifications_payload_user_{$user->id}");

        return $this->successResponse([
            'id' => $id,
            'is_read' => true,
        ], 'Notification marked as read');
    }

    /**
     * Dismiss / clear a notification item.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = Auth::user();
        if (! $user) {
            return $this->errorResponse('Unauthenticated. Token otentikasi diperlukan.', 401);
        }

        return $this->successResponse([
            'id' => $id,
            'dismissed' => true,
        ], 'Notification dismissed successfully');
    }
}
