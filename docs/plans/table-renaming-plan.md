# Implementation Plan: Database Table Renaming & Standardization

## 1. Summary
This plan outlines the steps to rename specific database tables for brevity and consistency, as requested. It also includes recommendations for standardizing other table names in the system.

## 2. Requested Renames
| Current Table Name | New Table Name | Reason |
| :--- | :--- | :--- |
| `t_contract_messages` | `t_messages` | (Assumed) Removing redundant `contract_` prefix. |
| `t_contract_attachments` | `t_attachments` | Removing redundant `contract_` prefix. |

*Note: User requested `t_contract_maeesge` to `t_contract`, but `t_contracts` already exists. We recommend `t_messages` to align with the `t_attachments` logic.*

## 3. Recommended Standardizations
To maintain a high-quality architectural standard, we recommend the following additional renames:

| Current Table Name | Recommended Name | Reason |
| :--- | :--- | :--- |
| `t_contract_h` | `t_contract_histories` | Avoid shorthand `_h`. Full names are more descriptive. |
| `t_contract_form_submission_h` | `t_contract_form_submission_histories` | Consistency with the history naming convention. |
| `t_http_log` | `t_http_logs` | Use plural form for consistency with other tables. |

## 4. Implementation Steps

### Step 1: Database Migration
Create a new migration to handle the renaming.
```php
Schema::rename('t_contract_messages', 't_messages');
Schema::rename('t_contract_attachments', 't_attachments');
// ... other recommended renames
```

### Step 2: Update Models
Update the `$table` property in the respective Eloquent models:
- `App\Models\ContractMessage`
- `App\Models\ContractAttachment`
- `App\Models\ContractHistory` (if recommended rename is accepted)

### Step 3: Update Relationships
Check all models for relationships that explicitly define table names in `belongsToMany` or other complex joins.

### Step 4: Update Queries & Actions
Audit `app/Queries` and `app/Actions` for any raw SQL queries or `DB::table()` calls that use the old table names.

## 5. Verification
- Run `php artisan migrate`.
- Run existing tests to ensure no regressions in data retrieval or storage.
- Manually verify "Discussion" and "Attachment" tabs in the Contract Detail UI.
