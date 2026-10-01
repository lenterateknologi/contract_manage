<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContractHistory extends Model
{
    protected $table = 't_contract_h';

    use HasUuids, SoftDeletes;

    protected $fillable = [
        'contract_id',
        'action',
        'description',
        'actor_id',
        'ip_address',
        'user_agent',
        'step_name',
        'step_number',
        'metadata',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'metadata' => 'array',
        'step_number' => 'integer',
        'created_at' => 'datetime',
    ];

    public static function record(
        string $contractId,
        string $action,
        string $description,
        ?string $actorId = null,
        ?array $metadata = null,
        ?string $stepName = null,
        ?int $stepNumber = null
    ): self {
        $request = request();
        $ip = $request ? $request->ip() : null;
        $userAgent = $request ? substr((string) $request->userAgent(), 0, 500) : null;
        $resolvedActorId = $actorId ?: auth()->id();

        return static::create([
            'contract_id' => $contractId,
            'action' => $action,
            'description' => $description,
            'actor_id' => $resolvedActorId,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'step_name' => $stepName,
            'step_number' => $stepNumber,
            'metadata' => $metadata,
            'created_by' => $resolvedActorId,
            'updated_by' => $resolvedActorId,
        ]);
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
