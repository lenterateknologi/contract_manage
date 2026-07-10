<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->handle(Request::capture());

use App\Models\Contract;
use App\Models\ContractType;
use App\Models\Role;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Services\Workflow\ContractWorkflowService;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

try {
    $type = ContractType::create([
        'code' => 'TEST-WF-ADHOC-DEBUG',
        'name' => 'Testing Adhoc Workflow Type Debug',
        'is_active' => true,
    ]);

    $creator = User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Staff'])->id]);
    $manager = User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Manager'])->id]);

    $workflow = Workflow::create([
        'name' => 'Adhoc Test Workflow Debug',
        'description' => 'Test workflow for ad-hoc approvals',
        'contract_type_id' => $type->id,
        'initiator_type' => 'all',
        'is_active' => true,
    ]);

    $step1 = WorkflowStep::create([
        'workflow_id' => $workflow->id,
        'step' => 1,
        'description' => 'Drafting Phase',
        'approver_type' => 'initiator',
        'step_category' => 'drafting',
    ]);

    $step2 = WorkflowStep::create([
        'workflow_id' => $workflow->id,
        'step' => 2,
        'description' => 'Manager Approval',
        'approver_type' => 'role',
    ]);
    DB::table('m_workflow_step_authorities')->insert([
        'id' => Str::uuid()->toString(),
        'workflow_step_id' => $step2->id,
        'role_id' => Role::firstOrCreate(['name' => 'Manager'])->id,
        'is_additional' => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('m_workflow_step_actions')->insert([
        [
            'id' => Str::uuid()->toString(),
            'workflow_step_id' => $step1->id,
            'action_code' => 'approve',
            'next_step_id' => $step2->id,
            'is_active' => true,
        ],
    ]);

    $contract = Contract::create([
        'title' => 'Test Adhoc Approval Contract Debug',
        'form_no' => 'CTR-ADHOC-001-DEBUG',
        'contract_type_id' => $type->id,
        'created_by' => $creator->id,
        'initiated_by_id' => $creator->id,
        'status' => 'draft',
    ]);

    auth()->login($creator);
    $service = app(ContractWorkflowService::class);
    $service->sendForApproval($contract, $workflow->id, [], true);
    echo 'Success!'.PHP_EOL;
} catch (Exception $e) {
    echo 'Error: '.$e->getMessage().PHP_EOL;
    echo 'File: '.$e->getFile().':'.$e->getLine().PHP_EOL;
    echo $e->getTraceAsString().PHP_EOL;
}
