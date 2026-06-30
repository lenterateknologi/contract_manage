<?php

use App\Models\Approval;
use App\Models\Contract;
use App\Models\ContractType;
use App\Models\Role;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->withoutMiddleware();
    // Set up a basic contract type
    $this->type = ContractType::create([
        'code' => 'TEST-WF-ADHOC',
        'name' => 'Testing Adhoc Workflow Type',
        'is_active' => true,
    ]);

    // Set up users
    $this->creator = User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Staff'])->id]);
    $this->manager = User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Manager'])->id]);
    $this->vp = User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'VP'])->id]);
    $this->adhocUser = User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'VP'])->id]);

    // Set up a simple 2-step workflow
    $this->workflow = Workflow::create([
        'name' => 'Adhoc Test Workflow',
        'description' => 'Test workflow for ad-hoc approvals',
        'contract_type_id' => $this->type->id,
        'initiator_type' => 'all',
        'is_active' => true,
    ]);

    // Step 1: Initiator (Drafting)
    $this->step1 = WorkflowStep::create([
        'workflow_id' => $this->workflow->id,
        'step' => 1,
        'description' => 'Drafting Phase',
        'approver_type' => 'initiator',
        'step_category' => 'drafting',
    ]);

    // Step 2: Manager Approval (role-based)
    $this->step2 = WorkflowStep::create([
        'workflow_id' => $this->workflow->id,
        'step' => 2,
        'description' => 'Manager Approval',
        'approver_type' => 'role',
    ]);
    DB::table('m_workflow_step_roles')->insert([
        'id' => Str::uuid()->toString(),
        'workflow_step_id' => $this->step2->id,
        'role_name' => 'Manager',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Step 3: VP Approval (user-based)
    $this->step3 = WorkflowStep::create([
        'workflow_id' => $this->workflow->id,
        'step' => 3,
        'description' => 'VP Approval',
        'approver_type' => 'user',
    ]);
    DB::table('m_workflow_step_users')->insert([
        'id' => Str::uuid()->toString(),
        'workflow_step_id' => $this->step3->id,
        'user_id' => $this->vp->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Actions
    DB::table('m_workflow_step_actions')->insert([
        [
            'id' => Str::uuid()->toString(),
            'workflow_step_id' => $this->step1->id,
            'action_code' => 'approve',
            'next_step_id' => $this->step2->id,
            'is_active' => true,
        ],
        [
            'id' => Str::uuid()->toString(),
            'workflow_step_id' => $this->step2->id,
            'action_code' => 'approve',
            'next_step_id' => $this->step3->id,
            'is_active' => true,
        ],
        [
            'id' => Str::uuid()->toString(),
            'workflow_step_id' => $this->step3->id,
            'action_code' => 'approve',
            'next_step_id' => null, // End of workflow
            'is_active' => true,
        ],
    ]);
});

test('it can add adhoc approver during active review', function () {
    // 1. Create contract in draft
    $contract = Contract::create([
        'title' => 'Test Adhoc Approval Contract',
        'contract_no' => 'CTR-ADHOC-001',
        'contract_type_id' => $this->type->id,
        'created_by' => $this->creator->id,
        'initiated_by_id' => $this->creator->id,
        'status' => 'draft',
    ]);

    // 2. Send for approval (transitions to step 2 - Manager Approval)
    $this->actingAs($this->creator);
    $response = $this->postJson("/api/contracts/{$contract->id}/send", [
        'workflow_id' => $this->workflow->id,
    ]);
    $response->assertSuccessful();

    $contract = $contract->fresh();
    expect($contract->status)->toBe('in_review');
    expect($contract->workflow_step_id)->toBe($this->step2->id);

    // Verify a pending approval exists for manager
    $managerApproval = Approval::where('contract_id', $contract->id)
        ->where('workflow_step_id', $this->step2->id)
        ->where('user_id', $this->manager->id)
        ->first();
    expect($managerApproval)->not->toBeNull();
    expect($managerApproval->status)->toBe('pending');

    // 3. Add adhoc approver
    $responseAdhoc = $this->postJson("/api/contracts/{$contract->id}/add-approver", [
        'user_id' => $this->adhocUser->id,
        'note' => 'Please review this special clause',
    ]);
    $responseAdhoc->assertSuccessful();

    // Verify adhoc approval was created
    $this->assertDatabaseHas('t_approvals', [
        'contract_id' => $contract->id,
        'workflow_step_id' => $this->step2->id,
        'user_id' => $this->adhocUser->id,
        'role' => 'Persetujuan Tambahan',
        'status' => 'pending',
    ]);

    // Verify contract history logged the event
    $this->assertDatabaseHas('t_contract_h', [
        'contract_id' => $contract->id,
        'action' => 'ADHOC_APPROVER_ADDED',
    ]);
});

test('it prevents adding duplicate adhoc approver', function () {
    $contract = Contract::create([
        'title' => 'Test Adhoc Duplicate',
        'contract_no' => 'CTR-ADHOC-002',
        'contract_type_id' => $this->type->id,
        'created_by' => $this->creator->id,
        'initiated_by_id' => $this->creator->id,
        'status' => 'draft',
    ]);

    $this->actingAs($this->creator);
    $this->postJson("/api/contracts/{$contract->id}/send", [
        'workflow_id' => $this->workflow->id,
    ])->assertSuccessful();

    // Add first time
    $this->postJson("/api/contracts/{$contract->id}/add-approver", [
        'user_id' => $this->adhocUser->id,
    ])->assertSuccessful();

    // Add second time (should fail)
    $response = $this->postJson("/api/contracts/{$contract->id}/add-approver", [
        'user_id' => $this->adhocUser->id,
    ]);
    $response->assertStatus(422);
    expect($response->json('message'))->toContain('sudah terdaftar');
});

test('it can add multiple adhoc approvers at once', function () {
    $contract = Contract::create([
        'title' => 'Test Multiple Adhoc',
        'contract_no' => 'CTR-ADHOC-005',
        'contract_type_id' => $this->type->id,
        'created_by' => $this->creator->id,
        'initiated_by_id' => $this->creator->id,
        'status' => 'draft',
    ]);

    $this->actingAs($this->creator);
    $this->postJson("/api/contracts/{$contract->id}/send", [
        'workflow_id' => $this->workflow->id,
    ])->assertSuccessful();

    $anotherAdhocUser = User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'VP'])->id]);

    $response = $this->postJson("/api/contracts/{$contract->id}/add-approver", [
        'user_ids' => [$this->adhocUser->id, $anotherAdhocUser->id],
        'note' => 'Please both review',
    ]);
    $response->assertSuccessful();

    // Verify both approvals are in db
    $this->assertDatabaseHas('t_approvals', [
        'contract_id' => $contract->id,
        'user_id' => $this->adhocUser->id,
        'role' => 'Persetujuan Tambahan',
        'status' => 'pending',
    ]);
    $this->assertDatabaseHas('t_approvals', [
        'contract_id' => $contract->id,
        'user_id' => $anotherAdhocUser->id,
        'role' => 'Persetujuan Tambahan',
        'status' => 'pending',
    ]);
});

