-- Add is_completed column to comments table
ALTER TABLE comments ADD COLUMN is_completed BOOLEAN DEFAULT FALSE;

-- Update existing comments to have is_completed = false
UPDATE comments SET is_completed = FALSE WHERE is_completed IS NULL; 