<?php

use App\Models\ContractType;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepAction;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

test('admin workflows index page returns steps_count and contract_type_name', function () {
    $admin = User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Admin'])->id]);

    $type = ContractType::create([
        'name' => 'Test Contract Type',
        'code' => 'TEST_TYPE',
    ]);

    $workflow = Workflow::create([
        'name' => 'Test Workflow',
        'contract_type_id' => $type->id,
        'initiator_type' => 'all',
    ]);

    WorkflowStep::create([
        'workflow_id' => $workflow->id,
        'label' => 'Step 1',
        'step' => 1,
        'hierarchy_level' => 1,
    ]);

    $response = $this->actingAs($admin)
        ->get(route('admin.workflows'));

    $response->assertStatus(200);

    $response->assertInertia(
        fn (Assert $page) => $page
            ->component('admin/Index')
            ->has(
                'workflows.data',
                1,
                fn (Assert $page) => $page
                    ->where('name', 'Test Workflow')
                    ->where('steps_count', 1)
                    ->where('contract_type_name', 'Test Contract Type')
                    ->etc(),
            ),
    );
});

test('admin can duplicate workflow with its steps and actions', function () {
    $admin = User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Admin'])->id]);

    $type = ContractType::create([
        'name' => 'Original Type',
        'code' => 'ORIG_TYPE',
    ]);

    $workflow = Workflow::create([
        'name' => 'Original Workflow',
        'contract_type_id' => $type->id,
        'initiator_type' => 'all',
        'is_default' => true,
    ]);

    $step = WorkflowStep::create([
        'workflow_id' => $workflow->id,
        'label' => 'Original Step',
        'step' => 1,
        'hierarchy_level' => 1,
    ]);

    $action = WorkflowStepAction::create([
        'workflow_step_id' => $step->id,
        'action_code' => 'approve',
        'next_step_id' => null,
        'assignee_config' => [
            'default_target_step' => $step->id,
        ],
    ]);

    $response = $this->actingAs($admin)
        ->post(route('admin.workflows.duplicate', $workflow->id));

    $response->assertRedirect(route('admin.workflows'));
    $response->assertSessionHas('success');

    // Assert original workflow still exists and is untouched
    $this->assertDatabaseHas('m_workflows', [
        'id' => $workflow->id,
        'name' => 'Original Workflow',
        'is_default' => true,
    ]);

    // Assert duplicated workflow exists
    $this->assertDatabaseHas('m_workflows', [
        'name' => 'Original Workflow (Copy)',
        'is_default' => false,
    ]);

    $duplicatedWorkflow = Workflow::where('name', 'Original Workflow (Copy)')->first();
    expect($duplicatedWorkflow)->not->toBeNull();

    // Assert steps duplicated
    $this->assertDatabaseHas('m_workflow_steps', [
        'workflow_id' => $duplicatedWorkflow->id,
        'label' => 'Original Step',
        'step' => 1,
    ]);

    $duplicatedStep = WorkflowStep::where('workflow_id', $duplicatedWorkflow->id)->first();
    expect($duplicatedStep)->not->toBeNull();

    // Assert actions duplicated and assignee_config step ID mapped correctly
    $duplicatedAction = WorkflowStepAction::where('workflow_step_id', $duplicatedStep->id)->first();
    expect($duplicatedAction)->not->toBeNull();
    expect($duplicatedAction->action_code->value)->toBe('approve');
    expect($duplicatedAction->assignee_config['default_target_step'])->toBe($duplicatedStep->id);
});

