<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Carbon\Carbon;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * @property string $id
 * @property string $name
 * @property string $email
 * @property string|null $email_verified_at
 * @property string $password
 * @property string|null $phone_number
 * @property string|null $username
 * @property string|null $role_id
 * @property string|null $department_id
 * @property string|null $company_id
 * @property bool $is_active
 * @property-read bool $is_admin
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property-read Role|null $roleRelation
 * @property-read Department|null $department
 * @property-read Company|null $company
 * @property-read Collection<int, WorkflowStep> $workflowSteps
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasUuids, Notifiable, SoftDeletes;

    protected $table = 'm_users';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone_number',
        'username',
        'role_id',
        'department_id',
        'is_active',
        'company_id',
        'spv_id',
        'code',
        'company_group_id',
        'division_id',
        'login_status',
        'last_login',
        'last_connected',
        'address',
        'birth_date',
        'gender',
        'created_by',
        'updated_by',
        'is_verified',
        'verified_by',
        'verified_at',
        'job_position_id',
        'job_level_id',
        'image_src',
        'location_id',
        'region_id',
        'is_employee',
        'id_employee_portal_master',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $with = ['roleRelation'];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'initials',
        'role',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Role, User>
     */
    public function roleRelation(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    /**
     * Get the user's role name.
     */
    public function getRoleAttribute(): ?string
    {
        return $this->roleRelation?->name;
    }

    /**
     * @return BelongsTo<Company, User>
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    /**
     * @return BelongsTo<CompanyGroup, User>
     */
    public function companyGroup(): BelongsTo
    {
        return $this->belongsTo(CompanyGroup::class, 'company_group_id');
    }

    /**
     * @return BelongsTo<Division, User>
     */
    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class, 'division_id');
    }

    /**
     * @return BelongsTo<Region, User>
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'region_id');
    }

    /**
     * @return BelongsToMany<WorkflowStep, User>
     */
    public function workflowSteps(): BelongsToMany
    {
        return $this->belongsToMany(WorkflowStep::class, 't_workflow_step_users')->withTimestamps();
    }

    public function getIsAdminAttribute(): bool
    {
        return in_array($this->role, ['Admin', 'Super Admin']);
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, ['Admin', 'Super Admin']);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'Super Admin';
    }

    public function getInitialsAttribute(): string
    {
        $name = $this->name ?? '';
        $words = explode(' ', trim($name));
        if (count($words) >= 2) {
            return strtoupper(substr($words[0], 0, 1).substr($words[1], 0, 1));
        }

        return strtoupper(substr($name, 0, 2));
    }
}
