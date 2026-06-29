# Master Data

### m_contract_types
| Column | Type | Nullable | FK To |
|---|---|---|---|
| parent_id | uuid | YES |  |
| f1_contract_template_id | uuid | YES | m_contract_templates.id |
| f2_contract_template_id | uuid | YES | m_contract_templates.id |
| workflow_id | uuid | YES |  |
| features | json | YES |  |
| id | uuid | NO |  |
| is_active | boolean | NO |  |
| created_by | uuid | YES |  |
| updated_by | uuid | YES |  |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| deleted_at | timestamp without time zone | YES |  |
| f1_form_template_id | uuid | YES | m_form_templates.id |
| f2_form_template_id | uuid | YES | m_form_templates.id |
| name | character varying | NO |  |
| code | character varying | NO |  |
| description | text | YES |  |
| f1_input_mechanism | character varying | YES |  |
| f2_input_mechanism | character varying | YES |  |

### m_access_modules
| Column | Type | Nullable | FK To |
|---|---|---|---|
| id | uuid | NO |  |
| role_id | uuid | NO | m_roles.id |
| module_id | uuid | NO | m_modules.id |
| module_group_id | uuid | YES | m_module_groups.id |
| can_read | boolean | NO |  |
| can_create | boolean | NO |  |
| can_update | boolean | NO |  |
| can_delete | boolean | NO |  |
| can_approve | boolean | NO |  |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| deleted_at | timestamp without time zone | YES |  |
| can_bulk_approve | boolean | NO |  |
| can_bulk_delete | boolean | NO |  |
| sequence | integer | YES |  |

### m_contract_statuses
| Column | Type | Nullable | FK To |
|---|---|---|---|
| id | uuid | NO |  |
| created_by | uuid | YES |  |
| updated_by | uuid | YES |  |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| deleted_at | timestamp without time zone | YES |  |
| is_active | boolean | NO |  |
| code | character varying | NO |  |
| label | character varying | NO |  |
| color | character varying | NO |  |
| bg_color | character varying | YES |  |
| icon | character varying | YES |  |
| description | text | YES |  |

### m_departments
| Column | Type | Nullable | FK To |
|---|---|---|---|
| company_id | uuid | YES | m_companies.id |
| updated_at | timestamp without time zone | YES |  |
| deleted_at | timestamp without time zone | YES |  |
| id | uuid | NO |  |
| is_active | boolean | NO |  |
| created_by | uuid | YES |  |
| updated_by | uuid | YES |  |
| created_at | timestamp without time zone | YES |  |
| name | character varying | NO |  |
| code | character varying | NO |  |
| description | text | YES |  |

### m_form_templates
| Column | Type | Nullable | FK To |
|---|---|---|---|
| deleted_at | timestamp without time zone | YES |  |
| updated_by | uuid | YES |  |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| id | uuid | NO |  |
| contract_type_id | uuid | YES | m_contract_types.id |
| has_letterhead | boolean | NO |  |
| letterhead_json | json | YES |  |
| is_active | boolean | NO |  |
| created_by | uuid | YES |  |
| name | character varying | NO |  |
| description | text | YES |  |
| document_type | character varying | NO |  |
| transaction_type | character varying | YES |  |

### m_roles
| Column | Type | Nullable | FK To |
|---|---|---|---|
| company_id | uuid | YES | m_companies.id |
| deleted_at | timestamp without time zone | YES |  |
| id | uuid | NO |  |
| created_by | uuid | YES |  |
| updated_by | uuid | YES |  |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| name | character varying | NO |  |
| description | text | YES |  |

### m_modules
| Column | Type | Nullable | FK To |
|---|---|---|---|
| id | uuid | NO |  |
| created_by | uuid | YES |  |
| updated_by | uuid | YES |  |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| deleted_at | timestamp without time zone | YES |  |
| module_group_id | uuid | YES | m_module_groups.id |
| showed_as_menu | boolean | NO |  |
| is_active | boolean | NO |  |
| name | character varying | NO |  |
| identifier | character varying | NO |  |
| description | text | YES |  |
| icon | character varying | YES |  |
| route | character varying | YES |  |

