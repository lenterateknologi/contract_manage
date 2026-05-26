<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoleModuleGroup extends Model
{
    use HasFactory;

    protected $table = 'm_role_module_groups';

    protected $fillable = [
        'role_id',
        'module_group_id',
        'sequence',
    ];

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function moduleGroup()
    {
        return $this->belongsTo(ModuleGroup::class, 'module_group_id');
    }
}
