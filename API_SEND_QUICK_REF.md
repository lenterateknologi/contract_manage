# API "Send Contract" - Quick Reference Card

## 🎯 What It Does

Sends a contract for approval workflow. The API:
1. Assigns default workflow based on `contract_type`
2. Sets to first workflow step
3. Records submission timestamp in `submitted_at` field
4. Creates approval records for matching role users
5. Changes status to `in_review`

---

## 📍 Endpoint

```
POST /api/contracts/{id}/send
```

**Example:**
```
POST http://localhost:8000/api/contracts/550e8400-e29b-41d4-a716-446655440000/send
```

---

## 📤 Request

**Method:** POST  
**Content-Type:** application/json  
**Auth:** Bearer token required

```bash
curl -X POST "http://localhost:8000/api/contracts/{id}/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN"
```

---

## ✅ Success Response (200)

```json
{
  "id": "contract-uuid",
  "contract_no": "CTR-2025-004",
  "status": "in_review",
  "workflow_id": 1,
  "workflow_step_id": 1,
  "submitted_at": "2026-04-10T14:30:45.000000Z",
  "approvals": [
    {
      "id": 1,
      "approver_name": "Jane Smith",
      "role": "Legal",
      "status": "pending"
    }
  ]
}
```

---

## ❌ Error Responses

| Status | Message | Reason |
|--------|---------|--------|
| 404 | Not found | Contract doesn't exist |
| 422 | Only draft contracts can be sent | Contract not in draft status |
| 422 | No default workflow found | No workflow for contract type |
| 422 | No workflow steps defined | Workflow has no steps |

---

## 🔄 Database Changes

### Before Send
```
workflow_id:      null
workflow_step_id: null
submitted_at:     null
status:           draft
```

### After Send
```
workflow_id:      1
workflow_step_id: 1
submitted_at:     2026-04-10T14:30:45Z
status:           in_review
```

---

## 🎛️ Workflows (Auto-Assigned)

| Contract Type | Workflow ID | Steps | First Step |
|---------------|-------------|-------|-----------|
| Service Agreement | 1 | 4 | Legal |
| NDA | 2 | 2 | Legal |
| Purchase Agreement | 3 | 4 | Procurement |
| Employment Agreement | 4 | 3 | HR |

---

## 🖱️ Frontend Usage

**Button appears only for draft contracts:**
```javascript
{selected.status === 'draft' && (
  <button onClick={handleSendForApproval}>
    <i className="fa-solid fa-paper-plane" /> Kirim 
  </button>
)}
```

**Click → Toast notification → Contract updated**

---

## 🧪 Quick Test

### Terminal (Tinker)
```bash
php artisan tinker

$c = App\Models\Contract::where('status', 'draft')->first();
app(App\Services\ContractWorkflowService::class)->sendForApproval($c);
$c->fresh();  # Check results
```

### Browser
1. Navigate to contracts page
2. Click on draft contract
3. Click "Kirim" button
4. See success toast
5. Status changes to "in_review"

---

## 📋 What Gets Set

| Field | Set To | Example |
|-------|--------|---------|
| `workflow_id` | Default workflow for contract type | 1 |
| `workflow_step_id` | First workflow step | 1 |
| `submitted_at` | Current datetime | 2026-04-10T14:30:45Z |
| `status` | in_review | in_review |

---

## 🔐 Security

- ✅ Requires authentication (middleware: auth)
- ✅ Only draft contracts can be sent
- ✅ Validates workflow existence
- ✅ Validates workflow steps exist
- ✅ Records actor (who sent it) in history

---

## 📂 Implementation Files

| File | Purpose |
|------|---------|
| `routes/api.php` | Route definition |
| `app/Http/Controllers/ContractController.php` | Endpoint handler |
| `app/Services/ContractWorkflowService.php` | Business logic |
| `database/migrations/2026_04_09_alter_contracts_add_workflow.php` | workflow_id, workflow_step_id, submitted_at columns |
| `database/migrations/2026_04_10_000000_add_contract_type_to_contracts.php` | contract_type column |

---

## ⚙️ How It Works

```
1. Client: POST /api/contracts/{id}/send
   ↓
2. Controller: Validate contract is draft
   ↓
3. Service: Get default workflow by contract_type
   ↓
4. Service: Get first workflow step
   ↓
5. Database: Update contract with:
   - workflow_id
   - workflow_step_id  
   - status = in_review
   - submitted_at = NOW()
   ↓
6. Service: Create approval records for matching role users
   ↓
7. Service: Log in history
   ↓
8. Response: Return updated contract
```

---

## 🚀 Status: Ready to Use

All components implemented and tested. Production ready!
