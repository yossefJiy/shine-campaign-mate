
-- Temporarily disable the broken trigger
ALTER TABLE tasks DISABLE TRIGGER trigger_notify_task_assigned_insert;
ALTER TABLE tasks DISABLE TRIGGER trigger_notify_task_assigned;

-- Stage 1: השלמת אתר + שיפורים + בקשות מירי
INSERT INTO tasks (client_id, title, description, status, priority, assignee, stage_id, task_type, expected_result, reference_links, category) VALUES
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'תיקון חיפוש באתר — אין תוצאות / לא מדויק', 'חיפוש מוצרים לא מחזיר תוצאות רלוונטיות. יש לוודא חיפוש עובד עם שם מוצר, קטגוריה, ומילות מפתח', 'pending', 'high', 'אלכס רמבה', 'aaa1df60-cd06-4f63-b80d-680483e84cdb', 'development', 'חיפוש מחזיר תוצאות מדויקות לכל מוצר באתר', ARRAY['https://raselhanut.ussl.store/'], 'development'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'תיקון עגלה נעלמת / ריענון עגלה', 'העגלה מתרוקנת לאחר ריענון דף או מעבר בין עמודים', 'pending', 'urgent', 'אלכס רמבה', 'aaa1df60-cd06-4f63-b80d-680483e84cdb', 'development', 'העגלה שומרת מוצרים גם אחרי ריענון ומעבר עמודים', NULL, 'development'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'אכיפת מינימום הזמנה 150 ש״ח', 'למנוע מעבר לתשלום מתחת ל-150 ש״ח עם הודעה ברורה', 'pending', 'high', 'אלכס רמבה', 'aaa1df60-cd06-4f63-b80d-680483e84cdb', 'development', 'חסימת צ׳קאאוט מתחת ל-150 ש״ח + הודעה', NULL, 'development'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'תיקון ולידציית צ׳קאאוט — שדות חסרים', 'שדות חובה לא מאומתים: כתובת, טלפון, שם מלא', 'pending', 'high', 'אלכס רמבה', 'aaa1df60-cd06-4f63-b80d-680483e84cdb', 'development', 'כל שדות החובה מאומתים עם הודעות שגיאה בעברית', NULL, 'development'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'תיקון בעיות משלוח וכתובת', 'בעיות בבחירת אזור, חישוב עלות, ושמירת כתובת', 'pending', 'high', 'אלכס רמבה', 'aaa1df60-cd06-4f63-b80d-680483e84cdb', 'development', 'משלוח מחושב נכון לפי אזור, כתובת נשמרת', NULL, 'development'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'חיבור עמוד FAQ', 'יצירת עמוד שאלות נפוצות עם תשובות רלוונטיות', 'pending', 'medium', 'אלכס רמבה', 'aaa1df60-cd06-4f63-b80d-680483e84cdb', 'content', 'עמוד FAQ נגיש מהתפריט', NULL, 'content'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'חיבור עמוד צור קשר', 'עמוד צור קשר עם טופס, טלפון, ווטסאפ, מייל', 'pending', 'medium', 'אלכס רמבה', 'aaa1df60-cd06-4f63-b80d-680483e84cdb', 'development', 'עמוד צור קשר פעיל', NULL, 'development'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'השלמת דף הבית — באנרים, קטגוריות, מוצרים מומלצים', 'דף הבית חסר תוכן: באנר ראשי, קטגוריות מובילות, מוצרים נבחרים', 'pending', 'high', 'מילן פנדיר', 'aaa1df60-cd06-4f63-b80d-680483e84cdb', 'design', 'דף בית מלא עם באנר, קטגוריות, ומוצרים', ARRAY['https://raselhanut.co.il'], 'design'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'תרגום כל הטקסטים באנגלית לעברית', 'אלמנטים, כפתורים, הודעות מערכת באנגלית — תרגום לעברית', 'pending', 'high', 'אלכס רמבה', 'aaa1df60-cd06-4f63-b80d-680483e84cdb', 'content', 'אפס טקסט באנגלית באתר', NULL, 'content'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'לוגיקת בחירת אריזה (משקל/כמות)', 'בחירת אריזה/משקל/כמות ברורה בכרטיס מוצר', 'pending', 'medium', 'אלכס רמבה', 'aaa1df60-cd06-4f63-b80d-680483e84cdb', 'development', 'בחירת אריזה עובדת עם מחיר מתעדכן', NULL, 'development'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'מצבי מיקרו — עגלה ריקה, 404, הצלחה, טעינה', 'חסרים מצבי UI: עגלה ריקה, 404, הצלחה, טעינה', 'pending', 'medium', 'מילן פנדיר', 'aaa1df60-cd06-4f63-b80d-680483e84cdb', 'design', 'כל מצב מיקרו מעוצב ומתפקד', NULL, 'design'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'כפתור הזמנה חוזרת (Reorder)', 'כפתור הזמנה חוזרת בהיסטוריית הזמנות', 'pending', 'medium', 'אלכס רמבה', 'aaa1df60-cd06-4f63-b80d-680483e84cdb', 'development', 'לקוח לוחץ הזמן שוב והמוצרים נכנסים לעגלה', NULL, 'development'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'חיבור PDF / הזמנות WooCommerce', 'יצירת PDF להזמנה ושליחה אוטומטית', 'pending', 'medium', 'אלכס רמבה', 'aaa1df60-cd06-4f63-b80d-680483e84cdb', 'development', 'כל הזמנה מייצרת PDF ונשלחת במייל', NULL, 'development'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'טיפול בבקשות מירי — רשימה מרוכזת', 'ריכוז וטיפול בכל בקשות מירי', 'pending', 'high', 'מילן פנדיר', 'aaa1df60-cd06-4f63-b80d-680483e84cdb', 'operations', 'כל בקשות מירי טופלו ונסגרו', NULL, 'operations');

