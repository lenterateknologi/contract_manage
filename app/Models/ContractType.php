<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

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

    public function formTemplates()
    {
        return $this->hasMany(FormTemplate::class);
    }
}
