-- 1. Project Templates - תבניות פרויקטים
CREATE TABLE public.project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('campaign', 'branding', 'website', 'ecommerce', 'content', 'custom')),
  description TEXT,
  stages JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Project Notes - הערות פנימיות לפרויקט
CREATE TABLE public.project_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_project_notes_project ON public.project_notes(project_id);
CREATE INDEX idx_project_templates_type ON public.project_templates(template_type);

-- RLS
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

-- Policies for project_templates (admin only write, all authenticated read)
CREATE POLICY "Anyone can read active templates" ON public.project_templates
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admins can manage templates" ON public.project_templates
  FOR ALL TO authenticated USING (public.has_role_level(auth.uid(), 'admin'::app_role));

-- Policies for project_notes
CREATE POLICY "Team can view project notes" ON public.project_notes
  FOR SELECT TO authenticated USING (
    public.has_role_level(auth.uid(), 'employee'::app_role)
    OR user_id = auth.uid()
  );

CREATE POLICY "Team can create notes" ON public.project_notes
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role_level(auth.uid(), 'employee'::app_role)
  );

CREATE POLICY "Users can update own notes" ON public.project_notes
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Triggers
CREATE TRIGGER update_project_templates_updated_at
  BEFORE UPDATE ON public.project_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_notes_updated_at
  BEFORE UPDATE ON public.project_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.project_templates (name, template_type, description, stages, sort_order) VALUES
('קמפיין ממומן', 'campaign', 'קמפיין פרסום ממומן בפלטפורמות דיגיטליות', '[
  {"name": "אסטרטגיה והכנה", "tasks": [{"title": "אפיון מטרות", "task_tag": "income_generating"}, {"title": "הגדרת קהלים", "task_tag": "income_generating"}, {"title": "חיבור נכסים", "task_tag": "operational"}]},
  {"name": "הקמה", "tasks": [{"title": "הקמת קמפיינים", "task_tag": "income_generating"}, {"title": "כתיבת מודעות", "task_tag": "income_generating"}, {"title": "העלאת קריאייטיב", "task_tag": "income_generating"}]},
  {"name": "אופטימיזציה", "tasks": [{"title": "ניתוח ביצועים", "task_tag": "income_generating"}, {"title": "שיפור מודעות", "task_tag": "income_generating"}]},
  {"name": "סיכום", "tasks": [{"title": "דוח תוצאות", "task_tag": "operational"}, {"title": "המלצות להמשך", "task_tag": "income_generating"}]}
]'::jsonb, 1),

('מיתוג', 'branding', 'פרויקט מיתוג ושפה ויזואלית', '[
  {"name": "מחקר", "tasks": [{"title": "איסוף חומרים", "task_tag": "client_dependent"}, {"title": "מחקר השראה", "task_tag": "operational"}]},
  {"name": "קונספט", "tasks": [{"title": "הגדרת כיוון", "task_tag": "income_generating"}, {"title": "סקיצות ראשוניות", "task_tag": "income_generating"}]},
  {"name": "עיצוב", "tasks": [{"title": "פיתוח שפה", "task_tag": "income_generating"}, {"title": "לוגו", "task_tag": "income_generating"}]},
  {"name": "מסירה", "tasks": [{"title": "קבצים סופיים", "task_tag": "operational"}]}
]'::jsonb, 2),

('אתר / דף נחיתה', 'website', 'בניית אתר או דף נחיתה', '[
  {"name": "אפיון", "tasks": [{"title": "הבנת צרכים", "task_tag": "client_dependent"}, {"title": "מבנה עמודים", "task_tag": "income_generating"}]},
  {"name": "עיצוב", "tasks": [{"title": "עיצוב UI", "task_tag": "income_generating"}, {"title": "אישור עיצוב", "task_tag": "client_dependent"}]},
  {"name": "פיתוח", "tasks": [{"title": "בניית האתר", "task_tag": "income_generating"}, {"title": "חיבור אנליטיקס", "task_tag": "operational"}]},
  {"name": "העלאה", "tasks": [{"title": "בדיקות", "task_tag": "operational"}, {"title": "העלאה לאוויר", "task_tag": "income_generating"}]}
]'::jsonb, 3);