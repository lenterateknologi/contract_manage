<?php

namespace App\Services\Chat;

use App\Mail\NewMessageNotificationMail;
use App\Models\Master\ContractType;
use App\Models\Master\User;
use App\Models\Transaction\Contract;
use App\Models\Transaction\ContractMessage;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

class ChatService
{
    /**
     * Scope query to only contracts where the user is an involved member.
     */
    public function applyInvolvedScope($query, User $user)
    {
        return $query->where(function ($q) use ($user) {
            $q->where('created_by', $user->id)
                ->orWhere('initiated_by_id', $user->id)
                ->orWhere('assigned_pic_id', $user->id)
                ->orWhere('assigned_by_id', $user->id)
                ->orWhere('closed_by', $user->id)
                ->orWhereHas('approvals', function ($sq) use ($user) {
                    $sq->where('user_id', $user->id);
                })
                ->orWhereHas('messages', function ($sq) use ($user) {
                    $sq->where('user_id', $user->id);
                })
                ->orWhereHas('submissionReviews', function ($sq) use ($user) {
                    $sq->where('user_id', $user->id);
                })
                ->orWhereHas('histories', function ($sq) use ($user) {
                    $sq->where('actor_id', $user->id);
                });
        });
    }

    /**
     * Check whether the user is an involved participant in the contract.
     */
    public function isUserInvolved(Contract $contract, User $user): bool
    {
        if (
            $contract->created_by === $user->id ||
            $contract->initiated_by_id === $user->id ||
            $contract->assigned_pic_id === $user->id ||
            $contract->assigned_by_id === $user->id ||
            $contract->closed_by === $user->id
        ) {
            return true;
        }

        if ($contract->approvals()->where('user_id', $user->id)->exists()) {
            return true;
        }

        if ($contract->messages()->where('user_id', $user->id)->exists()) {
            return true;
        }

        if ($contract->submissionReviews()->where('user_id', $user->id)->exists()) {
            return true;
        }

        if ($contract->histories()->where('actor_id', $user->id)->exists()) {
            return true;
        }

        return false;
    }

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

        $allTypes = ContractType::whereNull('deleted_at')->get();
        $typeToRootMap = [];
        foreach ($allTypes as $t) {
            $curr = $t;
            $visited = [];
            while ($curr && $curr->parent_id && ! in_array($curr->id, $visited)) {
                $visited[] = $curr->id;
                $curr = $allTypes->firstWhere('id', $curr->parent_id);
            }
            $rootCode = strtoupper($curr?->code ?? '');
            $rootName = strtolower($curr?->name ?? '');
            if ($rootCode === 'NDA' || str_contains($rootName, 'nda') || str_contains($rootName, 'kerahasiaan')) {
                $typeToRootMap[$t->id] = 'nda';
            } elseif ($rootCode === 'A-2' || str_contains($rootName, 'non')) {
                $typeToRootMap[$t->id] = 'non_kontrak';
            } else {
                $typeToRootMap[$t->id] = 'kontrak';
            }
        }

        $query = Contract::query()
            ->select(['id', 'form_no', 'contract_no', 'title', 'contract_type_id', 'created_by', 'created_at', 'updated_at'])
            ->selectSub($lastMessageQuery, 'last_message_at')
            ->whereRaw("UPPER(status) != 'DRAFT'");

        $this->applyInvolvedScope($query, $user);

