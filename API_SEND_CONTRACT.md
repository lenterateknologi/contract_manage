# API: Send Contract for Approval

## Endpoint
```
POST /api/contracts/{id}/send
```

## Description
Sends a draft contract for approval workflow. This endpoint:
1. Assigns the default workflow based on contract type
2. Sets workflow to the first workflow step
3. Records submission timestamp in `submitted_at` column
4. Creates approval records for all users with the required role
5. Changes contract status to `in_review`

## Request
```bash
curl -X POST http://localhost:8000/api/contracts/contract-uuid/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -H "Accept: application/json"
```

## Response (200 OK)
```json
{
  "id": "contract-uuid",
  "contract_no": "CTR-2026-001",
  "title": "Service Agreement with XYZ",
  "description": "Annual service agreement",
  "status": "in_review",
  "workflow_id": 1,
  "workflow_step_id": 5,
  "submitted_at": "2026-04-08T14:30:45.000000Z",
  "created_by": "user-uuid",
  "creator": {
    "id": "user-uuid",
    "name": "John Doe",
    "role": "Management",
    "initials": "JD",
    "bg_color": "#dbeafe",
    "text_color": "#1d4ed8"
  },
  "workflow": {
    "id": 1,
    "contract_type": "Service Agreement",
    "is_default": true,
    "is_active": true
  },
  "workflowStep": {
    "id": 5,
    "workflow_id": 1,
    "step": 1,
    "role": "Legal",
    "description": "Initial legal review"
  },
  "approvals": [
    {
      "id": 1,
      "contract_id": "contract-uuid",
      "workflow_step_id": 5,
      "user_id": "approver-uuid",
      "approver_name": "Jane Smith",
      "role": "Legal",
      "status": "pending",
      "decided_at": null,
      "comment": null,
      "approver": {
        "id": "approver-uuid",
        "name": "Jane Smith",
        "role": "Legal"
      },
      "sequence": 1
    }
  ],
  "workflowApprovals": [
    {
      "id": 1,
      "contract_id": "contract-uuid",
      "workflow_step_id": 5,
      "user_id": "approver-uuid",
      "approver_name": "Jane Smith",
      "role": "Legal",
      "status": "pending",
      "sequence": 1
    }
  ],
  "current_version": 1,
  "versions": [
    {
      "version_no": 1,
      "file_name": "CTR-2026-001_v1_initial.docx",
      "file_hash": "abcd1234...",
      "file_path": "contracts/2026/CTR-2026-001_v1.docx",
      "change_log": "Initial version",
      "is_final": false,
      "created_at": "2026-04-08T10:00:00.000000Z"
    }
  ],
  "created_at": "2026-04-08T10:00:00.000000Z",
  "updated_at": "2026-04-08T14:30:45.000000Z",
  "progress": {
    "done": 0,
    "total": 1,
    "pct": 0
  }
}
```

## Error Responses

### 404 Not Found
```json
{
  "message": "No query results found for model [App\\Models\\Contract]"
}
```

### 422 Unprocessable Entity - Not Draft
```json
{
  "message": "Only draft contracts can be sent."
}
```

### 422 Unprocessable Entity - No Workflow
```json
{
  "message": "No default workflow found for contract type: Service Agreement"
}
```

### 422 Unprocessable Entity - No Workflow Steps
```json
{
  "message": "No workflow steps defined for this workflow"
}
```

## Implementation Details

