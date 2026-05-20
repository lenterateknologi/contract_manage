<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccessModule extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'm_access_modules';

    protected $fillable = [
        'role_id',
        'module_id',
        'can_read',
        'can_create',
        'can_update',
        'can_delete',
        'can_approve',
        'can_bulk_approve',
        'can_bulk_delete',
        'created_by',
        'module_group_id',
    ];

    public $timestamps = true;

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function module()
    {
        return $this->belongsTo(Module::class, 'module_id');
    }
}
