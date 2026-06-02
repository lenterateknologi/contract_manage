<?php

use App\Models\ContractType;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStep;
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
