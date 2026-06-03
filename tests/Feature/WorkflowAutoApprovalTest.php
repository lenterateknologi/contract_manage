<?php

use App\Models\Approval;
use App\Models\Contract;
use App\Models\ContractType;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->withoutMiddleware();
    // Set up a basic contract type
    $this->type = ContractType::create([
        'code' => 'TEST-AUTO-APPROVE',
        'name' => 'Testing Auto Approve',
        'is_active' => true,
    ]);

    // Set up users
    $this->creator = User::factory()->create(['role' => 'Staff', 'name' => 'Creator User']);
    $this->manager = User::factory()->create(['role' => 'Manager', 'name' => 'Manager User']);

    // Set up a simple 2-step workflow
    $this->workflow = Workflow::create([
        'name' => 'Auto Approve Test Workflow',
        'description' => 'Test workflow for auto-approval',
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

    // Step 2: Same Creator (Auto-approve scenario if we didn't have the rule)
    // For this test, we'll manually assign the creator to Step 2 to test auto-approve for Step > 1
    $this->step2 = WorkflowStep::create([
        'workflow_id' => $this->workflow->id,
        'step' => 2,
        'description' => 'Self Review Phase',
        'approver_type' => 'user',
    ]);
    DB::table('m_workflow_step_users')->insert([
        'id' => Str::uuid()->toString(),
        'workflow_step_id' => $this->step2->id,
        'user_id' => $this->creator->id,
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
            'next_step_id' => null,
            'is_active' => true,
        ],
    ]);
});

test('it does not auto-approve step 1 even if the user is the initiator', function () {
    // 1. Create contract
    $contract = Contract::create([
        'title' => 'Test Step 1 Auto Approve',
        'contract_no' => 'CTR-AUTO-001',
        'contract_type_id' => $this->type->id,
        'created_by' => $this->creator->id,
        'initiated_by_id' => $this->creator->id,
        'status' => 'draft',
    ]);

    $this->actingAs($this->creator);

    // 2. Start workflow (submit=false, simulating creation flow)
    $contract = app(App\Services\ContractWorkflowService::class)->sendForApproval($contract, $this->workflow->id, null, false);

    $contract = $contract->fresh();

    // EXPECTATION: Step 1 should remain PENDING because of our fix in handleAutoApproval
    expect($contract->workflow_step_id)->toBe($this->step1->id);
    expect($contract->status)->toBe('draft');

    $approval = Approval::where('contract_id', $contract->id)
        ->where('workflow_step_id', $this->step1->id)
        ->where('user_id', $this->creator->id)
        ->first();

    expect($approval->status)->toBe('pending');
});

test('it still auto-approves step > 1 if the user is the same', function () {
    // 1. Create contract
    $contract = Contract::create([
        'title' => 'Test Step 2 Auto Approve',
        'contract_no' => 'CTR-AUTO-002',
        'contract_type_id' => $this->type->id,
        'created_by' => $this->creator->id,
        'initiated_by_id' => $this->creator->id,
        'status' => 'draft',
    ]);

    $this->actingAs($this->creator);

    // 2. Start workflow (Initial Step 1)
    app(App\Services\ContractWorkflowService::class)->sendForApproval($contract, $this->workflow->id, null, false);

    $contract = $contract->fresh();
    expect($contract->workflow_step_id)->toBe($this->step1->id);

    // 3. Manually approve Step 1
    $this->postJson("/api/contracts/{$contract->id}/approve", [
        'note' => 'Completing draft',
    ])->assertSuccessful();

    $contract = $contract->fresh();

    // EXPECTATION: Since Step 2 approver is ALSO $this->creator,
    // it should auto-approve Step 2 and finish the workflow.

    expect($contract->workflow_step_id)->toBeNull();
    expect($contract->status)->toBe('approved');

    // Verify Step 2 approval was auto-approved
    $this->assertDatabaseHas('t_approvals', [
        'contract_id' => $contract->id,
        'workflow_step_id' => $this->step2->id,
        'user_id' => $this->creator->id,
        'status' => 'approved',
        'comment' => 'Sistem Auto-Approve (Pemeriksa yang sama)',
    ]);
});

