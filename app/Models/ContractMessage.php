<?php

namespace App\Models;

use App\Mail\NewMessageNotificationMail;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Mail;

class ContractMessage extends Model
{
    protected $table = 't_messages';

    use HasUuids, SoftDeletes;

    protected $fillable = [
        'contract_id', 'user_id', 'message', 'read_by', 'attachment_path', 'attachment_name',
    ];

    protected $casts = [
        'read_by' => 'array',
    ];

    protected $appends = ['attachment_url'];

    public function getAttachmentUrlAttribute()
    {
        return $this->attachment_path ? route('contracts.message-attachment', ['messageId' => $this->id]) : null;
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected static function booted()
    {
        static::created(function ($message) {
            // ponytail: find all involved users and send email notification
            $contract = $message->contract;
            if (! $contract) {
                return;
            }

            $involvedUserIds = collect([
                $contract->created_by,
                $contract->initiated_by_id,
            ])
                ->concat($contract->approvals()->pluck('user_id'))
                ->concat($contract->messages()->where('id', '!=', $message->id)->pluck('user_id'))
                ->filter()
                ->unique()
                ->reject(fn ($id) => $id === $message->user_id);

            if (config('notifications.email.enabled', true)) {
                $users = User::whereIn('id', $involvedUserIds)->get();
                foreach ($users as $user) {
                    if ($user->email) {
                        Mail::to($user->email)
                            ->queue(new NewMessageNotificationMail($message, $user));
                    }
                }
            }
        });
    }
}
