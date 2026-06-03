<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * App\Models\Contract
 *
 * @property string $id
 * @property string|null $contract_no
 * @property string|null $crown_no
 * @property string|null $title
 * @property string|null $description
 * @property \Carbon\Carbon|null $contract_date
 * @property \Carbon\Carbon|null $end_date
 * @property string|null $contract_type_id
 * @property string|null $contract_type_parent_id
 * @property string|null $submission_type_id
 * @property string|null $transaction_type
 * @property string|null $status
 * @property bool $is_digital_signature
 * @property string|null $created_by
 * @property int $current_version
 * @property string|null $workflow_id
 * @property string|null $origin_workflow_id
 * @property string|null $workflow_step_id
 * @property array|null $metadata
 * @property \Carbon\Carbon|null $submitted_at
 * @property string|null $initiated_by_id
 * @property string|null $vendor_id
 * @property string|null $parent_id
 * @property string|null $assigned_pic_id
 * @property string|null $assigned_by_id
 * @property string|null $p1_entity
 * @property string|null $p1_signer
 * @property string|null $p1_signer_position
 * @property string|null $p1_address
 * @property string|null $p2_entity
 * @property string|null $p2_signer
 * @property string|null $p2_signer_position
 * @property string|null $p2_address
 * @property string|null $kop_topik
 * @property string|null $kop_sub_topik
 * @property string|null $kop_lampiran
 * @property string|null $f1_tujuan
 * @property string|null $f1_sifat
 * @property string|null $f2_scope
 * @property string|null $f2_price
 * @property string|null $f2_payment
 * @property string|null $f2_tenure
 * @property string|null $f2_location
 * @property-read ContractType|null $contractType
 * @property-read ContractType|null $contractTypeParent
 * @property-read SubmissionType|null $submissionType
 * @property-read ContractStatus|null $statusDetail
 * @property-read \Illuminate\Database\Eloquent\Collection|ContractAttachment[] $attachments
 * @property-read User|null $creator
 * @property-read User $initiator
 * @property-read \Illuminate\Database\Eloquent\Collection|ContractVersion[] $versions
 * @property-read \Illuminate\Database\Eloquent\Collection|Approval[] $approvals
 * @property-read \Illuminate\Database\Eloquent\Collection|ContractHistory[] $histories
 * @property-read \Illuminate\Database\Eloquent\Collection|ContractMessage[] $messages
 * @property-read \Illuminate\Database\Eloquent\Collection|ContractFormSubmission[] $formSubmissions
 * @property-read Workflow|null $workflow
 * @property-read WorkflowStep|null $workflowStep
 * @property-read Vendor|null $vendor
 * @property-read Contract|null $parent
 * @property-read User|null $assignedPic
 * @property-read User|null $assignedBy
 * @property-read ContractMeta|null $meta
 */
class Contract extends Model
{
    protected $table = 't_contracts';

    use HasFactory, HasUuids, SoftDeletes;

    protected $with = ['meta'];

    protected $appends = [
        'kop_topik',
        'kop_sub_topik',
        'kop_lampiran',
        'f1_tujuan',
        'f1_sifat',
        'p1_entity',
        'p1_signer',
        'p1_signer_position',
        'p1_address',
        'p2_entity',
        'p2_signer',
        'p2_signer_position',
        'p2_address',
        'f2_scope',
        'f2_price',
        'f2_payment',
        'f2_tenure',
        'f2_location',
    ];

    protected static $metaColumns = [
        'kop_topik',
        'kop_sub_topik',
        'kop_lampiran',
        'f1_tujuan',
        'f1_sifat',
        'p1_entity',
        'p1_signer',
        'p1_signer_position',
        'p1_address',
        'p2_entity',
        'p2_signer',
        'p2_signer_position',
        'p2_address',
        'f2_scope',
        'f2_price',
        'f2_payment',
        'f2_tenure',
        'f2_location',
    ];

    protected $fillable = [
        'contract_no',
        'crown_no',
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
        // F1 & F2 Template Fields
        'kop_topik',
        'kop_sub_topik',
        'kop_lampiran',
        'f1_tujuan',
        'f1_sifat',
        'p1_entity',
        'p1_signer',
        'p1_signer_position',
        'p1_address',
        'p2_entity',
        'p2_signer',
        'p2_signer_position',
        'p2_address',
        'f2_scope',
        'f2_price',
        'f2_payment',
        'f2_tenure',
        'f2_location',
        'vendor_id',
        'parent_id',
        'assigned_pic_id',
        'assigned_by_id',
    ];

    protected $casts = [
        'metadata' => 'array',
        'submitted_at' => 'datetime',
        'contract_date' => 'date',
        'end_date' => 'date',
    ];

    /**
     * @return BelongsTo<ContractType, Contract>
     */
    public function contractType(): BelongsTo
    {
        return $this->belongsTo(ContractType::class, 'contract_type_id');
    }

    /**
     * @return BelongsTo<ContractType, $this>
     */
    public function contractTypeParent(): BelongsTo
    {
        return $this->belongsTo(ContractType::class, 'contract_type_parent_id');
    }

    /**
     * @return BelongsTo<SubmissionType, $this>
     */
    public function submissionType(): BelongsTo
    {
        return $this->belongsTo(SubmissionType::class, 'submission_type_id');
    }

    /**
     * @return BelongsTo<ContractStatus, $this>
     */
    public function statusDetail(): BelongsTo
    {
        return $this->belongsTo(ContractStatus::class, 'status', 'code');
    }

