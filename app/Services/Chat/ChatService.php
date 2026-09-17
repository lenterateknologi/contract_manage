<?php

namespace App\Services\Chat;

use App\Models\Contract;
use App\Models\ContractMessage;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;

class ChatService
{
    /**
     * Get contracts involved with the user for Chat Center.
     */
    public function getInvolvedContracts(User $user, ?string $selectedId = null): Collection
    {
        $lastMessageQuery = ContractMessage::query()
            ->select('created_at')
            ->whereColumn('contract_id', 't_contracts.id')
            ->latest('created_at')
            ->limit(1);

        $allTypes = \App\Models\ContractType::all();
        $typeToRootMap = [];
        foreach ($allTypes as $t) {
            $curr = $t;
            while ($curr && $curr->parent_id) {
                $curr = $allTypes->firstWhere('id', $curr->parent_id);
            }
            $rootCode = $curr?->code;
            $rootName = strtolower($curr?->name ?? '');
            if ($rootCode === 'NDA' || str_contains($rootName, 'nda') || str_contains($rootName, 'kerahasiaan')) {
                $typeToRootMap[$t->id] = 'nda';
            } elseif ($rootCode === 'A-2' || str_contains($rootName, 'non kontrak')) {
                $typeToRootMap[$t->id] = 'non_kontrak';
            } else {
                $typeToRootMap[$t->id] = 'kontrak';
            }
        }

        $contracts = Contract::query()
            ->select(['id', 'form_no', 'contract_no', 'title', 'contract_type_id', 'created_by', 'created_at', 'updated_at'])
            ->selectSub($lastMessageQuery, 'last_message_at')
            ->whereRaw("UPPER(status) != 'DRAFT'")
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
            ->with([
                'creator:id,name,role_id',
                'contractType:id,name',
            ])
            ->withCount(['messages as unread_count' => function ($q) use ($user) {
                $q->whereJsonDoesntContain('read_by', $user->id);
            }])
            ->orderByRaw('COALESCE(('.$lastMessageQuery->toSql().'), t_contracts.updated_at) DESC')
            ->get()
            ->map(function ($c) use ($typeToRootMap) {
                $effectiveTimestamp = $c->last_message_at
                    ? Carbon::parse($c->last_message_at)
                    : ($c->updated_at ?? $c->created_at);

                return [
                    'id' => $c->id,
                    'form_no' => $c->form_no,
                    'contract_no' => $c->contract_no,
                    'title' => $c->title,
                    'contract_type' => $c->contractType?->name ?? '—',
                    'contract_type_id' => $c->contract_type_id,
                    'parent_category' => $c->contract_type_id ? ($typeToRootMap[$c->contract_type_id] ?? 'kontrak') : 'kontrak',
                    'unread_count' => $c->unread_count ?? 0,
                    'updated_at' => $effectiveTimestamp ? $effectiveTimestamp->toIso8601String() : null,
                    'updated_at_formatted' => $effectiveTimestamp ? $effectiveTimestamp->diffForHumans() : '',
                    'creator' => $c->creator ? ['id' => $c->creator->id, 'name' => $c->creator->name] : null,
                ];
            });

        return $contracts->map(function ($c) use ($selectedId, $user) {
            $isInitialSelected = $selectedId && $c['id'] === $selectedId;
            if ($isInitialSelected) {
                $contractModel = Contract::with(['messages.user'])->find($c['id']);
                if ($contractModel) {
                    $c['messages'] = $this->formatMessages($contractModel->messages->sortBy('created_at')->values(), $user->id);
                }
            }

            return $c;
        });
    }

    /**
     * Get formatted messages for a contract.
     */
    public function getContractMessages(Contract $contract, int $limit = 100, ?string $currentUserId = null): Collection
    {
        $messages = $contract->messages()
            ->with(['user'])
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->take($limit)
            ->get();

        return $this->formatMessages($messages, $currentUserId);
    }

    /**
     * Format message models to structured array.
     */
    public function formatMessages(Collection $messages, ?string $currentUserId = null): Collection
    {
        return $messages->map(fn ($m) => $this->formatMessage($m, $currentUserId));
    }

