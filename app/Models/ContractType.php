<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ContractType extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'description',
    ];

    public function contracts()
    {
        return $this->hasMany(Contract::class);
    }
}