-- Stage 2: עיצוב האתר
INSERT INTO tasks (client_id, title, description, status, priority, assignee, stage_id, task_type, expected_result, reference_links, category) VALUES
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'התאמת פונטים לשפה העיצובית', 'בחירת והטמעת פונטים מתאימים — עברית ואנגלית', 'pending', 'high', 'מילן פנדיר', '44337e7d-4f1b-459f-af2b-e1e8fee2d04d', 'design', 'פונט אחיד ומותג בכל האתר', ARRAY['https://raselhanut.co.il'], 'design'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'עיצוב לוגו והטמעה באתר', 'לוגו מוצג נכון בכל הגדלים — header, favicon, mobile', 'pending', 'high', 'מילן פנדיר', '44337e7d-4f1b-459f-af2b-e1e8fee2d04d', 'design', 'לוגו חד ומותאם בכל מסך', NULL, 'design'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'עיצוב כרטיס מוצר', 'עיצוב אחיד: תמונה, מחיר, כפתור, אריזה', 'pending', 'high', 'מילן פנדיר', '44337e7d-4f1b-459f-af2b-e1e8fee2d04d', 'design', 'כרטיס מוצר מעוצב עם CTA בולט', NULL, 'design'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'עיצוב Header + Navigation + Mobile Menu', 'תפריט ניווט ברור, מותאם מובייל, קטגוריות ראשיות', 'pending', 'high', 'מילן פנדיר', '44337e7d-4f1b-459f-af2b-e1e8fee2d04d', 'design', 'ניווט נקי ופונקציונלי בדסקטופ ומובייל', NULL, 'design'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'עיצוב Footer', 'Footer עם לינקים, סושיאל, פרטי קשר', 'pending', 'medium', 'מילן פנדיר', '44337e7d-4f1b-459f-af2b-e1e8fee2d04d', 'design', 'Footer מלא ומעוצב', NULL, 'design'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'עיצוב עמוד קטגוריה — גריד, פילטרים', 'עמוד קטגוריה עם תצוגת מוצרים מסודרת', 'pending', 'high', 'מילן פנדיר', '44337e7d-4f1b-459f-af2b-e1e8fee2d04d', 'design', 'עמוד קטגוריה מעוצב עם גריד נקי', NULL, 'design'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'עיצוב עמוד צ׳קאאוט ותשלום', 'עיצוב תהליך רכישה: סיכום, פרטי לקוח, תשלום', 'pending', 'high', 'מילן פנדיר', '44337e7d-4f1b-459f-af2b-e1e8fee2d04d', 'design', 'צ׳קאאוט נקי עם שלבים ברורים', NULL, 'design'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'ניקוי עיצובי כללי — ריווחים, צבעים, עקביות', 'סקירה כללית לאחידות עיצובית', 'pending', 'medium', 'מילן פנדיר', '44337e7d-4f1b-459f-af2b-e1e8fee2d04d', 'design', 'אתר עקבי ויזואלית', NULL, 'design');

