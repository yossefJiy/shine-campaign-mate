
ALTER TABLE tasks DISABLE TRIGGER trigger_notify_task_assigned_insert;
ALTER TABLE tasks DISABLE TRIGGER trigger_notify_task_assigned;

-- Breadcrumbs implementation = development → Milan/Dev
UPDATE tasks SET assignee = 'מילן פנדיר' 
WHERE title = 'הטמעת Breadcrumbs בכל עמוד' 
  AND client_id = '47b57709-8af4-4928-bf3c-15c9d283b8be';

-- "תיקון מוצרים חסרים" is operational/content mapping → Yosef (business decision on what's missing)
UPDATE tasks SET assignee = 'יוסף אוחיון' 
WHERE title = 'תיקון מוצרים חסרים בקטגוריות' 
  AND client_id = '47b57709-8af4-4928-bf3c-15c9d283b8be';

-- Verify: הטמעת 301 Redirects בשרת = technical SEO implementation → Milan (not just SEO mapping)
UPDATE tasks SET assignee = 'מילן פנדיר' 
WHERE title = 'הטמעת 301 Redirects בשרת' 
  AND client_id = '47b57709-8af4-4928-bf3c-15c9d283b8be';

ALTER TABLE tasks ENABLE TRIGGER trigger_notify_task_assigned_insert;
ALTER TABLE tasks ENABLE TRIGGER trigger_notify_task_assigned;
