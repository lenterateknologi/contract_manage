<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HttpLog extends Model
{
    protected $connection = 'log';

    protected $table = 't_http_log';

    protected $fillable = [
        'id',
        'method',
        'full_url',
        'domain',
        'path',
        'path_index',
        'title',
        'ip',
        'header',
        'file',
        'body',
        'user_id',
        'created_at',
    ];

    public $timestamps = false; // since created_at is manually set

    // Assuming id is not auto-increment, perhaps generate it
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = now()->getTimestampMs(); // or some unique id
            }
        });
    }
}
