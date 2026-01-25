
-- ============================================
-- RULE LAYER: Complete Trigger & Scheduler Setup
-- ============================================

-- Enable required extensions for scheduler
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- ============================================
-- R1: Proposal Approved → Create Project + Stages + Tasks + Block Work
-- ============================================

-- Attach trigger to quotes table (if not exists)
DROP TRIGGER IF EXISTS trigger_create_project_from_quote ON public.quotes;
CREATE TRIGGER trigger_create_project_from_quote
  AFTER UPDATE OF proposal_status ON public.quotes
  FOR EACH ROW
  WHEN (NEW.proposal_status = 'approved' AND OLD.proposal_status != 'approved')
  EXECUTE FUNCTION public.create_project_from_approved_quote();

-- ============================================
-- R2 & R3: Payment Status Changes → Work State
-- ============================================
-- Already have triggers: trigger_check_retainer_payment, trigger_retainer_payment_status
-- Verified working

-- ============================================
-- R4: Task Waiting Status → Set waiting_since
-- ============================================

-- Drop and recreate the waiting status trigger
DROP TRIGGER IF EXISTS trigger_task_waiting_status ON public.tasks;
CREATE TRIGGER trigger_task_waiting_status
  BEFORE UPDATE OF status ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_task_waiting_status();

-- Also attach the main task status change trigger
DROP TRIGGER IF EXISTS trigger_task_status_change ON public.tasks;
CREATE TRIGGER trigger_task_status_change
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.on_task_status_change();

-- Add points trigger for gamification
DROP TRIGGER IF EXISTS trigger_add_points_on_task_complete ON public.tasks;
CREATE TRIGGER trigger_add_points_on_task_complete
  AFTER UPDATE OF status ON public.tasks
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.add_points_on_task_complete();

-- Add streak trigger
DROP TRIGGER IF EXISTS trigger_update_user_streak ON public.tasks;
CREATE TRIGGER trigger_update_user_streak
  AFTER UPDATE OF status ON public.tasks
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.update_user_streak();

-- ============================================
-- R5: Stage Client Approved → Unlock Tasks + Notify
-- ============================================

DROP TRIGGER IF EXISTS trigger_stage_client_approved ON public.project_stages;
CREATE TRIGGER trigger_stage_client_approved
  AFTER UPDATE OF status ON public.project_stages
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION public.on_stage_client_approved();

-- ============================================
-- R6: Performance Fee Notifications
-- ============================================

DROP TRIGGER IF EXISTS trigger_performance_fee_alert ON public.performance_fees;
CREATE TRIGGER trigger_performance_fee_alert
  AFTER INSERT OR UPDATE OF revenue_reported ON public.performance_fees
  FOR EACH ROW
  WHEN (NEW.revenue_reported > 0 AND NEW.status = 'pending')
  EXECUTE FUNCTION public.alert_performance_fee_pending();

-- ============================================
-- SCHEDULER: Daily Cron Jobs (09:00 Israel = 06:00 UTC)
-- ============================================

-- Remove old jobs if exist
SELECT cron.unschedule('daily-scheduler-job') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-scheduler-job');
SELECT cron.unschedule('smart-alerts-job') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'smart-alerts-job');

-- Daily Scheduler Job - 06:00 UTC (09:00 Israel)
SELECT cron.schedule(
  'daily-scheduler-job',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://lakfzxdipczsjlkcadul.supabase.co/functions/v1/daily-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxha2Z6eGRpcGN6c2psa2NhZHVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTQzOTksImV4cCI6MjA4NDU5MDM5OX0.aD58vQHj_RI8QEdjYqJEbuSqotPBBq5mgOHMTLqwt6o"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Smart Alerts Job - 06:15 UTC (09:15 Israel)
SELECT cron.schedule(
  'smart-alerts-job',
  '15 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://lakfzxdipczsjlkcadul.supabase.co/functions/v1/smart-alerts-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxha2Z6eGRpcGN6c2psa2NhZHVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTQzOTksImV4cCI6MjA4NDU5MDM5OX0.aD58vQHj_RI8QEdjYqJEbuSqotPBBq5mgOHMTLqwt6o"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
