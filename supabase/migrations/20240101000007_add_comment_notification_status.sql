-- Add comment_notification status to projects table
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE projects 
ADD CONSTRAINT projects_status_check 
CHECK (status IN ('pending', 'in_review', 'completed', 'comment_notification')); 