test('step does not advance until both regular and adhoc approvals are approved', function () {
    $contract = Contract::create([
        'title' => 'Test Adhoc Block',
        'contract_no' => 'CTR-ADHOC-003',
        'contract_type_id' => $this->type->id,
        'created_by' => $this->creator->id,
        'initiated_by_id' => $this->creator->id,
        'status' => 'draft',
    ]);

    $this->actingAs($this->creator);
    $this->postJson("/api/contracts/{$contract->id}/send", [
        'workflow_id' => $this->workflow->id,
    ])->assertSuccessful();

    // Add adhoc user
    $this->postJson("/api/contracts/{$contract->id}/add-approver", [
        'user_id' => $this->adhocUser->id,
    ])->assertSuccessful();

    // Approve as regular manager should FAIL first because they are waiting for ad-hoc approval
    $this->actingAs($this->manager);
    $this->postJson("/api/contracts/{$contract->id}/approve", [
        'note' => 'Approved by manager',
    ])->assertStatus(422);

    // Verify manager is indeed waiting
    $this->assertDatabaseHas('t_approvals', [
        'contract_id' => $contract->id,
        'workflow_step_id' => $this->step2->id,
        'user_id' => $this->manager->id,
        'status' => 'waiting',
    ]);

    // Verify adhoc is pending
    $this->assertDatabaseHas('t_approvals', [
        'contract_id' => $contract->id,
        'workflow_step_id' => $this->step2->id,
        'user_id' => $this->adhocUser->id,
        'status' => 'pending',
    ]);

    // Now, approve as adhoc user
    $this->actingAs($this->adhocUser);
    $this->postJson("/api/contracts/{$contract->id}/approve", [
        'note' => 'Approved by adhoc VP',
    ])->assertSuccessful();

    // Verify manager is now activated to pending
    $this->assertDatabaseHas('t_approvals', [
        'contract_id' => $contract->id,
        'workflow_step_id' => $this->step2->id,
        'user_id' => $this->manager->id,
        'status' => 'pending',
    ]);

    // Approve as regular manager now succeeds
    $this->actingAs($this->manager);
    $this->postJson("/api/contracts/{$contract->id}/approve", [
        'note' => 'Approved by manager',
    ])->assertSuccessful();

    // Verify contract has now advanced to step 3 (VP Approval)
    $contract = $contract->fresh();
    expect($contract->workflow_step_id)->toBe($this->step3->id);
});

test('rejecting adhoc approval sends contract back to revision', function () {
    $contract = Contract::create([
        'title' => 'Test Adhoc Reject',
        'contract_no' => 'CTR-ADHOC-004',
        'contract_type_id' => $this->type->id,
        'created_by' => $this->creator->id,
        'initiated_by_id' => $this->creator->id,
        'status' => 'draft',
    ]);

    $this->actingAs($this->creator);
    $this->postJson("/api/contracts/{$contract->id}/send", [
        'workflow_id' => $this->workflow->id,
    ])->assertSuccessful();

    // Add adhoc user
    $this->postJson("/api/contracts/{$contract->id}/add-approver", [
        'user_id' => $this->adhocUser->id,
    ])->assertSuccessful();

    // Reject as adhoc user
    $this->actingAs($this->adhocUser);
    $response = $this->postJson("/api/contracts/{$contract->id}/reject", [
        'reason' => 'Need to change section 4',
    ]);
    $response->assertSuccessful();

    // Verify contract is sent back to revision (step 1)
    $contract = $contract->fresh();
    expect($contract->status)->toBe('revision');
    expect($contract->workflow_step_id)->toBe($this->step1->id);

    // Verify adhoc approval is marked rejected
    $this->assertDatabaseHas('t_approvals', [
        'contract_id' => $contract->id,
        'workflow_step_id' => $this->step2->id,
        'user_id' => $this->adhocUser->id,
        'status' => 'rejected',
    ]);
});
