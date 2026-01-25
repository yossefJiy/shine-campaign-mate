import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  BarChart3,
  CheckSquare,
  Users,
  LayoutDashboard,
  Loader2,
  Save,
  FileText,
  FolderKanban,
  CreditCard,
} from "lucide-react";
import { ClientModules } from "@/hooks/useClientModules";

interface ClientModulesSettingsProps {
  clientId: string;
  modules: ClientModules;
  syncFrequency?: string;
}

const MODULE_CATEGORIES = [
  {
    key: "core",
    label: "ליבה",
    icon: LayoutDashboard,
    modules: ["dashboard", "projects", "tasks", "team"],
  },
  {
    key: "business",
    label: "עסקי",
    icon: FileText,
    modules: ["proposals", "billing"],
  },
] as const;

const moduleConfig: Record<string, { label: string; icon: any; color: string; bgColor: string; description: string }> = {
  dashboard: { label: "דשבורד", icon: LayoutDashboard, color: "text-blue-500", bgColor: "bg-blue-500/20", description: "מסך סיכום ראשי" },
  projects: { label: "פרויקטים", icon: FolderKanban, color: "text-purple-500", bgColor: "bg-purple-500/20", description: "ניהול פרויקטים ושלבים" },
  tasks: { label: "משימות", icon: CheckSquare, color: "text-yellow-500", bgColor: "bg-yellow-500/20", description: "רשימת משימות" },
  team: { label: "צוות", icon: Users, color: "text-cyan-500", bgColor: "bg-cyan-500/20", description: "חברי צוות" },
  proposals: { label: "הצעות מחיר", icon: FileText, color: "text-emerald-500", bgColor: "bg-emerald-500/20", description: "הצעות מחיר והסכמים" },
  billing: { label: "חיובים", icon: CreditCard, color: "text-green-500", bgColor: "bg-green-500/20", description: "ניהול תשלומים" },
};

export function ClientModulesSettings({
  clientId,
  modules: initialModules,
}: ClientModulesSettingsProps) {
  const queryClient = useQueryClient();
  const [modules, setModules] = useState<ClientModules>(initialModules);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch client settings
  const { data: clientSettings } = useQuery({
    queryKey: ['client-settings', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('modules_enabled, modules_order, account_type')
        .eq('id', clientId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch global settings
  const { data: globalSettings = [] } = useQuery({
    queryKey: ['global-module-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_module_settings')
        .select('module_name, is_globally_enabled, default_for_basic, default_for_premium, sort_order')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Initialize modules
  useEffect(() => {
    if (globalSettings.length > 0 && clientSettings) {
      const isPremium = clientSettings.account_type === 'premium_client';
      const clientModules = clientSettings.modules_enabled as Record<string, boolean> | null;
      
      const computedModules: Record<string, boolean> = {};
      
      for (const key of Object.keys(moduleConfig)) {
        const globalSetting = globalSettings.find(g => g.module_name === key);
        
        if (globalSetting) {
          if (!globalSetting.is_globally_enabled) {
            computedModules[key] = false;
          } else if (clientModules && key in clientModules) {
            computedModules[key] = clientModules[key];
          } else {
            computedModules[key] = isPremium 
              ? globalSetting.default_for_premium 
              : globalSetting.default_for_basic;
          }
        } else if (clientModules && key in clientModules) {
          computedModules[key] = clientModules[key];
        } else {
          computedModules[key] = initialModules[key as keyof ClientModules] ?? true;
        }
      }
      
      setModules(computedModules as unknown as ClientModules);
    }
  }, [globalSettings, clientSettings, initialModules]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const modulesJson = modules as unknown as Record<string, boolean>;
      
      const { error } = await supabase
        .from("clients")
        .update({ modules_enabled: modulesJson })
        .eq("id", clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-modules", clientId] });
      toast.success("הגדרות המודולים נשמרו");
      setHasChanges(false);
    },
    onError: (error: Error) => {
      toast.error("שגיאה בשמירת ההגדרות: " + error.message);
    },
  });

  const handleModuleToggle = (module: keyof ClientModules) => {
    setModules((prev) => ({
      ...prev,
      [module]: !prev[module],
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {MODULE_CATEGORIES.map((category) => {
        const CategoryIcon = category.icon;
        const categoryModules = category.modules.filter(
          (m) => m in moduleConfig
        );

        if (categoryModules.length === 0) return null;

        return (
          <Card key={category.key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CategoryIcon className="w-5 h-5" />
                {category.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {categoryModules.map((moduleKey) => {
                  const config = moduleConfig[moduleKey];
                  if (!config) return null;
                  
                  const ModuleIcon = config.icon;
                  const isEnabled = modules[moduleKey as keyof ClientModules] ?? true;
                  const globalSetting = globalSettings.find(g => g.module_name === moduleKey);
                  const isGloballyDisabled = globalSetting && !globalSetting.is_globally_enabled;
                  
                  return (
                    <div
                      key={moduleKey}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isGloballyDisabled ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                          <ModuleIcon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                          <Label className="font-medium">{config.label}</Label>
                          <p className="text-xs text-muted-foreground">{config.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => handleModuleToggle(moduleKey as keyof ClientModules)}
                        disabled={isGloballyDisabled}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {hasChanges && (
        <div className="flex justify-end sticky bottom-4">
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending}
            className="shadow-lg"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 ml-2" />
            )}
            שמור שינויים
          </Button>
        </div>
      )}
    </div>
  );
}
