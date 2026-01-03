-- Run this SQL in your Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/xevypcauqoxzdhktlnok/sql

-- Create the KV store table if it doesn't exist
CREATE TABLE IF NOT EXISTS kv_store_98d69961 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- Grant necessary permissions
GRANT ALL ON kv_store_98d69961 TO postgres;
GRANT ALL ON kv_store_98d69961 TO service_role;
