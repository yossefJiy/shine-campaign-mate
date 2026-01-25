-- Create user_preferences table
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email notifications
  email_task_assigned BOOLEAN DEFAULT true,
  email_task_due_reminder BOOLEAN DEFAULT true,
  email_task_completed BOOLEAN DEFAULT false,
  email_daily_summary BOOLEAN DEFAULT false,
  email_weekly_report BOOLEAN DEFAULT true,
  
  -- Push/In-app notifications
  push_enabled BOOLEAN DEFAULT true,
  push_mentions BOOLEAN DEFAULT true,
  push_task_updates BOOLEAN DEFAULT true,
  
  -- Reminder settings
  reminder_hours_before INTEGER DEFAULT 24,
  reminder_time TIME DEFAULT '09:00',
  
  -- UI preferences
  default_view TEXT DEFAULT 'list',
  sidebar_collapsed BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'system',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT user_preferences_user_id_key UNIQUE(user_id)
);

-- Add columns to profiles if not exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Jerusalem';

-- RLS Policies for user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy for profiles self-update
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to update updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create preferences on user signup
CREATE OR REPLACE FUNCTION public.create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;