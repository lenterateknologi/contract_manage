<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * @property string $id
 * @property string $name
 * @property string $email
 * @property string|null $email_verified_at
 * @property string $password
 * @property string|null $initials
 * @property string|null $role
 * @property string|null $position
 * @property string|null $bio
 * @property string|null $phone
 * @property string|null $bg_color
 * @property string|null $text_color
 * @property string|null $username
 * @property string|null $role_id
 * @property string|null $department_id
 * @property string|null $company_id
 * @property bool $is_active
 * @property-read bool $is_admin
 * @property string|null $remember_token
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 * @property \Carbon\Carbon|null $deleted_at
 * @property-read Role|null $roleRelation
 * @property-read Department|null $department
 * @property-read Company|null $company
 * @property-read \Illuminate\Database\Eloquent\Collection<int, WorkflowStep> $workflowSteps
 */
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
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
        'initials',
        'role',
        'position',
        'bio',
        'phone',
        'bg_color',
        'text_color',
        'username',
        'role_id',
        'department_id',
        'company_id',
        'is_active',
    ];

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
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Role, User>
     */
    public function role(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Department, User>
     */
    public function department(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Company, User>
     */
    public function company(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<WorkflowStep, User>
     */
    public function workflowSteps(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(WorkflowStep::class, 't_workflow_step_users')->withTimestamps();
    }

    public function getIsAdminAttribute(): bool
    {
        return in_array($this->role, ['Admin', 'Super Admin']);
    }
}
