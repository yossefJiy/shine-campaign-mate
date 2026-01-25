-- =====================================================
-- ATTACH ALL MISSING NOTIFICATION TRIGGERS
-- =====================================================

-- N1/N2: Proposal status changes (sent/approved)
DROP TRIGGER IF EXISTS trigger_notify_proposal_status ON public.quotes;
CREATE TRIGGER trigger_notify_proposal_status
  AFTER UPDATE OF proposal_status ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION notify_proposal_status_change();

-- N3: Stage approval requested
DROP TRIGGER IF EXISTS trigger_notify_stage_approval_request ON public.project_stages;
CREATE TRIGGER trigger_notify_stage_approval_request
  AFTER UPDATE OF requires_client_approval ON public.project_stages
  FOR EACH ROW
  EXECUTE FUNCTION notify_stage_approval_request();

-- N4: Stage approved by client
DROP TRIGGER IF EXISTS trigger_notify_stage_approved ON public.project_stages;
CREATE TRIGGER trigger_notify_stage_approved
  AFTER UPDATE OF status ON public.project_stages
  FOR EACH ROW
  EXECUTE FUNCTION notify_stage_approved();

-- N5: Task assigned to owner (UPDATE)
DROP TRIGGER IF EXISTS trigger_notify_task_assigned ON public.tasks;
CREATE TRIGGER trigger_notify_task_assigned
  AFTER UPDATE OF assignee ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assigned();

-- N5: Task assigned to owner (INSERT)
DROP TRIGGER IF EXISTS trigger_notify_task_assigned_insert ON public.tasks;
CREATE TRIGGER trigger_notify_task_assigned_insert
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  WHEN (NEW.assignee IS NOT NULL)
  EXECUTE FUNCTION notify_task_assigned();

-- N6: Task set to waiting
DROP TRIGGER IF EXISTS trigger_notify_task_waiting ON public.tasks;
CREATE TRIGGER trigger_notify_task_waiting
  AFTER UPDATE OF status ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_waiting();