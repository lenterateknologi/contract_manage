<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoleModuleGroup extends Model
{
    use HasFactory;

    protected $table = 'role_module_groups';

    public $incrementing = false;

    protected $primaryKey = ['role_id', 'module_group_id'];

    protected $keyType = 'string';

    protected $fillable = [
        'role_id',
        'module_group_id',
        'sort_number',
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
