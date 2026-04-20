<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ForgotPassword extends Model
{
    protected $table = 't_forgot_password';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'email',
        'user_id',
        'expire_at',
        'redeemed_at',
        'token',
    ];

    protected $casts = [
        'expire_at' => 'datetime',
        'redeemed_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return $this->expire_at->isPast();
    }

    public function isRedeemed(): bool
    {
        return !is_null($this->redeemed_at);
    }

    public function isValid(): bool
    {
        return !$this->isExpired() && !$this->isRedeemed();
    }

    public function markAsRedeemed(): void
    {
        $this->update(['redeemed_at' => now()]);
    }
}
