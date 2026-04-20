<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Contract;
use App\Models\ContractType;
use App\Models\Role;
use App\Models\Department;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Database\Seeders\RoleSeeder;
use Database\Seeders\DepartmentSeeder;
use Database\Seeders\WorkflowSeeder;
use Database\Seeders\WorkflowStepSeeder;

/*
|--------------------------------------------------------------------------
| Contract Workflow End-to-End Automation Test Draft
|--------------------------------------------------------------------------
|
| This test script simulates the full contract lifecycle:
| 1. Creator (Staff) creates and submits contract.
| 2. Tax Manager reviews & approves.
| 3. Management Manager reviews & approves.
| 4. Legal Staff reviews & approves.
| 5. Direksi (Director) gives final approval.
|
*/

uses(RefreshDatabase::class);

beforeEach(function () {
    // 1. Seed necessary master data
    $this->seed(RoleSeeder::class);
    $this->seed(DepartmentSeeder::class);
    $this->seed(WorkflowSeeder::class);
    $this->seed(WorkflowStepSeeder::class);

    // 2. Create users for each role/department
    $this->roles = Role::pluck('id', 'name');
    $this->depts = Department::pluck('id', 'code');

    // Initiator (Staff)
    $this->staff = User::factory()->create([
        'name' => 'Initiator Staff',
        'role_id' => $this->roles['Staff'],
        'department_id' => $this->depts['OPS'],
    ]);

    // Tax Manager
    $this->taxManager = User::factory()->create([
        'name' => 'Tax Manager',
        'role_id' => $this->roles['Manager'],
        'department_id' => $this->depts['TAX'],
    ]);

    // Management Manager
    $this->mgtManager = User::factory()->create([
        'name' => 'Operations Manager',
        'role_id' => $this->roles['Manager'],
        'department_id' => $this->depts['MGT'],
    ]);

    // Legal Staff
    $this->legalStaff = User::factory()->create([
        'name' => 'Legal Counselor',
        'role_id' => $this->roles['Staff'],
        'department_id' => $this->depts['LGL'],
    ]);

    // Director (Board)
    $this->director = User::factory()->create([
        'name' => 'Board Director',
        'role_id' => $this->roles['Director'],
        'department_id' => $this->depts['MGT'],
    ]);

    $this->contractType = ContractType::first();
});

it('executes full contract workflow from creation to board approval', function () {
    // --- STEP 1: CREATE CONTRACT (Staff) ---
    $response = $this->actingAs($this->staff)->postJson('/api/contracts', [
        'title' => 'Automation Test Contract',
        'description' => 'Test for full approval cycle',
        'contract_type_id' => $this->contractType->id,
        'tax_required' => true, // Ensure Tax Step is triggered
    ]);

    $response->assertStatus(201);
    $contractId = $response->json('id');
    
    expect(Contract::find($contractId)->status)->toBe('draft');

    // --- STEP 2: SUBMIT FOR APPROVAL ---
    $this->actingAs($this->staff)->postJson("/api/contracts/{$contractId}/send")
        ->assertStatus(200);

    $contract = Contract::find($contractId);
    expect($contract->status)->toBe('in_review');
    expect($contract->workflowStep->description)->toContain('Tax');

    // --- STEP 3: TAX APPROVAL ---
    $taxApproval = $contract->approvals()->where('role', 'Manager')->first();
    $this->actingAs($this->taxManager)->postJson("/api/contracts/{$contractId}/approve", [
        'comment' => 'Tax review cleared.'
    ])->assertStatus(200);

    $contract->refresh();
    expect($contract->workflowStep->description)->toContain('Management');

    // --- STEP 4: MANAGEMENT APPROVAL ---
    $this->actingAs($this->mgtManager)->postJson("/api/contracts/{$contractId}/approve", [
        'comment' => 'Operations approved.'
    ])->assertStatus(200);

    $contract->refresh();
    expect($contract->workflowStep->description)->toContain('Legal');

    // --- STEP 5: LEGAL APPROVAL ---
    $this->actingAs($this->legalStaff)->postJson("/api/contracts/{$contractId}/approve", [
        'comment' => 'Legal requirements verified.'
    ])->assertStatus(200);

    $contract->refresh();
    expect($contract->workflowStep->description)->toContain('Direksi');

    // --- STEP 6: FINAL BOARD APPROVAL ---
    $this->actingAs($this->director)->postJson("/api/contracts/{$contractId}/approve", [
        'comment' => 'Final sign-off.'
    ])->assertStatus(200);

    $contract->refresh();
    expect($contract->status)->toBe('approved');
    
    // --- STEP 7: VERIFY AUDIT TRAIL ---
    expect($contract->histories()->count())->toBeGreaterThan(5);
    expect($contract->histories()->latest()->first()->action)->toBe('CONTRACT_APPROVED');
});
