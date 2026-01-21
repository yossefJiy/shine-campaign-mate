
-- ==========================================
-- GAMIFICATION SYSTEM TABLES
-- ==========================================

-- User Points Table - Track points per user
CREATE TABLE public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  level_progress INTEGER NOT NULL DEFAULT 0,
  weekly_points INTEGER NOT NULL DEFAULT 0,
  monthly_points INTEGER NOT NULL DEFAULT 0,
  all_time_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Daily Streaks Table - Track consecutive days of activity
CREATE TABLE public.daily_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  streak_start_date DATE,
  total_active_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Achievement Definitions - Define available achievements
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  category TEXT NOT NULL DEFAULT 'general',
  points_reward INTEGER NOT NULL DEFAULT 10,
  requirement_type TEXT NOT NULL, -- tasks_completed, streak_days, points_earned, projects_completed
  requirement_value INTEGER NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common', -- common, rare, epic, legendary
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Achievements - Track unlocked achievements per user
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

-- Weekly Challenges - Define weekly challenges
CREATE TABLE public.weekly_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  points_reward INTEGER NOT NULL DEFAULT 50,
  challenge_type TEXT NOT NULL, -- tasks_completed, hours_logged, on_time_delivery
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Challenge Progress - Track user progress on challenges
CREATE TABLE public.user_challenge_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  current_value INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Points History - Log point transactions
CREATE TABLE public.points_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  action TEXT NOT NULL, -- task_completed, streak_bonus, achievement_unlocked, challenge_completed
  reference_id UUID, -- task_id, achievement_id, etc.
  reference_type TEXT, -- task, achievement, challenge
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Leaderboard Cache - Cached leaderboard data
CREATE TABLE public.leaderboard_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  period TEXT NOT NULL, -- weekly, monthly, all_time
  rank INTEGER NOT NULL,
  points INTEGER NOT NULL,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period)
);

-- Enable RLS on all gamification tables
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_points
CREATE POLICY "Users can view their own points" ON public.user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own points" ON public.user_points FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert points" ON public.user_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all points" ON public.user_points FOR SELECT USING (public.has_role_level(auth.uid(), 'admin'));

-- RLS Policies for daily_streaks
CREATE POLICY "Users can view their own streaks" ON public.daily_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own streaks" ON public.daily_streaks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert streaks" ON public.daily_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all streaks" ON public.daily_streaks FOR SELECT USING (public.has_role_level(auth.uid(), 'admin'));

-- RLS Policies for achievements (public read)
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Admins can manage achievements" ON public.achievements FOR ALL USING (public.has_role_level(auth.uid(), 'admin'));

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update notification status" ON public.user_achievements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all user achievements" ON public.user_achievements FOR SELECT USING (public.has_role_level(auth.uid(), 'admin'));

-- RLS Policies for weekly_challenges (public read)
CREATE POLICY "Anyone can view active challenges" ON public.weekly_challenges FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage challenges" ON public.weekly_challenges FOR ALL USING (public.has_role_level(auth.uid(), 'admin'));

