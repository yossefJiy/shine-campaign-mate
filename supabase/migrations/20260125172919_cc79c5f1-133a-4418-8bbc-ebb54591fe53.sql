-- ========================================
-- Migration: Full Business Logic Implementation (Fixed)
-- ========================================

-- 1. Create performance_fees table for commission tracking
CREATE TABLE IF NOT EXISTS public.performance_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  revenue_reported NUMERIC DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  calculated_fee NUMERIC GENERATED ALWAYS AS (revenue_reported * percentage / 100) STORED,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid')),
  reported_at TIMESTAMPTZ,
  invoiced_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, month, year)
);

-- 2. Add client onboarding tracking
CREATE TABLE IF NOT EXISTS public.client_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE UNIQUE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  current_step INTEGER DEFAULT 1,
  completed_steps JSONB DEFAULT '[]'::JSONB,
  assets_connected JSONB DEFAULT '{}'::JSONB,
  business_info JSONB DEFAULT '{}'::JSONB,
  materials_uploaded BOOLEAN DEFAULT false,
  terms_accepted BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add payment_type to billing_records
ALTER TABLE public.billing_records 
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'retainer';

-- 4. Add blocking logic - project waiting_payment status
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'ok';

-- 5. Drop and recreate constraint with more types
ALTER TABLE public.project_templates DROP CONSTRAINT IF EXISTS project_templates_template_type_check;
ALTER TABLE public.project_templates ADD CONSTRAINT project_templates_template_type_check 
  CHECK (template_type IN ('campaign', 'branding', 'website', 'ecommerce', 'content', 'custom', 
                           'sponsored_campaign', 'google_ads', 'meta_ads', 'tiktok_ads', 'email_sms', 'products'));

-- 6. Insert production-ready templates
DELETE FROM public.project_templates WHERE is_active = true;

INSERT INTO public.project_templates (name, template_type, is_active, stages) VALUES
-- Core Template: Sponsored Campaign
('קמפיין ממומן', 'sponsored_campaign', true, '[
  {"name": "אסטרטגיה והכנה", "order": 1, "requires_approval": false, "tasks": [
    {"title": "אפיון מטרות הקמפיין", "tag": "income_generating", "priority": "high"},
    {"title": "הגדרת קהלים", "tag": "income_generating", "priority": "high"},
    {"title": "חיבור נכסים", "tag": "operational", "priority": "medium"},
    {"title": "קבלת חומרים מהלקוח", "tag": "client_dependent", "priority": "high"}
  ]},
  {"name": "הקמה", "order": 2, "requires_approval": true, "tasks": [
    {"title": "הקמת קמפיינים בפלטפורמה", "tag": "income_generating", "priority": "high"},
    {"title": "כתיבת מודעות", "tag": "income_generating", "priority": "high"},
    {"title": "העלאת קריאייטיב", "tag": "income_generating", "priority": "medium"},
    {"title": "בדיקות תקינות", "tag": "operational", "priority": "medium"}
  ]},
  {"name": "אופטימיזציה שוטפת", "order": 3, "requires_approval": false, "tasks": [
    {"title": "ניתוח ביצועים", "tag": "income_generating", "priority": "high"},
    {"title": "שיפור מודעות", "tag": "income_generating", "priority": "medium"},
    {"title": "שינוי תקציבים", "tag": "income_generating", "priority": "medium"},
    {"title": "בדיקות A/B", "tag": "income_generating", "priority": "low"}
  ]},
  {"name": "סקיילינג", "order": 4, "requires_approval": false, "tasks": [
    {"title": "פתיחת קהלים חדשים", "tag": "income_generating", "priority": "medium"},
    {"title": "הרחבת קריאייטיב", "tag": "income_generating", "priority": "medium"},
    {"title": "התאמות לפי תוצאות", "tag": "income_generating", "priority": "high"}
  ]},
  {"name": "סיכום והמשך", "order": 5, "requires_approval": true, "tasks": [
    {"title": "דוח תוצאות", "tag": "operational", "priority": "high"},
    {"title": "המלצות להמשך", "tag": "income_generating", "priority": "high"}
  ]}
]'::JSONB),

