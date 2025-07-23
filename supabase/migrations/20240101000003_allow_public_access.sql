-- Allow public access to projects for client review
CREATE POLICY "Anyone can view projects for review" ON projects
  FOR SELECT USING (true);

-- Update comments policy to allow anonymous comments
DROP POLICY IF EXISTS "Anyone can create comments" ON comments;
CREATE POLICY "Anyone can create comments" ON comments
  FOR INSERT WITH CHECK (true); 