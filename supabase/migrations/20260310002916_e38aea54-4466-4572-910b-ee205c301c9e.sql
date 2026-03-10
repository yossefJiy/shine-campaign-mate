
-- Temporarily disable broken triggers
ALTER TABLE tasks DISABLE TRIGGER trigger_notify_task_assigned_insert;
ALTER TABLE tasks DISABLE TRIGGER trigger_notify_task_assigned;

-- =============================================
-- REASSIGN per ownership map
-- =============================================

-- SEO tasks: redirects, URL mapping, meta → "SEO"
UPDATE tasks SET assignee = 'SEO' WHERE id IN (
  '605edd69-a02c-424c-a3be-c580a86aaafb', -- מיפוי עמודים עם תנועה אורגנית
  'e855ff00-69b2-4285-931c-0982e8812d72', -- בניית מפת 301 Redirects
  '9639c0af-1356-4d38-a649-0478a0ccb307', -- הטמעת 301 Redirects בשרת (technical SEO implementation)
  'e6b4e048-c2d5-4f06-8a23-5c2a10c97558', -- שימור Meta Tags
  'a36d94d3-a7ea-4c7e-952d-b9f959b14cdb'  -- שימור מבנה URL
);

-- QA tasks → "QA"
UPDATE tasks SET assignee = 'QA' WHERE id IN (
  'fec318d0-1fcf-456c-a629-62db38bf9c0a', -- QA 301 Redirects
  'b02e4517-fef4-4562-b965-db3b9ae81b8f', -- QA E2E רכישה מלא
  '395316c7-9db5-496c-9b61-a17b7bd7219f', -- QA מצבי מיקרו
  'ebac3e13-12e8-4b08-9246-ab9cbba58f70', -- QA תרגום
  'ebda2d6b-0197-4107-b000-42f9ed4e3ea5', -- QA דסקטופ
  '05b3cec9-c8e2-42cf-8153-189260668546', -- QA Breadcrumbs
  '884d31fb-2bc6-4ee3-8225-f2805078018b', -- QA E2E קופון
  '553c61eb-2f45-489b-9703-c45065f9be88'  -- QA E2E PDF
);
-- Also reassign QA tasks from stage 6 and 7
UPDATE tasks SET assignee = 'QA' WHERE stage_id IN (
  '35c4b5f8-7eb6-43bf-9f31-bf04d2e2a311', -- QA פונקציונלי
  'eca32c08-c498-49b3-9c53-3a5a35b649ef'  -- QA E2E
) AND task_type = 'qa';

-- Design tasks → Alex (אלכס רמבה)
-- These were already on Alex or need to move to Alex
UPDATE tasks SET assignee = 'אלכס רמבה' WHERE id IN (
  'b8676705-a20f-456f-aff2-9b0a630d0b67', -- מצבי מיקרו (design)
  '5ae27b92-ea9e-4b77-9ad6-77ea72610e5b', -- עיצוב Footer
  '3550b25d-644d-47ca-a332-ba1459decd6b', -- ניקוי עיצובי
  '288d8ef7-66ab-4074-bbcf-a2e7edb4a012'  -- סידור היררכיית עמודים (design)
);
-- All stage 2 design tasks → Alex
UPDATE tasks SET assignee = 'אלכס רמבה' WHERE stage_id = '44337e7d-4f1b-459f-af2b-e1e8fee2d04d';

-- Structure / business / Miri → Yosef (יוסף אוחיון)
UPDATE tasks SET assignee = 'יוסף אוחיון' WHERE id IN (
  'db3f2a42-31ec-4fbb-a9b6-3b83a2e0bde1'  -- טיפול בבקשות מירי
);

-- Category structure decision → Yosef
UPDATE tasks SET assignee = 'יוסף אוחיון' WHERE id IN (
  '00e3773a-dd5b-40a2-b9c6-26520e4b29f3'  -- הגדרת מבנה קטגוריות (business decision)
);

-- Technical / logic / cart / checkout / PDF / API → Milan (מילן פנדיר)
UPDATE tasks SET assignee = 'מילן פנדיר' WHERE id IN (
  '53ff6497-a505-44e1-8f1a-9581795fb6a2', -- עגלה נעלמת
  '5f2db958-91be-42db-a2c3-7a8849c54c9b', -- API תשלום
  '6b98d3ae-d92f-4190-8183-62b0a6b70578', -- API הזמנות
  'd5e81ab2-b166-4b7b-b344-1433565c369f', -- PDF / WooCommerce
  '07080953-6762-4c9e-9703-d26088ffcb62', -- Reorder
  '2c286708-9c25-4e6d-ba5d-da42473601f4', -- לוגיקת אריזה
  'ededeb5c-4153-4941-8ce7-09749ca9ddaf', -- API קופונים
  'ee6518ee-9721-4d57-a697-2166fe6df04c', -- עמוד צור קשר (dev)
  'c685951e-5757-4222-aa60-f3c9c7d054ed'  -- FAQ (dev/content)
);
-- All stage 5 API tasks → Milan
UPDATE tasks SET assignee = 'מילן פנדיר' WHERE stage_id = '988aa48f-33a8-49b8-9c80-75304500ceb3';

-- Stage 1 dev tasks that are technical → Milan
UPDATE tasks SET assignee = 'מילן פנדיר' WHERE stage_id = 'aaa1df60-cd06-4f63-b80d-680483e84cdb' 
  AND task_type = 'development';

-- Homepage design → Alex (not Milan)
UPDATE tasks SET assignee = 'אלכס רמבה' WHERE title LIKE '%השלמת דף הבית%';

-- Translation → content team placeholder
UPDATE tasks SET assignee = 'אלכס רמבה' WHERE title LIKE '%תרגום%' AND stage_id = 'aaa1df60-cd06-4f63-b80d-680483e84cdb';

-- Re-enable triggers
ALTER TABLE tasks ENABLE TRIGGER trigger_notify_task_assigned_insert;
ALTER TABLE tasks ENABLE TRIGGER trigger_notify_task_assigned;
