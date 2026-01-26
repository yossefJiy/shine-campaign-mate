-- Create default stage for each project that has tasks but no stages
INSERT INTO project_stages (project_id, name, description, status, sort_order)
SELECT DISTINCT 
  t.project_id,
  'שלב ראשי' as name,
  'שלב ברירת מחדל שנוצר אוטומטית' as description,
  'in_progress' as status,
  0 as sort_order
FROM tasks t
WHERE t.project_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM project_stages ps WHERE ps.project_id = t.project_id
  );

-- Update all tasks to link to their project's stage
UPDATE tasks t
SET stage_id = (
  SELECT ps.id 
  FROM project_stages ps 
  WHERE ps.project_id = t.project_id 
  ORDER BY ps.sort_order 
  LIMIT 1
)
WHERE t.project_id IS NOT NULL
  AND t.stage_id IS NULL;