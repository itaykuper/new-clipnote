-- Create comments table
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    timestamp FLOAT NOT NULL,
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add RLS policies
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read comments
CREATE POLICY "Anyone can read comments"
    ON comments FOR SELECT
    USING (true);

-- Allow authenticated users to create comments
CREATE POLICY "Authenticated users can create comments"
    ON comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Create updated_at trigger
CREATE TRIGGER set_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at(); 