-- Update RLS policy to allow anonymous users to create comments
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;

-- Allow anyone (including anonymous users) to create comments
CREATE POLICY "Anyone can create comments" ON comments
  FOR INSERT WITH CHECK (true);

-- Make created_by nullable for anonymous users
ALTER TABLE comments ALTER COLUMN created_by DROP NOT NULL; 