-- Stage 3: מבנה קטגוריות
INSERT INTO tasks (client_id, title, description, status, priority, assignee, stage_id, task_type, expected_result, reference_links, category) VALUES
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'הגדרת מבנה קטגוריות ותתי-קטגוריות', 'מיפוי קטגוריות ראשיות ותתי-קטגוריות לפי מוצרים', 'pending', 'high', 'מילן פנדיר', '1b82f89b-1fe4-48f8-912b-9f56d63a52f6', 'seo', 'מבנה קטגוריות מלא ומאושר', ARRAY['https://raselhanut.co.il'], 'seo'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'הטמעת Breadcrumbs בכל עמוד', 'שרשרת ניווט בכל עמוד מוצר וקטגוריה', 'pending', 'high', 'אלכס רמבה', '1b82f89b-1fe4-48f8-912b-9f56d63a52f6', 'development', 'Breadcrumbs מוצגים נכון עם לינקים פעילים', NULL, 'development'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'תיקון מוצרים חסרים בקטגוריות', 'מוצרים קיימים אך לא משויכים לקטגוריה', 'pending', 'high', 'אלכס רמבה', '1b82f89b-1fe4-48f8-912b-9f56d63a52f6', 'operations', 'כל מוצר משויך לקטגוריה הנכונה', NULL, 'operations'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'סידור היררכיית עמודים — תפריט ניווט', 'התאמת תפריט הניווט למבנה קטגוריות חדש', 'pending', 'medium', 'מילן פנדיר', '1b82f89b-1fe4-48f8-912b-9f56d63a52f6', 'design', 'תפריט ניווט תואם למבנה', NULL, 'design');

-- Stage 4: שימור חוזקות מהאתר הישן
INSERT INTO tasks (client_id, title, description, status, priority, assignee, stage_id, task_type, expected_result, reference_links, category) VALUES
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'מיפוי עמודים עם תנועה אורגנית באתר הישן', 'שליפת נתוני GA/GSC לזיהוי עמודים עם תנועה', 'pending', 'urgent', 'מילן פנדיר', '2f86c712-e43c-47d5-9485-ee92dcc7c6c8', 'seo', 'רשימת URLs עם תנועה אורגנית', ARRAY['https://raselhanut.co.il'], 'seo'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'בניית מפת 301 Redirects מלאה', 'כל URL ישן ממופה ל-URL חדש', 'pending', 'urgent', 'מילן פנדיר', '2f86c712-e43c-47d5-9485-ee92dcc7c6c8', 'seo', 'טבלת 301 מלאה: URL ישן → URL חדש', ARRAY['https://raselhanut.co.il'], 'seo'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'הטמעת 301 Redirects בשרת', 'יישום טכני של כל ה-redirects', 'pending', 'urgent', 'אלכס רמבה', '2f86c712-e43c-47d5-9485-ee92dcc7c6c8', 'development', 'כל URL ישן מפנה לחדש עם 301', NULL, 'development'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'שימור Meta Tags — Title, Description', 'העברת Title ו-Description מהאתר הישן לחדש', 'pending', 'high', 'מילן פנדיר', '2f86c712-e43c-47d5-9485-ee92dcc7c6c8', 'seo', 'כל עמוד חדש שומר SEO Metadata', NULL, 'seo'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'שימור מבנה URL ידידותי ל-SEO', 'URLs חדשים נקיים וקריאים', 'pending', 'high', 'מילן פנדיר', '2f86c712-e43c-47d5-9485-ee92dcc7c6c8', 'seo', 'כל URL חדש SEO-friendly', NULL, 'seo');