-- RLS Policies for user_challenge_progress
CREATE POLICY "Users can view their own progress" ON public.user_challenge_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_challenge_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.user_challenge_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for points_history
CREATE POLICY "Users can view their own history" ON public.points_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert history" ON public.points_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for leaderboard_cache (public read)
CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard_cache FOR SELECT USING (true);
CREATE POLICY "Admins can manage leaderboard" ON public.leaderboard_cache FOR ALL USING (public.has_role_level(auth.uid(), 'admin'));

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, points_reward, requirement_type, requirement_value, rarity) VALUES
('הצעד הראשון', 'השלם את המשימה הראשונה שלך', 'rocket', 'tasks', 10, 'tasks_completed', 1, 'common'),
('מתחילים לזוז', 'השלם 10 משימות', 'zap', 'tasks', 25, 'tasks_completed', 10, 'common'),
('מכונת משימות', 'השלם 50 משימות', 'flame', 'tasks', 50, 'tasks_completed', 50, 'rare'),
('אלוף המשימות', 'השלם 100 משימות', 'trophy', 'tasks', 100, 'tasks_completed', 100, 'epic'),
('אגדת הפרודוקטיביות', 'השלם 500 משימות', 'crown', 'tasks', 250, 'tasks_completed', 500, 'legendary'),
('שבוע של אש', 'שמור על רצף של 7 ימים', 'flame', 'streaks', 50, 'streak_days', 7, 'common'),
('חודש של מצוינות', 'שמור על רצף של 30 ימים', 'fire', 'streaks', 150, 'streak_days', 30, 'epic'),
('100 ימי הצלחה', 'שמור על רצף של 100 ימים', 'sparkles', 'streaks', 500, 'streak_days', 100, 'legendary'),
('פרויקט ראשון', 'השלם פרויקט שלם', 'folder', 'projects', 30, 'projects_completed', 1, 'common'),
('מנהל פרויקטים', 'השלם 5 פרויקטים', 'briefcase', 'projects', 100, 'projects_completed', 5, 'rare'),
('צובר נקודות', 'צבור 1000 נקודות', 'star', 'points', 50, 'points_earned', 1000, 'common'),
('מליונר נקודות', 'צבור 10000 נקודות', 'gem', 'points', 200, 'points_earned', 10000, 'epic');

-- Add realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_points;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_streaks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard_cache;

-- Create function to update streak on task completion
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  v_streak RECORD;
BEGIN
  -- Only process when task is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Get or create streak record
    SELECT * INTO v_streak FROM public.daily_streaks WHERE user_id = NEW.assignee;
    
    IF NOT FOUND THEN
      INSERT INTO public.daily_streaks (user_id, current_streak, longest_streak, last_activity_date, streak_start_date, total_active_days)
      VALUES (NEW.assignee, 1, 1, today_date, today_date, 1);
    ELSE
      IF v_streak.last_activity_date = today_date THEN
        -- Already active today, no change needed
        NULL;
      ELSIF v_streak.last_activity_date = today_date - 1 THEN
        -- Consecutive day, increment streak
        UPDATE public.daily_streaks SET
          current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          last_activity_date = today_date,
          total_active_days = total_active_days + 1,
          updated_at = now()
        WHERE user_id = NEW.assignee;
      ELSE
        -- Streak broken, start new
        UPDATE public.daily_streaks SET
          current_streak = 1,
          last_activity_date = today_date,
          streak_start_date = today_date,
          total_active_days = total_active_days + 1,
          updated_at = now()
        WHERE user_id = NEW.assignee;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for streak updates
CREATE TRIGGER update_streak_on_task_complete
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_streak();

-- Create function to add points on task completion
CREATE OR REPLACE FUNCTION public.add_points_on_task_complete()
RETURNS TRIGGER AS $$
DECLARE
  points_to_add INTEGER := 5;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') AND NEW.assignee IS NOT NULL THEN
    -- Add bonus for priority
    IF NEW.priority = 'urgent' THEN
      points_to_add := points_to_add + 5;
    ELSIF NEW.priority = 'high' THEN
      points_to_add := points_to_add + 3;
    END IF;
    
    -- Upsert user_points
    INSERT INTO public.user_points (user_id, total_points, weekly_points, monthly_points, all_time_points)
    VALUES (NEW.assignee, points_to_add, points_to_add, points_to_add, points_to_add)
    ON CONFLICT (user_id) DO UPDATE SET
      total_points = public.user_points.total_points + points_to_add,
      weekly_points = public.user_points.weekly_points + points_to_add,
      monthly_points = public.user_points.monthly_points + points_to_add,
      all_time_points = public.user_points.all_time_points + points_to_add,
      updated_at = now();
    
    -- Log to history
    INSERT INTO public.points_history (user_id, points, action, reference_id, reference_type, description)
    VALUES (NEW.assignee, points_to_add, 'task_completed', NEW.id, 'task', 'השלמת משימה: ' || NEW.title);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for points
CREATE TRIGGER add_points_on_task_complete
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.add_points_on_task_complete();
