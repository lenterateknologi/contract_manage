<?php

namespace App\Actions\Workflow;

use App\Models\Workflow;

class DestroyWorkflowAction
{
    /**
     * Remove the specified workflow from storage.
     */
    public function execute(Workflow $workflow): ?bool
    {
        return $workflow->delete();
    }
}
