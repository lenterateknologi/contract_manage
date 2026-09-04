<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Role extends Model
{
    protected $table = 'm_roles';

    use SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'company_id',
        'contract_filter_template_id',
        'dashboard_type_id',
        'name',
        'description',
        'can_create_on_behalf',
    ];

    protected $casts = [
        'can_create_on_behalf' => 'boolean',
    ];

    public function contractFilterTemplate()
    {
        return $this->belongsTo(ContractFilterTemplate::class, 'contract_filter_template_id');
    }

    public function dashboardType()
    {
        return $this->belongsTo(DashboardType::class, 'dashboard_type_id');
    }

    public function getContractFilterSettings(): array
    {
        $templateId = $this->contract_filter_template_id;
        if ($templateId) {
            $template = ContractFilterTemplate::find($templateId);
            if ($template) {
                return [
                    'can_change_company_group' => (bool) $template->can_change_company_group,
                    'allowed_company_groups' => (array) ($template->allowed_company_groups ?? []),
                    'can_change_region' => (bool) $template->can_change_region,
                    'allowed_regions' => (array) ($template->allowed_regions ?? []),
                    'can_change_company' => (bool) $template->can_change_company,
                    'allowed_companies' => (array) ($template->allowed_companies ?? []),
                    'can_change_division' => (bool) $template->can_change_division,
                    'allowed_divisions' => (array) ($template->allowed_divisions ?? []),
                    'can_change_department' => (bool) $template->can_change_department,
                    'allowed_departments' => (array) ($template->allowed_departments ?? []),
                ];
            }
        }

        return [
            'can_change_company_group' => false,
            'allowed_company_groups' => [],
            'can_change_region' => false,
            'allowed_regions' => [],
            'can_change_company' => false,
            'allowed_companies' => [],
            'can_change_division' => false,
            'allowed_divisions' => [],
            'can_change_department' => false,
            'allowed_departments' => [],
        ];
    }

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
