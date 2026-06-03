<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string $contract_id
 * @property string $action
 * @property string $description
 * @property string|null $actor_id
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 * @property \Carbon\Carbon|null $deleted_at
 * @property-read User|null $actor
 * @property-read Contract $contract
 */
class ContractHistory extends Model
{
    protected $table = 't_contract_h';

    use HasUuids, SoftDeletes;

    protected $fillable = [
        'contract_id', 'action', 'description', 'actor_id',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
