<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContractMessage extends Model
{
    protected $table = 't_contract_messages';

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
}
