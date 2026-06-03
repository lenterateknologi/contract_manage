<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string $contract_id
 * @property string $document_type
 * @property int $version_no
 * @property string $file_name
 * @property string $file_path
 * @property string|null $change_log
 * @property string|null $uploaded_by
 * @property bool $is_final
 * @property string|null $file_hash
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 * @property \Carbon\Carbon|null $deleted_at
 * @property-read Contract $contract
 * @property-read User|null $uploader
 */
class ContractVersion extends Model
{
    protected $table = 't_contract_versions';

    use HasUuids, SoftDeletes;

    protected $fillable = [
        'contract_id',
        'document_type',
        'version_no',
        'file_name',
        'file_path',
        'change_log',
        'uploaded_by',
        'is_final',
        'file_hash',
    ];

    protected $casts = [
        'is_final' => 'boolean',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
