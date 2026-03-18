
UPDATE tasks SET status = 'todo', completed_at = NULL, completed_by = NULL
WHERE project_id = 'aef833cf-77dc-4d5f-b604-33791f1ea4b6' AND status = 'completed';

UPDATE projects SET status = 'active', work_state = 'work_ok', updated_at = now()
WHERE id = 'aef833cf-77dc-4d5f-b604-33791f1ea4b6';
