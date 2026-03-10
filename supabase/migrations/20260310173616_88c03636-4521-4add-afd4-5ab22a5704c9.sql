
-- Add language preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS interface_language text NOT NULL DEFAULT 'he',
ADD COLUMN IF NOT EXISTS preferred_task_language text NOT NULL DEFAULT 'he';

-- Add language preferences to team table
ALTER TABLE public.team 
ADD COLUMN IF NOT EXISTS interface_language text NOT NULL DEFAULT 'en',
ADD COLUMN IF NOT EXISTS preferred_task_language text NOT NULL DEFAULT 'en';

-- Add task_language to tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS task_language text NOT NULL DEFAULT 'he';
