<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContractPurchaseOrder extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 't_contract_purchase_orders';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'contract_id',
        'po_number',
        'title',
        'po_date',
        'amount',
        'currency',
        'vendor_name',
        'status',
        'description',
        'file_path',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'po_date' => 'date:Y-m-d',
        'amount' => 'decimal:2',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class, 'contract_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
