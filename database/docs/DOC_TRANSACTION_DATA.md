# Transaction Data

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

### t_contracts
| Column | Type | Nullable | FK To |
|---|---|---|---|
| contract_type_parent_id | uuid | YES |  |
| assigned_at | timestamp without time zone | YES |  |
| finished_at | timestamp without time zone | YES |  |
| closed_at | timestamp without time zone | YES |  |
| closed_by | uuid | YES |  |
| origin_workflow_id | uuid | YES |  |
| id | uuid | NO |  |
| contract_date | date | YES |  |
| end_date | date | YES |  |
| contract_type_id | uuid | YES | m_contract_types.id |
| current_version | integer | NO |  |
| workflow_id | uuid | YES | m_workflows.id |
| workflow_step_id | uuid | YES | m_workflow_steps.id |
| created_by | uuid | NO | m_users.id |
| metadata | json | YES |  |
| submitted_at | timestamp without time zone | YES |  |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| deleted_at | timestamp without time zone | YES |  |
| initiated_by_id | uuid | YES | m_users.id |
| vendor_id | uuid | YES | m_vendors.id |
| parent_id | uuid | YES | t_contracts.id |
| submission_type_id | uuid | YES | m_submission_types.id |
| is_digital_signature | boolean | NO |  |
| assigned_pic_id | uuid | YES | m_users.id |
| assigned_by_id | uuid | YES | m_users.id |
| received_at | timestamp without time zone | YES |  |
| contract_no | character varying | NO |  |
| title | character varying | NO |  |
| description | text | YES |  |
| transaction_type | character varying | NO |  |
| status | character varying | NO |  |
| crown_no | character varying | YES |  |

### t_contract_meta
| Column | Type | Nullable | FK To |
|---|---|---|---|
| contract_id | uuid | NO | t_contracts.id |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| kop_lampiran | character varying | YES |  |
| f1_tujuan | text | YES |  |
| f1_sifat | character varying | YES |  |
| p1_entity | character varying | YES |  |
| p1_signer | character varying | YES |  |
| p1_signer_position | character varying | YES |  |
| p1_address | text | YES |  |
| p2_entity | character varying | YES |  |
| p2_signer | character varying | YES |  |
| p2_signer_position | character varying | YES |  |
| p2_address | text | YES |  |
| f2_scope | text | YES |  |
| f2_price | character varying | YES |  |
| f2_payment | character varying | YES |  |
| f2_tenure | character varying | YES |  |
| f2_location | text | YES |  |
| kop_topik | character varying | YES |  |
| kop_sub_topik | character varying | YES |  |

### t_contract_h
| Column | Type | Nullable | FK To |
|---|---|---|---|
| deleted_at | timestamp without time zone | YES |  |
| contract_id | uuid | NO | t_contracts.id |
| updated_at | timestamp without time zone | YES |  |
| id | uuid | NO |  |
| actor_id | uuid | NO | m_users.id |
| created_at | timestamp without time zone | YES |  |
| action | character varying | NO |  |
| description | text | YES |  |

### t_approvals
| Column | Type | Nullable | FK To |
|---|---|---|---|
| sub_step | integer | YES |  |
| contract_id | uuid | NO | t_contracts.id |
| workflow_step_id | uuid | NO | m_workflow_steps.id |
| user_id | uuid | YES | m_users.id |
| updated_by | uuid | YES | m_users.id |
| created_at | timestamp without time zone | YES |  |
| updated_at | timestamp without time zone | YES |  |
| deleted_at | timestamp without time zone | YES |  |
| sort_order | integer | NO |  |
| id | uuid | NO |  |
| sequence | integer | NO |  |
| decided_at | timestamp without time zone | YES |  |
| is_active | boolean | NO |  |
| created_by | uuid | YES | m_users.id |
| approver_name | character varying | YES |  |
| role | character varying | NO |  |
| job_title | character varying | YES |  |
| status | character varying | NO |  |
| comment | text | YES |  |
| attachment_path | character varying | YES |  |