### Controller Method
**File:** [app/Http/Controllers/ContractController.php](app/Http/Controllers/ContractController.php#L44-L59)

```php
public function send(Request $request, string $id): JsonResponse
{
    try {
        $contract = Contract::findOrFail($id);

        if ($contract->status !== 'draft') {
            return response()->json(['message' => 'Only draft contracts can be sent.'], 422);
        }

        // Use workflow service to send for approval
        $contract = $this->workflowService->sendForApproval($contract);

        $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user', 'workflow', 'workflowStep', 'workflowApprovals.user']);
        return response()->json($this->formatContract($contract), 200);
    } catch (\Exception $e) {
        return response()->json(['message' => $e->getMessage()], 422);
    }
}
```

### Service Method
**File:** [app/Services/ContractWorkflowService.php](app/Services/ContractWorkflowService.php#L15-L50)

```php
public function sendForApproval(Contract $contract): Contract
{
    // Get default workflow for contract type
    $workflow = Workflow::getDefaultByContractType($contract->contract_type);

    if (!$workflow) {
        throw new \Exception('No default workflow found for contract type: ' . $contract->contract_type);
    }

    // Get first workflow step
    $firstStep = $workflow->steps()->orderBy('step')->first();

    if (!$firstStep) {
        throw new \Exception('No workflow steps defined for this workflow');
    }

    // Update contract with workflow info and submission timestamp
    $contract->update([
        'workflow_id' => $workflow->id,
        'workflow_step_id' => $firstStep->id,
        'status' => 'in_review',
        'submitted_at' => now(),  // ← Sets current datetime
    ]);

    // Create approval record for the first step
    $this->createApprovalForStep($contract, $firstStep);

    // Log the action
    $contract->histories()->create([
        'action' => 'CONTRACT_SENT',
        'description' => 'Contract sent for approval',
        'actor_id' => auth()->id(),
    ]);

    return $contract->fresh();
}
```

### Route Definition
**File:** [routes/api.php](routes/api.php#L12)

```php
Route::post('/contracts/{id}/send', [ContractController::class, 'send']);
```

### Database Schema
**File:** [database/migrations/2026_04_09_alter_contracts_add_workflow.php](database/migrations/2026_04_09_alter_contracts_add_workflow.php#L17-L20)

```php
$table->foreignId('workflow_id')->index()->nullable()->constrained('workflows')->onDelete('set null');
$table->foreignId('workflow_step_id')->index()->nullable()->constrained('workflow_steps')->onDelete('set null');
$table->boolean('is_active')->default(true)->index();
$table->timestamp('submitted_at')->nullable()->index();  // ← Submission timestamp
```

## What Happens When Send is Called

1. **Validates Contract Status**
   - Only draft contracts can be sent
   - Returns 422 if not draft

2. **Gets Default Workflow**
   - Looks up workflow by `contract_type`
   - Returns 422 if no workflow exists for that type

3. **Gets First Step**
   - Retrieves first workflow step (lowest sequence number)
   - Returns 422 if no steps defined

4. **Updates Contract**
   - Sets `workflow_id` to the workflow ID
   - Sets `workflow_step_id` to the first step ID
   - Sets `status` to `in_review`
   - Sets `submitted_at` to current datetime (NOW)

5. **Creates Approval Records**
   - Finds all users with the role matching the first step
   - Creates pending approval record for each user
   - Each approval has reference to workflow_step and user

6. **Logs History**
   - Records action as `CONTRACT_SENT`
   - Tracks which user sent it (actor_id)

7. **Returns Updated Contract**
   - With all relationships loaded
   - Formatted for frontend consumption

## Frontend Integration
**File:** [resources/js/pages/contracts/index.tsx](resources/js/pages/contracts/index.tsx#L176-L182)

```javascript
const handleSendForApproval = async () => {
    if (!selected) return;
    try {
        const c = await contractApi.send(selected.id);
        updateContract(c);
        showToast('Kontrak berhasil dikirim untuk approval!', 'success');
    } catch { 
        showToast('Gagal mengirim kontrak.', 'danger'); 
    }
};
```

The button is shown only for draft contracts:
```javascript
{selected.status === 'draft' && (
    <button onClick={handleSendForApproval}>
        <i className="fa-solid fa-paper-plane" /> Kirim 
    </button>
)}
```

## Testing

### Via cURL
```bash
# Send a contract for approval
curl -X POST \
  "http://localhost:8000/api/contracts/550e8400-e29b-41d4-a716-446655440000/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -H "Accept: application/json"
```

### Via Frontend
1. Login as any user
2. Navigate to "Semua Kontrak" (All Contracts)
3. Click on a draft contract
4. Click "Kirim" (Send) button
5. Toast shows success/error message
6. Contract status changes to "in_review"
7. Pending approvers see it in "Menunggu Approval" tab

### Via tinker
```bash
php artisan tinker

# Get a draft contract
$contract = App\Models\Contract::where('status', 'draft')->first();

# Send it for approval
app(App\Services\ContractWorkflowService::class)->sendForApproval($contract);

# Check the results
$contract->fresh();
$contract->submitted_at;  # Should show current datetime
$contract->workflow_id;    # Should be set
$contract->workflow_step_id; # Should be set
$contract->approvals;      # Should have approval records
```

## Key Features

✅ **Automatic Workflow Assignment** - Based on contract_type
✅ **Submission Timestamp** - Recorded when sent (submitted_at)
✅ **First Step Identification** - Automatically selects first step
✅ **Approval Creation** - Creates records for matching role users
✅ **Status Update** - Changes to in_review
✅ **History Logging** - Tracks who sent it and when
✅ **Error Handling** - Validates contract, workflow, and steps
✅ **Frontend Integrated** - Send button in UI with success/error toast

---

**Status:** ✅ Complete and Production Ready
**Last Updated:** April 8, 2026