    /**
     * Format a single message model.
     */
    public function formatMessage(ContractMessage $m, ?string $currentUserId = null): array
    {
        return [
            'id' => $m->id,
            'user_id' => $m->user_id,
            'message' => $m->message,
            'read_by' => $m->read_by ?? [],
            'reactions' => $this->enrichReactionsWithUser($m->reactions, $currentUserId),
            'created_at' => $m->created_at->format('Y-m-d H:i'),
            'attachment_url' => $m->attachment_path ? asset('storage/'.$m->attachment_path) : null,
            'attachment_name' => $m->attachment_name,
            'user' => $m->user ? [
                'id' => $m->user->id,
                'name' => $m->user->name,
                'initials' => $m->user->initials,
                'role' => $m->user->role,
                'avatar' => $m->user->avatar_url ?? $m->user->avatar ?? null,
            ] : null,
        ];
    }

    /**
     * Send a new message.
     */
    public function sendMessage(Contract $contract, User $user, ?string $messageText, ?UploadedFile $attachmentFile): ContractMessage
    {
        $attachmentPath = null;
        $attachmentName = null;

        if ($attachmentFile) {
            $attachmentName = $attachmentFile->getClientOriginalName();
            $attachmentPath = $attachmentFile->store('chat_attachments', 'public');
        }

        $msg = ContractMessage::create([
            'contract_id' => $contract->id,
            'user_id' => $user->id,
            'message' => $messageText ?? '',
            'read_by' => [$user->id],
            'reactions' => [],
            'attachment_path' => $attachmentPath,
            'attachment_name' => $attachmentName,
        ]);

        $contract->touch();
        $msg->load(['user', 'contract']);

        $this->notifyMentionedUsers($contract, $user, $msg);

        return $msg;
    }

    /**
     * Dispatch notifications and clear caches for mentioned users.
     */
    protected function notifyMentionedUsers(Contract $contract, User $sender, ContractMessage $msg): void
    {
        $messageText = $msg->message ?? '';
        if (empty($messageText)) {
            return;
        }

        $userIds = [];
        $rawNames = [];

        // 1. Extract data-mention-id="UUID"
        if (preg_match_all('/data-mention-id="([^"]+)"/u', $messageText, $idMatches)) {
            $userIds = array_merge($userIds, $idMatches[1] ?? []);
        }

        // 2. Extract data-name="Name"
        if (preg_match_all('/data-name="([^"]+)"/u', $messageText, $dataNameMatches)) {
            $rawNames = array_merge($rawNames, $dataNameMatches[1] ?? []);
        }

        // 3. Extract span with mention-tag
        if (preg_match_all('/<span[^>]*class="[^"]*mention-tag[^"]*"[^>]*>.*?@([^<]+)<\/span>/u', $messageText, $spanMatches)) {
            $rawNames = array_merge($rawNames, $spanMatches[1] ?? []);
        }

        // 4. Extract HTML strong mentions: <strong>@Name</strong>
        if (preg_match_all('/<strong>@([^<]+)<\/strong>/u', $messageText, $htmlMatches)) {
            $rawNames = array_merge($rawNames, $htmlMatches[1] ?? []);
        }

        // 5. Extract plain text mentions: @Name
        $plainText = strip_tags($messageText);
        if (preg_match_all('/@([a-zA-Z0-9_.\s-]+?)(?=\s@|\s*$|[.,!?\n\r])/u', $plainText, $plainMatches)) {
            $rawNames = array_merge($rawNames, $plainMatches[1] ?? []);
        }

        $rawNames = array_unique(array_filter(array_map('trim', $rawNames)));
        $userIds = array_unique(array_filter(array_map('trim', $userIds)));

        if (empty($rawNames) && empty($userIds)) {
            return;
        }

        // Find users matching either exact user ID or name/username (case-insensitive)
        $mentionedUsers = User::query()
            ->where('id', '!=', $sender->id)
            ->where(function ($query) use ($userIds, $rawNames) {
                if (! empty($userIds)) {
                    $query->whereIn('id', $userIds);
                }
                foreach ($rawNames as $name) {
                    $lower = strtolower($name);
                    $query->orWhereRaw('LOWER(name) LIKE ?', ['%'.$lower.'%'])
                          ->orWhereRaw('LOWER(username) LIKE ?', ['%'.$lower.'%']);
                }
            })
            ->get();

        foreach ($mentionedUsers as $targetUser) {
            // Invalidate notification cache so notification center immediately shows new message
            \Illuminate\Support\Facades\Cache::forget("notifications_payload_user_{$targetUser->id}");
            \Illuminate\Support\Facades\Cache::forget("user_involved_contracts_{$targetUser->id}");

            // Send email notification if user has email configured
            if (! empty($targetUser->email)) {
                try {
                    \Illuminate\Support\Facades\Mail::to($targetUser->email)->queue(new \App\Mail\NewMessageNotificationMail($msg, $targetUser));
                } catch (\Throwable $e) {
                    report($e);
                }
            }
        }
    }

