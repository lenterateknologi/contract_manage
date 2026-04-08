<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contract extends Model
{
    use HasFactory, HasUuids;
    protected $fillable = [
        'contract_no',
        'title',
        'description',
        'contract_date',
        'contract_type_id',
        'status',
        'created_by',
        'current_version',
    ];

    public function contractType()
    {
        return $this->belongsTo(ContractType::class, 'contract_type_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(ContractAttachment::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(ContractVersion::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(ContractApproval::class)->orderBy('sequence');
    }

    public function histories(): HasMany
    {
        return $this->hasMany(ContractHistory::class)->orderBy('created_at');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ContractMessage::class)->orderBy('created_at');
    }

    public function currentVersionModel(): ?ContractVersion
    {
        return $this->versions()->where('version_no', $this->current_version)->first();
    }

    public function pendingApproval(): ?ContractApproval
    {
        return $this->approvals()->where('status', 'pending')->first();
    }

    public function progressData(): array
    {
        $sequences = $this->approvals->pluck('sequence')->unique();
        $done = $sequences->filter(fn($s) => $this->approvals->where('sequence', $s)->where('status', 'approved')->count() > 0);
        $total = $sequences->count();
        $pct = $total > 0 ? round($done->count() / $total * 100) : 0;
        return ['done' => $done->count(), 'total' => $total, 'pct' => $pct];
    }
}
