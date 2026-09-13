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
            ->map(function ($c) {
                $effectiveTimestamp = $c->last_message_at
                    ? Carbon::parse($c->last_message_at)
                    : ($c->updated_at ?? $c->created_at);

                return [
                    'id' => $c->id,
                    'form_no' => $c->form_no,
                    'contract_no' => $c->contract_no,
                    'title' => $c->title,
                    'contract_type' => $c->contractType?->name ?? '—',
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
        $msg->load('user');

        return $msg;
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
            ->whereJsonDoesntContain('read_by', $userId)
            ->get();

        foreach ($messages as $msg) {
            $readBy = $msg->read_by ?? [];
            if (! in_array($userId, $readBy)) {
                $readBy[] = $userId;
                $msg->update(['read_by' => $readBy]);
            }
        }

        return $messages->count();
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
