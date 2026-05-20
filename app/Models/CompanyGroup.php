<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CompanyGroup extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'm_company_groups';

    protected $fillable = [
        'name',
        'code',
        'description',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function companies()
    {
        return $this->hasMany(Company::class, 'company_group_id');
    }
}