test('it supports sequential ad-hoc approvers', function () {
    $contract = Contract::create([
        'title' => 'Test Sequential Adhoc',
        'contract_no' => 'CTR-SEQ-001',
        'contract_type_id' => $this->type->id,
        'created_by' => $this->creator->id,
        'initiated_by_id' => $this->creator->id,
        'status' => 'draft',
    ]);

    $adhoc1 = User::factory()->create(['name' => 'Adhoc 1']);
    $adhoc2 = User::factory()->create(['name' => 'Adhoc 2']);

    $this->actingAs($this->creator);

    // 1. Send for approval
    app(App\Services\ContractWorkflowService::class)->sendForApproval($contract, $this->workflow->id, null, false);
    $contract = $contract->fresh();

    // 2. Add 2 sequential ad-hoc approvers
    $resp = $this->postJson("/api/contracts/{$contract->id}/add-approver", [
        'user_ids' => [$adhoc1->id, $adhoc2->id],
        'is_sequential' => true,
    ]);
    $resp->assertSuccessful();

    // Verify: adhoc1 should be PENDING, adhoc2 should be WAITING
    $this->assertDatabaseHas('t_approvals', [
        'contract_id' => $contract->id,
        'user_id' => $adhoc1->id,
        'status' => 'pending',
        'is_active' => true,
    ]);
    $this->assertDatabaseHas('t_approvals', [
        'contract_id' => $contract->id,
        'user_id' => $adhoc2->id,
        'status' => 'waiting',
        'is_active' => true,
    ]);

    // 3. Approve as adhoc1
    $this->actingAs($adhoc1);
    $this->postJson("/api/contracts/{$contract->id}/approve", ['note' => 'OK from 1'])->assertSuccessful();

    // Verify: adhoc2 should now be PENDING
    $this->assertDatabaseHas('t_approvals', [
        'contract_id' => $contract->id,
        'user_id' => $adhoc2->id,
        'status' => 'pending',
    ]);
});

test('it supports parallel ad-hoc approvers', function () {
    $contract = Contract::create([
        'title' => 'Test Parallel Adhoc',
        'contract_no' => 'CTR-PAR-001',
        'contract_type_id' => $this->type->id,
        'created_by' => $this->creator->id,
        'initiated_by_id' => $this->creator->id,
        'status' => 'draft',
    ]);

    $adhoc1 = User::factory()->create(['name' => 'Adhoc 1']);
    $adhoc2 = User::factory()->create(['name' => 'Adhoc 2']);

    $this->actingAs($this->creator);

    // 1. Send for approval
    app(App\Services\ContractWorkflowService::class)->sendForApproval($contract, $this->workflow->id, null, false);
    $contract = $contract->fresh();

    // 2. Add 2 parallel ad-hoc approvers (default)
    $this->postJson("/api/contracts/{$contract->id}/add-approver", [
        'user_ids' => [$adhoc1->id, $adhoc2->id],
        'is_sequential' => false,
    ])->assertSuccessful();

    // Verify: BOTH should be PENDING
    $this->assertDatabaseHas('t_approvals', [
        'contract_id' => $contract->id,
        'user_id' => $adhoc1->id,
        'status' => 'pending',
    ]);
    $this->assertDatabaseHas('t_approvals', [
        'contract_id' => $contract->id,
        'user_id' => $adhoc2->id,
        'status' => 'pending',
    ]);
});

test('it activates future step sequential ad-hoc approvals on transition', function () {
    $contract = Contract::create([
        'title' => 'Test Future Sequential Adhoc',
        'contract_no' => 'CTR-FUT-SEQ-001',
        'contract_type_id' => $this->type->id,
        'created_by' => $this->creator->id,
        'initiated_by_id' => $this->creator->id,
        'status' => 'draft',
    ]);

    $adhoc1 = User::factory()->create(['name' => 'Adhoc Future 1']);
    $adhoc2 = User::factory()->create(['name' => 'Adhoc Future 2']);

    $this->actingAs($this->creator);

    // 1. Send for approval (transitions to step 1)
    app(App\Services\ContractWorkflowService::class)->sendForApproval($contract, $this->workflow->id, null, false);
    $contract = $contract->fresh();

    // 2. Add 2 sequential ad-hoc approvers to step 2 (future step!)
    $resp = $this->postJson("/api/contracts/{$contract->id}/add-approver", [
        'user_ids' => [$adhoc1->id, $adhoc2->id],
        'is_sequential' => true,
        'target_step_id' => $this->step2->id,
    ]);
    $resp->assertSuccessful();

    // Verify they are initially waiting since step 2 is not active
    $this->assertDatabaseHas('t_approvals', [
        'contract_id' => $contract->id,
        'user_id' => $adhoc1->id,
        'workflow_step_id' => $this->step2->id,
        'status' => 'waiting',
    ]);
    $this->assertDatabaseHas('t_approvals', [
        'contract_id' => $contract->id,
        'user_id' => $adhoc2->id,
        'workflow_step_id' => $this->step2->id,
        'status' => 'waiting',
    ]);

    // 3. Approve step 1 to advance to step 2
    $this->actingAs($this->creator);
    $this->postJson("/api/contracts/{$contract->id}/approve", [
        'note' => 'Approving step 1',
    ])->assertSuccessful();

    // Verify contract is now at step 2
    $contract = $contract->fresh();
    expect($contract->workflow_step_id)->toBe($this->step2->id);

    // Verify: adhoc1 should be pending, adhoc2 should be waiting, and the regular step 2 approval (creator user) should be waiting
    $this->assertDatabaseHas('t_approvals', [
        'contract_id' => $contract->id,
        'user_id' => $adhoc1->id,
        'workflow_step_id' => $this->step2->id,
        'status' => 'pending',
    ]);
    $this->assertDatabaseHas('t_approvals', [
        'contract_id' => $contract->id,
        'user_id' => $adhoc2->id,
        'workflow_step_id' => $this->step2->id,
        'status' => 'waiting',
    ]);
    $this->assertDatabaseHas('t_approvals', [
        'contract_id' => $contract->id,
        'user_id' => $this->creator->id,
        'workflow_step_id' => $this->step2->id,
        'status' => 'waiting',
    ]);
});

