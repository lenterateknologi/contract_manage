<?php

namespace App\Models;

use App\Services\Utils\ShortIdService;
use App\Traits\HasContractMeta;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Contract extends Model
{
    use HasContractMeta;

    protected $table = 't_contracts';

    use HasFactory, HasUuids, SoftDeletes;

    protected static function booted(): void
    {
        static::saved(fn () => static::refreshMaterializedView());
        static::deleted(fn () => static::refreshMaterializedView());
        static::restored(fn () => static::refreshMaterializedView());
    }

    public static function refreshMaterializedView(): void
    {
        // ponytail: Refresh materialized view concurrently for the dashboard data.
        // In SQLite (used for testing), we use a normal VIEW which updates automatically,
        // so we don't need to (and can't) run the REFRESH command.
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        try {
            DB::statement('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_contracts');
        } catch (\Throwable $e) {
            DB::statement('REFRESH MATERIALIZED VIEW mv_dashboard_contracts');
        }
    }

    public function resolveRouteBinding($value, $field = null)
    {
        $id = ShortIdService::decode($value);

        return parent::resolveRouteBinding($id, $field);
    }

    public function getShortIdAttribute(): ?string
    {
        return ShortIdService::encode($this->id);
    }

    protected $with = ['meta'];

    protected $fillable = [
        'form_no',
        'contract_no',
        'title',
        'description',
        'contract_date',
        'end_date',
        'contract_type_id',
        'contract_type_parent_id',
        'submission_type_id',
        'transaction_type',
        'status',
        'is_digital_signature',
        'created_by',
        'current_version',
        'workflow_id',
        'origin_workflow_id',
        'workflow_step_id',
        'metadata',
        'submitted_at',
        'initiated_by_id',

        'vendor_id',
        'parent_id',
        'assigned_pic_id',
        'assigned_by_id',

        // Meta columns transparently handled by HasContractMeta
        'kop_topik', 'kop_sub_topik', 'p1_entity', 'p1_address', 'p1_contact_person',
        'p1_email', 'p1_phone', 'p2_entity', 'p2_address', 'p2_contact_person',
        'p2_email', 'p2_phone', 'f1_name', 'f1_start_date', 'f1_end_date',
        'f2_price', 'f2_payment_terms', 'f3_penalties', 'f3_insurance',
        'f4_special_conditions', 'f4_guarantees',
    ];

    protected $casts = [
        'metadata' => 'array',
        'submitted_at' => 'datetime',
        'contract_date' => 'date',
        'end_date' => 'date',
    ];

    public function contractType(): BelongsTo
    {
        return $this->belongsTo(ContractType::class, 'contract_type_id');
    }

    public function contractTypeParent(): BelongsTo
    {
        return $this->belongsTo(ContractType::class, 'contract_type_parent_id');
    }

    public function submissionType(): BelongsTo
    {
        return $this->belongsTo(SubmissionType::class, 'submission_type_id');
    }

    public function statusDetail(): BelongsTo
    {
        return $this->belongsTo(ContractStatus::class, 'status', 'code');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(ContractAttachment::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function initiator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by_id')->withDefault(function ($user, $contract) {
            if ($contract->relationLoaded('creator')) {
                return $contract->creator;
            }

            return User::find($contract->created_by);
        });
    }

    public function versions(): HasMany
    {
        return $this->hasMany(ContractVersion::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(ContractHistory::class)->orderBy('created_at');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ContractMessage::class)->orderBy('created_at');
    }

    public function formSubmissions(): HasMany
    {
        return $this->hasMany(FormSubmission::class);
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function workflowStep(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Contract::class, 'parent_id');
    }

    public function assignedPic(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_pic_id');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by_id');
    }

    public function currentVersionModel(): ?ContractVersion
    {
        $version = $this->versions()->where('version_no', $this->current_version)->first();

        return $version instanceof ContractVersion ? $version : null;
    }

    public function pendingApproval()
    {
        return $this->approvals()->where('status', 'pending')->first();
    }

    public function progressData(): array
    {
        if ($this->workflow_id) {
            $steps = $this->workflow ? $this->workflow->loadMissing('steps')->steps : collect();
            $total = $steps->count();

            $doneCount = 0;
            foreach ($steps as $step) {
                $approvals = $this->approvals()->where('workflow_step_id', $step->id)->get();
                $isDone = $approvals->isNotEmpty() && $approvals->every(function ($a) {
                    return $a->status === 'approved';
                });
                if ($isDone) {
                    $doneCount++;
                }
            }

            $pct = $total > 0 ? round(($doneCount / $total) * 100) : 0;

            return ['done' => $doneCount, 'total' => $total, 'pct' => $pct];
        }

        return ['done' => 0, 'total' => 0, 'pct' => 0];
    }

    public function meta(): HasOne
    {
        return $this->hasOne(ContractMeta::class, 'contract_id', 'id');
    }
}
