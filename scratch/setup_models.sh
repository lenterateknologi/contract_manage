#!/bin/bash
models=("WorkflowInitiatorRole" "WorkflowInitiatorDepartment" "WorkflowInitiatorUser" "WorkflowStepDepartment" "WorkflowStepUser")
tables=("m_workflow_initiator_roles" "m_workflow_initiator_departments" "m_workflow_initiator_users" "m_workflow_step_departments" "m_workflow_step_users")
fields=("'workflow_id', 'role_name'" "'workflow_id', 'department_id'" "'workflow_id', 'user_id'" "'workflow_step_id', 'department_id'" "'workflow_step_id', 'user_id'")

for i in "${!models[@]}"; do
  model=${models[$i]}
  table=${tables[$i]}
  field=${fields[$i]}
  cat << EOM > app/Models/$model.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class $model extends Model
{
    use HasUuids;
    protected \$table = '$table';
    protected \$fillable = [$field];
}
EOM
done
