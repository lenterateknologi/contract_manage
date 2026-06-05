# Implementation Plan: Form Builder Table Renaming (Removing "Contract" Prefix)

## 1. Summary
This plan details the steps to rename the form-related transactional tables by removing the redundant `contract_` prefix. This aligns with the previous standardization efforts and simplifies the schema for the Form Builder module.

## 2. Proposed Renames
| Current Table Name | New Table Name | Reason |
| :--- | :--- | :--- |
| `t_contract_form_submissions` | `t_form_submissions` | Standardizing and removing redundant prefix. |
| `t_contract_form_submission_histories` | `t_form_submission_histories` | Consistency with the submission table rename. |

## 3. Recommended Model Renames (Optional but Recommended)
To maintain consistency between models and tables:
| Current Model | Recommended New Model |
| :--- | :--- |
| `App\Models\ContractFormSubmission` | `App\Models\FormSubmission` |
| `App\Models\ContractFormSubmissionVersion` | `App\Models\FormSubmissionHistory` |

## 4. Implementation Steps

### Step 1: Database Migration
Create a migration to rename the tables:
```php
Schema::rename('t_contract_form_submissions', 't_form_submissions');
Schema::rename('t_contract_form_submission_histories', 't_form_submission_histories');
```

### Step 2: Update Models
- Update the `$table` property in the existing models.
- (If agreed) Rename the model files and class names.

### Step 3: Update Relationships
Update all models that reference these submissions:
- `Contract` model (`formSubmissions` relation).
- `FormTemplate` model (`submissions` relation).

### Step 4: Audit Controllers & Actions
Update references in:
- `ContractFormController`
- `StoreContractAction`
- `ExportFormSubmissionPdfAction`
- `ContractDetailQuery`

## 5. Verification
- Run `php artisan migrate`.
- Verify Form F1/F2 saving and retrieval in the UI.
- Verify PDF generation from forms.
- Verify "Version History" for forms.
