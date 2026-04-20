<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContractType extends Model
{
    protected $table = 'm_contract_types';

    use HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'type',
    ];

    public function contracts()
    {
        return $this->hasMany(Contract::class);
    }

    public function formTemplates()
    {
        return $this->hasMany(FormTemplate::class);
    }
}