        $contracts = $query
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
     * Get discussions list with pagination and search/category filters.
     */
    public function getDiscussions(User $user, array $filters = [], int $perPage = 15): array
    {
        $allTypes = ContractType::whereNull('deleted_at')->get();
        $typeToRootMap = [];
        $typeToRootNameMap = [];
        foreach ($allTypes as $t) {
            $curr = $t;
            $visited = [];
            while ($curr && $curr->parent_id && ! in_array($curr->id, $visited)) {
                $visited[] = $curr->id;
                $curr = $allTypes->firstWhere('id', $curr->parent_id);
            }
            $rootCode = strtoupper($curr?->code ?? '');
            $rootName = strtolower($curr?->name ?? '');
            if ($rootCode === 'NDA' || str_contains($rootName, 'nda') || str_contains($rootName, 'kerahasiaan')) {
                $typeToRootMap[$t->id] = 'nda';
            } elseif ($rootCode === 'A-2' || str_contains($rootName, 'non')) {
                $typeToRootMap[$t->id] = 'non_kontrak';
            } else {
                $typeToRootMap[$t->id] = 'kontrak';
            }
            $typeToRootNameMap[$t->id] = $curr?->name ?? $t->name;
        }

        $lastMessageQuery = ContractMessage::query()
            ->select('created_at')
            ->whereColumn('contract_id', 't_contracts.id')
            ->latest('created_at')
            ->limit(1);

        $query = Contract::query()
            ->select(['id', 'form_no', 'contract_no', 'title', 'status', 'contract_type_id', 'created_by', 'created_at', 'updated_at'])
            ->selectSub($lastMessageQuery, 'last_message_at')
            ->whereRaw("UPPER(status) != 'DRAFT'");

        $this->applyInvolvedScope($query, $user);

        $query->with([
            'creator:id,name,role_id',
            'contractType:id,name',
        ])
            ->withCount(['messages as unread_count' => function ($q) use ($user) {
                $q->whereJsonDoesntContain('read_by', $user->id);
            }]);

        // Category filter
        if (! empty($filters['category']) && $filters['category'] !== 'all') {
            $categoryTarget = strtolower($filters['category']);
            $matchingTypeIds = array_keys(array_filter($typeToRootMap, function ($cat, $typeId) use ($categoryTarget, $typeToRootNameMap) {
                return $cat === $categoryTarget
                    || (string) $typeId === $categoryTarget
                    || strtolower($typeToRootNameMap[$typeId] ?? '') === $categoryTarget;
            }, ARRAY_FILTER_USE_BOTH));
            if (! empty($matchingTypeIds)) {
                $query->whereIn('contract_type_id', $matchingTypeIds);
            }
        }

        // Search filter
        if (! empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('contract_no', 'like', "%{$search}%")
                    ->orWhere('form_no', 'like', "%{$search}%")
                    ->orWhereHas('messages', function ($mq) use ($search) {
                        $mq->where('message', 'like', "%{$search}%");
                    });
            });
        }

        $query->orderByRaw('COALESCE(('.$lastMessageQuery->toSql().'), t_contracts.updated_at) DESC');

        $paginated = $query->paginate($perPage);

        $contractIds = collect($paginated->items())->pluck('id');
        $latestMessages = $contractIds->isNotEmpty()
            ? ContractMessage::with(['user:id,name,role_id,image_src'])
                ->whereIn('contract_id', $contractIds)
                ->orderBy('created_at', 'desc')
                ->get()
                ->unique('contract_id')
                ->keyBy('contract_id')
            : collect();

        $items = collect($paginated->items())->map(function ($c) use ($typeToRootMap, $latestMessages) {
            $effectiveTimestamp = $c->last_message_at
                ? Carbon::parse($c->last_message_at)
                : ($c->updated_at ?? $c->created_at);

            $lastMsg = $latestMessages->get($c->id);

            return [
                'id' => $c->id,
                'form_no' => $c->form_no,
                'contract_no' => $c->contract_no,
                'title' => $c->title,
                'status' => $c->status,
                'contract_type' => $c->contractType?->name ?? '—',
                'contract_type_id' => $c->contract_type_id,
                'parent_category' => $c->contract_type_id ? ($typeToRootMap[$c->contract_type_id] ?? 'kontrak') : 'kontrak',
                'unread_count' => $c->unread_count ?? 0,
                'last_message' => $lastMsg ? [
                    'id' => $lastMsg->id,
                    'message' => $lastMsg->message,
                    'has_attachment' => ! empty($lastMsg->attachment_path),
                    'attachment_name' => $lastMsg->attachment_name,
                    'created_at' => $lastMsg->created_at ? $lastMsg->created_at->format('Y-m-d H:i') : null,
                    'created_at_formatted' => $lastMsg->created_at ? $lastMsg->created_at->diffForHumans() : '',
                    'user' => $lastMsg->user ? [
                        'id' => $lastMsg->user->id,
                        'name' => $lastMsg->user->name,
                        'initials' => $lastMsg->user->initials,
                        'avatar' => $lastMsg->user->avatar_url ?? $lastMsg->user->avatar ?? null,
                    ] : null,
                ] : null,
                'updated_at' => $effectiveTimestamp ? $effectiveTimestamp->toIso8601String() : null,
                'updated_at_formatted' => $effectiveTimestamp ? $effectiveTimestamp->diffForHumans() : '',
                'creator' => $c->creator ? ['id' => $c->creator->id, 'name' => $c->creator->name] : null,
            ];
        });

        return [
            'data' => $items,
            'current_page' => $paginated->currentPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
            'last_page' => $paginated->lastPage(),
        ];
    }

    /**
     * Get discussion detail for a specific contract including header metadata and messages.
     */
    public function getDiscussionDetail(Contract $contract, User $user, int $limit = 50, ?string $search = null): array
    {
        $contract->loadMissing(['creator:id,name,role_id', 'contractType:id,name']);

        $messagesQuery = $contract->messages()->with(['user'])->orderBy('created_at', 'asc')->orderBy('id', 'asc');
        if (! empty($search)) {
            $messagesQuery->where('message', 'like', '%'.trim($search).'%');
        }
        $messages = $messagesQuery->take($limit)->get();

        $unreadCount = $contract->messages()
            ->where('user_id', '!=', $user->id)
            ->whereJsonDoesntContain('read_by', $user->id)
            ->count();

        return [
            'contract' => [
                'id' => $contract->id,
                'form_no' => $contract->form_no,
                'contract_no' => $contract->contract_no,
                'title' => $contract->title,
                'status' => $contract->status,
                'contract_type' => $contract->contractType?->name ?? '—',
                'contract_type_id' => $contract->contract_type_id,
                'creator' => $contract->creator ? ['id' => $contract->creator->id, 'name' => $contract->creator->name] : null,
            ],
            'unread_count' => $unreadCount,
            'messages' => $this->formatMessages($messages, $user->id),
        ];
    }

    /**
     * Get formatted messages for a contract.
     */
    public function getContractMessages(Contract $contract, int $limit = 100, ?string $currentUserId = null, ?string $search = null): Collection
    {
        $query = $contract->messages()
            ->with(['user'])
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc');

        if (! empty($search)) {
            $query->where('message', 'like', '%'.trim($search).'%');
        }

        $messages = $query->take($limit)->get();

        return $this->formatMessages($messages, $currentUserId);
    }

    /**
     * Get a single message by ID.
     */
    public function getMessageDetail(string $messageId, ?string $currentUserId = null): ?array
    {
        $msg = ContractMessage::with(['user', 'contract'])->find($messageId);
        if (! $msg) {
            return null;
        }

        $formatted = $this->formatMessage($msg, $currentUserId);
        $formatted['contract'] = [
            'id' => $msg->contract?->id,
            'title' => $msg->contract?->title,
            'contract_no' => $msg->contract?->contract_no,
            'status' => $msg->contract?->status,
        ];

        return $formatted;
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
            Cache::forget("notifications_payload_user_{$targetUser->id}");
            Cache::forget("user_involved_contracts_{$targetUser->id}");

            // Send email notification if user has email configured
            if (! empty($targetUser->email)) {
                try {
                    Mail::to($targetUser->email)->queue(new NewMessageNotificationMail($msg, $targetUser));
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

        Cache::forget("notifications_payload_user_{$userId}");
        Cache::forget("user_involved_contracts_{$userId}");

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
