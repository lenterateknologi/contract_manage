<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AccessModule extends Model
{
    use HasFactory;

    protected $table = 'access_modules';

    protected $fillable = [
        'role_id',
        'module_id',
        'can_read',
        'can_create',
        'can_update',
        'can_delete',
        'created_by',
        'module_group_id',
        'sort_number',
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
