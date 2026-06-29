# MasterFormBuilder

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