    /**
     * Toggle reaction on a message.
     */
    public function toggleReaction(ContractMessage $msg, User $user, string $emoji): array
    {
        $userId = $user->id;
        $reactions = $msg->reactions ?? [];
        if (! is_array($reactions)) {
            $reactions = [];
        }

        $existingIndex = -1;
        $sameEmoji = false;
        foreach ($reactions as $idx => $r) {
            if (isset($r['user_id']) && $r['user_id'] === $userId) {
                $existingIndex = $idx;
                if (isset($r['emoji']) && $r['emoji'] === $emoji) {
                    $sameEmoji = true;
                }
                break;
            }
        }

        if ($existingIndex >= 0) {
            if ($sameEmoji) {
                array_splice($reactions, $existingIndex, 1);
            } else {
                $reactions[$existingIndex]['emoji'] = $emoji;
            }
        } else {
            $reactions[] = [
                'emoji' => $emoji,
                'user_id' => $userId,
            ];
        }

        $msg->reactions = array_values($reactions);
        $msg->save();

        return $this->enrichReactionsWithUser($msg->reactions, $user->id);
    }

    /**
     * Mark messages as read for a contract.
     */
    public function markAsRead(Contract $contract, User $user): int
    {
        $userId = $user->id;
        $messages = ContractMessage::where('contract_id', $contract->id)
            ->where('user_id', '!=', $userId)
            ->get()
            ->filter(function ($msg) use ($userId) {
                $readBy = $msg->read_by;
                if (is_string($readBy)) {
                    $readBy = json_decode($readBy, true) ?: [];
                }
                if (! is_array($readBy)) {
                    $readBy = [];
                }
                return ! in_array($userId, $readBy, true) && ! in_array((string) $userId, $readBy, true);
            });

        $count = 0;
        foreach ($messages as $msg) {
            $readBy = $msg->read_by ?? [];
            if (is_string($readBy)) {
                $readBy = json_decode($readBy, true) ?: [];
            }
            if (! is_array($readBy)) {
                $readBy = [];
            }
            if (! in_array($userId, $readBy, true)) {
                $readBy[] = $userId;
                $msg->update(['read_by' => $readBy]);
                $count++;
            }
        }

        \Illuminate\Support\Facades\Cache::forget("notifications_payload_user_{$userId}");
        \Illuminate\Support\Facades\Cache::forget("user_involved_contracts_{$userId}");

        return $count;
    }

    /**
     * Enrich reactions array with User models.
     */
    public function enrichReactionsWithUser(?array $reactions, ?string $currentUserId = null): array
    {
        if (empty($reactions) || ! is_array($reactions)) {
            return [];
        }

        $userIds = collect($reactions)->pluck('user_id')->filter()->unique();
        $users = User::whereIn('id', $userIds)->get()->keyBy('id');

        return collect($reactions)->map(function ($r) use ($users, $currentUserId) {
            $u = $users->get($r['user_id'] ?? null);

            return [
                'emoji' => $r['emoji'] ?? '',
                'react' => true,
                'user_id' => $r['user_id'] ?? null,
                'is_me' => ($r['user_id'] ?? null) === $currentUserId,
                'user' => $u ? [
                    'id' => $u->id,
                    'name' => $u->name,
                    'initials' => $u->initials,
                    'avatar' => $u->avatar_url ?? $u->avatar ?? null,
                    'role' => $u->role,
                ] : null,
            ];
        })->toArray();
    }
}
