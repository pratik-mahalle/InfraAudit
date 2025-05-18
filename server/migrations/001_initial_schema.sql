-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    billing_email TEXT NOT NULL,
    plan_type TEXT DEFAULT 'free',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    organization_id INTEGER REFERENCES organizations(id),
    plan_type TEXT DEFAULT 'free',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_status TEXT DEFAULT 'inactive',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    region TEXT NOT NULL,
    status TEXT NOT NULL,
    tags JSONB,
    cost INTEGER,
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create security_drifts table
CREATE TABLE IF NOT EXISTS security_drifts (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES resources(id),
    drift_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    details JSONB,
    detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL
);

-- Create cost_anomalies table
CREATE TABLE IF NOT EXISTS cost_anomalies (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES resources(id),
    anomaly_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    percentage INTEGER NOT NULL,
    previous_cost INTEGER NOT NULL,
    current_cost INTEGER NOT NULL,
    detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    resource_id INTEGER REFERENCES resources(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL
);

-- Create recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    potential_savings INTEGER NOT NULL,
    resources_affected JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL
);

-- Create cloud_credentials table
CREATE TABLE IF NOT EXISTS cloud_credentials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    provider TEXT NOT NULL,
    credentials JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create cost_history table
CREATE TABLE IF NOT EXISTS cost_history (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES resources(id),
    cost INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    period TEXT NOT NULL
); 