test('admin or legal can get available workflows for another user', function () {
    $admin = User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Admin'])->id])->refresh();
    $staff = User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Staff'])->id])->refresh();

    // Create a workflow available only for Staff role
    $workflow = Workflow::create([
        'name' => 'Staff-Only Workflow',
        'initiator_type' => 'specific',
        'is_active' => true,
    ]);
    $workflow->initiatorAuthorities()->create(['role_id' => Role::firstOrCreate(['name' => 'Staff'])->id]);

    // If staff requests workflows, they get it
    $responseStaff = $this->actingAs($staff)
        ->getJson('/api/contracts/workflows');
    $responseStaff->assertSuccessful();
    $idsStaff = collect($responseStaff->json())->pluck('id')->toArray();
    expect($idsStaff)->toContain($workflow->id);

    // If admin requests without user_id, they don't get the Staff-only workflow (because admin role is Admin, not Staff)
    $responseAdminWithoutUser = $this->actingAs($admin)
        ->getJson('/api/contracts/workflows');
    $responseAdminWithoutUser->assertSuccessful();
    $idsAdmin = collect($responseAdminWithoutUser->json())->pluck('id')->toArray();
    expect($idsAdmin)->not->toContain($workflow->id);

    // If admin requests WITH user_id matching the staff user, they GET the Staff-only workflow!
    $responseAdminWithUser = $this->actingAs($admin)
        ->getJson('/api/contracts/workflows?user_id='.$staff->id);
    $responseAdminWithUser->assertSuccessful();
    $idsAdminWithUser = collect($responseAdminWithUser->json())->pluck('id')->toArray();
    expect($idsAdminWithUser)->toContain($workflow->id);
});

test('user can get available workflows based on role and department initiator constraints', function () {
    $roleStaff = Role::firstOrCreate(['name' => 'Staff']);
    $roleAdmin = Role::firstOrCreate(['name' => 'Admin']);

    $deptA = Department::forceCreate(['id' => (string) Str::uuid(), 'name' => 'Dept A', 'code' => 'DEPT-A']);
    $deptB = Department::forceCreate(['id' => (string) Str::uuid(), 'name' => 'Dept B', 'code' => 'DEPT-B']);

    $staffInDeptA = User::factory()->create([
        'role_id' => $roleStaff->id,
        'department_id' => $deptA->id,
    ])->refresh();

    $staffInDeptB = User::factory()->create([
        'role_id' => $roleStaff->id,
        'department_id' => $deptB->id,
    ])->refresh();

    $adminInDeptB = User::factory()->create([
        'role_id' => $roleAdmin->id,
        'department_id' => $deptB->id,
    ])->refresh();

    // Workflow 1: Role 'Staff', but if it includes department, department must be 'Dept A'
    $wfRoleAndDept = Workflow::create([
        'name' => 'Staff-DeptA Workflow',
        'initiator_type' => 'specific',
        'is_active' => true,
    ]);
    // authority 1: role = Staff
    $wfRoleAndDept->initiatorAuthorities()->create([
        'role_id' => $roleStaff->id,
        'authority_type' => 'role',
    ]);
    // authority 2: department = Dept A
    $wfRoleAndDept->initiatorAuthorities()->create([
        'department_id' => $deptA->id,
        'authority_type' => 'department',
    ]);

    // Workflow 2: Department 'Dept B' (independent of role)
    $wfDeptOnly = Workflow::create([
        'name' => 'DeptB-Only Workflow',
        'initiator_type' => 'specific',
        'is_active' => true,
    ]);
    $wfDeptOnly->initiatorAuthorities()->create([
        'department_id' => $deptB->id,
        'authority_type' => 'department',
    ]);

    // Test staffInDeptA
    $res = $this->actingAs($staffInDeptA)->getJson('/api/contracts/workflows');
    $res->assertSuccessful();
    $ids = collect($res->json())->pluck('id')->toArray();
    expect($ids)->toContain($wfRoleAndDept->id); // Staff role + matches Dept A constraint
    expect($ids)->not->toContain($wfDeptOnly->id); // Matches Dept A, but wf needs Dept B

    // Test staffInDeptB
    $res = $this->actingAs($staffInDeptB)->getJson('/api/contracts/workflows');
    $res->assertSuccessful();
    $ids = collect($res->json())->pluck('id')->toArray();
    expect($ids)->not->toContain($wfRoleAndDept->id); // Has Staff role, but does not match Dept A constraint
    expect($ids)->toContain($wfDeptOnly->id); // Matches Dept B constraint

    // Test adminInDeptB
    $res = $this->actingAs($adminInDeptB)->getJson('/api/contracts/workflows');
    $res->assertSuccessful();
    $ids = collect($res->json())->pluck('id')->toArray();
    expect($ids)->not->toContain($wfRoleAndDept->id); // Does not match role Staff
    expect($ids)->toContain($wfDeptOnly->id); // Matches Dept B constraint
});
