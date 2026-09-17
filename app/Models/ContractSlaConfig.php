<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContractSlaConfig extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'm_contract_sla_configs';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'contract_type_id',
        'workflow_id',
        'name',
        'topic',
        'priority',
        'sla_drafting_hours',
        'sla_review_hours',
        'sla_total_hours',
        'sla_start_hour',
        'sla_cutoff_hour',
        'sla_stages',
        'working_days',
        'warning_threshold_percent',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'sla_drafting_hours' => 'integer',
        'sla_review_hours' => 'integer',
        'sla_total_hours' => 'integer',
        'sla_start_hour' => 'integer',
        'sla_cutoff_hour' => 'integer',
        'sla_stages' => 'array',
        'working_days' => 'array',
        'warning_threshold_percent' => 'integer',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saving(function ($model) {
            if (is_array($model->sla_stages) && count($model->sla_stages) > 0) {
                $totalH = 0;
                foreach ($model->sla_stages as $st) {
                    $isActive = $st['is_active'] ?? true;
                    if ($isActive !== false && $isActive !== 0 && $isActive !== '0' && $isActive !== 'false') {
                        $totalH += (int) ($st['duration_hours'] ?? ($st['hours'] ?? 0));
                    }
                }
                if ($totalH > 0) {
                    $model->sla_total_hours = $totalH;
                }
            }
        });
    }

    protected $appends = [
        'sla_drafting_formatted',
        'sla_total_formatted',
        'sla_cutoff_formatted',
        'sla_working_hours_formatted',
    ];

    public function getSlaDraftingFormattedAttribute(): string
    {
        $hours = $this->sla_drafting_hours ?? 0;
        $days = round($hours / 24, 1);
        $daysClean = ($days == (int) $days) ? (int) $days : $days;
        return "{$daysClean} Hari ({$hours} Jam)";
    }

    public function getSlaTotalFormattedAttribute(): string
    {
        $hours = $this->sla_total_hours ?? 0;
        if (is_array($this->sla_stages) && count($this->sla_stages) > 0) {
            $calcHours = 0;
            foreach ($this->sla_stages as $st) {
                $calcHours += (int) ($st['duration_hours'] ?? ($st['hours'] ?? 0));
            }
            if ($calcHours > 0) {
                $hours = $calcHours;
            }
        }
        $days = round($hours / 24, 1);
        $daysClean = ($days == (int) $days) ? (int) $days : $days;
        return "{$daysClean} Hari ({$hours} Jam)";
    }

    public function getSlaCutoffFormattedAttribute(): string
    {
        $hour = $this->sla_cutoff_hour ?? 16;
        return sprintf('%02d:00 WIB', $hour);
    }

    public function getSlaWorkingHoursFormattedAttribute(): string
    {
        $start = $this->sla_start_hour ?? 8;
        $cutoff = $this->sla_cutoff_hour ?? 16;
        return sprintf('%02d:00 - %02d:00 WIB', $start, $cutoff);
    }

    public function contractType(): BelongsTo
    {
        return $this->belongsTo(ContractType::class, 'contract_type_id');
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class, 'workflow_id');
    }

    public function stepItems(): HasMany
    {
        return $this->hasMany(ContractSlaStepItem::class, 'sla_config_id');
    }
}
