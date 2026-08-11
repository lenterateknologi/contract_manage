<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class WorkflowStepPreset extends Model
{
    use HasUuids;

    protected $table = 'm_workflow_step_presets';

    protected $fillable = [
        'name',
        'step_data',
        'created_by_user_id',
    ];

    protected $casts = [
        'step_data' => 'array',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
