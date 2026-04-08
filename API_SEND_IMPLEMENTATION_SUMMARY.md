# API Endpoint: POST /api/contracts/{id}/send

## ✅ Implementation Complete

The "send for approval" API endpoint has been fully implemented and tested.

### What This API Does

When you call `POST /api/contracts/{id}/send`, it will:

1. ✅ **Find the contract** and verify it's in draft status
2. ✅ **Get default workflow** for the contract's type
3. ✅ **Get first workflow step** from that workflow
4. ✅ **Update contract** with:
   - `workflow_id` → The workflow ID
   - `workflow_step_id` → The first step ID
   - `status` → Changed to `in_review`
   - `submitted_at` → **Current datetime (now)**
5. ✅ **Create approval records** for all users with matching role
6. ✅ **Log the action** in contract history

---

## Example Workflow Flow

### Before Send
```
Contract: CTR-2025-004
Status: draft
Contract Type: Service Agreement
Workflow ID: null
Submitted At: null
```

### After Send
```
Contract: CTR-2025-004
Status: in_review
Contract Type: Service Agreement
Workflow ID: 1 ✓ (Service Agreement workflow)
Workflow Step ID: 1 ✓ (Legal review - first step)
Submitted At: 2026-04-10T14:30:45.000000Z ✓ (Current datetime)

Approvals Created:
  - Jane Smith (Legal): pending
  - (other Legal users...)
```

---

## Code Implementation

### 1. API Route
**File:** [routes/api.php](routes/api.php#L12)
```php
Route::post('/contracts/{id}/send', [ContractController::class, 'send']);
```

### 2. Controller Method
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

        $contract->load([...]);
        return response()->json($this->formatContract($contract), 200);
    } catch (\Exception $e) {
        return response()->json(['message' => $e->getMessage()], 422);
    }
}
```

### 3. Service Implementation
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

    // Update contract with workflow info and SUBMISSION TIMESTAMP
    $contract->update([
        'workflow_id' => $workflow->id,
        'workflow_step_id' => $firstStep->id,
        'status' => 'in_review',
        'submitted_at' => now(),  // ← CURRENT DATETIME
    ]);

    // Create approval records for all matching role users
    $this->createApprovalForStep($contract, $firstStep);

    // Log in history
    $contract->histories()->create([
        'action' => 'CONTRACT_SENT',
        'description' => 'Contract sent for approval',
        'actor_id' => auth()->id(),
    ]);

    return $contract->fresh();
}
```

### 4. Database Schema
**File:** [database/migrations/2026_04_09_alter_contracts_add_workflow.php](database/migrations/2026_04_09_alter_contracts_add_workflow.php#L16-L20)
```php
$table->foreignId('workflow_id')->index()->nullable()->constrained('workflows');
$table->foreignId('workflow_step_id')->index()->nullable()->constrained('workflow_steps');
$table->boolean('is_active')->default(true)->index();
$table->timestamp('submitted_at')->nullable()->index();  // ← Added for submission timestamp
```

**Also added:**
**File:** [database/migrations/2026_04_10_000000_add_contract_type_to_contracts.php](database/migrations/2026_04_10_000000_add_contract_type_to_contracts.php)
```php
$table->string('contract_type', 100)->default('Service Agreement')->index();
```

---

## Testing the API

### Via cURL
```bash
curl -X POST "http://localhost:8000/api/contracts/CONTRACT-UUID/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN"
```

### Via Frontend (React)
Click the "Kirim" (Send) button on a draft contract:
- Button appears only for draft contracts
- Calls `contractApi.send(contract.id)`
- Shows toast success/error message
- Updates contract in real-time

### Via Tinker
```bash
php artisan tinker

# Get a draft contract
$c = App\Models\Contract::where('status', 'draft')->first();

# Call the service
app(App\Services\ContractWorkflowService::class)->sendForApproval($c);

# Verify results
$c->fresh();
$c->submitted_at;        // Shows current datetime
$c->workflow_id;         // Shows workflow ID
$c->workflow_step_id;    // Shows first step ID
$c->approvals->count();  // Shows number of approvals created
```

---

## Response Structure

### Success (200 OK)
```json
{
  "id": "contract-uuid",
  "contract_no": "CTR-2025-004",
  "title": "Kontrak Vendor IT Infrastructure",
  "status": "in_review",
  "workflow_id": 1,
  "workflow_step_id": 1,
  "submitted_at": "2026-04-10T14:30:45.000000Z",
  "approvals": [
    {
      "id": 1,
      "contract_id": "contract-uuid",
      "workflow_step_id": 1,
      "user_id": "approver-uuid",
      "approver_name": "Jane Smith",
      "role": "Legal",
      "status": "pending",
      "decided_at": null
    }
  ]
}
```

### Error: Not Draft (422)
```json
{
  "message": "Only draft contracts can be sent."
}
```

### Error: No Workflow (422)
```json
{
  "message": "No default workflow found for contract type: Service Agreement"
}
```

### Error: No Workflow Steps (422)
```json
{
  "message": "No workflow steps defined for this workflow"
}
```

---

## Field Details

### `workflow_id`
- Type: `foreignId` (references `workflows` table)
- Set to: ID of default workflow for contract type
- Example: `1` (Service Agreement workflow)

### `workflow_step_id`
- Type: `foreignId` (references `workflow_steps` table)
- Set to: ID of first workflow step (lowest sequence)
- Example: `1` (Legal review - first step)

### `submitted_at`
- Type: `timestamp`
- Set to: Current datetime when sent
- Format: `2026-04-10T14:30:45.000000Z`
- Nullable: Yes (null until sent)

### `status`
- Type: `enum`
- Changes from: `draft`
- Changes to: `in_review`

---

## Workflow Configuration

### Available Workflows (Seeded)
1. **Service Agreement** (ID: 1)
   - Steps: Legal → Tax → Management → Director

2. **Non-Disclosure Agreement** (ID: 2)
   - Steps: Legal → Management

3. **Purchase Agreement** (ID: 3)
   - Steps: Procurement → Legal → Finance → Director

4. **Employment Agreement** (ID: 4)
   - Steps: HR → Legal → Management

### How It Works
1. Contract created with `contract_type = 'Service Agreement'`
2. User clicks "Kirim" (Send) button
3. API finds default workflow for "Service Agreement"
4. Gets first step (Legal)
5. Sets `workflow_id = 1`, `workflow_step_id = 1`
6. Sets `submitted_at = NOW()`
7. Creates approval records for all Legal users
8. Contract status becomes `in_review`
9. Legal users see pending approval in their queue

---

## Files Modified/Created

### New Files
- [database/migrations/2026_04_10_000000_add_contract_type_to_contracts.php](database/migrations/2026_04_10_000000_add_contract_type_to_contracts.php) - Added contract_type column

### Modified Files
- [app/Services/ContractWorkflowService.php](app/Services/ContractWorkflowService.php) - Updated sendForApproval() to set submitted_at

---

## Status: ✅ Production Ready

- ✅ API endpoint created
- ✅ Workflow service implemented
- ✅ Database columns added
- ✅ Frontend integration working
- ✅ submitted_at timestamp implemented
- ✅ Migrations tested
- ✅ Error handling complete
- ✅ Documentation complete

**Ready for use!** 🚀
