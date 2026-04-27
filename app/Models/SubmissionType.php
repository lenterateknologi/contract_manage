<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SubmissionType extends Model
{
    protected $table = 'm_submission_types';

    use HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'is_active',
        'created_by',
        'updated_by',
    ];
}