    /**
     * @return HasMany<ContractAttachment, $this>
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(ContractAttachment::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function initiator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by_id')->withDefault(function ($user, $contract) {
            return $contract->creator;
        });
    }

    /**
     * @return HasMany<ContractVersion, $this>
     */
    public function versions(): HasMany
    {
        return $this->hasMany(ContractVersion::class);
    }

    /**
     * @return HasMany<Approval, $this>
     */
    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class);
    }

    /**
     * @return HasMany<ContractHistory, $this>
     */
    public function histories(): HasMany
    {
        return $this->hasMany(ContractHistory::class)->orderBy('created_at');
    }

    /**
     * @return HasMany<ContractMessage, $this>
     */
    public function messages(): HasMany
    {
        return $this->hasMany(ContractMessage::class)->orderBy('created_at');
    }

    /**
     * @return HasMany<ContractFormSubmission, $this>
     */
    public function formSubmissions(): HasMany
    {
        return $this->hasMany(ContractFormSubmission::class);
    }

    /**
     * @return BelongsTo<Workflow, $this>
     */
    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    /**
     * @return BelongsTo<WorkflowStep, $this>
     */
    public function workflowStep(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class);
    }

    /**
     * @return BelongsTo<Vendor, $this>
     */
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }

    /**
     * @return BelongsTo<Contract, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Contract::class, 'parent_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function assignedPic(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_pic_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
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
            $steps = $this->workflow->steps ?? collect();
            $total = $steps->count();

            // A step is done if all approvals for that step are 'approved'
            $doneCount = 0;
            foreach ($steps as $step) {
                $approvals = $this->approvals()->where('workflow_step_id', $step->id)->get();
                if ($approvals->isNotEmpty() && $approvals->every(function ($a) {
                    /** @var Approval $a */
                    return $a->status === 'approved';
                })) {
                    $doneCount++;
                }
            }

            $pct = $total > 0 ? round(($doneCount / $total) * 100) : 0;

            return ['done' => $doneCount, 'total' => $total, 'pct' => $pct];
        }

        return ['done' => 0, 'total' => 0, 'pct' => 0];
    }

    public function getKopTopikAttribute(): ?string
    {
        return $this->meta?->kop_topik;
    }

    public function getKopSubTopikAttribute(): ?string
    {
        return $this->meta?->kop_sub_topik;
    }

    public function getKopLampiranAttribute(): ?string
    {
        return $this->meta?->kop_lampiran;
    }

    public function getF1TujuanAttribute(): ?string
    {
        return $this->meta?->f1_tujuan;
    }

    public function getF1SifatAttribute(): ?string
    {
        return $this->meta?->f1_sifat;
    }

    public function getP1EntityAttribute(): ?string
    {
        return $this->meta?->p1_entity;
    }

    public function getP1SignerAttribute(): ?string
    {
        return $this->meta?->p1_signer;
    }

    public function getP1SignerPositionAttribute(): ?string
    {
        return $this->meta?->p1_signer_position;
    }

    public function getP1AddressAttribute(): ?string
    {
        return $this->meta?->p1_address;
    }

    public function getP2EntityAttribute(): ?string
    {
        return $this->meta?->p2_entity;
    }

    public function getP2SignerAttribute(): ?string
    {
        return $this->meta?->p2_signer;
    }

    public function getP2SignerPositionAttribute(): ?string
    {
        return $this->meta?->p2_signer_position;
    }

    public function getP2AddressAttribute(): ?string
    {
        return $this->meta?->p2_address;
    }

    public function getF2ScopeAttribute(): ?string
    {
        return $this->meta?->f2_scope;
    }

    public function getF2PriceAttribute(): ?string
    {
        return $this->meta?->f2_price;
    }

    public function getF2PaymentAttribute(): ?string
    {
        return $this->meta?->f2_payment;
    }

    public function getF2TenureAttribute(): ?string
    {
        return $this->meta?->f2_tenure;
    }

    public function getF2LocationAttribute(): ?string
    {
        return $this->meta?->f2_location;
    }

    /**
     * Boot the model.
     */
    protected static function booted(): void
    {
        static::saved(function (self $contract) {
            if ($contract->relationLoaded('meta') && $contract->meta) {
                $meta = $contract->meta;
                $meta->contract_id = $contract->id;
                $meta->save();
            }
        });
    }

    /**
     * Get the metadata relationship.
     */
    public function meta(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(ContractMeta::class, 'contract_id', 'id');
    }

    /**
     * Override getAttribute to transparently fetch from meta relation.
     */
    public function getAttribute($key)
    {
        if (in_array($key, static::$metaColumns)) {
            if ($this->relationLoaded('meta')) {
                return $this->meta ? $this->meta->{$key} : null;
            }

            $meta = $this->meta;

            return $meta ? $meta->{$key} : null;
        }

        return parent::getAttribute($key);
    }

    /**
     * Override setAttribute to transparently set into meta relation.
     */
    public function setAttribute($key, $value)
    {
        if (in_array($key, static::$metaColumns)) {
            $meta = $this->meta;
            if (! $meta) {
                $meta = new ContractMeta();
                if ($this->exists) {
                    $meta->contract_id = $this->id;
                }
                $this->setRelation('meta', $meta);
            }

            $meta->{$key} = $value;

            return $this;
        }

        return parent::setAttribute($key, $value);
    }

    /**
     * Mutate an attribute for an array.
     */
    protected function mutateAttributeForArray($key, $value)
    {
        if (in_array($key, static::$metaColumns)) {
            return $this->getAttribute($key);
        }

        return parent::mutateAttributeForArray($key, $value);
    }
}
