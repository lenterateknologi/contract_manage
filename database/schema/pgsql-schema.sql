--
-- PostgreSQL database dump
--

\restrict WqSdABcclldD9qcUsPNcxpRbPrUHKn4yxvqc4adEnV7Jsk8eetbrMIBN4A1vNea

-- Dumped from database version 17.7 (Homebrew)
-- Dumped by pg_dump version 17.7 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: set_jobs_uuid(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_jobs_uuid() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        IF NEW.id IS NULL THEN
            NEW.id := gen_random_uuid();
        END IF;
        RETURN NEW;
    END;
    $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration integer NOT NULL
);


--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration integer NOT NULL,
    created_by uuid,
    updated_by uuid
);


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection text NOT NULL,
    queue text NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer,
    created_by uuid,
    updated_by uuid
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: m_access_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_access_modules (
    id uuid NOT NULL,
    role_id uuid NOT NULL,
    module_id uuid NOT NULL,
    module_group_id uuid,
    can_read boolean DEFAULT false NOT NULL,
    can_create boolean DEFAULT false NOT NULL,
    can_update boolean DEFAULT false NOT NULL,
    can_delete boolean DEFAULT false NOT NULL,
    can_approve boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    can_bulk_approve boolean DEFAULT false NOT NULL,
    can_bulk_delete boolean DEFAULT false NOT NULL,
    sequence integer,
    created_by uuid,
    updated_by uuid
);