-- Google Ads
('Google Ads', 'google_ads', true, '[
  {"name": "הקמת Google Ads", "order": 1, "requires_approval": false, "tasks": [
    {"title": "חיבור Google Ads + GA4", "tag": "operational", "priority": "high"},
    {"title": "הקמת Search / PMax / Shopping", "tag": "income_generating", "priority": "high"},
    {"title": "אופטימיזציית מילות מפתח", "tag": "income_generating", "priority": "medium"}
  ]}
]'::JSONB),

-- Meta Ads
('Meta Ads', 'meta_ads', true, '[
  {"name": "הקמת Meta Ads", "order": 1, "requires_approval": false, "tasks": [
    {"title": "חיבור BM + פיקסל", "tag": "operational", "priority": "high"},
    {"title": "הגדרת קהלים", "tag": "income_generating", "priority": "high"},
    {"title": "מודעות וידאו / סטטיות", "tag": "income_generating", "priority": "high"}
  ]}
]'::JSONB),

-- TikTok Ads
('TikTok Ads', 'tiktok_ads', true, '[
  {"name": "הקמת TikTok Ads", "order": 1, "requires_approval": false, "tasks": [
    {"title": "חיבור חשבון", "tag": "operational", "priority": "high"},
    {"title": "העלאת וידאו", "tag": "income_generating", "priority": "high"},
    {"title": "בדיקות קריאייטיב מהירות", "tag": "income_generating", "priority": "medium"}
  ]}
]'::JSONB),

-- eCommerce Management
('ניהול אתר איקומרס', 'ecommerce', true, '[
  {"name": "ניהול אתר", "order": 1, "requires_approval": false, "tasks": [
    {"title": "בדיקת חוויית רכישה", "tag": "operational", "priority": "high"},
    {"title": "שיפור המרות", "tag": "income_generating", "priority": "high"},
    {"title": "סידור קולקציות", "tag": "income_generating", "priority": "medium"}
  ]}
]'::JSONB),

-- Email/SMS Marketing
('דיוור / SMS', 'email_sms', true, '[
  {"name": "שיווק במייל וSMS", "order": 1, "requires_approval": true, "tasks": [
    {"title": "אפיון מסרים", "tag": "income_generating", "priority": "high"},
    {"title": "כתיבה", "tag": "income_generating", "priority": "high"},
    {"title": "העלאה וחיבור", "tag": "operational", "priority": "medium"}
  ]}
]'::JSONB),

-- Product Upload
('העלאת מוצרים', 'products', true, '[
  {"name": "העלאת מוצרים", "order": 1, "requires_approval": false, "tasks": [
    {"title": "אפיון מוצר", "tag": "income_generating", "priority": "medium"},
    {"title": "כתיבת תוכן", "tag": "income_generating", "priority": "medium"},
    {"title": "העלאה", "tag": "operational", "priority": "low"}
  ]}
]'::JSONB),

-- Branding
('מיתוג ומדיה', 'branding', true, '[
  {"name": "זהות מותג", "order": 1, "requires_approval": true, "tasks": [
    {"title": "מחקר והשראה", "tag": "income_generating", "priority": "high"},
    {"title": "קונספטים", "tag": "income_generating", "priority": "high"}
  ]},
  {"name": "שפה ויזואלית", "order": 2, "requires_approval": true, "tasks": [
    {"title": "לוגו", "tag": "income_generating", "priority": "high"},
    {"title": "פלטת צבעים", "tag": "income_generating", "priority": "medium"},
    {"title": "טיפוגרפיה", "tag": "income_generating", "priority": "medium"}
  ]},
  {"name": "קריאייטיב לקמפיין", "order": 3, "requires_approval": true, "tasks": [
    {"title": "עיצוב מודעות", "tag": "income_generating", "priority": "high"},
    {"title": "וידאו/אנימציה", "tag": "income_generating", "priority": "medium"}
  ]},
  {"name": "התאמה למודעות", "order": 4, "requires_approval": false, "tasks": [
    {"title": "גדלים לפלטפורמות", "tag": "operational", "priority": "medium"},
    {"title": "מסירה", "tag": "operational", "priority": "high"}
  ]}
]'::JSONB),

