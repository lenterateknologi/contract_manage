<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Role extends Model
{
    protected $table = 'm_roles';

    // Role Constants
    const ADMIN = 'Admin';

    const SUPER_ADMIN = 'Super Admin';

    const MANAGER = 'Manager';

    const STAFF = 'Staff';

    const DIRECTOR = 'Director';

    const VP = 'VP';

    const CEO = 'CEO';

    const ADHOC_APPROVER = 'Persetujuan Tambahan';

    use SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'company_id',
        'name',
        'description',
    ];

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
