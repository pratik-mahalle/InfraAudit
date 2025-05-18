--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alerts (
    id integer NOT NULL,
    title text,
    message text,
    type text,
    severity text,
    resource_id integer,
    created_at timestamp without time zone,
    status text
);


--
-- Name: cost_anomalies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cost_anomalies (
    id integer NOT NULL,
    resource_id integer,
    anomaly_type text,
    severity text,
    percentage integer,
    previous_cost integer,
    current_cost integer,
    detected_at timestamp without time zone,
    status text
);


--
-- Name: cost_optimization_suggestions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cost_optimization_suggestions (
    id integer NOT NULL,
    resource_id integer,
    organization_id integer,
    title text,
    description text,
    suggested_action text,
    potential_savings integer,
    confidence double precision,
    implementation_difficulty text,
    status text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    applied_at timestamp without time zone
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id integer NOT NULL,
    name text,
    display_name text,
    billing_email text,
    billing_address text,
    plan_type text,
    resource_limit integer,
    user_limit integer,
    stripe_customer_id text,
    stripe_subscription_id text,
    subscription_status text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: recommendations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recommendations (
    id integer NOT NULL,
    title text,
    description text,
    type text,
    potential_savings integer,
    resources_affected text,
    created_at timestamp without time zone,
    status text
);


--
-- Name: resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resources (
    id integer NOT NULL,
    name text,
    type text,
    provider text,
    region text,
    status text,
    tags text,
    cost integer,
    organization_id integer,
    user_id integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: security_drifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_drifts (
    id integer NOT NULL,
    resource_id integer,
    drift_type text,
    severity text,
    details text,
    detected_at timestamp without time zone,
    status text
);


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid text NOT NULL,
    sess text,
    expire timestamp without time zone
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text,
    email text,
    password text,
    full_name text,
    role text,
    organization_id integer,
    plan_type text,
    stripe_customer_id text,
    stripe_subscription_id text,
    subscription_status text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    last_login_at timestamp without time zone
);


--
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alerts (id, title, message, type, severity, resource_id, created_at, status) FROM stdin;
1	Cost anomaly detected in EC2	Unexpected 43% increase in compute costs over the last 24 hours.	cost	critical	1	2025-05-10 09:49:56.585	open
2	Security group modified	Port 22 (SSH) opened to 0.0.0.0/0 on production-web-sg.	security	high	1	2025-05-10 09:49:56.655	open
3	S3 access policy changed	Public read access granted to data-exports bucket.	security	high	3	2025-05-10 09:49:56.724	open
\.


--
-- Data for Name: cost_anomalies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cost_anomalies (id, resource_id, anomaly_type, severity, percentage, previous_cost, current_cost, detected_at, status) FROM stdin;
1	1	spike	critical	43	5800	8400	2025-05-10 09:49:56.515	open
\.


--
-- Data for Name: cost_optimization_suggestions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cost_optimization_suggestions (id, resource_id, organization_id, title, description, suggested_action, potential_savings, confidence, implementation_difficulty, status, created_at, updated_at, applied_at) FROM stdin;
1	1	1	Implement instance scheduling	Instance web-server-prod is running 24/7. Implement scheduling to stop during non-business hours.	Schedule	2520	0.75	easy	pending	2025-05-10 13:31:36.04	2025-05-10 13:31:36.04	\N
2	2	1	Implement instance scheduling	Instance api-server-prod is running 24/7. Implement scheduling to stop during non-business hours.	Schedule	1860	0.75	easy	pending	2025-05-10 13:31:36.14	2025-05-10 13:31:36.14	\N
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organizations (id, name, display_name, billing_email, billing_address, plan_type, resource_limit, user_limit, stripe_customer_id, stripe_subscription_id, subscription_status, created_at, updated_at) FROM stdin;
1	demo-org	Demo Organization	demo@example.com	\N	free	10	2	cus_SHmGANG9HONaSY	\N	inactive	2025-05-10 09:49:55.676	2025-05-10 09:49:55.676
\.


--
-- Data for Name: recommendations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recommendations (id, title, description, type, potential_savings, resources_affected, created_at, status) FROM stdin;
1	Right-size over-provisioned instances	15 EC2 instances consistently using <20% CPU and memory.	rightsizing	218000	[1,2]	2025-05-10 09:49:56.792	open
2	Remove unused EBS volumes	8 unattached EBS volumes totaling 1.2TB of storage.	unused_resources	84000	[]	2025-05-10 09:49:56.862	open
3	Optimize S3 storage classes	3.5TB of infrequently accessed data in Standard tier.	storage_optimization	62000	[3]	2025-05-10 09:49:56.931	open
\.


--
-- Data for Name: resources; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resources (id, name, type, provider, region, status, tags, cost, organization_id, user_id, created_at, updated_at) FROM stdin;
1	web-server-prod	EC2	AWS	us-east-1	running	{"app":"web","environment":"production"}	8400	1	1	2025-05-10 09:49:55.903	2025-05-10 09:49:55.903
2	api-server-prod	EC2	AWS	us-east-1	running	{"app":"api","environment":"production"}	6200	1	1	2025-05-10 09:49:55.977	2025-05-10 09:49:55.977
3	s3-customer-data	S3	AWS	us-east-1	active	{"data":"customer","environment":"production"}	2500	1	1	2025-05-10 09:49:56.052	2025-05-10 09:49:56.052
4	rds-analytics-cluster	RDS	AWS	us-east-1	running	{"app":"analytics","environment":"production"}	12000	1	1	2025-05-10 09:49:56.125	2025-05-10 09:49:56.125
5	api-gateway-prod	ApiGateway	AWS	us-east-1	active	{"app":"api","environment":"production"}	1800	1	1	2025-05-10 09:49:56.195	2025-05-10 09:49:56.195
\.


--
-- Data for Name: security_drifts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.security_drifts (id, resource_id, drift_type, severity, details, detected_at, status) FROM stdin;
1	3	Public Access	critical	{"current":"public","previous":"private"}	2025-05-10 09:49:56.304	open
2	5	IAM Policy Change	high	{"policy":"API execution permissions expanded"}	2025-05-10 09:49:56.375	open
3	4	Encryption Disabled	high	{"current":"unencrypted","previous":"encrypted"}	2025-05-10 09:49:56.446	open
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session (sid, sess, expire) FROM stdin;
xgt3L9HhNhk-Uuo34VDS8uuPBYBmUbta	{"cookie":{"originalMaxAge":86400000,"expires":"2025-05-11T16:26:18.233Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-12 16:29:25
w4masMBag-kWZn_nY98w9oRtLoez2rxE	{"cookie":{"originalMaxAge":86400000,"expires":"2025-05-13T09:35:36.803Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-13 15:19:18
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, email, password, full_name, role, organization_id, plan_type, stripe_customer_id, stripe_subscription_id, subscription_status, created_at, updated_at, last_login_at) FROM stdin;
1	demo	demo@example.com	bb0c589c4bebda7e091d746fda703a75fec420e4fa55914d64eb2e869e0a35305259f5a0ed4d3881e80d3ee71723498ac2a4f0ed1d425e4ec84ffdeacb88c996.58c15e51ead7f428d5068e70e48d7e30	Demo User	admin	1	free	\N	\N	inactive	2025-05-10 09:49:55.793	2025-05-12 09:35:36.792	2025-05-12 09:35:36.792
\.


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- Name: cost_anomalies cost_anomalies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_anomalies
    ADD CONSTRAINT cost_anomalies_pkey PRIMARY KEY (id);


--
-- Name: cost_optimization_suggestions cost_optimization_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_optimization_suggestions
    ADD CONSTRAINT cost_optimization_suggestions_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: recommendations recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_pkey PRIMARY KEY (id);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- Name: security_drifts security_drifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_drifts
    ADD CONSTRAINT security_drifts_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

