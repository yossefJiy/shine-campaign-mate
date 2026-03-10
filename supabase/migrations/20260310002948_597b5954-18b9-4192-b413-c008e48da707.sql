
ALTER TABLE tasks DISABLE TRIGGER trigger_notify_task_assigned_insert;
ALTER TABLE tasks DISABLE TRIGGER trigger_notify_task_assigned;

-- Miri requests → Yosef
UPDATE tasks SET assignee = 'יוסף אוחיון' WHERE id = '266ac430-51b7-4462-87c0-508f7a3de481';

-- Category structure decision → Yosef  
UPDATE tasks SET assignee = 'יוסף אוחיון' WHERE id = '7a74c9de-a498-4df6-a2d0-3ddeba3165e6';

-- SEO preservation tasks → SEO
UPDATE tasks SET assignee = 'SEO' WHERE id IN (
  '6c7d9974-60a0-43f8-a148-5454755b031c', -- שימור URL
  '86061a68-cf06-4193-8b30-3160e1863ada'  -- שימור Meta Tags
);

ALTER TABLE tasks ENABLE TRIGGER trigger_notify_task_assigned_insert;
ALTER TABLE tasks ENABLE TRIGGER trigger_notify_task_assigned;
