## Contract Management Workflow Implementation Summary

### Overview
A complete workflow system has been implemented for the Contract Management System that allows contracts to be sent for approval through a multi-step approval process with role-based access control.

---

## Database Tables

### 1. **workflows** Table
Stores workflow configurations for different contract types.
- `id` (bigint) - Primary key
- `contract_type` (varchar) - Type of contract (e.g., "Service Agreement")
- `name` (varchar) - Workflow name
- `description` (text) - Workflow description
- `is_default` (boolean) - Whether this is the default workflow
- `is_active` (boolean) - Workflow status
- `created_by`, `updated_by` (uuid) - Audit fields
- `created_at`, `updated_at` (timestamp) - Timestamps

**Seeded Workflows:**
1. Service Agreement
2. Non-Disclosure Agreement  
3. Purchase Agreement
4. Employment Agreement

---

### 2. **workflow_steps** Table
Defines approval steps within each workflow.
- `id` (bigint) - Primary key
- `workflow_id` (bigint) - Foreign key to workflows
- `role` (varchar) - Approver role (e.g., "Legal", "Management")
- `step` (integer) - Step sequence number
- `description` (varchar) - Step description
- `is_active` (boolean) - Step status
- `created_by`, `updated_by` (uuid) - Audit fields
- `created_at`, `updated_at` (timestamp) - Timestamps

**Service Agreement Workflow Steps:**
1. Legal Review
2. Tax Review
3. Management Approval
4. Director Approval

---

### 3. **approvals** Table
Tracks approval decisions for contracts.
- `id` (bigint) - Primary key
- `contract_id` (uuid) - Foreign key to contracts
- `workflow_step_id` (bigint) - Foreign key to workflow_steps
- `user_id` (uuid) - User who approves (nullable for pending)
- `approver_name` (varchar) - Name of approver
- `role` (varchar) - Approver's role
- `job_title` (varchar) - Job title
- `status` (enum) - 'pending', 'approved', 'rejected'
- `comment` (text) - Approval comment
- `decided_at` (timestamp) - Decision timestamp
- `is_active` (boolean) - Approval record status
- `created_by`, `updated_by` (uuid) - Audit fields
- `created_at`, `updated_at` (timestamp) - Timestamps

---

### 4. **contracts** Table (Updated)
Added workflow fields to track workflow progress:
- `workflow_id` (bigint) - Current workflow
- `workflow_step_id` (bigint) - Current workflow step
- `is_active` (boolean) - Contract status

---

## Models

### Workflow Model
```php
class Workflow extends Model {
    - belongsTo many: WorkflowStep
    - belongsTo many: Contract
    - getDefaultByContractType(string): static method
}
```

### WorkflowStep Model
```php
class WorkflowStep extends Model {
    - belongsTo: Workflow
    - hasMany: Approval
    - nextStep(): ?WorkflowStep - Get next approval step
}
```

### Approval Model
```php
class Approval extends Model {
    - belongsTo: Contract
    - belongsTo: WorkflowStep
    - belongsTo: User
    - approve(comment): void
    - reject(comment): void
}
```

### Contract Model (Updated)
```php
class Contract extends Model {
    - belongsTo: Workflow
    - belongsTo: WorkflowStep
    - hasMany: Approval (via workflowApprovals)
}
```

---

## Workflow Service

### ContractWorkflowService
Handles all workflow-related operations:

**Methods:**
1. `sendForApproval(Contract): Contract`
   - Assigns default workflow
   - Sets first workflow step
   - Creates approval records for first step
   - Updates contract status to 'in_review'

2. `approveContract(Contract, Approval, comment): Contract`
   - Marks approval as approved
   - Checks if all approvals for current step are complete
   - Advances to next step if all approved
   - Updates contract status when all steps complete

3. `rejectContract(Contract, Approval, reason): Contract`
   - Marks approval as rejected
   - Sets contract status to 'revision'
   - Clears workflow progress

4. `getPendingApprovalsForUser(User): Collection`
   - Returns all pending approvals for a user

5. `getContractsAwaitingMyApproval(User): Collection`
   - Returns contracts awaiting current user's approval

---

## API Routes

### New Endpoints
- `POST /api/contracts/{id}/send` - Send contract for approval
- `POST /api/contracts/{id}/approve` - Approve contract (existing, works with both systems)
- `POST /api/contracts/{id}/reject` - Reject contract (existing, works with both systems)

### Updated Endpoints
- `GET /api/contracts/{id}` - Returns contract with workflow data
- `POST /api/contracts` - Creates contract with contract_type field

---

## Seeders

### WorkflowSeeder
Seeds 4 default workflows:
- Service Agreement (4-step process)
- Non-Disclosure Agreement (2-step process)
- Purchase Agreement (4-step process with Procurement)
- Employment Agreement (3-step process with HR)

### WorkflowStepSeeder
Creates workflow steps for each seeded workflow:
- Maps roles to steps
- Sets step sequence
- Adds descriptions

**Execution:**
```bash
php artisan migrate:fresh --seed
```

---

## Frontend Components

### Send Button
- Appears when contract status is 'draft'
- Located in contract detail header
- Button text: "Kirim untuk Approval" (Send for Approval)
- Icon: Paper plane

