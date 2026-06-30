# MasterWorkflow

### m_workflows
| Column | Type | Nullable | FK To |
|---|---|---|---|
| meta | json | YES |  |
| legal_roles | json | YES |  |
| legal_departments | json | YES |  |
| legal_users | json | YES |  |
| contract_type_id | uuid | YES | m_contract_types.id |
| id | uuid | NO |  |
| department_id | uuid | YES | m_departments.id |
| is_default | boolean | NO |  |
| is_template | boolean | NO |  |
| is_active | boolean | NO |  |
| is_tax_involved | boolean | NO |  |
| created_by | uuid | YES |  |
| updated_by | uuid | YES |  |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| deleted_at | timestamp without time zone | YES |  |
| sla_drafting_hours | integer | NO |  |
| sla_total_hours | integer | NO |  |
| sla_cutoff_hour | integer | NO |  |
| company_group_ids | json | YES |  |
| region_ids | json | YES |  |
| company_ids | json | YES |  |
| approver_roles | json | YES |  |
| approver_departments | json | YES |  |
| approver_users | json | YES |  |
| name | character varying | NO |  |
| description | text | YES |  |
| workflow_category | character varying | YES |  |
| initiator_type | character varying | NO |  |
| scope | character varying | YES |  |

### m_workflow_steps
| Column | Type | Nullable | FK To |
|---|---|---|---|
| approver_config | json | YES |  |
| workflow_id | uuid | NO | m_workflows.id |
| step | integer | NO |  |
| company_ids | json | YES |  |
| allowed_actions | json | YES |  |
| is_mandatory | boolean | NO |  |
| filter_department | smallint | NO |  |
| filter_company_group | smallint | NO |  |
| filter_region | smallint | NO |  |
| filter_company | smallint | NO |  |
| id | uuid | NO |  |
| is_active | boolean | NO |  |
| created_by | uuid | YES |  |
| updated_by | uuid | YES |  |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| deleted_at | timestamp without time zone | YES |  |
| hierarchy_level | integer | YES |  |
| role_id | uuid | YES | m_roles.id |
| is_optional | boolean | NO |  |
| meta | jsonb | YES |  |
| company_group_ids | json | YES |  |
| region_ids | json | YES |  |
| approver_type | character varying | NO |  |
| condition_expression | character varying | YES |  |
| description | text | YES |  |
| step_category | character varying | YES |  |
| phase | character varying | YES |  |
| uploader_type | character varying | YES |  |
| label | character varying | YES |  |
| optional_label | character varying | YES |  |

### m_workflow_step_actions
| Column | Type | Nullable | FK To |
|---|---|---|---|
| transition_config | json | YES |  |
| workflow_step_id | uuid | NO | m_workflow_steps.id |
| next_step_id | uuid | YES | m_workflow_steps.id |
| next_workflow_id | uuid | YES | m_workflows.id |
| next_workflow_step_id | uuid | YES | m_workflow_steps.id |
| required_fields | json | YES |  |
| autofilled_fields | json | YES |  |
| is_active | boolean | NO |  |
| created_by | uuid | YES |  |
| updated_by | uuid | YES |  |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| deleted_at | timestamp without time zone | YES |  |
| signing_parties | json | YES |  |
| assignee_config | json | YES |  |
| id | uuid | NO |  |
| description | character varying | YES |  |
| action_code | character varying | YES |  |
| alias | character varying | YES |  |

