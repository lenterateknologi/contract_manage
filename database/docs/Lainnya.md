# Lainnya

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

### m_role_module_groups
| Column | Type | Nullable | FK To |
|---|---|---|---|
| id | bigint | NO |  |
| role_id | uuid | NO | m_roles.id |
| module_group_id | uuid | NO | m_module_groups.id |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| sequence | integer | YES |  |

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

### m_workflow_step_users
| Column | Type | Nullable | FK To |
|---|---|---|---|
| id | uuid | NO |  |
| workflow_step_id | uuid | NO | m_workflow_steps.id |
| user_id | uuid | NO | m_users.id |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |

### t_form_submissions
| Column | Type | Nullable | FK To |
|---|---|---|---|
| deleted_at | timestamp without time zone | YES |  |
| contract_id | uuid | NO | t_contracts.id |
| form_template_id | uuid | NO | m_form_templates.id |
| id | uuid | NO |  |
| current_version | integer | NO |  |
| submitted_by | uuid | YES | m_users.id |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| document_type | character varying | NO |  |

### t_form_submission_h
| Column | Type | Nullable | FK To |
|---|---|---|---|
| id | uuid | NO |  |
| submission_id | uuid | NO | t_form_submissions.id |
| version_no | integer | NO |  |
| form_data | json | NO |  |
| deleted_at | timestamp without time zone | YES |  |
| created_by | uuid | YES | m_users.id |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| change_summary | text | YES |  |

### t_attachments
| Column | Type | Nullable | FK To |
|---|---|---|---|
| id | uuid | NO |  |
| contract_id | uuid | NO | t_contracts.id |
| uploaded_by | uuid | NO | m_users.id |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| deleted_at | timestamp without time zone | YES |  |
| file_type | character varying | YES |  |
| label | character varying | NO |  |
| category | character varying | YES |  |
| file_name | character varying | NO |  |
| file_path | character varying | NO |  |

### t_contract_versions
| Column | Type | Nullable | FK To |
|---|---|---|---|
| id | uuid | NO |  |
| contract_id | uuid | NO | t_contracts.id |
| version_no | integer | NO |  |
| uploaded_by | uuid | NO | m_users.id |
| is_final | boolean | NO |  |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| deleted_at | timestamp without time zone | YES |  |
| file_name | character varying | NO |  |
| file_path | character varying | YES |  |
| document_type | character varying | YES |  |
| change_log | text | YES |  |
| file_hash | character varying | YES |  |

### t_forgot_password
| Column | Type | Nullable | FK To |
|---|---|---|---|
| updated_at | timestamp without time zone | YES |  |
| created_at | timestamp without time zone | YES |  |
| id | uuid | NO |  |
| user_id | uuid | NO | m_users.id |
| expire_at | timestamp without time zone | NO |  |
| redeemed_at | timestamp without time zone | YES |  |
| email | character varying | NO |  |
| token | character varying | NO |  |

### t_messages
| Column | Type | Nullable | FK To |
|---|---|---|---|
| id | uuid | NO |  |
| contract_id | uuid | NO | t_contracts.id |
| user_id | uuid | NO | m_users.id |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| deleted_at | timestamp without time zone | YES |  |
| read_by | json | YES |  |
| message | text | NO |  |
| attachment_path | character varying | YES |  |
| attachment_name | character varying | YES |  |

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

