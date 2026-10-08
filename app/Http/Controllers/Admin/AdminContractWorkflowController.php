<?php

namespace App\Http\Controllers\Admin;

use App\Http\Actions\Admin\Contract\AdminOverrideWorkflowAction;
use App\Http\Controllers\Controller;
use App\Http\Queries\Contract\ContractDetailQuery;
use App\Models\Master\Workflow;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminContractWorkflowController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ContractDetailQuery $contractDetailQuery,
        protected AdminOverrideWorkflowAction $overrideWorkflowAction,
    ) {}

    /**
     * Override contract workflow and step (Admin only).
     */
    public function override(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $isAdmin = $user && ($user->role === 'Super Admin' || $user->role === 'Admin' || (bool) $user->is_admin);
        if (! $isAdmin) {
            return $this->errorResponse('Hanya Administrator yang memiliki akses untuk mengubah alur kerja kontrak.', 403);
        }

        $request->validate([
            'workflow_id' => 'required|uuid|exists:m_workflows,id',
            'workflow_step_id' => 'required|uuid|exists:m_workflow_steps,id',
            'reason' => 'nullable|string|max:1000',
        ]);

        try {
            $contract = $this->contractDetailQuery->find($id);
            $formatted = $this->overrideWorkflowAction->execute(
                $contract,
                $request->input('workflow_id'),
                $request->input('workflow_step_id'),
                $request->input('reason'),
                $user
            );

            return $this->successResponse(
                $formatted,
                'Alur kerja dan tahap kontrak berhasil diubah oleh Administrator.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    /**
     * Get all active workflows with their steps for admin selection.
     */
    public function getWorkflows(): JsonResponse
    {
        $workflows = Workflow::where('is_active', true)
            ->with(['steps' => fn ($q) => $q->orderBy('step'), 'contractType'])
            ->orderBy('name')
            ->get();

        return $this->successResponse($workflows, 'Workflows retrieved successfully');
    }
}
