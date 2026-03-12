-- Add rich task fields for backlog import support
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS expected_result TEXT,
  ADD COLUMN IF NOT EXISTS reference_links TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'operational',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS depends_on UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ready_for_qa BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS qa_result TEXT,
  ADD COLUMN IF NOT EXISTS completion_proof TEXT[] DEFAULT '{}';