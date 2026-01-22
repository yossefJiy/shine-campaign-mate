
-- Drop existing triggers first
DROP TRIGGER IF EXISTS trigger_update_user_streak ON public.tasks;
DROP TRIGGER IF EXISTS trigger_add_points_on_task_complete ON public.tasks;

-- Update the streak function to look up team member ID by name
CREATE OR REPLACE FUNCTION public.update_user_streak()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  today_date DATE := CURRENT_DATE;
  v_streak RECORD;
  v_team_member_id UUID;
BEGIN
  -- Only process when task is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Skip if no assignee
    IF NEW.assignee IS NULL OR NEW.assignee = '' THEN
      RETURN NEW;
    END IF;
    
    -- Look up team member ID by name (assignee is stored as name, not UUID)
    SELECT id INTO v_team_member_id 
    FROM public.team 
    WHERE name = NEW.assignee AND is_active = true
    LIMIT 1;
    
    -- If no team member found, skip
    IF v_team_member_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Get or create streak record
    SELECT * INTO v_streak FROM public.daily_streaks WHERE user_id = v_team_member_id;
    
    IF NOT FOUND THEN
      INSERT INTO public.daily_streaks (user_id, current_streak, longest_streak, last_activity_date, streak_start_date, total_active_days)
      VALUES (v_team_member_id, 1, 1, today_date, today_date, 1);
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
        WHERE user_id = v_team_member_id;
      ELSE
        -- Streak broken, start new
        UPDATE public.daily_streaks SET
          current_streak = 1,
          last_activity_date = today_date,
          streak_start_date = today_date,
          total_active_days = total_active_days + 1,
          updated_at = now()
        WHERE user_id = v_team_member_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update the points function to look up team member ID by name
CREATE OR REPLACE FUNCTION public.add_points_on_task_complete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  points_to_add INTEGER := 5;
  v_team_member_id UUID;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Skip if no assignee
    IF NEW.assignee IS NULL OR NEW.assignee = '' THEN
      RETURN NEW;
    END IF;
    
    -- Look up team member ID by name (assignee is stored as name, not UUID)
    SELECT id INTO v_team_member_id 
    FROM public.team 
    WHERE name = NEW.assignee AND is_active = true
    LIMIT 1;
    
    -- If no team member found, skip
    IF v_team_member_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Add bonus for priority
    IF NEW.priority = 'urgent' THEN
      points_to_add := points_to_add + 5;
    ELSIF NEW.priority = 'high' THEN
      points_to_add := points_to_add + 3;
    END IF;
    
    -- Upsert user_points
    INSERT INTO public.user_points (user_id, total_points, weekly_points, monthly_points, all_time_points)
    VALUES (v_team_member_id, points_to_add, points_to_add, points_to_add, points_to_add)
    ON CONFLICT (user_id) DO UPDATE SET
      total_points = public.user_points.total_points + points_to_add,
      weekly_points = public.user_points.weekly_points + points_to_add,
      monthly_points = public.user_points.monthly_points + points_to_add,
      all_time_points = public.user_points.all_time_points + points_to_add,
      updated_at = now();
    
    -- Log to history
    INSERT INTO public.points_history (user_id, points, action, reference_id, reference_type, description)
    VALUES (v_team_member_id, points_to_add, 'task_completed', NEW.id, 'task', 'השלמת משימה: ' || NEW.title);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Re-create the triggers
CREATE TRIGGER trigger_update_user_streak
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_streak();

CREATE TRIGGER trigger_add_points_on_task_complete
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.add_points_on_task_complete();
