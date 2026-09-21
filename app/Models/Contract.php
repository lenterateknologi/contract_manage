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
use Illuminate\Support\Str;

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

        if (($field === null || $field === 'id') && ! Str::isUuid($id)) {
            return null;
        }

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
        'is_in_sub_workflow',
        'branch_step_number',
        'current_step_number',
        'current_sub_workflow_id',
        'workflow_iteration',
        'workflow_step_id',
        'metadata',
        'submitted_at',
        'initiated_by_id',

        'vendor_id',
        'parent_id',
        'assigned_pic_id',
        'assigned_by_id',
        'received_at',
        'assigned_at',
        'finished_at',
        'closed_at',
        'closed_by',
        'tax_required',

        // Meta columns transparently handled by HasContractMeta
        'kop_topik', 'kop_sub_topik', 'kop_lampiran', 'f1_tujuan', 'f1_sifat',
        'p1_entity', 'p1_signer', 'p1_signer_position', 'p1_address', 'p1_contact_person',
        'p1_email', 'p1_phone', 'p2_entity', 'p2_signer', 'p2_signer_position', 'p2_address', 'p2_contact_person',
        'p2_email', 'p2_phone', 'f1_name', 'f1_start_date', 'f1_end_date',
        'f2_scope', 'f2_price', 'f2_payment', 'f2_tenure', 'f2_location',
        'f2_payment_terms', 'f3_penalties', 'f3_insurance',
        'f4_special_conditions', 'f4_guarantees',
    ];

    protected $casts = [
        'metadata' => 'array',
        'is_in_sub_workflow' => 'boolean',
        'branch_step_number' => 'integer',
        'current_step_number' => 'integer',
        'workflow_iteration' => 'integer',
        'submitted_at' => 'datetime',
        'received_at' => 'datetime',
        'assigned_at' => 'datetime',
        'finished_at' => 'datetime',
        'closed_at' => 'datetime',
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

    public function originWorkflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class, 'origin_workflow_id');
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

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(ContractPurchaseOrder::class, 'contract_id')->latest();
    }

    public function docReviews(): HasMany
    {
        return $this->hasMany(SubmissionReview::class, 'submission_id')->latest();
    }

    public function submissionReviews(): HasMany
    {
        return $this->hasMany(SubmissionReview::class, 'submission_id')->latest();
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

    public function getTaxRequiredAttribute(): ?bool
    {
        if (array_key_exists('tax_required', $this->attributes) && $this->attributes['tax_required'] !== null) {
            return (bool) $this->attributes['tax_required'];
        }

        $tax = $this->metadata['tax_required'] ?? ($this->metadata['meta_tax_required'] ?? null);
        if ($tax === null) {
            return false;
        }

        return ($tax === true || $tax === '1' || $tax === 1 || $tax === 'Ya' || $tax === 'ya' || $tax === 'true');
    }

    public function setTaxRequiredAttribute($value): void
    {
        $metadata = $this->metadata ?? [];
        $isTax = ($value === true || $value === '1' || $value === 1 || $value === 'Ya' || $value === 'ya' || $value === 'true');
        $metadata['tax_required'] = $isTax;
        $metadata['meta_tax_required'] = $isTax ? 'Ya' : 'Tidak';
        $this->metadata = $metadata;
    }

    public function scopeArchived($query)
    {
        return $query->where(function ($q) {
            $q->whereRaw('UPPER(status) = ?', ['ARCHIVED'])
                ->orWhereNotNull('closed_at');
        });
    }

    public function scopeNotArchived($query)
    {
        return $query->where(function ($q) {
            $q->whereRaw('UPPER(status) != ?', ['ARCHIVED'])
                ->whereNull('closed_at');
        });
    }

    public function meta(): HasOne
    {
        return $this->hasOne(ContractMeta::class, 'contract_id', 'id');
    }
}