-- Stage 5: השלמת API
INSERT INTO tasks (client_id, title, description, status, priority, assignee, stage_id, task_type, expected_result, reference_links, category) VALUES
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'חיבור API תשלום (סליקה)', 'API סליקה עובד מלא — חיוב, ביטול, החזר', 'pending', 'urgent', 'אלכס רמבה', '988aa48f-33a8-49b8-9c80-75304500ceb3', 'development', 'תשלום עובר, חיוב נרשם, אישור מתקבל', NULL, 'development'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'חיבור API הזמנות — יצירה ועדכון', 'הזמנה נוצרת בצד השרת/WooCommerce בזמן רכישה', 'pending', 'urgent', 'אלכס רמבה', '988aa48f-33a8-49b8-9c80-75304500ceb3', 'development', 'הזמנה נוצרת ומתעדכנת בפאנל הניהול', NULL, 'development'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'חיבור API מלאי — סנכרון מוצרים', 'סנכרון מלאי בין ה-API למוצגים באתר', 'pending', 'high', 'אלכס רמבה', '988aa48f-33a8-49b8-9c80-75304500ceb3', 'development', 'מלאי מתעדכן, מוצר אזל לא ניתן להזמנה', NULL, 'development'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'חיבור API משלוחים — חישוב עלות ואזורים', 'חיבור API משלוחים לחישוב עלות לפי אזור', 'pending', 'high', 'אלכס רמבה', '988aa48f-33a8-49b8-9c80-75304500ceb3', 'development', 'עלות משלוח מחושבת נכון', NULL, 'development'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'חיבור API קופונים והנחות', 'תמיכה בקופונים — תוקף, הנחה, שימוש', 'pending', 'medium', 'אלכס רמבה', '988aa48f-33a8-49b8-9c80-75304500ceb3', 'development', 'קופון עובד בצ׳קאאוט עם הנחה מחושבת', NULL, 'development'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'חיבור API מיילים — אישור הזמנה', 'מייל אוטומטי ללקוח אחרי הזמנה', 'pending', 'high', 'אלכס רמבה', '988aa48f-33a8-49b8-9c80-75304500ceb3', 'development', 'לקוח מקבל מייל אישור עם פרטי ההזמנה', NULL, 'development');

-- Stage 6: QA פונקציונלי וויזואלי
INSERT INTO tasks (client_id, title, description, status, priority, assignee, stage_id, task_type, expected_result, reference_links, category) VALUES
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'QA חיפוש — בדיקת תרחישים', 'חיפוש עם מילים שונות, שגיאות כתיב, תוצאות ריקות', 'pending', 'high', 'מילן פנדיר', '35c4b5f8-7eb6-43bf-9f31-bf04d2e2a311', 'qa', 'חיפוש עובד בכל התרחישים', NULL, 'qa'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'QA עגלה — הוספה, עדכון, מחיקה, ריענון', 'בדיקת כל פעולות העגלה כולל persistency', 'pending', 'high', 'מילן פנדיר', '35c4b5f8-7eb6-43bf-9f31-bf04d2e2a311', 'qa', 'עגלה מתפקדת מושלם', NULL, 'qa'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'QA מינימום הזמנה — מתחת ומעל 150', 'בדיקת חסימה מתחת ל-150 ש״ח', 'pending', 'high', 'מילן פנדיר', '35c4b5f8-7eb6-43bf-9f31-bf04d2e2a311', 'qa', 'חסימה מתחת ל-150 + מעבר מעל', NULL, 'qa'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'QA ולידציית צ׳קאאוט', 'בדיקת שדות חובה, פורמטים שגויים', 'pending', 'high', 'מילן פנדיר', '35c4b5f8-7eb6-43bf-9f31-bf04d2e2a311', 'qa', 'ולידציה תקינה עם הודעות שגיאה', NULL, 'qa'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'QA ויזואלי — מובייל (iOS + Android)', 'בדיקת כל העמודים במובייל', 'pending', 'high', 'מילן פנדיר', '35c4b5f8-7eb6-43bf-9f31-bf04d2e2a311', 'qa', 'האתר נראה ומתפקד מושלם במובייל', NULL, 'qa'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'QA ויזואלי — דסקטופ (Chrome, Safari, Firefox)', 'בדיקת תצוגה בכל הדפדפנים', 'pending', 'medium', 'מילן פנדיר', '35c4b5f8-7eb6-43bf-9f31-bf04d2e2a311', 'qa', 'תצוגה תקינה בכל הדפדפנים', NULL, 'qa'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'QA 301 Redirects — בדיקת כל ההפניות', 'בדיקה שכל URL ישן מפנה נכון', 'pending', 'urgent', 'מילן פנדיר', '35c4b5f8-7eb6-43bf-9f31-bf04d2e2a311', 'qa', 'כל redirect עובד — אין 404', ARRAY['https://raselhanut.co.il'], 'qa'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'QA Breadcrumbs — כל עמוד', 'בדיקת breadcrumbs בכל עמוד', 'pending', 'medium', 'מילן פנדיר', '35c4b5f8-7eb6-43bf-9f31-bf04d2e2a311', 'qa', 'Breadcrumbs מדויקים בכל עמוד', NULL, 'qa'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'QA תרגום — אין טקסט באנגלית', 'סריקת כל העמודים לאיתור טקסט באנגלית', 'pending', 'medium', 'מילן פנדיר', '35c4b5f8-7eb6-43bf-9f31-bf04d2e2a311', 'qa', 'אפס טקסט באנגלית', NULL, 'qa'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'QA מצבי מיקרו — עגלה ריקה, 404, שגיאה, הצלחה', 'בדיקת כל מצבי Edge', 'pending', 'medium', 'מילן פנדיר', '35c4b5f8-7eb6-43bf-9f31-bf04d2e2a311', 'qa', 'כל מצב מיקרו מציג הודעה ברורה', NULL, 'qa');

