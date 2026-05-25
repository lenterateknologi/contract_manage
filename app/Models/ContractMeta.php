<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractMeta extends Model
{
    use HasFactory;

    protected $table = 't_contract_meta';

    protected $primaryKey = 'contract_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'contract_id',
        'kop_topik',
        'kop_sub_topik',
        'kop_lampiran',
        'f1_tujuan',
        'f1_sifat',
        'p1_entity',
        'p1_signer',
        'p1_signer_position',
        'p1_address',
        'p2_entity',
        'p2_signer',
        'p2_signer_position',
        'p2_address',
        'f2_scope',
        'f2_price',
        'f2_payment',
        'f2_tenure',
        'f2_location',
    ];

    /**
     * Get the contract that owns this metadata.
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class, 'contract_id', 'id');
    }
}
