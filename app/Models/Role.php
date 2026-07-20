<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Role extends Model
{
    protected $table = 'm_roles';

    use SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'company_id',
        'name',
        'description',
    ];

    public function getContractFilterSettings(): array
    {
        return [
            'can_change_company_group' => false,
            'allowed_company_groups'   => [],
            'can_change_region'        => false,
            'allowed_regions'          => [],
            'can_change_company'       => false,
            'allowed_companies'        => [],
            'can_change_division'      => false,
            'allowed_divisions'        => [],
            'can_change_department'    => false,
            'allowed_departments'      => [],
        ];
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'role_id');
    }

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }
}