-- Stage 7: QA תהליך לקוח מקצה לקצה
INSERT INTO tasks (client_id, title, description, status, priority, assignee, stage_id, task_type, expected_result, reference_links, category) VALUES
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'QA E2E — תהליך רכישה מלא', 'דף בית → עגלה → צ׳קאאוט → תשלום → אישור', 'pending', 'urgent', 'מילן פנדיר', 'eca32c08-c498-49b3-9c53-3a5a35b649ef', 'qa', 'לקוח משלים רכישה מלאה ומקבל אישור', ARRAY['https://raselhanut.ussl.store/'], 'qa'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'QA E2E — לקוח חוזר: כניסה → הזמנה חוזרת', 'בדיקת תהליך לקוח חוזר', 'pending', 'high', 'מילן פנדיר', 'eca32c08-c498-49b3-9c53-3a5a35b649ef', 'qa', 'לקוח חוזר יכול להזמין שוב בקלות', NULL, 'qa'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'QA E2E — קופון: הזנה → הנחה → תשלום', 'בדיקת תהליך קופון מלא', 'pending', 'medium', 'מילן פנדיר', 'eca32c08-c498-49b3-9c53-3a5a35b649ef', 'qa', 'קופון מוחל נכון והסכום תקין', NULL, 'qa'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'QA E2E — שגיאת תשלום וטיפול', 'מה קורה כשתשלום נכשל', 'pending', 'high', 'מילן פנדיר', 'eca32c08-c498-49b3-9c53-3a5a35b649ef', 'qa', 'הודעת שגיאה ברורה + אפשרות לנסות שנית', NULL, 'qa'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'QA E2E — מייל אישור הזמנה', 'וידוא מייל אישור מגיע עם פרטים מלאים', 'pending', 'high', 'מילן פנדיר', 'eca32c08-c498-49b3-9c53-3a5a35b649ef', 'qa', 'מייל אישור נשלח עם כל פרטי ההזמנה', NULL, 'qa'),
('47b57709-8af4-4928-bf3c-15c9d283b8be', 'QA E2E — PDF הזמנה נוצר ונכון', 'בדיקת PDF הזמנה', 'pending', 'medium', 'מילן פנדיר', 'eca32c08-c498-49b3-9c53-3a5a35b649ef', 'qa', 'PDF מדויק עם כל פרטי ההזמנה', NULL, 'qa');

-- Re-enable triggers
ALTER TABLE tasks ENABLE TRIGGER trigger_notify_task_assigned_insert;
ALTER TABLE tasks ENABLE TRIGGER trigger_notify_task_assigned;
