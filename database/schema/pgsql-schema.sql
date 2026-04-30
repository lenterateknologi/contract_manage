--
-- PostgreSQL database dump
--

\restrict hpBY8ggbj3guFKRPbUw7AzqjrIwVHVZIMvUzjR8ycHn7npwFn5t7xHCKzqDu0uT

-- Dumped from database version 14.19 (Homebrew)
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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


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
    expiration integer NOT NULL
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
    finished_at integer
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
    can_bulk_delete boolean DEFAULT false NOT NULL
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
    is_active boolean DEFAULT true NOT NULL,
    display_mode character varying(20) DEFAULT 'interactive'::character varying NOT NULL,
    allow_info_edit boolean DEFAULT false NOT NULL,
    allow_reference boolean DEFAULT false NOT NULL
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
    f2_contract_template_id uuid
);


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
    deleted_at timestamp(0) without time zone
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
    deleted_at timestamp(0) without time zone
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
    updated_at timestamp(0) without time zone
);


--
-- Name: m_role_module_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_role_module_groups (
    id bigint NOT NULL,
    role_id uuid NOT NULL,
    module_group_id uuid NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
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
    deleted_at timestamp(0) without time zone
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
    deleted_at timestamp(0) without time zone
);


--
-- Name: m_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_users (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    username character varying(255),
    initials character varying(10),
    role character varying(255),
    "position" character varying(255),
    phone character varying(255),
    bg_color character varying(255),
    text_color character varying(255),
    role_id uuid,
    department_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    company character varying(255),
    location character varying(255),
    bio text,
    "group" character varying(255),
    region character varying(255)
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
    updated_at timestamp(0) without time zone
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
-- Name: m_workflow_initiator_departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_workflow_initiator_departments (
    id uuid NOT NULL,
    workflow_id uuid NOT NULL,
    department_id uuid NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: m_workflow_initiator_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_workflow_initiator_roles (
    id uuid NOT NULL,
    workflow_id uuid NOT NULL,
    role_name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: m_workflow_initiator_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_workflow_initiator_users (
    id uuid NOT NULL,
    workflow_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: m_workflow_step_departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_workflow_step_departments (
    id uuid NOT NULL,
    workflow_step_id uuid NOT NULL,
    department_id uuid NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: m_workflow_step_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_workflow_step_roles (
    id uuid NOT NULL,
    workflow_step_id uuid NOT NULL,
    role_name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: m_workflow_step_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_workflow_step_users (
    id uuid NOT NULL,
    workflow_step_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: m_workflow_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_workflow_steps (
    id uuid NOT NULL,
    workflow_id uuid NOT NULL,
    step integer NOT NULL,
    approver_type character varying(255) DEFAULT 'role'::character varying NOT NULL,
    step_type character varying(255) DEFAULT 'approval'::character varying NOT NULL,
    condition_expression character varying(255),
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    status_id uuid
);


--
-- Name: m_workflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.m_workflows (
    id uuid NOT NULL,
    contract_type character varying(255) NOT NULL,
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
    initiator_type character varying(255) DEFAULT 'all'::character varying NOT NULL
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
    CONSTRAINT t_approvals_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: t_contract_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_contract_attachments (
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
    deleted_at timestamp(0) without time zone
);


--
-- Name: t_contract_form_submission_h; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_contract_form_submission_h (
    id uuid NOT NULL,
    submission_id uuid NOT NULL,
    version_no integer NOT NULL,
    form_data json NOT NULL,
    change_summary text,
    created_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


--
-- Name: t_contract_form_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_contract_form_submissions (
    id uuid NOT NULL,
    contract_id uuid NOT NULL,
    form_template_id uuid NOT NULL,
    document_type character varying(10) NOT NULL,
    current_version integer DEFAULT 1 NOT NULL,
    submitted_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
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
    deleted_at timestamp(0) without time zone
);


--
-- Name: t_contract_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_contract_messages (
    id uuid NOT NULL,
    contract_id uuid NOT NULL,
    user_id uuid NOT NULL,
    message text NOT NULL,
    read_by json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    attachment_path character varying(255),
    attachment_name character varying(255)
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
    deleted_at timestamp(0) without time zone
);


--
-- Name: t_contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_contracts (
    id uuid NOT NULL,
    contract_no character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    contract_date date,
    end_date date,
    contract_type character varying(255),
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
    kop_topik character varying(255),
    kop_sub_topik character varying(255),
    kop_lampiran character varying(255),
    f1_tujuan text,
    f1_sifat character varying(255),
    p1_entity character varying(255),
    p1_signer character varying(255),
    p1_address text,
    p2_entity character varying(255),
    p2_signer character varying(255),
    p2_address text,
    f2_scope text,
    f2_price character varying(255),
    f2_payment character varying(255),
    f2_tenure character varying(255),
    f2_location text,
    vendor_id uuid,
    parent_id uuid,
    p1_signer_position character varying(255),
    p2_signer_position character varying(255),
    crown_no character varying(255),
    submission_type_id uuid,
    CONSTRAINT t_contracts_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'in_review'::character varying, 'revision'::character varying, 'approved'::character varying, 'locked'::character varying, 'archived'::character varying])::text[])))
);


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
    updated_at timestamp(0) without time zone
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
-- Name: m_users m_users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_users
    ADD CONSTRAINT m_users_email_unique UNIQUE (email);


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
-- Name: m_workflow_initiator_departments m_workflow_initiator_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_initiator_departments
    ADD CONSTRAINT m_workflow_initiator_departments_pkey PRIMARY KEY (id);


--
-- Name: m_workflow_initiator_roles m_workflow_initiator_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_initiator_roles
    ADD CONSTRAINT m_workflow_initiator_roles_pkey PRIMARY KEY (id);


--
-- Name: m_workflow_initiator_users m_workflow_initiator_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_initiator_users
    ADD CONSTRAINT m_workflow_initiator_users_pkey PRIMARY KEY (id);


--
-- Name: m_workflow_step_departments m_workflow_step_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_step_departments
    ADD CONSTRAINT m_workflow_step_departments_pkey PRIMARY KEY (id);


--
-- Name: m_workflow_step_roles m_workflow_step_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_step_roles
    ADD CONSTRAINT m_workflow_step_roles_pkey PRIMARY KEY (id);


--
-- Name: m_workflow_step_users m_workflow_step_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_step_users
    ADD CONSTRAINT m_workflow_step_users_pkey PRIMARY KEY (id);


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
-- Name: t_contract_attachments t_contract_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_attachments
    ADD CONSTRAINT t_contract_attachments_pkey PRIMARY KEY (id);


--
-- Name: t_contract_form_submission_h t_contract_form_submission_h_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_form_submission_h
    ADD CONSTRAINT t_contract_form_submission_h_pkey PRIMARY KEY (id);


--
-- Name: t_contract_form_submission_h t_contract_form_submission_h_submission_id_version_no_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_form_submission_h
    ADD CONSTRAINT t_contract_form_submission_h_submission_id_version_no_unique UNIQUE (submission_id, version_no);


--
-- Name: t_contract_form_submissions t_contract_form_submissions_contract_id_document_type_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_form_submissions
    ADD CONSTRAINT t_contract_form_submissions_contract_id_document_type_unique UNIQUE (contract_id, document_type);


--
-- Name: t_contract_form_submissions t_contract_form_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_form_submissions
    ADD CONSTRAINT t_contract_form_submissions_pkey PRIMARY KEY (id);


--
-- Name: t_contract_h t_contract_h_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_h
    ADD CONSTRAINT t_contract_h_pkey PRIMARY KEY (id);


--
-- Name: t_contract_messages t_contract_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_messages
    ADD CONSTRAINT t_contract_messages_pkey PRIMARY KEY (id);


--
-- Name: t_contract_versions t_contract_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_versions
    ADD CONSTRAINT t_contract_versions_pkey PRIMARY KEY (id);


--
-- Name: t_contracts t_contracts_contract_no_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contracts
    ADD CONSTRAINT t_contracts_contract_no_unique UNIQUE (contract_no);


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
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: m_workflow_steps_step_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_workflow_steps_step_index ON public.m_workflow_steps USING btree (step);


--
-- Name: m_workflows_contract_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX m_workflows_contract_type_index ON public.m_workflows USING btree (contract_type);


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
-- Name: t_approvals_role_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_approvals_role_index ON public.t_approvals USING btree (role);


--
-- Name: t_approvals_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_approvals_status_index ON public.t_approvals USING btree (status);


--
-- Name: t_forgot_password_email_token_expire_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_forgot_password_email_token_expire_at_index ON public.t_forgot_password USING btree (email, token, expire_at);


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
-- Name: m_contract_templates m_contract_templates_template_folder_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_contract_templates
    ADD CONSTRAINT m_contract_templates_template_folder_id_foreign FOREIGN KEY (template_folder_id) REFERENCES public.m_template_folders(id) ON DELETE SET NULL;


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
-- Name: m_template_folders m_template_folders_parent_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_template_folders
    ADD CONSTRAINT m_template_folders_parent_id_foreign FOREIGN KEY (parent_id) REFERENCES public.m_template_folders(id) ON DELETE CASCADE;


--
-- Name: m_users m_users_department_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_users
    ADD CONSTRAINT m_users_department_id_foreign FOREIGN KEY (department_id) REFERENCES public.m_departments(id) ON DELETE SET NULL;


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
-- Name: m_workflow_initiator_departments m_workflow_initiator_departments_department_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_initiator_departments
    ADD CONSTRAINT m_workflow_initiator_departments_department_id_foreign FOREIGN KEY (department_id) REFERENCES public.m_departments(id) ON DELETE CASCADE;


--
-- Name: m_workflow_initiator_departments m_workflow_initiator_departments_workflow_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_initiator_departments
    ADD CONSTRAINT m_workflow_initiator_departments_workflow_id_foreign FOREIGN KEY (workflow_id) REFERENCES public.m_workflows(id) ON DELETE CASCADE;


--
-- Name: m_workflow_initiator_roles m_workflow_initiator_roles_workflow_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_initiator_roles
    ADD CONSTRAINT m_workflow_initiator_roles_workflow_id_foreign FOREIGN KEY (workflow_id) REFERENCES public.m_workflows(id) ON DELETE CASCADE;


--
-- Name: m_workflow_initiator_users m_workflow_initiator_users_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_initiator_users
    ADD CONSTRAINT m_workflow_initiator_users_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.m_users(id) ON DELETE CASCADE;


--
-- Name: m_workflow_initiator_users m_workflow_initiator_users_workflow_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_initiator_users
    ADD CONSTRAINT m_workflow_initiator_users_workflow_id_foreign FOREIGN KEY (workflow_id) REFERENCES public.m_workflows(id) ON DELETE CASCADE;


--
-- Name: m_workflow_step_departments m_workflow_step_departments_department_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_step_departments
    ADD CONSTRAINT m_workflow_step_departments_department_id_foreign FOREIGN KEY (department_id) REFERENCES public.m_departments(id) ON DELETE CASCADE;


--
-- Name: m_workflow_step_departments m_workflow_step_departments_workflow_step_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_step_departments
    ADD CONSTRAINT m_workflow_step_departments_workflow_step_id_foreign FOREIGN KEY (workflow_step_id) REFERENCES public.m_workflow_steps(id) ON DELETE CASCADE;


--
-- Name: m_workflow_step_roles m_workflow_step_roles_workflow_step_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_step_roles
    ADD CONSTRAINT m_workflow_step_roles_workflow_step_id_foreign FOREIGN KEY (workflow_step_id) REFERENCES public.m_workflow_steps(id) ON DELETE CASCADE;


--
-- Name: m_workflow_step_users m_workflow_step_users_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_step_users
    ADD CONSTRAINT m_workflow_step_users_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.m_users(id) ON DELETE CASCADE;


--
-- Name: m_workflow_step_users m_workflow_step_users_workflow_step_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_step_users
    ADD CONSTRAINT m_workflow_step_users_workflow_step_id_foreign FOREIGN KEY (workflow_step_id) REFERENCES public.m_workflow_steps(id) ON DELETE CASCADE;


--
-- Name: m_workflow_steps m_workflow_steps_status_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_steps
    ADD CONSTRAINT m_workflow_steps_status_id_foreign FOREIGN KEY (status_id) REFERENCES public.m_contract_statuses(id) ON DELETE SET NULL;


--
-- Name: m_workflow_steps m_workflow_steps_workflow_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.m_workflow_steps
    ADD CONSTRAINT m_workflow_steps_workflow_id_foreign FOREIGN KEY (workflow_id) REFERENCES public.m_workflows(id) ON DELETE CASCADE;


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
-- Name: t_contract_attachments t_contract_attachments_contract_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_attachments
    ADD CONSTRAINT t_contract_attachments_contract_id_foreign FOREIGN KEY (contract_id) REFERENCES public.t_contracts(id) ON DELETE CASCADE;


--
-- Name: t_contract_attachments t_contract_attachments_uploaded_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_attachments
    ADD CONSTRAINT t_contract_attachments_uploaded_by_foreign FOREIGN KEY (uploaded_by) REFERENCES public.m_users(id) ON DELETE CASCADE;


--
-- Name: t_contract_form_submission_h t_contract_form_submission_h_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_form_submission_h
    ADD CONSTRAINT t_contract_form_submission_h_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.m_users(id) ON DELETE SET NULL;


--
-- Name: t_contract_form_submission_h t_contract_form_submission_h_submission_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_form_submission_h
    ADD CONSTRAINT t_contract_form_submission_h_submission_id_foreign FOREIGN KEY (submission_id) REFERENCES public.t_contract_form_submissions(id) ON DELETE CASCADE;


--
-- Name: t_contract_form_submissions t_contract_form_submissions_contract_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_form_submissions
    ADD CONSTRAINT t_contract_form_submissions_contract_id_foreign FOREIGN KEY (contract_id) REFERENCES public.t_contracts(id) ON DELETE CASCADE;


--
-- Name: t_contract_form_submissions t_contract_form_submissions_form_template_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_form_submissions
    ADD CONSTRAINT t_contract_form_submissions_form_template_id_foreign FOREIGN KEY (form_template_id) REFERENCES public.m_form_templates(id) ON DELETE CASCADE;


--
-- Name: t_contract_form_submissions t_contract_form_submissions_submitted_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_form_submissions
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
-- Name: t_contract_messages t_contract_messages_contract_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_messages
    ADD CONSTRAINT t_contract_messages_contract_id_foreign FOREIGN KEY (contract_id) REFERENCES public.t_contracts(id) ON DELETE CASCADE;


--
-- Name: t_contract_messages t_contract_messages_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_messages
    ADD CONSTRAINT t_contract_messages_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.m_users(id) ON DELETE CASCADE;


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
-- Name: t_contracts t_contracts_parent_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contracts
    ADD CONSTRAINT t_contracts_parent_id_foreign FOREIGN KEY (parent_id) REFERENCES public.t_contracts(id) ON DELETE SET NULL;


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
-- PostgreSQL database dump complete
--

\unrestrict hpBY8ggbj3guFKRPbUw7AzqjrIwVHVZIMvUzjR8ycHn7npwFn5t7xHCKzqDu0uT

--
-- PostgreSQL database dump
--

\restrict TdatuocqSWes2aRk3zlxXXUuzd8bKCqmOLclTMa5CdY4LVyFeQdeca2UXcQdgDk

-- Dumped from database version 14.19 (Homebrew)
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
1	2026_04_20_000001_create_framework_tables	1
2	2026_04_20_000002_create_master_tables	1
3	2026_04_20_000003_create_template_tables	1
4	2026_04_20_000004_create_transaction_tables	1
5	2026_04_20_000005_create_history_and_pivot_tables	1
6	2026_04_21_000001_add_extra_fields_to_users_table	1
7	2026_04_21_030416_add_group_and_region_to_users_table	1
8	2026_04_22_021123_add_sla_and_initiator_fields	1
9	2026_04_23_014247_add_f1_f2_fields_to_t_contracts_table	2
10	2026_04_23_015645_add_legal_finance_fields_to_vendors	3
11	2026_04_23_015646_create_m_vendor_documents_table	3
12	2026_04_23_070140_add_vendor_id_to_t_contracts_table	4
13	2026_04_23_093700_add_attachment_to_contract_messages_table	5
14	2026_04_24_040027_add_parent_id_to_t_contracts_table	6
15	2026_04_24_042404_add_signer_position_to_t_contracts_table	7
16	2026_04_24_073713_create_m_numbering_formats_table	8
17	2026_04_26_094703_add_input_fields_to_contract_types_table	9
18	2026_04_26_095224_restructure_contract_types_for_f1_f2	10
19	2026_04_26_095520_add_contract_template_ids_to_contract_types	11
20	2026_04_26_100015_add_initiator_settings_to_workflows	12
21	2026_04_26_102350_change_role_to_json_in_workflow_steps_table	13
22	2026_04_26_103600_change_department_id_to_json_in_workflow_steps_table	14
23	2026_04_26_105500_add_initiator_departments_to_workflows_table	14
24	2026_04_26_113734_add_status_id_to_workflow_steps_table	14
25	2026_04_27_014447_normalize_workflow_authority_tables	15
26	2026_04_27_063518_add_crown_no_to_t_contracts	16
27	2026_04_27_070903_add_is_active_to_m_contract_statuses_table	17
28	2026_04_27_043000_create_m_submission_types_table	18
29	2026_04_27_044000_add_submission_type_id_to_t_contracts_table	18
30	2026_04_29_034507_add_display_mode_to_m_contract_statuses_table	19
31	2026_04_29_035153_drop_sequence_columns_from_multiple_tables	20
32	2026_04_29_062638_add_allow_info_edit_to_m_contract_statuses_table	21
33	2026_04_29_063355_add_bulk_permissions_to_access_modules_table	22
34	2026_04_30_033152_add_allow_reference_to_m_contract_statuses_table	23
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 34, true);


--
-- PostgreSQL database dump complete
--

\unrestrict TdatuocqSWes2aRk3zlxXXUuzd8bKCqmOLclTMa5CdY4LVyFeQdeca2UXcQdgDk

