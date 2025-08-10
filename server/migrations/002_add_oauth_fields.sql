-- Add OAuth fields to users table
ALTER TABLE users 
ALTER COLUMN password DROP NOT NULL;

-- Add OAuth provider fields
ALTER TABLE users 
ADD COLUMN oauth_provider VARCHAR(20),
ADD COLUMN oauth_id VARCHAR(255),
ADD COLUMN avatar_url TEXT;

-- Create index for OAuth lookups
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider_id ON users(oauth_provider, oauth_id); 