test('it separates Pihak 1 and Pihak 2 into sequential sub-steps and creates contract versions on upload', function () {
    $contract = Contract::create([
        'title' => 'Test Signing Substeps',
        'contract_no' => 'CTR-SIGN-SUB-001',
        'contract_type_id' => $this->type->id,
        'created_by' => $this->creator->id,
        'initiated_by_id' => $this->creator->id,
        'status' => 'draft',
    ]);

    // Update step 2's category to signing
    $this->step2->update(['step_category' => 'signing']);

    $p1 = User::factory()->create(['name' => 'Pihak 1 User']);
    $p2 = User::factory()->create(['name' => 'Pihak 2 User']);

    $this->actingAs($this->creator);

    // 1. Send for approval (transitions to step 1)
    app(App\Services\ContractWorkflowService::class)->sendForApproval($contract, $this->workflow->id, null, false);
    $contract = $contract->fresh();

    // 2. Approve step 1 to advance to step 2 (signing setup step)
    $this->postJson("/api/contracts/{$contract->id}/approve", [
        'note' => 'Approving step 1',
    ])->assertSuccessful();

    // Verify contract is at step 2
    $contract = $contract->fresh();
    expect($contract->workflow_step_id)->toBe($this->step2->id);

    // Verify approval exists for Staff Legal (Setup)
    $setupApproval = Approval::where('contract_id', $contract->id)
        ->where('workflow_step_id', $this->step2->id)
        ->where('role', 'Staff Legal (Setup)')
        ->first();
    expect($setupApproval)->not->toBeNull();

    // 3. Approve as Staff Legal (Setup) and pass p1_user_id and p2_user_id
    $this->actingAs($this->creator);
    $this->postJson("/api/contracts/{$contract->id}/approve", [
        'note' => 'Setup signers',
        'p1_user_id' => $p1->id,
        'p2_user_id' => $p2->id,
    ])->assertSuccessful();

    // Verify Pihak 1 and Pihak 2 approvals were created with DIFFERENT sub-steps
    $p1Approval = Approval::where('contract_id', $contract->id)
        ->where('workflow_step_id', $this->step2->id)
        ->where('role', 'Pihak 1')
        ->first();
    $p2Approval = Approval::where('contract_id', $contract->id)
        ->where('workflow_step_id', $this->step2->id)
        ->where('role', 'Pihak 2')
        ->first();

    expect($p1Approval)->not->toBeNull();
    expect($p2Approval)->not->toBeNull();

    // Verify sub-steps are sequential!
    expect($p1Approval->sub_step)->toBe(1);
    expect($p2Approval->sub_step)->toBe(2);

    // Verify statuses
    expect($p1Approval->status)->toBe('pending');
    expect($p2Approval->status)->toBe('waiting');

    // 4. Upload signature as Pihak 1
    $this->actingAs($p1);
    $file = Illuminate\Http\UploadedFile::fake()->create('signed_p1.docx', 100);

    $this->postJson("/api/contracts/{$contract->id}/approve", [
        'note' => 'Signed by Pihak 1',
        'attachment' => $file,
    ])->assertSuccessful();

    // Verify a new ContractVersion of type 'agreement' was created!
    $this->assertDatabaseHas('t_contract_versions', [
        'contract_id' => $contract->id,
        'document_type' => 'agreement',
        'version_no' => 1,
        'change_log' => 'Dokumen ditandatangani Pihak 1',
    ]);

    // Verify Pihak 2 is now activated to pending
    expect($p2Approval->fresh()->status)->toBe('pending');

    // 5. Upload signature as Pihak 2
    $this->actingAs($p2);
    $file2 = Illuminate\Http\UploadedFile::fake()->create('signed_p2.docx', 100);

    $this->postJson("/api/contracts/{$contract->id}/approve", [
        'note' => 'Signed by Pihak 2',
        'attachment' => $file2,
    ])->assertSuccessful();

    // Verify a second ContractVersion of type 'agreement' was created!
    $this->assertDatabaseHas('t_contract_versions', [
        'contract_id' => $contract->id,
        'document_type' => 'agreement',
        'version_no' => 2,
        'change_log' => 'Dokumen ditandatangani Pihak 2',
    ]);

    // Verify setup approval (regular) is now activated to pending
    $setupApproval = Approval::where('contract_id', $contract->id)
        ->where('workflow_step_id', $this->step2->id)
        ->where('role', 'Staff Legal (Setup)')
        ->first();
    expect($setupApproval->fresh()->status)->toBe('pending');

    // 6. Act as setup PIC to perform final approval
    $this->actingAs($this->creator);
    $this->postJson("/api/contracts/{$contract->id}/approve", [
        'note' => 'Final approval of signing step',
    ])->assertSuccessful();

    // Now it should advance (in our test config, step 2 transitions to step 3 / approved)
    $contract = $contract->fresh();
    expect($contract->workflow_step_id)->toBeNull();
    expect($contract->status)->toBe('approved');
});

