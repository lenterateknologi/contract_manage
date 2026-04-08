<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractApproval extends Model
{
    use HasUuids;
    protected $fillable = [
        'contract_id', 'approver_id', 'role', 'sequence',
        'status', 'note', 'approved_at',
    ];

    protected $casts = [
        'approved_at' => 'date',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