--
-- Name: m_companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_companies (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(255) NOT NULL,
    alias character varying(255),
    address text,
    company_group_id uuid,
    region_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


--
-- Name: m_company_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_company_groups (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


--
-- Name: m_contract_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_contract_statuses (
    id uuid NOT NULL,
    code character varying(255) NOT NULL,
    label character varying(255) NOT NULL,
    color character varying(20) DEFAULT 'gray'::character varying NOT NULL,
    bg_color character varying(20),
    icon character varying(50),
    description text,
    created_by uuid,
    updated_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: m_contract_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_contract_templates (
    id uuid NOT NULL,
    template_folder_id uuid,
    name character varying(255) NOT NULL,
    description text,
    file_path character varying(255) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_size bigint DEFAULT '0'::bigint NOT NULL,
    file_type character varying(255),
    created_by uuid,
    updated_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


--
-- Name: m_contract_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_contract_types (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    f1_input_mechanism character varying(255) DEFAULT 'digital'::character varying,
    f1_form_template_id uuid,
    f2_input_mechanism character varying(255) DEFAULT 'digital'::character varying,
    f2_form_template_id uuid,
    f1_contract_template_id uuid,
    f2_contract_template_id uuid,
    workflow_id uuid,
    features json,
    parent_id uuid,
    contract_input_mechanism character varying(255) DEFAULT 'digital'::character varying,
    contract_form_template_id uuid,
    level smallint DEFAULT '0'::smallint NOT NULL
);


--
-- Name: COLUMN m_contract_types.parent_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.m_contract_types.parent_id IS 'induk dari jenis kontrak';


--
-- Name: COLUMN m_contract_types.level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.m_contract_types.level IS '0=Parent, 1=Child, 2=Subchild';


--
-- Name: m_departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_departments (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    company_id uuid
);


--
-- Name: m_division; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_division (
    id uuid NOT NULL,
    code character varying(255),
    id_portal_master uuid,
    name character varying(255) NOT NULL,
    department_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


--
-- Name: m_form_fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_form_fields (
    id uuid NOT NULL,
    form_template_id uuid NOT NULL,
    parent_id uuid,
    label character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    container_type character varying(255),
    width character varying(255) DEFAULT '100'::character varying NOT NULL,
    placeholder character varying(255),
    is_required boolean DEFAULT false NOT NULL,
    use_rich_text boolean DEFAULT false NOT NULL,
    options json,
    validation_rules json,
    "order" integer DEFAULT 0 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid,
    updated_by uuid
);


--
-- Name: m_form_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_form_templates (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    document_type character varying(255) DEFAULT 'contract'::character varying NOT NULL,
    contract_type_id uuid,
    transaction_type character varying(255),
    has_letterhead boolean DEFAULT false NOT NULL,
    letterhead_json json,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


--
-- Name: m_module_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_module_groups (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    icon character varying(255),
    created_by uuid,
    updated_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


--
-- Name: m_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_modules (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    identifier character varying(255) NOT NULL,
    module_group_id uuid,
    icon character varying(255),
    route character varying(255),
    showed_as_menu boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    description text
);


--
-- Name: m_numbering_formats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_numbering_formats (
    id uuid NOT NULL,
    module character varying(255) NOT NULL,
    format_pattern character varying(255) NOT NULL,
    current_number integer DEFAULT 0 NOT NULL,
    padding integer DEFAULT 3 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    created_by uuid,
    updated_by uuid
);


--
-- Name: m_regions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_regions (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(255) NOT NULL,
    alias character varying(255),
    id_portal_master character varying(255),
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


--
-- Name: m_role_module_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_role_module_groups (
    id bigint NOT NULL,
    role_id uuid NOT NULL,
    module_group_id uuid NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    sequence integer,
    created_by uuid,
    updated_by uuid
);


--
-- Name: m_role_module_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.m_role_module_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: m_role_module_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.m_role_module_groups_id_seq OWNED BY public.m_role_module_groups.id;


--
-- Name: m_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_roles (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_by uuid,
    updated_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    company_id uuid
);


--
-- Name: m_submission_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_submission_types (
    id uuid NOT NULL,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


--
-- Name: m_template_folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_template_folders (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    parent_id uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid,
    updated_by uuid
);


--
-- Name: m_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_users (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255),
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    username character varying(255),
    phone_number character varying(255),
    role_id uuid,
    department_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    company_id uuid,
    spv_id uuid,
    code character varying(255),
    company_group_id uuid,
    division_id uuid,
    login_status boolean DEFAULT false NOT NULL,
    last_login timestamp(0) without time zone,
    last_connected timestamp(0) without time zone,
    address text,
    birth_date date,
    gender character varying(10),
    created_by uuid,
    updated_by uuid,
    is_verified boolean DEFAULT false NOT NULL,
    verified_by uuid,
    verified_at timestamp(0) without time zone,
    job_position_id uuid,
    job_level_id uuid,
    image_src character varying(255),
    location_id uuid,
    region_id uuid,
    is_employee boolean DEFAULT true NOT NULL,
    id_employee_portal_master integer
);


--
-- Name: m_vendor_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_vendor_documents (
    id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    document_name character varying(255) NOT NULL,
    document_type character varying(255) NOT NULL,
    file_url character varying(255),
    expires_at date,
    is_verified boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    created_by uuid,
    updated_by uuid
);


--
-- Name: m_vendors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_vendors (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(255),
    address text,
    tax_id character varying(255),
    category character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    company_type character varying(255),
    is_individual boolean DEFAULT false NOT NULL,
    website character varying(255),
    pic_name character varying(255),
    pic_position character varying(255),
    npwp character varying(255),
    nib character varying(255),
    siup character varying(255),
    director_name character varying(255),
    bank_name character varying(255),
    bank_account_no character varying(255),
    bank_account_name character varying(255)
);


--
-- Name: m_workflow_contract_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_workflow_contract_types (
    workflow_id uuid NOT NULL,
    contract_type_id uuid NOT NULL
);


--
-- Name: m_workflow_initiator_authorities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_workflow_initiator_authorities (
    id uuid NOT NULL,
    workflow_id uuid NOT NULL,
    department_id uuid,
    division_id uuid,
    user_id uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    role_id uuid,
    authority_type character varying(32),
    company_group_id uuid,
    region_id uuid,
    role_use_initiator boolean DEFAULT false NOT NULL,
    department_use_initiator boolean DEFAULT false NOT NULL,
    division_use_initiator boolean DEFAULT false NOT NULL,
    company_group_use_initiator boolean DEFAULT false NOT NULL,
    region_use_initiator boolean DEFAULT false NOT NULL
);


--
-- Name: m_workflow_org_scopes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_workflow_org_scopes (
    id uuid NOT NULL,
    workflow_id uuid NOT NULL,
    company_group_id uuid,
    region_id uuid,
    company_id uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    is_initiator boolean DEFAULT false NOT NULL,
    scope_type character varying(32)
);


--
-- Name: m_workflow_step_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_workflow_step_actions (
    id uuid NOT NULL,
    workflow_step_id uuid NOT NULL,
    next_step_id uuid,
    next_workflow_id uuid,
    next_workflow_step_id uuid,
    required_fields json,
    autofilled_fields json,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    signing_parties json,
    assignee_config json,
    alias character varying(255),
    description character varying(255),
    action_code character varying(255),
    transition_config json
);


--
-- Name: m_workflow_step_authorities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_workflow_step_authorities (
    id uuid NOT NULL,
    workflow_step_id uuid NOT NULL,
    department_id uuid,
    division_id uuid,
    user_id uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    role_id uuid,
    authority_type character varying(32),
    is_additional boolean DEFAULT false NOT NULL,
    additional_type character varying(32),
    workflow_step_action_id uuid,
    target_step_id uuid,
    company_group_id uuid,
    region_id uuid,
    role_use_initiator boolean DEFAULT false NOT NULL,
    department_use_initiator boolean DEFAULT false NOT NULL,
    division_use_initiator boolean DEFAULT false NOT NULL,
    company_group_use_initiator boolean DEFAULT false NOT NULL,
    region_use_initiator boolean DEFAULT false NOT NULL
);


--
-- Name: m_workflow_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_workflow_steps (
    id uuid NOT NULL,
    workflow_id uuid NOT NULL,
    step integer NOT NULL,
    approver_type character varying(255) DEFAULT 'role'::character varying NOT NULL,
    condition_expression character varying(255),
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    phase character varying(255) DEFAULT 'f1_request'::character varying,
    uploader_type character varying(255),
    hierarchy_level integer,
    role_id uuid,
    step_category character varying(255),
    is_optional boolean DEFAULT false NOT NULL,
    optional_label character varying(255),
    meta jsonb,
    company_group_ids json,
    region_ids json,
    company_ids json,
    label character varying(255),
    allowed_actions json,
    is_mandatory boolean DEFAULT true NOT NULL,
    filter_department smallint DEFAULT '0'::smallint NOT NULL,
    filter_company_group smallint DEFAULT '0'::smallint NOT NULL,
    filter_region smallint DEFAULT '0'::smallint NOT NULL,
    filter_company smallint DEFAULT '0'::smallint NOT NULL,
    approver_config json
);


--
-- Name: COLUMN m_workflow_steps.filter_department; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.m_workflow_steps.filter_department IS 'if yes then get department initiator';


--
-- Name: COLUMN m_workflow_steps.filter_company_group; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.m_workflow_steps.filter_company_group IS 'if yes then get company_group_from initiator';


--
-- Name: COLUMN m_workflow_steps.filter_region; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.m_workflow_steps.filter_region IS 'if yes then get region initiator';


--
-- Name: COLUMN m_workflow_steps.filter_company; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.m_workflow_steps.filter_company IS 'if yes then get company initiator';


--
-- Name: m_workflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_workflows (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    department_id uuid,
    is_default boolean DEFAULT false NOT NULL,
    is_template boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_tax_involved boolean DEFAULT false NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    sla_drafting_hours integer DEFAULT 72 NOT NULL,
    sla_total_hours integer DEFAULT 240 NOT NULL,
    sla_cutoff_hour integer DEFAULT 16 NOT NULL,
    initiator_type character varying(255) DEFAULT 'all'::character varying NOT NULL,
    scope character varying(255) DEFAULT 'HO'::character varying,
    workflow_category character varying(255) DEFAULT 'unified'::character varying,
    company_group_ids json,
    region_ids json,
    company_ids json,
    approver_roles json,
    approver_departments json,
    approver_users json,
    legal_roles json,
    legal_departments json,
    legal_users json,
    contract_type_id uuid,
    meta json,
    is_selectable boolean DEFAULT true NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id uuid,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


--
-- Name: t_approvals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_approvals (
    id uuid NOT NULL,
    contract_id uuid NOT NULL,
    workflow_step_id uuid NOT NULL,
    user_id uuid,
    approver_name character varying(255),
    role character varying(255) NOT NULL,
    job_title character varying(255),
    status character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    comment text,
    sequence integer DEFAULT 0 NOT NULL,
    decided_at timestamp(0) without time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    attachment_path character varying(255),
    sort_order integer DEFAULT 0 NOT NULL,
    sub_step integer,
    CONSTRAINT t_approvals_status_check CHECK (((status)::text = ANY (ARRAY['pending'::text, 'waiting'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: t_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_attachments (
    id uuid NOT NULL,
    contract_id uuid NOT NULL,
    label character varying(255) NOT NULL,
    category character varying(255),
    file_name character varying(255) NOT NULL,
    file_path character varying(255) NOT NULL,
    file_type character varying(255),
    uploaded_by uuid NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid,
    updated_by uuid
);


--
-- Name: t_contract_h; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_contract_h (
    id uuid NOT NULL,
    contract_id uuid NOT NULL,
    action character varying(255) NOT NULL,
    description text,
    actor_id uuid NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid,
    updated_by uuid
);


--
-- Name: t_contract_meta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_contract_meta (
    contract_id uuid NOT NULL,
    kop_topik character varying(255),
    kop_sub_topik character varying(255),
    kop_lampiran character varying(255),
    f1_tujuan text,
    f1_sifat character varying(255),
    p1_entity character varying(255),
    p1_signer character varying(255),
    p1_signer_position character varying(255),
    p1_address text,
    p2_entity character varying(255),
    p2_signer character varying(255),
    p2_signer_position character varying(255),
    p2_address text,
    f2_scope text,
    f2_price character varying(255),
    f2_payment character varying(255),
    f2_tenure character varying(255),
    f2_location text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    created_by uuid,
    updated_by uuid
);


--
-- Name: t_contract_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_contract_versions (
    id uuid NOT NULL,
    contract_id uuid NOT NULL,
    version_no integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path character varying(255),
    document_type character varying(255),
    change_log text,
    uploaded_by uuid NOT NULL,
    is_final boolean DEFAULT false NOT NULL,
    file_hash character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid,
    updated_by uuid
);


--
-- Name: t_contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_contracts (
    id uuid NOT NULL,
    form_no character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    contract_date date,
    end_date date,
    contract_type_id uuid,
    transaction_type character varying(255) DEFAULT 'General'::character varying NOT NULL,
    status character varying(255) DEFAULT 'draft'::character varying NOT NULL,
    current_version integer DEFAULT 1 NOT NULL,
    workflow_id uuid,
    workflow_step_id uuid,
    created_by uuid NOT NULL,
    metadata json,
    submitted_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    initiated_by_id uuid,
    vendor_id uuid,
    parent_id uuid,
    submission_type_id uuid,
    contract_no character varying(255),
    is_digital_signature boolean DEFAULT false NOT NULL,
    assigned_pic_id uuid,
    assigned_by_id uuid,
    received_at timestamp(0) without time zone,
    assigned_at timestamp(0) without time zone,
    finished_at timestamp(0) without time zone,
    closed_at timestamp(0) without time zone,
    closed_by uuid,
    origin_workflow_id uuid,
    contract_type_parent_id uuid,
    updated_by uuid
);


--
-- Name: COLUMN t_contracts.origin_workflow_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.t_contracts.origin_workflow_id IS 'Workflow sebelumnya jika diubah dari workflow lain';


--
-- Name: COLUMN t_contracts.contract_type_parent_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.t_contracts.contract_type_parent_id IS 'induk dari jenis kontrak';


--
-- Name: t_forgot_password; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_forgot_password (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    user_id uuid NOT NULL,
    expire_at timestamp(0) without time zone NOT NULL,
    redeemed_at timestamp(0) without time zone,
    token character varying(64) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    created_by uuid,
    updated_by uuid
);


--
-- Name: t_form_submission_h; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_form_submission_h (
    id uuid NOT NULL,
    submission_id uuid NOT NULL,
    version_no integer NOT NULL,
    form_data json NOT NULL,
    change_summary text,
    created_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    updated_by uuid
);


--
-- Name: t_form_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_form_submissions (
    id uuid NOT NULL,
    contract_id uuid NOT NULL,
    form_template_id uuid NOT NULL,
    document_type character varying(10) NOT NULL,
    current_version integer DEFAULT 1 NOT NULL,
    submitted_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid,
    updated_by uuid
);


--
-- Name: t_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_messages (
    id uuid NOT NULL,
    contract_id uuid NOT NULL,
    user_id uuid NOT NULL,
    message text NOT NULL,
    read_by json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    attachment_path character varying(255),
    attachment_name character varying(255),
    created_by uuid,
    updated_by uuid
);


--
-- Name: telescope_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telescope_entries (
    sequence bigint NOT NULL,
    uuid uuid NOT NULL,
    batch_id uuid NOT NULL,
    family_hash character varying(255),
    should_display_on_index boolean DEFAULT true NOT NULL,
    type character varying(20) NOT NULL,
    content text NOT NULL,
    created_at timestamp(0) without time zone
);


--
-- Name: telescope_entries_sequence_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.telescope_entries_sequence_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: telescope_entries_sequence_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.telescope_entries_sequence_seq OWNED BY public.telescope_entries.sequence;


--
-- Name: telescope_entries_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telescope_entries_tags (
    entry_uuid uuid NOT NULL,
    tag character varying(255) NOT NULL
);


--
-- Name: telescope_monitoring; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telescope_monitoring (
    tag character varying(255) NOT NULL
);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: m_role_module_groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_role_module_groups ALTER COLUMN id SET DEFAULT nextval('public.m_role_module_groups_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);


--
-- Name: telescope_entries sequence; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telescope_entries ALTER COLUMN sequence SET DEFAULT nextval('public.telescope_entries_sequence_seq'::regclass);


--
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: m_access_modules m_access_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_access_modules
    ADD CONSTRAINT m_access_modules_pkey PRIMARY KEY (id);


--
-- Name: m_companies m_companies_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_companies
    ADD CONSTRAINT m_companies_code_unique UNIQUE (code);


--
-- Name: m_companies m_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_companies
    ADD CONSTRAINT m_companies_pkey PRIMARY KEY (id);


--
-- Name: m_company_groups m_company_groups_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_company_groups
    ADD CONSTRAINT m_company_groups_code_unique UNIQUE (code);


--
-- Name: m_company_groups m_company_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_company_groups
    ADD CONSTRAINT m_company_groups_pkey PRIMARY KEY (id);


--
-- Name: m_contract_statuses m_contract_statuses_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_contract_statuses
    ADD CONSTRAINT m_contract_statuses_code_unique UNIQUE (code);


--
-- Name: m_contract_statuses m_contract_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_contract_statuses
    ADD CONSTRAINT m_contract_statuses_pkey PRIMARY KEY (id);


--
-- Name: m_contract_templates m_contract_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_contract_templates
    ADD CONSTRAINT m_contract_templates_pkey PRIMARY KEY (id);


--
-- Name: m_contract_types m_contract_types_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_contract_types
    ADD CONSTRAINT m_contract_types_code_unique UNIQUE (code);


--
-- Name: m_contract_types m_contract_types_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_contract_types
    ADD CONSTRAINT m_contract_types_name_unique UNIQUE (name);


--
-- Name: m_contract_types m_contract_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_contract_types
    ADD CONSTRAINT m_contract_types_pkey PRIMARY KEY (id);


--
-- Name: m_departments m_departments_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_departments
    ADD CONSTRAINT m_departments_code_unique UNIQUE (code);


--
-- Name: m_departments m_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_departments
    ADD CONSTRAINT m_departments_pkey PRIMARY KEY (id);


--
-- Name: m_division m_division_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_division
    ADD CONSTRAINT m_division_pkey PRIMARY KEY (id);


--
-- Name: m_form_fields m_form_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_form_fields
    ADD CONSTRAINT m_form_fields_pkey PRIMARY KEY (id);


--
-- Name: m_form_templates m_form_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_form_templates
    ADD CONSTRAINT m_form_templates_pkey PRIMARY KEY (id);


--
-- Name: m_module_groups m_module_groups_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_module_groups
    ADD CONSTRAINT m_module_groups_name_unique UNIQUE (name);


--
-- Name: m_module_groups m_module_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_module_groups
    ADD CONSTRAINT m_module_groups_pkey PRIMARY KEY (id);


--
-- Name: m_modules m_modules_identifier_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_modules
    ADD CONSTRAINT m_modules_identifier_unique UNIQUE (identifier);


--
-- Name: m_modules m_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_modules
    ADD CONSTRAINT m_modules_pkey PRIMARY KEY (id);


--
-- Name: m_numbering_formats m_numbering_formats_module_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_numbering_formats
    ADD CONSTRAINT m_numbering_formats_module_unique UNIQUE (module);


--
-- Name: m_numbering_formats m_numbering_formats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_numbering_formats
    ADD CONSTRAINT m_numbering_formats_pkey PRIMARY KEY (id);


--
-- Name: m_regions m_regions_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_regions
    ADD CONSTRAINT m_regions_code_unique UNIQUE (code);


--
-- Name: m_regions m_regions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_regions
    ADD CONSTRAINT m_regions_pkey PRIMARY KEY (id);


--
-- Name: m_role_module_groups m_role_module_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_role_module_groups
    ADD CONSTRAINT m_role_module_groups_pkey PRIMARY KEY (id);


--
-- Name: m_roles m_roles_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_roles
    ADD CONSTRAINT m_roles_name_unique UNIQUE (name);


--
-- Name: m_roles m_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_roles
    ADD CONSTRAINT m_roles_pkey PRIMARY KEY (id);


--
-- Name: m_submission_types m_submission_types_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_submission_types
    ADD CONSTRAINT m_submission_types_code_unique UNIQUE (code);


--
-- Name: m_submission_types m_submission_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_submission_types
    ADD CONSTRAINT m_submission_types_pkey PRIMARY KEY (id);


--
-- Name: m_template_folders m_template_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_template_folders
    ADD CONSTRAINT m_template_folders_pkey PRIMARY KEY (id);


--
-- Name: m_users m_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_users
    ADD CONSTRAINT m_users_pkey PRIMARY KEY (id);


--
-- Name: m_users m_users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_users
    ADD CONSTRAINT m_users_username_unique UNIQUE (username);


--
-- Name: m_vendor_documents m_vendor_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_vendor_documents
    ADD CONSTRAINT m_vendor_documents_pkey PRIMARY KEY (id);


--
-- Name: m_vendors m_vendors_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_vendors
    ADD CONSTRAINT m_vendors_code_unique UNIQUE (code);


--
-- Name: m_vendors m_vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_vendors
    ADD CONSTRAINT m_vendors_pkey PRIMARY KEY (id);


--
-- Name: m_workflow_contract_types m_workflow_contract_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_contract_types
    ADD CONSTRAINT m_workflow_contract_types_pkey PRIMARY KEY (workflow_id, contract_type_id);


--
-- Name: m_workflow_initiator_authorities m_workflow_initiator_authorities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_initiator_authorities
    ADD CONSTRAINT m_workflow_initiator_authorities_pkey PRIMARY KEY (id);


--
-- Name: m_workflow_org_scopes m_workflow_org_scopes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_org_scopes
    ADD CONSTRAINT m_workflow_org_scopes_pkey PRIMARY KEY (id);


--
-- Name: m_workflow_step_actions m_workflow_step_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_step_actions
    ADD CONSTRAINT m_workflow_step_actions_pkey PRIMARY KEY (id);


--
-- Name: m_workflow_step_authorities m_workflow_step_authorities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_step_authorities
    ADD CONSTRAINT m_workflow_step_authorities_pkey PRIMARY KEY (id);


--
-- Name: m_workflow_steps m_workflow_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_steps
    ADD CONSTRAINT m_workflow_steps_pkey PRIMARY KEY (id);


--
-- Name: m_workflow_steps m_workflow_steps_workflow_id_step_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_steps
    ADD CONSTRAINT m_workflow_steps_workflow_id_step_unique UNIQUE (workflow_id, step);


--
-- Name: m_workflows m_workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflows
    ADD CONSTRAINT m_workflows_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_unique UNIQUE (token);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: t_approvals t_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_approvals
    ADD CONSTRAINT t_approvals_pkey PRIMARY KEY (id);


--
-- Name: t_attachments t_contract_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_attachments
    ADD CONSTRAINT t_contract_attachments_pkey PRIMARY KEY (id);


--
-- Name: t_form_submission_h t_contract_form_submission_h_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_form_submission_h
    ADD CONSTRAINT t_contract_form_submission_h_pkey PRIMARY KEY (id);


--
-- Name: t_form_submission_h t_contract_form_submission_h_submission_id_version_no_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_form_submission_h
    ADD CONSTRAINT t_contract_form_submission_h_submission_id_version_no_unique UNIQUE (submission_id, version_no);


--
-- Name: t_form_submissions t_contract_form_submissions_contract_id_document_type_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_form_submissions
    ADD CONSTRAINT t_contract_form_submissions_contract_id_document_type_unique UNIQUE (contract_id, document_type);


--
-- Name: t_form_submissions t_contract_form_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_form_submissions
    ADD CONSTRAINT t_contract_form_submissions_pkey PRIMARY KEY (id);


--
-- Name: t_contract_h t_contract_h_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_h
    ADD CONSTRAINT t_contract_h_pkey PRIMARY KEY (id);


--
-- Name: t_messages t_contract_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_messages
    ADD CONSTRAINT t_contract_messages_pkey PRIMARY KEY (id);


--
-- Name: t_contract_meta t_contract_meta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_meta
    ADD CONSTRAINT t_contract_meta_pkey PRIMARY KEY (contract_id);


--
-- Name: t_contract_versions t_contract_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_versions
    ADD CONSTRAINT t_contract_versions_pkey PRIMARY KEY (id);


--
-- Name: t_contracts t_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contracts
    ADD CONSTRAINT t_contracts_pkey PRIMARY KEY (id);


--
-- Name: t_forgot_password t_forgot_password_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_forgot_password
    ADD CONSTRAINT t_forgot_password_pkey PRIMARY KEY (id);


--
-- Name: t_forgot_password t_forgot_password_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_forgot_password
    ADD CONSTRAINT t_forgot_password_token_unique UNIQUE (token);


--
-- Name: telescope_entries telescope_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telescope_entries
    ADD CONSTRAINT telescope_entries_pkey PRIMARY KEY (sequence);


--
-- Name: telescope_entries_tags telescope_entries_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telescope_entries_tags
    ADD CONSTRAINT telescope_entries_tags_pkey PRIMARY KEY (entry_uuid, tag);


--
-- Name: telescope_entries telescope_entries_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telescope_entries
    ADD CONSTRAINT telescope_entries_uuid_unique UNIQUE (uuid);


--
-- Name: telescope_monitoring telescope_monitoring_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telescope_monitoring
    ADD CONSTRAINT telescope_monitoring_pkey PRIMARY KEY (tag);


--
-- Name: cache_locks_created_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cache_locks_created_by_index ON public.cache_locks USING btree (created_by);


--
-- Name: cache_locks_updated_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cache_locks_updated_by_index ON public.cache_locks USING btree (updated_by);


--
-- Name: job_batches_created_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX job_batches_created_by_index ON public.job_batches USING btree (created_by);


--
-- Name: job_batches_updated_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX job_batches_updated_by_index ON public.job_batches USING btree (updated_by);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: m_access_modules_created_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_access_modules_created_by_index ON public.m_access_modules USING btree (created_by);


--
-- Name: m_access_modules_updated_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_access_modules_updated_by_index ON public.m_access_modules USING btree (updated_by);


--
-- Name: m_contract_types_parent_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_contract_types_parent_id_index ON public.m_contract_types USING btree (parent_id);


--
-- Name: m_form_fields_created_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_form_fields_created_by_index ON public.m_form_fields USING btree (created_by);


--
-- Name: m_form_fields_updated_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_form_fields_updated_by_index ON public.m_form_fields USING btree (updated_by);


--
-- Name: m_numbering_formats_created_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_numbering_formats_created_by_index ON public.m_numbering_formats USING btree (created_by);


--
-- Name: m_numbering_formats_updated_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_numbering_formats_updated_by_index ON public.m_numbering_formats USING btree (updated_by);


--
-- Name: m_role_module_groups_created_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_role_module_groups_created_by_index ON public.m_role_module_groups USING btree (created_by);


--
-- Name: m_role_module_groups_updated_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_role_module_groups_updated_by_index ON public.m_role_module_groups USING btree (updated_by);


--
-- Name: m_users_company_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_users_company_id_index ON public.m_users USING btree (company_id);


--
-- Name: m_users_department_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_users_department_id_index ON public.m_users USING btree (department_id);


--
-- Name: m_users_role_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_users_role_id_index ON public.m_users USING btree (role_id);


--
-- Name: m_vendor_documents_created_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_vendor_documents_created_by_index ON public.m_vendor_documents USING btree (created_by);


--
-- Name: m_vendor_documents_updated_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_vendor_documents_updated_by_index ON public.m_vendor_documents USING btree (updated_by);


--
-- Name: m_workflow_contract_types_contract_type_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_workflow_contract_types_contract_type_id_index ON public.m_workflow_contract_types USING btree (contract_type_id);


--
-- Name: m_workflow_contract_types_workflow_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_workflow_contract_types_workflow_id_index ON public.m_workflow_contract_types USING btree (workflow_id);


--
-- Name: m_workflow_initiator_authorities_company_group_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_workflow_initiator_authorities_company_group_id_index ON public.m_workflow_initiator_authorities USING btree (company_group_id);


--
-- Name: m_workflow_initiator_authorities_region_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_workflow_initiator_authorities_region_id_index ON public.m_workflow_initiator_authorities USING btree (region_id);


--
-- Name: m_workflow_step_authorities_company_group_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_workflow_step_authorities_company_group_id_index ON public.m_workflow_step_authorities USING btree (company_group_id);


--
-- Name: m_workflow_step_authorities_region_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_workflow_step_authorities_region_id_index ON public.m_workflow_step_authorities USING btree (region_id);


--
-- Name: m_workflow_steps_filter_company_group_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_workflow_steps_filter_company_group_index ON public.m_workflow_steps USING btree (filter_company_group);


--
-- Name: m_workflow_steps_filter_company_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_workflow_steps_filter_company_index ON public.m_workflow_steps USING btree (filter_company);


--
-- Name: m_workflow_steps_filter_department_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_workflow_steps_filter_department_index ON public.m_workflow_steps USING btree (filter_department);


--
-- Name: m_workflow_steps_filter_region_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_workflow_steps_filter_region_index ON public.m_workflow_steps USING btree (filter_region);


--
-- Name: m_workflow_steps_step_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_workflow_steps_step_index ON public.m_workflow_steps USING btree (step);


--
-- Name: m_workflows_contract_type_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_workflows_contract_type_id_index ON public.m_workflows USING btree (contract_type_id);


--
-- Name: personal_access_tokens_tokenable_type_tokenable_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);


--
-- Name: sessions_last_activity_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);


--
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- Name: t_approvals_contract_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_approvals_contract_id_index ON public.t_approvals USING btree (contract_id);


--
-- Name: t_approvals_role_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_approvals_role_index ON public.t_approvals USING btree (role);


--
-- Name: t_approvals_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_approvals_status_index ON public.t_approvals USING btree (status);


--
-- Name: t_approvals_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_approvals_user_id_index ON public.t_approvals USING btree (user_id);


--
-- Name: t_approvals_workflow_step_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_approvals_workflow_step_id_index ON public.t_approvals USING btree (workflow_step_id);


--
-- Name: t_attachments_created_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_attachments_created_by_index ON public.t_attachments USING btree (created_by);


--
-- Name: t_attachments_updated_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_attachments_updated_by_index ON public.t_attachments USING btree (updated_by);


--
-- Name: t_contract_h_created_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contract_h_created_by_index ON public.t_contract_h USING btree (created_by);


--
-- Name: t_contract_h_updated_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contract_h_updated_by_index ON public.t_contract_h USING btree (updated_by);


--
-- Name: t_contract_meta_created_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contract_meta_created_by_index ON public.t_contract_meta USING btree (created_by);


--
-- Name: t_contract_meta_updated_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contract_meta_updated_by_index ON public.t_contract_meta USING btree (updated_by);


--
-- Name: t_contract_versions_created_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contract_versions_created_by_index ON public.t_contract_versions USING btree (created_by);


--
-- Name: t_contract_versions_updated_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contract_versions_updated_by_index ON public.t_contract_versions USING btree (updated_by);


--
-- Name: t_contracts_assigned_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contracts_assigned_at_index ON public.t_contracts USING btree (assigned_at);


--
-- Name: t_contracts_assigned_by_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contracts_assigned_by_id_index ON public.t_contracts USING btree (assigned_by_id);


--
-- Name: t_contracts_assigned_pic_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contracts_assigned_pic_id_index ON public.t_contracts USING btree (assigned_pic_id);


--
-- Name: t_contracts_closed_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contracts_closed_at_index ON public.t_contracts USING btree (closed_at);


--
-- Name: t_contracts_closed_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contracts_closed_by_index ON public.t_contracts USING btree (closed_by);


--
-- Name: t_contracts_contract_no_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contracts_contract_no_index ON public.t_contracts USING btree (contract_no);


--
-- Name: t_contracts_contract_type_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contracts_contract_type_id_index ON public.t_contracts USING btree (contract_type_id);


--
-- Name: t_contracts_contract_type_parent_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contracts_contract_type_parent_id_index ON public.t_contracts USING btree (contract_type_parent_id);


--
-- Name: t_contracts_created_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contracts_created_by_index ON public.t_contracts USING btree (created_by);


--
-- Name: t_contracts_finished_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contracts_finished_at_index ON public.t_contracts USING btree (finished_at);


--
-- Name: t_contracts_form_no_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contracts_form_no_index ON public.t_contracts USING btree (form_no);


--
-- Name: t_contracts_initiated_by_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contracts_initiated_by_id_index ON public.t_contracts USING btree (initiated_by_id);


--
-- Name: t_contracts_origin_workflow_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contracts_origin_workflow_id_index ON public.t_contracts USING btree (origin_workflow_id);


--
-- Name: t_contracts_parent_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contracts_parent_id_index ON public.t_contracts USING btree (parent_id);


--
-- Name: t_contracts_received_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contracts_received_at_index ON public.t_contracts USING btree (received_at);


--
-- Name: t_contracts_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contracts_status_index ON public.t_contracts USING btree (status);


--
-- Name: t_contracts_submission_type_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contracts_submission_type_id_index ON public.t_contracts USING btree (submission_type_id);


--
-- Name: t_contracts_updated_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contracts_updated_by_index ON public.t_contracts USING btree (updated_by);


--
-- Name: t_contracts_vendor_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contracts_vendor_id_index ON public.t_contracts USING btree (vendor_id);


--
-- Name: t_contracts_workflow_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contracts_workflow_id_index ON public.t_contracts USING btree (workflow_id);


--
-- Name: t_contracts_workflow_step_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contracts_workflow_step_id_index ON public.t_contracts USING btree (workflow_step_id);


--
-- Name: t_forgot_password_created_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_forgot_password_created_by_index ON public.t_forgot_password USING btree (created_by);


--
-- Name: t_forgot_password_email_token_expire_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_forgot_password_email_token_expire_at_index ON public.t_forgot_password USING btree (email, token, expire_at);


--
-- Name: t_forgot_password_updated_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_forgot_password_updated_by_index ON public.t_forgot_password USING btree (updated_by);


--
-- Name: t_form_submission_h_updated_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_form_submission_h_updated_by_index ON public.t_form_submission_h USING btree (updated_by);


--
-- Name: t_form_submissions_created_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_form_submissions_created_by_index ON public.t_form_submissions USING btree (created_by);


--
-- Name: t_form_submissions_updated_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_form_submissions_updated_by_index ON public.t_form_submissions USING btree (updated_by);


--
-- Name: t_messages_created_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_messages_created_by_index ON public.t_messages USING btree (created_by);


--
-- Name: t_messages_updated_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_messages_updated_by_index ON public.t_messages USING btree (updated_by);


--
-- Name: telescope_entries_batch_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX telescope_entries_batch_id_index ON public.telescope_entries USING btree (batch_id);


--
-- Name: telescope_entries_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX telescope_entries_created_at_index ON public.telescope_entries USING btree (created_at);


--
-- Name: telescope_entries_family_hash_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX telescope_entries_family_hash_index ON public.telescope_entries USING btree (family_hash);


--
-- Name: telescope_entries_tags_tag_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX telescope_entries_tags_tag_index ON public.telescope_entries_tags USING btree (tag);


--
-- Name: telescope_entries_type_should_display_on_index_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX telescope_entries_type_should_display_on_index_index ON public.telescope_entries USING btree (type, should_display_on_index);


--
-- Name: m_access_modules m_access_modules_module_group_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_access_modules
    ADD CONSTRAINT m_access_modules_module_group_id_foreign FOREIGN KEY (module_group_id) REFERENCES public.m_module_groups(id) ON DELETE SET NULL;


--
-- Name: m_access_modules m_access_modules_module_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_access_modules
    ADD CONSTRAINT m_access_modules_module_id_foreign FOREIGN KEY (module_id) REFERENCES public.m_modules(id) ON DELETE CASCADE;


--
-- Name: m_access_modules m_access_modules_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_access_modules
    ADD CONSTRAINT m_access_modules_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.m_roles(id) ON DELETE CASCADE;


--
-- Name: m_companies m_companies_company_group_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_companies
    ADD CONSTRAINT m_companies_company_group_id_foreign FOREIGN KEY (company_group_id) REFERENCES public.m_company_groups(id) ON DELETE SET NULL;


--
-- Name: m_companies m_companies_region_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_companies
    ADD CONSTRAINT m_companies_region_id_foreign FOREIGN KEY (region_id) REFERENCES public.m_regions(id) ON DELETE SET NULL;


--
-- Name: m_contract_templates m_contract_templates_template_folder_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_contract_templates
    ADD CONSTRAINT m_contract_templates_template_folder_id_foreign FOREIGN KEY (template_folder_id) REFERENCES public.m_template_folders(id) ON DELETE SET NULL;


--
-- Name: m_contract_types m_contract_types_contract_form_template_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_contract_types
    ADD CONSTRAINT m_contract_types_contract_form_template_id_foreign FOREIGN KEY (contract_form_template_id) REFERENCES public.m_form_templates(id) ON DELETE SET NULL;


--
-- Name: m_contract_types m_contract_types_f1_contract_template_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_contract_types
    ADD CONSTRAINT m_contract_types_f1_contract_template_id_foreign FOREIGN KEY (f1_contract_template_id) REFERENCES public.m_contract_templates(id) ON DELETE SET NULL;


--
-- Name: m_contract_types m_contract_types_f1_form_template_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_contract_types
    ADD CONSTRAINT m_contract_types_f1_form_template_id_foreign FOREIGN KEY (f1_form_template_id) REFERENCES public.m_form_templates(id) ON DELETE SET NULL;


--
-- Name: m_contract_types m_contract_types_f2_contract_template_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_contract_types
    ADD CONSTRAINT m_contract_types_f2_contract_template_id_foreign FOREIGN KEY (f2_contract_template_id) REFERENCES public.m_contract_templates(id) ON DELETE SET NULL;


--
-- Name: m_contract_types m_contract_types_f2_form_template_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_contract_types
    ADD CONSTRAINT m_contract_types_f2_form_template_id_foreign FOREIGN KEY (f2_form_template_id) REFERENCES public.m_form_templates(id) ON DELETE SET NULL;


--
-- Name: m_departments m_departments_company_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_departments
    ADD CONSTRAINT m_departments_company_id_foreign FOREIGN KEY (company_id) REFERENCES public.m_companies(id) ON DELETE SET NULL;


--
-- Name: m_form_fields m_form_fields_form_template_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_form_fields
    ADD CONSTRAINT m_form_fields_form_template_id_foreign FOREIGN KEY (form_template_id) REFERENCES public.m_form_templates(id) ON DELETE CASCADE;


--
-- Name: m_form_fields m_form_fields_parent_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_form_fields
    ADD CONSTRAINT m_form_fields_parent_id_foreign FOREIGN KEY (parent_id) REFERENCES public.m_form_fields(id) ON DELETE CASCADE;


--
-- Name: m_form_templates m_form_templates_contract_type_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_form_templates
    ADD CONSTRAINT m_form_templates_contract_type_id_foreign FOREIGN KEY (contract_type_id) REFERENCES public.m_contract_types(id) ON DELETE SET NULL;


--
-- Name: m_modules m_modules_module_group_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_modules
    ADD CONSTRAINT m_modules_module_group_id_foreign FOREIGN KEY (module_group_id) REFERENCES public.m_module_groups(id) ON DELETE SET NULL;


--
-- Name: m_role_module_groups m_role_module_groups_module_group_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_role_module_groups
    ADD CONSTRAINT m_role_module_groups_module_group_id_foreign FOREIGN KEY (module_group_id) REFERENCES public.m_module_groups(id) ON DELETE CASCADE;


--
-- Name: m_role_module_groups m_role_module_groups_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_role_module_groups
    ADD CONSTRAINT m_role_module_groups_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.m_roles(id) ON DELETE CASCADE;


--
-- Name: m_roles m_roles_company_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_roles
    ADD CONSTRAINT m_roles_company_id_foreign FOREIGN KEY (company_id) REFERENCES public.m_companies(id) ON DELETE SET NULL;


--
-- Name: m_template_folders m_template_folders_parent_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_template_folders
    ADD CONSTRAINT m_template_folders_parent_id_foreign FOREIGN KEY (parent_id) REFERENCES public.m_template_folders(id) ON DELETE CASCADE;


--
-- Name: m_users m_users_company_group_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_users
    ADD CONSTRAINT m_users_company_group_id_foreign FOREIGN KEY (company_group_id) REFERENCES public.m_company_groups(id) ON DELETE SET NULL;


--
-- Name: m_users m_users_company_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_users
    ADD CONSTRAINT m_users_company_id_foreign FOREIGN KEY (company_id) REFERENCES public.m_companies(id) ON DELETE SET NULL;


--
-- Name: m_users m_users_department_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_users
    ADD CONSTRAINT m_users_department_id_foreign FOREIGN KEY (department_id) REFERENCES public.m_departments(id) ON DELETE SET NULL;


--
-- Name: m_users m_users_division_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_users
    ADD CONSTRAINT m_users_division_id_foreign FOREIGN KEY (division_id) REFERENCES public.m_departments(id) ON DELETE SET NULL;


--
-- Name: m_users m_users_region_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_users
    ADD CONSTRAINT m_users_region_id_foreign FOREIGN KEY (region_id) REFERENCES public.m_regions(id) ON DELETE SET NULL;


--
-- Name: m_users m_users_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_users
    ADD CONSTRAINT m_users_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.m_roles(id) ON DELETE SET NULL;


--
-- Name: m_vendor_documents m_vendor_documents_vendor_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_vendor_documents
    ADD CONSTRAINT m_vendor_documents_vendor_id_foreign FOREIGN KEY (vendor_id) REFERENCES public.m_vendors(id) ON DELETE CASCADE;


--
-- Name: m_workflow_contract_types m_workflow_contract_types_contract_type_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_contract_types
    ADD CONSTRAINT m_workflow_contract_types_contract_type_id_foreign FOREIGN KEY (contract_type_id) REFERENCES public.m_contract_types(id) ON DELETE CASCADE;


--
-- Name: m_workflow_contract_types m_workflow_contract_types_workflow_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_contract_types
    ADD CONSTRAINT m_workflow_contract_types_workflow_id_foreign FOREIGN KEY (workflow_id) REFERENCES public.m_workflows(id) ON DELETE CASCADE;


--
-- Name: m_workflow_initiator_authorities m_workflow_initiator_authorities_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_initiator_authorities
    ADD CONSTRAINT m_workflow_initiator_authorities_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.m_roles(id) ON DELETE SET NULL;


--
-- Name: m_workflow_initiator_authorities m_workflow_initiator_authorities_workflow_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_initiator_authorities
    ADD CONSTRAINT m_workflow_initiator_authorities_workflow_id_foreign FOREIGN KEY (workflow_id) REFERENCES public.m_workflows(id) ON DELETE CASCADE;


--
-- Name: m_workflow_org_scopes m_workflow_org_scopes_workflow_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_org_scopes
    ADD CONSTRAINT m_workflow_org_scopes_workflow_id_foreign FOREIGN KEY (workflow_id) REFERENCES public.m_workflows(id) ON DELETE CASCADE;


--
-- Name: m_workflow_step_actions m_workflow_step_actions_next_step_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_step_actions
    ADD CONSTRAINT m_workflow_step_actions_next_step_id_foreign FOREIGN KEY (next_step_id) REFERENCES public.m_workflow_steps(id) ON DELETE SET NULL;


--
-- Name: m_workflow_step_actions m_workflow_step_actions_next_workflow_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_step_actions
    ADD CONSTRAINT m_workflow_step_actions_next_workflow_id_foreign FOREIGN KEY (next_workflow_id) REFERENCES public.m_workflows(id) ON DELETE SET NULL;


--
-- Name: m_workflow_step_actions m_workflow_step_actions_next_workflow_step_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_step_actions
    ADD CONSTRAINT m_workflow_step_actions_next_workflow_step_id_foreign FOREIGN KEY (next_workflow_step_id) REFERENCES public.m_workflow_steps(id) ON DELETE SET NULL;


--
-- Name: m_workflow_step_actions m_workflow_step_actions_workflow_step_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_step_actions
    ADD CONSTRAINT m_workflow_step_actions_workflow_step_id_foreign FOREIGN KEY (workflow_step_id) REFERENCES public.m_workflow_steps(id) ON DELETE CASCADE;


--
-- Name: m_workflow_step_authorities m_workflow_step_authorities_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_step_authorities
    ADD CONSTRAINT m_workflow_step_authorities_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.m_roles(id) ON DELETE SET NULL;


--
-- Name: m_workflow_step_authorities m_workflow_step_authorities_target_step_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_step_authorities
    ADD CONSTRAINT m_workflow_step_authorities_target_step_id_foreign FOREIGN KEY (target_step_id) REFERENCES public.m_workflow_steps(id) ON DELETE SET NULL;


--
-- Name: m_workflow_step_authorities m_workflow_step_authorities_workflow_step_action_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_step_authorities
    ADD CONSTRAINT m_workflow_step_authorities_workflow_step_action_id_foreign FOREIGN KEY (workflow_step_action_id) REFERENCES public.m_workflow_step_actions(id) ON DELETE CASCADE;


--
-- Name: m_workflow_step_authorities m_workflow_step_authorities_workflow_step_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_step_authorities
    ADD CONSTRAINT m_workflow_step_authorities_workflow_step_id_foreign FOREIGN KEY (workflow_step_id) REFERENCES public.m_workflow_steps(id) ON DELETE CASCADE;


--
-- Name: m_workflow_steps m_workflow_steps_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_steps
    ADD CONSTRAINT m_workflow_steps_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.m_roles(id) ON DELETE SET NULL;


--
-- Name: m_workflow_steps m_workflow_steps_workflow_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_steps
    ADD CONSTRAINT m_workflow_steps_workflow_id_foreign FOREIGN KEY (workflow_id) REFERENCES public.m_workflows(id) ON DELETE CASCADE;


--
-- Name: m_workflows m_workflows_contract_type_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflows
    ADD CONSTRAINT m_workflows_contract_type_id_foreign FOREIGN KEY (contract_type_id) REFERENCES public.m_contract_types(id) ON DELETE SET NULL;


--
-- Name: m_workflows m_workflows_department_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflows
    ADD CONSTRAINT m_workflows_department_id_foreign FOREIGN KEY (department_id) REFERENCES public.m_departments(id) ON DELETE SET NULL;


--
-- Name: t_approvals t_approvals_contract_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_approvals
    ADD CONSTRAINT t_approvals_contract_id_foreign FOREIGN KEY (contract_id) REFERENCES public.t_contracts(id) ON DELETE CASCADE;


--
-- Name: t_approvals t_approvals_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_approvals
    ADD CONSTRAINT t_approvals_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.m_users(id) ON DELETE SET NULL;


--
-- Name: t_approvals t_approvals_updated_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_approvals
    ADD CONSTRAINT t_approvals_updated_by_foreign FOREIGN KEY (updated_by) REFERENCES public.m_users(id) ON DELETE SET NULL;


--
-- Name: t_approvals t_approvals_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_approvals
    ADD CONSTRAINT t_approvals_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.m_users(id) ON DELETE SET NULL;


--
-- Name: t_approvals t_approvals_workflow_step_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_approvals
    ADD CONSTRAINT t_approvals_workflow_step_id_foreign FOREIGN KEY (workflow_step_id) REFERENCES public.m_workflow_steps(id) ON DELETE CASCADE;


--
-- Name: t_attachments t_contract_attachments_contract_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_attachments
    ADD CONSTRAINT t_contract_attachments_contract_id_foreign FOREIGN KEY (contract_id) REFERENCES public.t_contracts(id) ON DELETE CASCADE;


--
-- Name: t_attachments t_contract_attachments_uploaded_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_attachments
    ADD CONSTRAINT t_contract_attachments_uploaded_by_foreign FOREIGN KEY (uploaded_by) REFERENCES public.m_users(id) ON DELETE CASCADE;


--
-- Name: t_form_submission_h t_contract_form_submission_h_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_form_submission_h
    ADD CONSTRAINT t_contract_form_submission_h_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.m_users(id) ON DELETE SET NULL;


--
-- Name: t_form_submission_h t_contract_form_submission_h_submission_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_form_submission_h
    ADD CONSTRAINT t_contract_form_submission_h_submission_id_foreign FOREIGN KEY (submission_id) REFERENCES public.t_form_submissions(id) ON DELETE CASCADE;


--
-- Name: t_form_submissions t_contract_form_submissions_contract_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_form_submissions
    ADD CONSTRAINT t_contract_form_submissions_contract_id_foreign FOREIGN KEY (contract_id) REFERENCES public.t_contracts(id) ON DELETE CASCADE;


--
-- Name: t_form_submissions t_contract_form_submissions_form_template_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_form_submissions
    ADD CONSTRAINT t_contract_form_submissions_form_template_id_foreign FOREIGN KEY (form_template_id) REFERENCES public.m_form_templates(id) ON DELETE CASCADE;


--
-- Name: t_form_submissions t_contract_form_submissions_submitted_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_form_submissions
    ADD CONSTRAINT t_contract_form_submissions_submitted_by_foreign FOREIGN KEY (submitted_by) REFERENCES public.m_users(id) ON DELETE SET NULL;


--
-- Name: t_contract_h t_contract_h_actor_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_h
    ADD CONSTRAINT t_contract_h_actor_id_foreign FOREIGN KEY (actor_id) REFERENCES public.m_users(id) ON DELETE CASCADE;


--
-- Name: t_contract_h t_contract_h_contract_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_h
    ADD CONSTRAINT t_contract_h_contract_id_foreign FOREIGN KEY (contract_id) REFERENCES public.t_contracts(id) ON DELETE CASCADE;


--
-- Name: t_messages t_contract_messages_contract_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_messages
    ADD CONSTRAINT t_contract_messages_contract_id_foreign FOREIGN KEY (contract_id) REFERENCES public.t_contracts(id) ON DELETE CASCADE;


--
-- Name: t_messages t_contract_messages_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_messages
    ADD CONSTRAINT t_contract_messages_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.m_users(id) ON DELETE CASCADE;


--
-- Name: t_contract_meta t_contract_meta_contract_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_meta
    ADD CONSTRAINT t_contract_meta_contract_id_foreign FOREIGN KEY (contract_id) REFERENCES public.t_contracts(id) ON DELETE CASCADE;


--
-- Name: t_contract_versions t_contract_versions_contract_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_versions
    ADD CONSTRAINT t_contract_versions_contract_id_foreign FOREIGN KEY (contract_id) REFERENCES public.t_contracts(id) ON DELETE CASCADE;


--
-- Name: t_contract_versions t_contract_versions_uploaded_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_versions
    ADD CONSTRAINT t_contract_versions_uploaded_by_foreign FOREIGN KEY (uploaded_by) REFERENCES public.m_users(id) ON DELETE CASCADE;


--
-- Name: t_contracts t_contracts_assigned_by_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contracts
    ADD CONSTRAINT t_contracts_assigned_by_id_foreign FOREIGN KEY (assigned_by_id) REFERENCES public.m_users(id) ON DELETE SET NULL;


--
-- Name: t_contracts t_contracts_assigned_pic_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contracts
    ADD CONSTRAINT t_contracts_assigned_pic_id_foreign FOREIGN KEY (assigned_pic_id) REFERENCES public.m_users(id) ON DELETE SET NULL;


--
-- Name: t_contracts t_contracts_contract_type_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contracts
    ADD CONSTRAINT t_contracts_contract_type_id_foreign FOREIGN KEY (contract_type_id) REFERENCES public.m_contract_types(id) ON DELETE SET NULL;


--
-- Name: t_contracts t_contracts_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contracts
    ADD CONSTRAINT t_contracts_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.m_users(id) ON DELETE CASCADE;


--
-- Name: t_contracts t_contracts_initiated_by_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contracts
    ADD CONSTRAINT t_contracts_initiated_by_id_foreign FOREIGN KEY (initiated_by_id) REFERENCES public.m_users(id);


--
-- Name: t_contracts t_contracts_submission_type_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contracts
    ADD CONSTRAINT t_contracts_submission_type_id_foreign FOREIGN KEY (submission_type_id) REFERENCES public.m_submission_types(id) ON DELETE SET NULL;


--
-- Name: t_contracts t_contracts_vendor_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contracts
    ADD CONSTRAINT t_contracts_vendor_id_foreign FOREIGN KEY (vendor_id) REFERENCES public.m_vendors(id) ON DELETE SET NULL;


--
-- Name: t_contracts t_contracts_workflow_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contracts
    ADD CONSTRAINT t_contracts_workflow_id_foreign FOREIGN KEY (workflow_id) REFERENCES public.m_workflows(id) ON DELETE SET NULL;


--
-- Name: t_contracts t_contracts_workflow_step_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contracts
    ADD CONSTRAINT t_contracts_workflow_step_id_foreign FOREIGN KEY (workflow_step_id) REFERENCES public.m_workflow_steps(id) ON DELETE SET NULL;


--
-- Name: t_forgot_password t_forgot_password_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_forgot_password
    ADD CONSTRAINT t_forgot_password_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.m_users(id) ON DELETE CASCADE;


--
-- Name: telescope_entries_tags telescope_entries_tags_entry_uuid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telescope_entries_tags
    ADD CONSTRAINT telescope_entries_tags_entry_uuid_foreign FOREIGN KEY (entry_uuid) REFERENCES public.telescope_entries(uuid) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict WqSdABcclldD9qcUsPNcxpRbPrUHKn4yxvqc4adEnV7Jsk8eetbrMIBN4A1vNea

--
-- PostgreSQL database dump
--

\restrict xSJwocZuIhUguGD4jrn6zLVx3yiYemfonfe4qQEjm5PGMJxShmjK6Z3gwmq6z8s

-- Dumped from database version 17.7 (Homebrew)
-- Dumped by pg_dump version 17.7 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (id, migration, batch) FROM stdin;
394	2026_07_03_093622_cleanup_orphaned_relations	32
395	2026_07_03_094103_drop_self_relations_foreign_keys	32
396	2026_07_03_015732_alter_contract_table	33
397	2026_07_03_074429_rename_columns_in_t_contracts_table	33
398	2026_07_04_024540_rename_is_initiator_to_use_initiator_property_in_workflow_step_authorities_table	33
399	2026_07_04_055739_rename_is_initiator_to_use_initiator_property_in_workflow_initiator_authorities_table	33
400	2026_07_04_064313_add_company_group_id_and_region_id_to_workflow_authorities_tables	33
403	2026_07_07_165057_create_workflow_contract_types_table	35
406	2026_07_08_164640_add_level_to_contract_types_table	38
283	2026_07_02_063938_change_role_name_to_role_id_in_authority_tables	30
90	2026_07_01_030118_add_contract_type_ids_to_m_workflows	25
401	2026_07_07_085831_add_contract_mode_to_contract_types_table	34
404	2026_07_07_173826_add_per_field_initiator_flags	36
407	2026_07_09_091933_remove_use_initiator_property_from_workflow_authorities_tables	39
291	2026_04_20_000001_create_framework_tables	31
292	2026_04_20_000002_create_master_tables	31
293	2026_04_20_000003_create_template_tables	31
294	2026_04_20_000004_create_transaction_tables	31
295	2026_04_20_000005_create_history_and_pivot_tables	31
296	2026_04_21_000001_add_extra_fields_to_users_table	31
297	2026_04_21_030416_add_group_and_region_to_users_table	31
298	2026_04_22_021123_add_sla_and_initiator_fields	31
299	2026_04_23_014247_add_f1_f2_fields_to_t_contracts_table	31
300	2026_04_23_015645_add_legal_finance_fields_to_vendors	31
301	2026_04_23_015646_create_m_vendor_documents_table	31
302	2026_04_23_070140_add_vendor_id_to_t_contracts_table	31
303	2026_04_23_093700_add_attachment_to_contract_messages_table	31
304	2026_04_24_040027_add_parent_id_to_t_contracts_table	31
305	2026_04_24_042404_add_signer_position_to_t_contracts_table	31
306	2026_04_24_073713_create_m_numbering_formats_table	31
307	2026_04_26_094703_add_input_fields_to_contract_types_table	31
308	2026_04_26_095224_restructure_contract_types_for_f1_f2	31
309	2026_04_26_095520_add_contract_template_ids_to_contract_types	31
310	2026_04_26_100015_add_initiator_settings_to_workflows	31
311	2026_04_26_102350_change_role_to_json_in_workflow_steps_table	31
312	2026_04_26_103600_change_department_id_to_json_in_workflow_steps_table	31
313	2026_04_26_105500_add_initiator_departments_to_workflows_table	31
314	2026_04_26_113734_add_status_id_to_workflow_steps_table	31
315	2026_04_27_014447_normalize_workflow_authority_tables	31
316	2026_04_27_043000_create_m_submission_types_table	31
317	2026_04_27_044000_add_submission_type_id_to_t_contracts_table	31
318	2026_04_27_063518_add_crown_no_to_t_contracts	31
319	2026_04_27_070903_add_is_active_to_m_contract_statuses_table	31
320	2026_04_29_034507_add_display_mode_to_m_contract_statuses_table	31
321	2026_04_29_035153_drop_sequence_columns_from_multiple_tables	31
322	2026_04_29_062638_add_allow_info_edit_to_m_contract_statuses_table	31
323	2026_04_29_063355_add_bulk_permissions_to_access_modules_table	31
324	2026_04_30_033152_add_allow_reference_to_m_contract_statuses_table	31
325	2026_05_04_000001_add_dynamic_workflow_fields	31
326	2026_05_05_074649_add_meeting_update_fields_to_contracts_and_approvals	31
327	2026_05_06_012451_enhance_workflow_steps_structure_v2	31
328	2026_05_06_014757_create_m_company_group_table	31
329	2026_05_06_014818_create_m_company_table	31
330	2026_05_06_032815_add_workflow_id_and_features_to_contract_types_table	31
331	2026_05_06_075600_add_assigned_pic_and_manager_to_t_contracts_table	31
332	2026_05_07_020603_add_meta_to_workflow_steps_table	31
333	2026_05_08_000001_create_organizational_master_tables	31
334	2026_05_08_025730_create_company_group_region_table	31
335	2026_05_08_032850_drop_company_group_region_table	31
336	2026_05_08_035924_add_organizational_filters_to_workflows_table	31
337	2026_05_08_072529_simplify_workflows_and_steps	31
338	2026_05_19_162638_drop_workflow_step_selection_rules_table	31
339	2026_05_20_080859_drop_unneeded_fields_from_workflow_steps_table	31
340	2026_05_20_083500_create_workflow_master_actions_and_step_actions	31
341	2026_05_20_100747_add_signing_parties_to_workflow_step_actions	31
342	2026_05_20_105109_add_assignee_config_to_workflow_step_actions	31
343	2026_05_20_142355_add_alias_to_workflow_step_actions_table	31
344	2026_05_21_022051_add_description_to_workflow_step_actions_table	31
345	2026_05_21_022253_fix_master_action_references_and_status	31
346	2026_05_21_022753_alter_t_contract_table	31
347	2026_05_21_063849_add_master_data_sync_module	31
348	2026_05_22_042300_alter_contract_table	31
349	2026_05_22_042310_alter_contract_type_table	31
350	2026_05_25_030327_alter_workflow_table	31
351	2026_05_25_033010_optimize_t_contracts_and_create_contract_meta	31
352	2026_05_26_011556_add_sequence_to_role_navigation_tables	31
353	2026_05_26_013710_alter_workflow_steps_table	31
354	2026_05_28_011831_add_created_by_and_updated_by_to_m_template_folders_table	31
355	2026_05_28_032100_add_description_to_m_modules_table	31
356	2026_05_29_013953_add_action_code_to_workflow_step_actions	31
357	2026_05_29_021131_drop_m_master_actions_table	31
358	2026_05_29_035539_add_sequential_support_to_approvals_table	31
359	2026_05_30_153641_add_meta_to_m_workflows_table	31
360	2026_05_30_154131_drop_legacy_columns_from_m_contract_statuses_table	31
361	2026_06_01_123258_cleanup_database_and_optimize_indexes	31
362	2026_06_02_015634_add_sub_step_to_t_approvals_table	31
363	2026_06_02_063548_add_transition_config_to_workflow_step_actions	31
364	2026_06_03_022812_create_telescope_entries_table	31
365	2026_06_03_143910_drop_bg_color_and_text_color_from_m_users_table	31
366	2026_06_03_144412_drop_initials_from_m_users_table	31
367	2026_06_05_012537_rename_and_standardize_tables	31
368	2026_06_05_013129_rename_form_builder_tables	31
369	2026_06_05_074048_add_manager_id_to_users_table	31
370	2026_06_05_074109_add_manager_id_to_m_users	31
371	2026_06_05_075455_add_approver_config_to_workflow_steps	31
372	2026_06_05_080417_add_approver_config_to_m_workflow_steps_table	31
373	2026_06_29_094255_drop_role_column_from_m_users	31
374	2026_06_29_094816_drop_position_column_from_m_users	31
375	2026_06_29_095807_restore_t_approvals_columns	31
376	2026_06_29_110052_sync_m_users_to_helpdesk	31
377	2026_06_29_135241_rename_histories_to_h_tables	31
378	2026_06_29_152450_modify_email_on_m_users_table	31
379	2026_06_30_014300_add_created_by_and_updated_by_to_all_tables	31
380	2026_07_01_080757_alter_t_contracts_status_constraint	31
381	2026_07_01_082625_create_m_division_table	31
382	2026_07_01_082812_insert_m_division_module_data	31
383	2026_07_01_083255_create_m_workflow_step_divisions_table	31
384	2026_07_02_124800_create_workflow_org_scopes_and_consolidate_initiators	31
385	2026_07_02_125200_drop_old_workflow_initiator_tables	31
386	2026_07_02_125700_create_workflow_step_authorities_table	31
387	2026_07_02_125800_change_role_name_to_role_id_in_authority_tables	31
388	2026_07_02_125900_add_is_initiator_to_workflow_initiator_authorities	31
389	2026_07_02_130000_add_is_initiator_to_org_scopes_and_step_authorities	31
390	2026_07_02_130100_add_scope_type_to_workflow_org_scopes	31
391	2026_07_02_130200_add_authority_type_to_workflow_initiator_authorities	31
392	2026_07_02_130300_add_authority_type_to_workflow_step_authorities	31
393	2026_07_02_130400_add_additional_approval_fields_to_workflow_step_authorities_table	31
405	2026_07_08_083400_drop_t_contracts_status_check_constraint	37
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 407, true);


--
-- PostgreSQL database dump complete
--

\unrestrict xSJwocZuIhUguGD4jrn6zLVx3yiYemfonfe4qQEjm5PGMJxShmjK6Z3gwmq6z8s

