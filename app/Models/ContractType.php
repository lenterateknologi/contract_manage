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
        'code',
        'description',
        'f1_input_mechanism',
        'f1_form_template_id',
        'f1_contract_template_id',
        'f2_input_mechanism',
        'f2_form_template_id',
        'f2_contract_template_id',
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
