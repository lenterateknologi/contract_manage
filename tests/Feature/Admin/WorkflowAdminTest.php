<?php

use App\Models\ContractType;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepAction;
use Inertia\Testing\AssertableInertia as Assert;

test('admin workflows index page returns steps_count and contract_type_name', function () {
    $admin = User::factory()->create(['role' => 'Admin']);

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
            ->component('admin/index')
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
    $admin = User::factory()->create(['role' => 'Admin']);

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
    $admin = User::factory()->create(['role' => 'Admin']);
    $staff = User::factory()->create(['role' => 'Staff']);

    // Create a workflow available only for Staff role
    $workflow = Workflow::create([
        'name' => 'Staff-Only Workflow',
        'initiator_type' => 'role',
        'is_active' => true,
    ]);
    $workflow->initiatorRolesData()->create(['role_name' => 'Staff']);

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
