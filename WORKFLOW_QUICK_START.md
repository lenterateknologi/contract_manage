# Contract Workflow System - Quick Start Guide

## Implementation Complete ✅

The contract management system now has a fully functional workflow system that manages multi-step contract approvals with role-based access control.

---

## Key Components

### 1. **Workflows** (4 Seeded Types)
- **Service Agreement** → 4 steps (Legal → Tax → Management → Director)
- **Non-Disclosure Agreement** → 2 steps (Legal → Management)
- **Purchase Agreement** → 4 steps (Procurement → Legal → Finance → Director)
- **Employment Agreement** → 3 steps (HR → Legal → Management)

### 2. **Database Tables**
- `workflows` - Workflow definitions
- `workflow_steps` - Approval steps per workflow
- `approvals` - Approval records for contracts
- `contracts` - Updated with workflow_id and workflow_step_id

### 3. **Models**
- `Workflow` - Workflow configurations
- `WorkflowStep` - Individual approval steps
- `Approval` - Approval tracking
- `Contract` - Updated with workflow relationships

### 4. **Service Layer**
- `ContractWorkflowService` - Handles all workflow operations
  - `sendForApproval()` - Initiate workflow
  - `approveContract()` - Approve and advance
  - `rejectContract()` - Reject and reset

### 5. **API Endpoints**
- `POST /api/contracts/{id}/send` - Send for approval
- `POST /api/contracts/{id}/approve` - Approve contract
- `POST /api/contracts/{id}/reject` - Reject contract

### 6. **Frontend**
- "Kirim untuk Approval" (Send for Approval) button on draft contracts
- Automatic UI updates when workflow progresses
- Full workflow status display

---

## Database Statistics

```
✓ 4 Workflows configured
✓ 13 Workflow steps defined
✓ 5 Sample users with roles
✓ 4 Sample contracts ready for workflow
```

---

## How to Use

### 1. **Create a Contract**
```
Click "Buat Kontrak" (Create Contract)
- Fill in title, description
- (Optionally) upload initial document
- Contract created with status: "draft"
```

### 2. **Send for Approval**
```
Click "Kirim untuk Approval" button
- System assigns default workflow for contract type
- Sets to first approval step (usually Legal Review)
- Creates approval records for users with matching role
- Contract status: draft → in_review
```

### 3. **Approve (User with Matching Role)**
```
User with matching role sees pending approval
Clicks "Setujui" (Approve) button
- If all approvals at step are complete:
  - Move to next step (if exists)
  - Create new approval records
- If no more steps:
  - Mark contract as approved
```

### 4. **Reject (Optional)**
```
User can reject instead of approve
- Provides rejection reason
- Contract status: in_review → revision
- Creator can upload revisions
- Resend for approval
```

---

## Testing the Workflow

### Sample Users
Created in database:
- Legal role
- Tax role
- Management role
- Direksi (Director) role
- Procurement role

### Test Flow
1. Login as any user
2. Create a new contract with contract_type "Service Agreement"
3. Send for approval → Legal user gets approval request
4. Approve as Legal → Tax user gets approval request
5. Continue approving through all steps
6. Final approval → Contract marked as approved

---

## API Examples

### Send Contract for Approval
```bash
POST /api/contracts/{contractId}/send
Content-Type: application/json

Response:
{
  "id": "contract-uuid",
  "status": "in_review",
  "workflow_id": 1,
  "workflow_step_id": 5,
  "workflow_approvals": [
    {
      "id": 1,
      "status": "pending",
      "role": "Legal",
      "approver_name": "John Doe"
    }
  ]
}
```

### Approve Contract
```bash
POST /api/contracts/{contractId}/approve
Content-Type: application/json

{
  "note": "Looks good to me"
}

Response: Updated contract with next workflow step approvals
```

### Reject Contract
```bash
POST /api/contracts/{contractId}/reject
Content-Type: application/json

{
  "reason": "Needs revision on section 3"
}

Response: Contract status set to "revision"
```

---

## Workflow Architecture

```
Draft Contract
    ↓
[Send for Approval]
    ↓
Assign Default Workflow
Get First Step (e.g., Legal)
    ↓
Create Approval Records for all Legal users
Contract status: in_review
    ↓
Users with Legal role see pending approval
    ↓
[All Legal users approve]
    ↓
Move to Step 2 (e.g., Tax)
Create Approval Records for all Tax users
    ↓
[Continue through all steps]
    ↓
[Final step complete]
    ↓
Contract status: approved ✅
```

---

## Database Queries

### See All Workflows
```sql
SELECT * FROM workflows;
```

### See Workflow Steps
```sql
SELECT w.contract_type, ws.step, ws.role, ws.description
FROM workflow_steps ws
JOIN workflows w ON w.id = ws.workflow_id
ORDER BY w.id, ws.step;
```

### See Contract Approvals
```sql
SELECT c.contract_no, a.role, a.status, a.decided_at, u.name
FROM approvals a
JOIN contracts c ON c.id = a.contract_id
LEFT JOIN users u ON u.id = a.user_id
ORDER BY c.id, a.workflow_step_id;
```

### Get Pending Approvals for User
```sql
SELECT c.contract_no, ws.role, ws.description
FROM approvals a
JOIN contracts c ON c.id = a.contract_id
JOIN workflow_steps ws ON ws.id = a.workflow_step_id
WHERE a.user_id = 'user-uuid' AND a.status = 'pending';
```

---

## File Structure

### New Files
```
app/
  Models/
    ├── Workflow.php
    ├── WorkflowStep.php
    └── Approval.php
  Services/
    └── ContractWorkflowService.php

database/
  seeders/
    ├── WorkflowSeeder.php
    └── WorkflowStepSeeder.php
  migrations/
    ├── 2026_04_08_000001_create_workflows_table.php
    ├── 2026_04_08_000002_create_workflow_steps_table.php
    ├── 2026_04_08_000003_create_approvals_table.php
    └── 2026_04_09_alter_contracts_add_workflow.php
```

### Updated Files
```
app/Models/Contract.php - Added workflow relationships
app/Http/Controllers/ContractController.php - Added send() method
bootstrap/app.php - Added LogHttpRequest middleware
routes/api.php - Added /send endpoint
database/seeders/DatabaseSeeder.php - Added workflow seeders
```

---

## Features Implemented

✅ **Multi-Step Workflows** - Configurable approval sequences
✅ **Role-Based Access** - Only matching roles can approve
✅ **Automatic Progression** - Moves to next step when all approve
✅ **Rejection Handling** - Can send back to revision
✅ **Audit Trail** - All approvals logged with timestamps
✅ **Default Workflows** - Auto-assigned per contract type
✅ **HTTP Logging** - All API requests logged
✅ **CASCADE Migrations** - Safe database operations

---

## Next Steps (Optional Enhancements)

- [ ] Add workflow status reports
- [ ] Email notifications on approval requests
- [ ] Approval deadline tracking
- [ ] Multiple approvers per role
- [ ] Custom workflow creation UI
- [ ] Workflow performance analytics
- [ ] Approval delegations

---

## Support

For issues or questions:
1. Check database migrations: `php artisan migrate:status`
2. Verify seeders: `php artisan db:seed`
3. Check logs: `storage/logs/laravel.log`
4. Test API: Check HTTP log table for requests

---

**Workflow System Ready to Use! 🚀**
