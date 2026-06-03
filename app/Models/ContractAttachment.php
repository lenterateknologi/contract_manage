<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string $contract_id
 * @property string $label
 * @property string|null $category
 * @property string $file_name
 * @property string $file_path
 * @property string|null $file_type
 * @property string|null $uploaded_by
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 * @property \Carbon\Carbon|null $deleted_at
 * @property-read Contract $contract
 * @property-read User|null $uploader
 */
class ContractAttachment extends Model
{
    protected $table = 't_contract_attachments';

    use HasUuids, SoftDeletes;

    protected $fillable = [
        'contract_id',
        'label',
        'category',
        'file_name',
        'file_path',
        'file_type',
        'uploaded_by',
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