### m_form_fields
| Column | Type | Nullable | FK To |
|---|---|---|---|
| id | uuid | NO |  |
| form_template_id | uuid | NO | m_form_templates.id |
| parent_id | uuid | YES | m_form_fields.id |
| options | json | YES |  |
| validation_rules | json | YES |  |
| order | integer | NO |  |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| deleted_at | timestamp without time zone | YES |  |
| is_required | boolean | NO |  |
| use_rich_text | boolean | NO |  |
| label | character varying | NO |  |
| name | character varying | NO |  |
| type | character varying | NO |  |
| container_type | character varying | YES |  |
| width | character varying | NO |  |
| placeholder | character varying | YES |  |

### m_role_module_groups
| Column | Type | Nullable | FK To |
|---|---|---|---|
| id | bigint | NO |  |
| role_id | uuid | NO | m_roles.id |
| module_group_id | uuid | NO | m_module_groups.id |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| sequence | integer | YES |  |

### m_numbering_formats
| Column | Type | Nullable | FK To |
|---|---|---|---|
| updated_at | timestamp without time zone | YES |  |
| created_at | timestamp without time zone | YES |  |
| id | uuid | NO |  |
| current_number | integer | NO |  |
| padding | integer | NO |  |
| is_active | boolean | NO |  |
| module | character varying | NO |  |
| format_pattern | character varying | NO |  |

### m_contract_templates
| Column | Type | Nullable | FK To |
|---|---|---|---|
| deleted_at | timestamp without time zone | YES |  |
| template_folder_id | uuid | YES | m_template_folders.id |
| created_by | uuid | YES |  |
| updated_by | uuid | YES |  |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| id | uuid | NO |  |
| file_size | bigint | NO |  |
| name | character varying | NO |  |
| description | text | YES |  |
| file_path | character varying | NO |  |
| file_name | character varying | NO |  |
| file_type | character varying | YES |  |

### m_module_groups
| Column | Type | Nullable | FK To |
|---|---|---|---|
| deleted_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| id | uuid | NO |  |
| created_by | uuid | YES |  |
| updated_by | uuid | YES |  |
| created_at | timestamp without time zone | YES |  |
| name | character varying | NO |  |
| icon | character varying | YES |  |

### m_vendors
| Column | Type | Nullable | FK To |
|---|---|---|---|
| id | uuid | NO |  |
| is_active | boolean | NO |  |
| created_by | uuid | YES |  |
| updated_by | uuid | YES |  |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| deleted_at | timestamp without time zone | YES |  |
| is_individual | boolean | NO |  |
| npwp | character varying | YES |  |
| nib | character varying | YES |  |
| siup | character varying | YES |  |
| director_name | character varying | YES |  |
| bank_name | character varying | YES |  |
| bank_account_no | character varying | YES |  |
| company_type | character varying | YES |  |
| bank_account_name | character varying | YES |  |
| website | character varying | YES |  |
| pic_name | character varying | YES |  |
| pic_position | character varying | YES |  |
| name | character varying | NO |  |
| code | character varying | NO |  |
| email | character varying | YES |  |
| phone | character varying | YES |  |
| address | text | YES |  |
| tax_id | character varying | YES |  |
| category | character varying | YES |  |

### m_workflow_initiator_departments
| Column | Type | Nullable | FK To |
|---|---|---|---|
| id | uuid | NO |  |
| workflow_id | uuid | NO | m_workflows.id |
| department_id | uuid | NO | m_departments.id |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |

### m_workflow_step_roles
| Column | Type | Nullable | FK To |
|---|---|---|---|
| id | uuid | NO |  |
| workflow_step_id | uuid | NO | m_workflow_steps.id |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| role_name | character varying | NO |  |

### m_workflow_initiator_roles
| Column | Type | Nullable | FK To |
|---|---|---|---|
| id | uuid | NO |  |
| workflow_id | uuid | NO | m_workflows.id |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| role_name | character varying | NO |  |

### m_users
| Column | Type | Nullable | FK To |
|---|---|---|---|
| manager_id | uuid | YES | m_users.id |
| department_id | uuid | YES | m_departments.id |
| is_active | boolean | NO |  |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| deleted_at | timestamp without time zone | YES |  |
| company_id | uuid | YES | m_companies.id |
| id | uuid | NO |  |
| email_verified_at | timestamp without time zone | YES |  |
| role_id | uuid | YES | m_roles.id |
| name | character varying | NO |  |
| email | character varying | NO |  |
| remember_token | character varying | YES |  |
| password | character varying | NO |  |
| username | character varying | YES |  |
| phone | character varying | YES |  |
| bio | text | YES |  |