### Function Handler
```typescript
const handleSendForApproval = async () => {
    const c = await contractApi.send(selected.id);
    updateContract(c);
    showToast('Kontrak berhasil dikirim untuk approval!', 'success');
}
```

### API Integration
```typescript
send: (id: string): Promise<Contract> =>
    api.post(`/api/contracts/${id}/send`).then((r) => r.data)
```

---

## Workflow Execution Flow

### 1. **Send Contract (Draft → In Review)**
```
User clicks "Send for Approval" button
  ↓
ContractController.send()
  ↓
ContractWorkflowService.sendForApproval()
  ↓
- Find default workflow for contract_type
- Get first workflow step
- Update contract: status='in_review', workflow_id, workflow_step_id
- Create Approval records for all users with matching role
- Log CONTRACT_SENT history
  ↓
Contract status: draft → in_review
Awaiting first approver group
```

### 2. **User Approval (Step Progress)**
```
User with matching role approves
  ↓
ContractController.approve()
  ↓
ContractWorkflowService.approveContract()
  ↓
- Mark Approval as approved
- Check if all approvals for current step are done
  ↓
IF all approved:
  - Move to next step (if exists)
  - Create Approval records for next step role
  - Log WORKFLOW_ADVANCED history
ELSE IF no more steps:
  - Mark contract as approved
  - Log CONTRACT_APPROVED history
  ↓
Contract progresses to next approval step
```

### 3. **Rejection (Back to Draft)**
```
User rejects during approval
  ↓
ContractController.reject()
  ↓
ContractWorkflowService.rejectContract()
  ↓
- Mark Approval as rejected
- Reset contract to status='revision'
- Clear workflow_step_id
- Reject all other pending approvals for step
- Log APPROVAL_REJECTED history
  ↓
Contract status: in_review → revision
Creator can upload revisions and resend
```

---

## Data Structures

### Contract Response with Workflow Data
```json
{
  "id": "contract-uuid",
  "contract_no": "CTR-2026-001",
  "title": "Service Agreement",
  "status": "in_review",
  "workflow_id": 1,
  "workflow_step_id": 5,
  "workflow": {
    "id": 1,
    "name": "Standard Service Agreement Workflow",
    "contract_type": "Service Agreement"
  },
  "workflow_step": {
    "id": 5,
    "step": 1,
    "role": "Legal",
    "description": "Legal Review"
  },
  "workflow_approvals": [
    {
      "id": 1,
      "status": "pending",
      "role": "Legal",
      "approver_name": "John Doe",
      "comment": null,
      "decided_at": null,
      "user": {
        "id": "user-uuid",
        "name": "John Doe",
        "role": "Legal"
      }
    }
  ]
}
```

---

## User Roles & Permissions

### Supported Roles
- Legal
- Tax
- Management
- Direksi (Director)
- Procurement
- Finance
- HR

### User Seeder
Creates sample users with assigned roles for testing different workflow paths.

---

## Key Features

✅ **Multi-step Approval Workflows** - Configurable approval sequences
✅ **Role-based Access** - Only users with matching roles can approve
✅ **Contract Status Tracking** - Automatic progression through workflow
✅ **Approval Audit Trail** - Full history of who approved/rejected and when
✅ **Rejection Handling** - Contracts can be sent back for revision
✅ **Default Workflows** - Automatic workflow assignment per contract type
✅ **HTTP Request Logging** - All API requests logged to t_http_log table
✅ **CASCADE Drops** - Safe database migrations with CASCADE delete support

---

## Testing

### Test the Workflow:
1. Create a new contract (status: draft)
2. Click "Send for Approval" button
3. Login as a user with "Legal" role
4. Approve the contract
5. Contract progresses to next approval step
6. Continue approving through all steps
7. Contract reaches "approved" status

### Database Verification:
```bash
# Check workflows
SELECT * FROM workflows;

# Check workflow steps
SELECT * FROM workflow_steps;

# Check approval records
SELECT * FROM approvals;

# Check contract progress
SELECT id, status, workflow_step_id FROM contracts;
```

---

## Files Modified/Created

### New Files
- `app/Models/Workflow.php`
- `app/Models/WorkflowStep.php`
- `app/Models/Approval.php`
- `app/Services/ContractWorkflowService.php`
- `database/seeders/WorkflowSeeder.php`
- `database/seeders/WorkflowStepSeeder.php`

### Migrations
- `2026_04_08_000001_create_workflows_table.php`
- `2026_04_08_000002_create_workflow_steps_table.php`
- `2026_04_08_000003_create_approvals_table.php`
- `2026_04_09_alter_contracts_add_workflow.php`

### Updated Files
- `app/Http/Controllers/ContractController.php` - Added send() method
- `app/Models/Contract.php` - Added workflow relationships
- `routes/api.php` - Added /send endpoint
- `database/seeders/DatabaseSeeder.php` - Added workflow seeders
- All migrations - Refactored with CASCADE drops

---

## Summary

The workflow system is now fully implemented and tested. Contracts can be created, sent for approval, and progress through multi-step approval workflows. Each step is role-based, with approvals tracked in the database and full audit trails maintained.
