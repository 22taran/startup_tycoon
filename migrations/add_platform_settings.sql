-- Add platform settings table
-- This migration adds a table to store platform-wide configuration settings

-- Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO platform_settings (key, value, description) VALUES
  ('signup_enabled', 'true'::jsonb, 'Controls whether new user registration is enabled'),
  ('maintenance_mode', 'false'::jsonb, 'Controls whether the platform is in maintenance mode'),
  ('max_team_size', '2'::jsonb, 'Maximum number of members allowed per team'),
  ('min_team_size', '1'::jsonb, 'Minimum number of members required per team')
ON CONFLICT (key) DO NOTHING;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(key);

-- Enable RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (admins only in practice)
CREATE POLICY "Allow all operations on platform_settings" ON platform_settings FOR ALL USING (true);

-- Add comment
COMMENT ON TABLE platform_settings IS 'Platform-wide configuration settings';
COMMENT ON COLUMN platform_settings.key IS 'Unique setting identifier';
COMMENT ON COLUMN platform_settings.value IS 'Setting value stored as JSON';
COMMENT ON COLUMN platform_settings.description IS 'Human-readable description of the setting';