-- Content & Strategy
('תוכן ואפיון', 'content', true, '[
  {"name": "הבטחה שיווקית", "order": 1, "requires_approval": true, "tasks": [
    {"title": "מחקר מתחרים", "tag": "income_generating", "priority": "high"},
    {"title": "ניסוח הבטחה", "tag": "income_generating", "priority": "high"}
  ]},
  {"name": "יתרונות וייחודיות", "order": 2, "requires_approval": true, "tasks": [
    {"title": "זיהוי יתרונות", "tag": "income_generating", "priority": "high"},
    {"title": "ניסוח USP", "tag": "income_generating", "priority": "high"}
  ]},
  {"name": "קופי לאתר", "order": 3, "requires_approval": true, "tasks": [
    {"title": "כתיבת כותרות", "tag": "income_generating", "priority": "high"},
    {"title": "תוכן עמודים", "tag": "income_generating", "priority": "medium"}
  ]},
  {"name": "מסרים לקמפיינים", "order": 4, "requires_approval": false, "tasks": [
    {"title": "מסרים למודעות", "tag": "income_generating", "priority": "high"},
    {"title": "CTA", "tag": "income_generating", "priority": "medium"}
  ]}
]'::JSONB);

-- 7. Trigger for retainer payment blocking
CREATE OR REPLACE FUNCTION public.check_retainer_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'overdue' AND NEW.payment_type = 'retainer' THEN
    UPDATE public.projects
    SET payment_status = 'waiting_payment'
    WHERE id = (SELECT p.id FROM public.projects p 
                JOIN public.billing_records br ON br.client_id = p.client_id 
                WHERE br.id = NEW.id LIMIT 1);
  END IF;
  
  IF NEW.status = 'paid' AND OLD.status IN ('pending', 'overdue') THEN
    UPDATE public.projects
    SET payment_status = 'ok'
    WHERE id = (SELECT p.id FROM public.projects p 
                JOIN public.billing_records br ON br.client_id = p.client_id 
                WHERE br.id = NEW.id LIMIT 1);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_check_retainer_payment ON public.billing_records;
CREATE TRIGGER trigger_check_retainer_payment
  AFTER UPDATE ON public.billing_records
  FOR EACH ROW
  EXECUTE FUNCTION public.check_retainer_payment_status();

-- 8. Performance fee alert trigger
CREATE OR REPLACE FUNCTION public.alert_performance_fee_pending()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.revenue_reported > 0 AND NEW.status = 'pending' THEN
    INSERT INTO public.smart_alerts (to_user_id, alert_type, entity_type, entity_id, title, message, priority)
    SELECT ur.user_id, 'performance_fee_ready', 'performance_fee', NEW.id,
           'הוזן מחזור - יש להפיק חיוב אחוזים',
           format('מחזור: ₪%s | עמלה: ₪%s', NEW.revenue_reported, NEW.revenue_reported * NEW.percentage / 100),
           'normal'
    FROM public.user_roles ur
    WHERE ur.role IN ('super_admin', 'admin');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_performance_fee_alert ON public.performance_fees;
CREATE TRIGGER trigger_performance_fee_alert
  AFTER INSERT OR UPDATE ON public.performance_fees
  FOR EACH ROW
  EXECUTE FUNCTION public.alert_performance_fee_pending();

-- 9. RLS for new tables
ALTER TABLE public.performance_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage performance_fees" ON public.performance_fees;
CREATE POLICY "Admins can manage performance_fees" ON public.performance_fees
  FOR ALL USING (public.has_role_level(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Team can view performance_fees" ON public.performance_fees;
CREATE POLICY "Team can view performance_fees" ON public.performance_fees
  FOR SELECT USING (public.has_role_level(auth.uid(), 'employee'::app_role));

DROP POLICY IF EXISTS "Admins can manage client_onboarding" ON public.client_onboarding;
CREATE POLICY "Admins can manage client_onboarding" ON public.client_onboarding
  FOR ALL USING (public.has_role_level(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Clients can view own onboarding" ON public.client_onboarding;
CREATE POLICY "Clients can view own onboarding" ON public.client_onboarding
  FOR SELECT USING (client_id IN (SELECT client_id FROM public.client_users WHERE user_id = auth.uid()));

-- 10. Indexes
CREATE INDEX IF NOT EXISTS idx_performance_fees_project ON public.performance_fees(project_id);
CREATE INDEX IF NOT EXISTS idx_performance_fees_status ON public.performance_fees(status);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_status ON public.client_onboarding(status);