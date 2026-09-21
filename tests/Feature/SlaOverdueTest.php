<?php

use App\Mail\ContractSlaOverdueMail;
use App\Models\Approval;
use App\Models\Authority;
use App\Models\Contract;
use App\Models\ContractSlaConfig;
use App\Models\ContractType;
use App\Models\Role;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use Carbon\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    $this->withoutMiddleware();

    $this->type = ContractType::create([
        'code' => 'SLA-TEST-TYPE',
        'name' => 'SLA Test Contract Type',
        'is_active' => true,
    ]);

    $this->roleStaff = Role::firstOrCreate(['name' => 'Staff']);
    $this->roleManager = Role::firstOrCreate(['name' => 'Manager']);
    $this->roleLegal = Role::firstOrCreate(['name' => 'Legal']);

    $this->initiator = User::factory()->create(['role_id' => $this->roleStaff->id, 'email' => 'initiator@example.com']);
    $this->approver = User::factory()->create(['role_id' => $this->roleManager->id, 'email' => 'approver@example.com']);
    $this->notifRecipient = User::factory()->create(['role_id' => $this->roleLegal->id, 'email' => 'legal@example.com']);

    $this->slaConfig = ContractSlaConfig::create([
        'contract_type_id' => $this->type->id,
        'topic' => 'perjanjian',
        'sla_drafting_hours' => 24,
        'sla_total_hours' => 72,
        'sla_stages' => [
            'in_review' => 8,
            'signing' => 16,
        ],
        'is_active' => true,
    ]);

    // Setup overdue authority for this SLA config targeting Legal role
    Authority::create([
        'context_type' => Authority::CONTEXT_SLA_OVERDUE,
        'context_id' => $this->slaConfig->id,
        'role_id' => $this->roleLegal->id,
        'authority_type' => 'role',
        'is_active' => true,
    ]);

    $this->workflow = Workflow::create([
        'name' => 'SLA Test Workflow',
        'contract_type_id' => $this->type->id,
        'initiator_type' => 'all',
        'is_active' => true,
    ]);

    $this->step1 = WorkflowStep::create([
        'workflow_id' => $this->workflow->id,
        'step' => 1,
        'description' => 'Drafting',
        'approver_type' => 'initiator',
        'step_category' => 'drafting',
    ]);

    $this->step2 = WorkflowStep::create([
        'workflow_id' => $this->workflow->id,
        'step' => 2,
        'description' => 'Review',
        'approver_type' => 'role',
        'step_category' => 'review',
        'meta' => ['target_status' => 'in_review'],
    ]);
    $this->step2->approverAuthorities()->create([
        'role_id' => $this->roleManager->id,
        'authority_type' => 'role',
    ]);

    $this->step1->actions()->create([
        'action_code' => 'approve',
        'alias' => 'Submit',
        'target_status' => 'in_review',
        'next_step_id' => $this->step2->id,
        'is_active' => true,
    ]);
});

test('it calculates stage sla when contract is sent for approval', function () {
    $contract = Contract::create([
        'title' => 'SLA Tracking Test Contract',
        'form_no' => 'CTR-SLA-001',
        'contract_type_id' => $this->type->id,
        'created_by' => $this->initiator->id,
        'initiated_by_id' => $this->initiator->id,
        'status' => 'draft',
    ]);

    $this->actingAs($this->initiator);
    $response = $this->postJson("/api/contracts/{$contract->id}/send", [
        'workflow_id' => $this->workflow->id,
    ]);
    $response->assertSuccessful();

    $contract = $contract->fresh();
    expect($contract->status)->toBe('in_review');
    expect($contract->sla_config_id)->toBe($this->slaConfig->id);
    expect($contract->stage_sla_hours)->toBe(8);
    expect($contract->sla_due_at)->not->toBeNull();
    expect($contract->current_stage_due_at)->not->toBeNull();
    expect($contract->sla_status)->toBe('on_track');

    $approval = Approval::where('contract_id', $contract->id)->where('status', 'pending')->first();
    expect($approval)->not->toBeNull();
    expect($approval->sla_hours)->toBe(8);
    expect($approval->due_at)->not->toBeNull();
    expect($approval->is_overdue)->toBeFalse();
});

test('it marks contracts as overdue and sends notifications via authority context', function () {
    Mail::fake();

    $contract = Contract::create([
        'title' => 'Overdue Test Contract',
        'form_no' => 'CTR-SLA-002',
        'contract_type_id' => $this->type->id,
        'created_by' => $this->initiator->id,
        'initiated_by_id' => $this->initiator->id,
        'status' => 'draft',
    ]);

    $this->actingAs($this->initiator);
    $this->postJson("/api/contracts/{$contract->id}/send", [
        'workflow_id' => $this->workflow->id,
    ])->assertSuccessful();

    // Force stage and total SLA due date into the past
    $pastDate = Carbon::now()->subHours(5);
    $contract->update([
        'current_stage_due_at' => $pastDate,
        'sla_due_at' => $pastDate,
        'sla_status' => 'on_track',
        'overdue_notified_at' => null,
    ]);

    Approval::where('contract_id', $contract->id)->update([
        'due_at' => $pastDate,
        'is_overdue' => false,
        'overdue_notified_at' => null,
    ]);

    // Run scheduled command
    Artisan::call('sla:check-overdue');

    $contract = $contract->fresh();
    expect($contract->sla_status)->toBe('overdue');
    expect($contract->overdue_notified_at)->not->toBeNull();

    $approval = Approval::where('contract_id', $contract->id)->where('status', 'pending')->first();
    expect($approval->is_overdue)->toBeTrue();
    expect($approval->overdue_notified_at)->not->toBeNull();

    // Verify email was queued to Legal user configured in m_authorities
    Mail::assertQueued(ContractSlaOverdueMail::class, function ($mail) {
        return $mail->hasTo('legal@example.com');
    });
});
