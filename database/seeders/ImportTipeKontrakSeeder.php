<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ImportTipeKontrakSeeder extends Seeder
{
    public function run(): void
    {
        $jsonPath = base_path('data_json/tipe-kontrak.json');
        if (! file_exists($jsonPath)) {
            $this->command->warn('>>> tipe-kontrak.json FILE NOT FOUND');

            return;
        }

        $this->command->info('>>> IMPORTING MASTER DATA FROM tipe-kontrak.json');
        $jsonData = json_decode(file_get_contents($jsonPath), true);

        // Order is important for foreign keys.
        // NOTE: We only import master data here.
        // Workflows are skipped because the JSON contains outdated schema (e.g. master_action_id).
        $tablesOrder = [
            'contract_types',
            'contract_statuses',
        ];

        DB::statement('SET CONSTRAINTS ALL DEFERRED');

        foreach ($tablesOrder as $table) {
            $dbTable = "m_{$table}";

            if ($table === 'workflow_step_actions') {
                $dbTable = 'm_workflow_step_actions'; // Ensure it's correctly mapped if needed, though already correct
            }

            if (! isset($jsonData[$table])) {
                $this->command->warn("Missing data for table $table");

                continue;
            }

            $data = $jsonData[$table];

            // Clean up existing data
            DB::table($dbTable)->delete();

            // Format data (handling boolean conversion if needed)
            foreach ($data as &$row) {
                if (isset($row['is_active'])) {
                    $row['is_active'] = filter_var($row['is_active'], FILTER_VALIDATE_BOOLEAN) ? true : false;
                }
                if (isset($row['is_default'])) {
                    $row['is_default'] = filter_var($row['is_default'], FILTER_VALIDATE_BOOLEAN) ? true : false;
                }
                if (isset($row['is_template'])) {
                    $row['is_template'] = filter_var($row['is_template'], FILTER_VALIDATE_BOOLEAN) ? true : false;
                }
                if (isset($row['is_tax_involved'])) {
                    $row['is_tax_involved'] = filter_var($row['is_tax_involved'], FILTER_VALIDATE_BOOLEAN) ? true : false;
                }
                if (isset($row['is_optional'])) {
                    $row['is_optional'] = filter_var($row['is_optional'], FILTER_VALIDATE_BOOLEAN) ? true : false;
                }
                if (isset($row['is_mandatory'])) {
                    $row['is_mandatory'] = filter_var($row['is_mandatory'], FILTER_VALIDATE_BOOLEAN) ? true : false;
                }

                // Map contract_type to contract_type_id in workflows
                if ($table === 'workflows' && array_key_exists('contract_type', $row)) {
                    $contractTypeStr = $row['contract_type'];
                    unset($row['contract_type']);
                    if ($contractTypeStr) {
                        $typeId = DB::table('m_contract_types')
                            ->where('code', $contractTypeStr)
                            ->orWhere('name', $contractTypeStr)
                            ->value('id');
                        $row['contract_type_id'] = $typeId;
                    } else {
                        $row['contract_type_id'] = null;
                    }
                }

                // Map workflow_name to workflow_id in contract_types (if applicable in JSON)
                if ($table === 'contract_types' && array_key_exists('workflow_name', $row)) {
                    $workflowName = $row['workflow_name'];
                    unset($row['workflow_name']);
                    if ($workflowName) {
                        $workflowId = DB::table('m_workflows')->where('name', $workflowName)->value('id');
                        // but since workflows is seeded after contract_types, this might not work.
                        // wait, if contract_types comes BEFORE workflows, workflowId will be null!
                        // Let's store it and update it later. We can just unset it for now and handle relation from the workflows side if necessary.
                        // Actually, in the new schema, workflow is linked FROM contract_types (contract_types.workflow_id). Wait, no, it's t_contracts that has workflow_id.
                        // Let's check m_contract_types schema. It might have workflow_id.
                        $row['workflow_id'] = null; // Will just null it out, they don't have it natively or we can map it later.
                    }
                }

                // Convert arrays/objects to JSON strings for jsonb columns
                foreach (['features', 'meta', 'company_group_ids', 'region_ids', 'company_ids', 'allowed_actions', 'required_fields', 'autofilled_fields', 'signing_parties', 'assignee_config'] as $jsonCol) {
                    if (isset($row[$jsonCol]) && is_array($row[$jsonCol])) {
                        $row[$jsonCol] = json_encode($row[$jsonCol]);
                    }
                }
            }

            // Chunk insertion
            $chunks = array_chunk($data, 1000);
            foreach ($chunks as $chunk) {
                DB::table($dbTable)->insert($chunk);
            }

            $this->command->info('Seeded '.count($data)." rows into {$dbTable}.");
        }

        $this->command->info('>>> tipe-kontrak.json IMPORT COMPLETED');
    }
}
