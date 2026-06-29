# MasterUser

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

