import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface PresetTask {
  title: string;
  task_tag: 'income_generating' | 'operational' | 'client_dependent';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface StageTemplate {
  name: string;
  description?: string;
  order: number;
  estimated_hours?: number;
  preset_tasks: PresetTask[];
}

export interface ProposalTemplate {
  id: string;
  name: string;
  description: string | null;
  template_type: string;
  stages_json: StageTemplate[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateDTO {
  name: string;
  description?: string;
  template_type: string;
  stages_json: StageTemplate[];
}

// Helper to parse stages_json from DB
function parseStagesJson(json: Json): StageTemplate[] {
  if (Array.isArray(json)) {
    return json as unknown as StageTemplate[];
  }
  return [];
}

export function useProposalTemplates() {
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ["proposal-templates"],
    queryFn: async (): Promise<ProposalTemplate[]> => {
      const { data, error } = await supabase
        .from("proposal_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      
      return (data || []).map(row => ({
        ...row,
        stages_json: parseStagesJson(row.stages_json),
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (dto: CreateTemplateDTO) => {
      const { data, error } = await supabase
        .from("proposal_templates")
        .insert({
          name: dto.name,
          description: dto.description,
          template_type: dto.template_type,
          stages_json: dto.stages_json as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-templates"] });
      toast.success("תבנית נוצרה בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה ביצירת תבנית: " + error.message);
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...dto }: Partial<CreateTemplateDTO> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (dto.name) updateData.name = dto.name;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.template_type) updateData.template_type = dto.template_type;
      if (dto.stages_json) updateData.stages_json = dto.stages_json as unknown as Json;

      const { data, error } = await supabase
        .from("proposal_templates")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-templates"] });
      toast.success("תבנית עודכנה בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה בעדכון תבנית: " + error.message);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      // Soft delete - just mark as inactive
      const { error } = await supabase
        .from("proposal_templates")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-templates"] });
      toast.success("תבנית נמחקה");
    },
    onError: (error) => {
      toast.error("שגיאה במחיקת תבנית: " + error.message);
    },
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    createTemplate: createTemplateMutation.mutate,
    updateTemplate: updateTemplateMutation.mutate,
    deleteTemplate: deleteTemplateMutation.mutate,
    isCreating: createTemplateMutation.isPending,
    isUpdating: updateTemplateMutation.isPending,
  };
}

// Pre-defined templates based on the business spec
export const defaultTemplates: CreateTemplateDTO[] = [
  {
    name: "קמפיין ממומן",
    description: "תבנית לקמפיין ממומן - הלחם והחמאה",
    template_type: "campaign",
    stages_json: [
      {
        name: "אסטרטגיה והכנה",
        order: 0,
        preset_tasks: [
          { title: "אפיון מטרות הקמפיין", task_tag: "income_generating", priority: "high" },
          { title: "הגדרת קהלים", task_tag: "income_generating", priority: "high" },
          { title: "חיבור נכסים (פיקסלים, חשבונות)", task_tag: "operational" },
          { title: "קבלת חומרים מהלקוח", task_tag: "client_dependent" },
        ],
      },
      {
        name: "הקמה",
        order: 1,
        preset_tasks: [
          { title: "הקמת קמפיינים בפלטפורמה", task_tag: "income_generating", priority: "high" },
          { title: "כתיבת מודעות", task_tag: "income_generating" },
          { title: "העלאת קריאייטיב", task_tag: "income_generating" },
          { title: "בדיקות תקינות", task_tag: "operational" },
        ],
      },
      {
        name: "אופטימיזציה שוטפת",
        order: 2,
        preset_tasks: [
          { title: "ניתוח ביצועים", task_tag: "income_generating" },
          { title: "שיפור מודעות", task_tag: "income_generating" },
          { title: "שינוי תקציבים", task_tag: "income_generating" },
          { title: "בדיקות A/B", task_tag: "income_generating" },
        ],
      },
      {
        name: "סיכום והמשך",
        order: 3,
        preset_tasks: [
          { title: "דוח תוצאות", task_tag: "operational" },
          { title: "המלצות להמשך", task_tag: "income_generating" },
        ],
      },
    ],
  },
  {
    name: "מיתוג ושפה",
    description: "תבנית למיתוג ושפה ויזואלית",
    template_type: "branding",
    stages_json: [
      {
        name: "מחקר ואסטרטגיה",
        order: 0,
        preset_tasks: [
          { title: "איסוף חומרים מהלקוח", task_tag: "client_dependent" },
          { title: "מחקר השראה", task_tag: "operational" },
          { title: "הגדרת כיוון", task_tag: "income_generating" },
        ],
      },
      {
        name: "קונספט",
        order: 1,
        preset_tasks: [
          { title: "סקיצות ראשוניות", task_tag: "income_generating" },
          { title: "בחירת קונספט", task_tag: "client_dependent" },
        ],
      },
      {
        name: "עיצוב",
        order: 2,
        preset_tasks: [
          { title: "פיתוח שפה ויזואלית", task_tag: "income_generating" },
          { title: "עיצוב לוגו", task_tag: "income_generating" },
        ],
      },
      {
        name: "תיקונים ומסירה",
        order: 3,
        preset_tasks: [
          { title: "סבב תיקונים", task_tag: "client_dependent" },
          { title: "הכנת קבצים למסירה", task_tag: "operational" },
        ],
      },
    ],
  },
  {
    name: "אתר / דף נחיתה",
    description: "תבנית לבניית אתר או דף נחיתה",
    template_type: "website",
    stages_json: [
      {
        name: "אפיון",
        order: 0,
        preset_tasks: [
          { title: "אפיון צרכים ומטרות", task_tag: "income_generating" },
          { title: "איסוף תכנים מהלקוח", task_tag: "client_dependent" },
        ],
      },
      {
        name: "UX",
        order: 1,
        preset_tasks: [
          { title: "מבנה ומסע משתמש", task_tag: "income_generating" },
          { title: "Wireframes", task_tag: "income_generating" },
        ],
      },
      {
        name: "UI",
        order: 2,
        preset_tasks: [
          { title: "עיצוב ויזואלי", task_tag: "income_generating" },
          { title: "אישור עיצוב", task_tag: "client_dependent" },
        ],
      },
      {
        name: "פיתוח",
        order: 3,
        preset_tasks: [
          { title: "בניית האתר", task_tag: "income_generating" },
          { title: "חיבור אנליטיקס ופיקסלים", task_tag: "operational" },
        ],
      },
      {
        name: "בדיקות ומסירה",
        order: 4,
        preset_tasks: [
          { title: "בדיקות QA", task_tag: "operational" },
          { title: "העלאה לאוויר", task_tag: "operational" },
        ],
      },
    ],
  },
];
