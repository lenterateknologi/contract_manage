<?php

use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepAction;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->admin = User::factory()->create([
        'role' => 'Admin',
    ]);
});

test('unauthorized users cannot access master data sync index', function () {
    $user = User::factory()->create([
        'role' => 'User',
    ]);

    $this->actingAs($user)
        ->get(route('admin.master-data-sync'))
        ->assertRedirect('/dashboard');
});

test('admin can access master data sync index with counts', function () {
    Workflow::create([
        'id' => (string) Str::uuid(),
        'name' => 'Workflow A',
        'is_active' => true,
    ]);

    Workflow::create([
        'id' => (string) Str::uuid(),
        'name' => 'Workflow B',
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->admin)
        ->get(route('admin.master-data-sync'))
        ->assertOk();

    $response->assertInertia(
        fn (Inertia\Testing\AssertableInertia $page) => $page
            ->has('counts.workflows')
            ->where('counts.workflows', 2),
    );
});

test('admin can export master data including workflow tables', function () {
    $w = Workflow::create([
        'id' => (string) Str::uuid(),
        'name' => 'Test Workflow',
        'is_active' => true,
    ]);

    $step = WorkflowStep::create([
        'id' => (string) Str::uuid(),
        'workflow_id' => $w->id,
        'step' => 1,
        'step_category' => 'approval',
        'is_active' => true,
    ]);
    $action = WorkflowStepAction::create([
        'id' => (string) Str::uuid(),
        'workflow_step_id' => $step->id,
        'action_code' => 'approve',
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->admin)
        ->get(route('admin.master-data-sync.export'))
        ->assertOk();

    $response->assertHeader('Content-Type', 'application/json');

    ob_start();
    $response->sendContent();
    $content = ob_get_clean();

    $data = json_decode($content, true);

    expect($data)->toBeArray()
        ->toHaveKey('workflows')
        ->toHaveKey('workflow_steps')
        ->toHaveKey('workflow_step_actions');

    expect($data['workflows'])->toHaveCount(1);
    expect($data['workflows'][0]['id'])->toBe($w->id);
    expect($data['workflow_steps'][0]['id'])->toBe($step->id);
    expect($data['workflow_step_actions'][0]['id'])->toBe($action->id);
});

test('admin can import master data using id as key for createorupdate', function () {
    $uuidWorkflow = (string) Str::uuid();
    $uuidStep = (string) Str::uuid();
    $uuidAction = (string) Str::uuid();

    $payload = [
        'company_groups' => [],
        'regions' => [],
        'companies' => [],
        'departments' => [],
        'contract_statuses' => [],
        'workflows' => [
            [
                'id' => $uuidWorkflow,
                'name' => 'Imported Workflow',
                'description' => 'A workflow imported via JSON',
                'is_active' => true,
            ],
        ],
        'workflow_initiator_departments' => [],
        'workflow_initiator_roles' => [],
        'workflow_initiator_users' => [],
        'workflow_steps' => [
            [
                'id' => $uuidStep,
                'workflow_id' => $uuidWorkflow,
                'step' => 1,
                'step_category' => 'review',
                'is_active' => true,
            ],
        ],
        'workflow_step_departments' => [],
        'workflow_step_roles' => [],
        'workflow_step_users' => [],
        'workflow_step_actions' => [
            [
                'id' => $uuidAction,
                'workflow_step_id' => $uuidStep,
                'action_code' => 'return',
                'is_active' => true,
            ],
        ],
        'contract_types' => [],
    ];

    $file = UploadedFile::fake()->createWithContent('master_data.json', json_encode($payload));

    $response = $this->actingAs($this->admin)
        ->withoutExceptionHandling()
        ->withoutMiddleware()
        ->post(route('admin.master-data-sync.import'), [
            'file' => $file,
        ]);

    $response->assertRedirect(route('admin.master-data-sync'));
    $response->assertSessionHasNoErrors();

    // Verify it was saved in the database
    $this->assertDatabaseHas('m_workflows', [
        'id' => $uuidWorkflow,
        'name' => 'Imported Workflow',
    ]);

    $this->assertDatabaseHas('m_workflow_steps', [
        'id' => $uuidStep,
        'workflow_id' => $uuidWorkflow,
        'step_category' => 'review',
    ]);

    $this->assertDatabaseHas('m_workflow_step_actions', [
        'id' => $uuidAction,
        'workflow_step_id' => $uuidStep,
        'action_code' => 'return',
    ]);

    // Now test importing again with the same UUIDs but updated values (replace scenario)
    $payload2 = [
        'company_groups' => [],
        'regions' => [],
        'companies' => [],
        'departments' => [],
        'contract_statuses' => [],
        'workflows' => [
            [
                'id' => $uuidWorkflow,
                'name' => 'Updated Workflow Name',
                'description' => 'An updated description',
                'is_active' => true,
            ],
        ],
        'workflow_initiator_departments' => [],
        'workflow_initiator_roles' => [],
        'workflow_initiator_users' => [],
        'workflow_steps' => [
            [
                'id' => $uuidStep,
                'workflow_id' => $uuidWorkflow,
                'step' => 1,
                'step_category' => 'approval',
                'is_active' => true,
            ],
        ],
        'workflow_step_departments' => [],
        'workflow_step_roles' => [],
        'workflow_step_users' => [],
        'workflow_step_actions' => [
            [
                'id' => $uuidAction,
                'workflow_step_id' => $uuidStep,
                'action_code' => 'return',
                'is_active' => false,
            ],
        ],
        'contract_types' => [],
    ];

    $file2 = UploadedFile::fake()->createWithContent('master_data_updated.json', json_encode($payload2));

    $response2 = $this->actingAs($this->admin)
        ->withoutExceptionHandling()
        ->withoutMiddleware()
        ->post(route('admin.master-data-sync.import'), [
            'file' => $file2,
        ]);

    $response2->assertRedirect(route('admin.master-data-sync'));
    $response2->assertSessionHasNoErrors();

    // Verify it was replaced/updated in the database
    $this->assertDatabaseHas('m_workflows', [
        'id' => $uuidWorkflow,
        'name' => 'Updated Workflow Name',
    ]);
    expect(Workflow::count())->toBe(1);

    $this->assertDatabaseHas('m_workflow_steps', [
        'id' => $uuidStep,
        'workflow_id' => $uuidWorkflow,
        'step_category' => 'approval',
    ]);
    expect(WorkflowStep::count())->toBe(1);

    $this->assertDatabaseHas('m_workflow_step_actions', [
        'id' => $uuidAction,
        'workflow_step_id' => $uuidStep,
        'is_active' => false,
    ]);
    expect(WorkflowStepAction::count())->toBe(1);
});

test('admin can export and import contract types hierarchy correctly', function () {
    $parent = App\Models\ContractType::create([
        'id' => (string) Str::uuid(),
        'code' => 'CT-PARENT',
        'name' => 'Parent Contract Type',
        'f1_input_mechanism' => 'manual',
        'f2_input_mechanism' => 'manual',
    ]);

    $child = App\Models\ContractType::create([
        'id' => (string) Str::uuid(),
        'code' => 'CT-CHILD',
        'name' => 'Child Contract Type',
        'parent_id' => $parent->id,
        'f1_input_mechanism' => 'manual',
        'f2_input_mechanism' => 'manual',
    ]);

    // Export test
    $response = $this->actingAs($this->admin)
        ->get(route('admin.master-data-sync.export'))
        ->assertOk();

    ob_start();
    $response->sendContent();
    $content = ob_get_clean();

    $data = json_decode($content, true);
    expect($data)->toHaveKey('contract_types');

    $parentExport = collect($data['contract_types'])->firstWhere('code', 'CT-PARENT');
    $childExport = collect($data['contract_types'])->firstWhere('code', 'CT-CHILD');

    expect($parentExport['parent_code'])->toBeNull();
    expect($childExport['parent_code'])->toBe('CT-PARENT');

    // Clean DB types to test import
    App\Models\ContractType::query()->forceDelete();

    // Prepare import payload
    $payload = [
        'company_groups' => [],
        'regions' => [],
        'companies' => [],
        'departments' => [],
        'contract_statuses' => [],
        'workflows' => [],
        'workflow_initiator_departments' => [],
        'workflow_initiator_roles' => [],
        'workflow_initiator_users' => [],
        'workflow_steps' => [],
        'workflow_step_departments' => [],
        'workflow_step_roles' => [],
        'workflow_step_users' => [],
        'workflow_step_actions' => [],
        'contract_types' => [
            [
                'code' => 'CT-CHILD',
                'name' => 'Child Contract Type',
                'parent_code' => 'CT-PARENT',
                'f1_input_mechanism' => 'manual',
                'f2_input_mechanism' => 'manual',
            ],
            [
                'code' => 'CT-PARENT',
                'name' => 'Parent Contract Type',
                'parent_code' => null,
                'f1_input_mechanism' => 'manual',
                'f2_input_mechanism' => 'manual',
            ],
        ],
    ];

    $file = UploadedFile::fake()->createWithContent('master_data.json', json_encode($payload));

    $response = $this->actingAs($this->admin)
        ->withoutExceptionHandling()
        ->withoutMiddleware()
        ->post(route('admin.master-data-sync.import'), [
            'file' => $file,
        ]);

    $response->assertRedirect(route('admin.master-data-sync'));

    $importedParent = App\Models\ContractType::where('code', 'CT-PARENT')->first();
    $importedChild = App\Models\ContractType::where('code', 'CT-CHILD')->first();

    expect($importedParent)->not->toBeNull();
    expect($importedChild)->not->toBeNull();
    expect($importedChild->parent_id)->toBe($importedParent->id);
});

test('admin can clean master and transactional data', function () {
    // 1. Seed some master data
    $w = Workflow::create([
        'id' => (string) Str::uuid(),
        'name' => 'Clean Test Workflow',
        'is_active' => true,
    ]);

    $companyGroup = App\Models\CompanyGroup::create([
        'id' => (string) Str::uuid(),
        'code' => 'CG-TEST',
        'name' => 'CG Test Name',
        'is_active' => true,
    ]);

    $group = App\Models\ModuleGroup::create([
        'id' => (string) Str::uuid(),
        'name' => 'Clean Test Group',
    ]);

    $module = App\Models\Module::create([
        'id' => (string) Str::uuid(),
        'name' => 'Clean Test Module',
        'identifier' => 'CLEAN_TEST_MOD',
        'module_group_id' => $group->id,
    ]);

    // 2. Perform the clean POST request
    $response = $this->actingAs($this->admin)
        ->withoutMiddleware()
        ->post(route('admin.master-data-sync.clean'), [
            'entities' => ['workflows', 'company_groups', 'navigation_mappings'],
        ]);

    $response->assertRedirect(route('admin.master-data-sync'));
    $response->assertSessionHasNoErrors();

    // 3. Verify it was cleared from the database
    $this->assertDatabaseMissing('m_workflows', [
        'id' => $w->id,
    ]);
    $this->assertDatabaseMissing('m_company_groups', [
        'id' => $companyGroup->id,
    ]);
    $this->assertDatabaseMissing('m_modules', [
        'id' => $module->id,
    ]);
    $this->assertDatabaseMissing('m_module_groups', [
        'id' => $group->id,
    ]);

    // 4. Verify admin user still exists
    $this->assertDatabaseHas('m_users', [
        'id' => $this->admin->id,
    ]);
});