test('it supports exactly 1 signer and advances step when signed', function () {
    $contract = Contract::create([
        'title' => 'Test Single Signing Substep',
        'contract_no' => 'CTR-SIGN-SUB-002',
        'contract_type_id' => $this->type->id,
        'created_by' => $this->creator->id,
        'initiated_by_id' => $this->creator->id,
        'status' => 'draft',
    ]);

    // Update step 2's category to signing
    $this->step2->update(['step_category' => 'signing']);

    $p1 = User::factory()->create(['name' => 'Single Signer User']);

    $this->actingAs($this->creator);

    // 1. Send for approval
    app(App\Services\ContractWorkflowService::class)->sendForApproval($contract, $this->workflow->id, null, false);
    $contract = $contract->fresh();

    // 2. Approve step 1 to advance to step 2
    $this->postJson("/api/contracts/{$contract->id}/approve", [
        'note' => 'Approving step 1',
    ])->assertSuccessful();

    $contract = $contract->fresh();
    expect($contract->workflow_step_id)->toBe($this->step2->id);

    // 3. Approve as setup step and pass only p1_user_id (no p2)
    $this->postJson("/api/contracts/{$contract->id}/approve", [
        'note' => 'Setup single signer',
        'p1_user_id' => $p1->id,
        'p2_user_id' => null,
    ])->assertSuccessful();

    // Verify Pihak 1 approval was created, but Pihak 2 was not
    $p1Approval = Approval::where('contract_id', $contract->id)
        ->where('workflow_step_id', $this->step2->id)
        ->where('role', 'Pihak 1')
        ->first();
    $p2Approval = Approval::where('contract_id', $contract->id)
        ->where('workflow_step_id', $this->step2->id)
        ->where('role', 'Pihak 2')
        ->first();

    expect($p1Approval)->not->toBeNull();
    expect($p2Approval)->toBeNull();

    expect($p1Approval->sub_step)->toBe(1);
    expect($p1Approval->status)->toBe('pending');

    // 4. Upload signature as Pihak 1
    $this->actingAs($p1);
    $file = Illuminate\Http\UploadedFile::fake()->create('signed_single.docx', 100);

    $this->postJson("/api/contracts/{$contract->id}/approve", [
        'note' => 'Signed by Single Signer',
        'attachment' => $file,
    ])->assertSuccessful();

    // Verify version created
    $this->assertDatabaseHas('t_contract_versions', [
        'contract_id' => $contract->id,
        'document_type' => 'agreement',
        'version_no' => 1,
        'change_log' => 'Dokumen ditandatangani Pihak 1',
    ]);

    // Verify setup approval (regular) is now activated to pending
    $setupApproval = Approval::where('contract_id', $contract->id)
        ->where('workflow_step_id', $this->step2->id)
        ->where('role', 'Staff Legal (Setup)')
        ->first();
    expect($setupApproval->fresh()->status)->toBe('pending');

    // 5. Act as setup PIC to perform final approval
    $this->actingAs($this->creator);
    $this->postJson("/api/contracts/{$contract->id}/approve", [
        'note' => 'Final approval of signing step',
    ])->assertSuccessful();

    // Now it should advance (in our test config, step 2 transitions to step 3 / approved)
    $contract = $contract->fresh();
    expect($contract->workflow_step_id)->toBeNull();
    expect($contract->status)->toBe('approved');
});
