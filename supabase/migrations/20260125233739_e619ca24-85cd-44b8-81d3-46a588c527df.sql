-- Add source column to track project origin
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'proposal' 
CHECK (source IN ('proposal', 'internal', 'import'));

-- Add comment for documentation
COMMENT ON COLUMN public.projects.source IS 'Project origin: proposal (from approved proposal), internal (admin-created for non-billable work), import (historical data)';