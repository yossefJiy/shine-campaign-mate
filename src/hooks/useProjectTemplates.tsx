import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TemplateStage {
  name: string;
  order: number;
  requires_approval: boolean;
  tasks: {
    title: string;
    tag: "income_generating" | "operational" | "client_dependent";
    priority: "low" | "medium" | "high";
  }[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  template_type: string;
  is_active: boolean;
  stages: TemplateStage[];
  description?: string;
  created_at: string;
}

export function useProjectTemplates() {
  return useQuery({
    queryKey: ["project-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      
      return (data || []).map(template => ({
        ...template,
        stages: (template.stages as unknown as TemplateStage[]) || [],
      })) as ProjectTemplate[];
    },
  });
}

export function useProjectTemplate(templateId: string | undefined) {
  return useQuery({
    queryKey: ["project-template", templateId],
    queryFn: async () => {
      if (!templateId) return null;
      
      const { data, error } = await supabase
        .from("project_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        stages: (data.stages as unknown as TemplateStage[]) || [],
      } as ProjectTemplate;
    },
    enabled: !!templateId,
  });
}

// Template type labels for display
export const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  sponsored_campaign: "קמפיין ממומן",
  google_ads: "Google Ads",
  meta_ads: "Meta Ads",
  tiktok_ads: "TikTok Ads",
  ecommerce: "ניהול אתר",
  email_sms: "דיוור / SMS",
  products: "העלאת מוצרים",
  branding: "מיתוג ומדיה",
  content: "תוכן ואפיון",
  website: "אתר / דף נחיתה",
  campaign: "קמפיין",
  custom: "מותאם אישית",
};

// Template type icons (Lucide icon names)
export const TEMPLATE_TYPE_ICONS: Record<string, string> = {
  sponsored_campaign: "Megaphone",
  google_ads: "Search",
  meta_ads: "Facebook",
  tiktok_ads: "Video",
  ecommerce: "ShoppingCart",
  email_sms: "Mail",
  products: "Package",
  branding: "Palette",
  content: "FileText",
  website: "Globe",
  campaign: "Target",
  custom: "Settings",
};
