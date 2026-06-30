# MasterKontrak

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