### m_workflow_initiator_users
| Column | Type | Nullable | FK To |
|---|---|---|---|
| id | uuid | NO |  |
| workflow_id | uuid | NO | m_workflows.id |
| user_id | uuid | NO | m_users.id |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |

### m_workflow_step_departments
| Column | Type | Nullable | FK To |
|---|---|---|---|
| id | uuid | NO |  |
| workflow_step_id | uuid | NO | m_workflow_steps.id |
| department_id | uuid | NO | m_departments.id |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |

### m_template_folders
| Column | Type | Nullable | FK To |
|---|---|---|---|
| updated_by | uuid | YES |  |
| id | uuid | NO |  |
| parent_id | uuid | YES | m_template_folders.id |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| deleted_at | timestamp without time zone | YES |  |
| created_by | uuid | YES |  |
| name | character varying | NO |  |

### m_workflow_step_users
| Column | Type | Nullable | FK To |
|---|---|---|---|
| id | uuid | NO |  |
| workflow_step_id | uuid | NO | m_workflow_steps.id |
| user_id | uuid | NO | m_users.id |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |

### m_submission_types
| Column | Type | Nullable | FK To |
|---|---|---|---|
| deleted_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| id | uuid | NO |  |
| is_active | boolean | NO |  |
| created_by | uuid | YES |  |
| updated_by | uuid | YES |  |
| created_at | timestamp without time zone | YES |  |
| code | character varying | NO |  |
| name | character varying | NO |  |

### m_vendor_documents
| Column | Type | Nullable | FK To |
|---|---|---|---|
| id | uuid | NO |  |
| vendor_id | uuid | NO | m_vendors.id |
| is_verified | boolean | NO |  |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| expires_at | date | YES |  |
| document_name | character varying | NO |  |
| document_type | character varying | NO |  |
| file_url | character varying | YES |  |

### m_company_groups
| Column | Type | Nullable | FK To |
|---|---|---|---|
| deleted_at | timestamp without time zone | YES |  |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| id | uuid | NO |  |
| is_active | boolean | NO |  |
| created_by | uuid | YES |  |
| updated_by | uuid | YES |  |
| name | character varying | NO |  |
| code | character varying | NO |  |
| description | text | YES |  |

### m_companies
| Column | Type | Nullable | FK To |
|---|---|---|---|
| deleted_at | timestamp without time zone | YES |  |
| updated_by | uuid | YES |  |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| id | uuid | NO |  |
| company_group_id | uuid | YES | m_company_groups.id |
| region_id | uuid | YES | m_regions.id |
| is_active | boolean | NO |  |
| created_by | uuid | YES |  |
| name | character varying | NO |  |
| code | character varying | NO |  |
| alias | character varying | YES |  |
| address | text | YES |  |

### m_regions
| Column | Type | Nullable | FK To |
|---|---|---|---|
| deleted_at | timestamp without time zone | YES |  |
| created_by | uuid | YES |  |
| updated_by | uuid | YES |  |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| id | uuid | NO |  |
| is_active | boolean | NO |  |
| name | character varying | NO |  |
| code | character varying | NO |  |
| alias | character varying | YES |  |
| id_portal_master | character varying | YES |  |
| description | text | YES |  |

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

### telescope_entries
| Column | Type | Nullable | FK To |
|---|---|---|---|
| created_at | timestamp without time zone | YES |  |
| uuid | uuid | NO |  |
| batch_id | uuid | NO |  |
| should_display_on_index | boolean | NO |  |
| sequence | bigint | NO |  |
| type | character varying | NO |  |
| family_hash | character varying | YES |  |
| content | text | NO |  |

### telescope_entries_tags
| Column | Type | Nullable | FK To |
|---|---|---|---|
| entry_uuid | uuid | NO | telescope_entries.uuid |
| tag | character varying | NO |  |

### telescope_monitoring
| Column | Type | Nullable | FK To |
|---|---|---|---|
| tag | character varying | NO |  |

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

