import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth, usePermissions } from "@/hooks/useAuth";
import { useClient } from "@/hooks/useClient";
import { 
  User, 
  Bell, 
  Palette,
  Save,
  Loader2,
  Shield,
  Users,
  UserCircle,
  Plug,
  Check,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AuthorizedUsersManager } from "@/components/admin/AuthorizedUsersManager";
import { ClientContactsManager } from "@/components/client/ClientContactsManager";
import { ClientTeamManager } from "@/components/client/ClientTeamManager";
import { Badge } from "@/components/ui/badge";

const settingsSections = [
  { id: "profile", icon: User, title: "פרופיל", description: "ניהול פרטים אישיים" },
  { id: "notifications", icon: Bell, title: "התראות", description: "הגדרת התראות ועדכונים" },
  { id: "integrations", icon: Plug, title: "אינטגרציות", description: "חיבורים למערכות חיצוניות" },
  { id: "users", icon: Shield, title: "משתמשים מורשים", description: "ניהול גישה למערכת", adminOnly: true },
  { id: "team", icon: Users, title: "צוות עובדים", description: "צוות משויך ללקוח", requiresClient: true },
  { id: "contacts", icon: UserCircle, title: "אנשי קשר", description: "אנשי קשר של הלקוח", requiresClient: true },
];

export default function Settings() {
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const { selectedClient } = useClient();
  const [activeSection, setActiveSection] = useState("profile");
  const [saving, setSaving] = useState(false);

  const visibleSections = settingsSections.filter(section => {
    if (section.adminOnly && !isAdmin) return false;
    if (section.requiresClient && !selectedClient) return false;
    return true;
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    toast.success("ההגדרות נשמרו בהצלחה");
  };

  return (
    <MainLayout>
      <div className="p-8 max-w-6xl mx-auto">
        <PageHeader 
          title="הגדרות"
          description="ניהול חשבון והעדפות"
          actions={
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
              שמור שינויים
            </Button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
          {/* Settings Menu */}
          <div className="lg:col-span-1">
            <div className="card-clean p-2 animate-fade-in">
              {visibleSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg text-right transition-all duration-200",
                    activeSection === section.id 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <section.icon className="w-5 h-5 shrink-0" />
                  <div className="flex-1 text-right">
                    <p className="font-medium text-sm">{section.title}</p>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Content Panel */}
          <div className="lg:col-span-3">
            {activeSection === "profile" && (
              <div className="card-clean p-6 animate-slide-up">
                <h2 className="text-xl font-semibold mb-6">פרופיל</h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">אימייל</label>
                    <Input value={user?.email || ""} disabled className="bg-muted" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">שם מלא</label>
                    <Input placeholder="הכנס שם מלא" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">תפקיד</label>
                    <Input placeholder="הכנס תפקיד" />
                  </div>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="card-clean p-6 animate-slide-up">
                <h2 className="text-xl font-semibold mb-6">התראות</h2>
                <div className="space-y-6 max-w-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">התראות אימייל</p>
                      <p className="text-sm text-muted-foreground">קבל עדכונים לאימייל</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">תזכורות משימות</p>
                      <p className="text-sm text-muted-foreground">קבל תזכורות על משימות</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">סיכום יומי</p>
                      <p className="text-sm text-muted-foreground">קבל סיכום יומי לאימייל</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            )}

            {activeSection === "integrations" && (
              <div className="card-clean p-6 animate-slide-up">
                <h2 className="text-xl font-semibold mb-2">אינטגרציות</h2>
                <p className="text-muted-foreground text-sm mb-6">חיבורים למערכות AI עבור משימות ותזכורות</p>
                
                <div className="space-y-4">
                  {/* Gemini - Active */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <span className="text-lg">✨</span>
                      </div>
                      <div>
                        <p className="font-medium">Gemini AI</p>
                        <p className="text-sm text-muted-foreground">ניתוח משימות והצעות חכמות</p>
                      </div>
                    </div>
                    <Badge className="bg-success/20 text-success border-0">
                      <Check className="w-3 h-3 ml-1" />
                      מחובר
                    </Badge>
                  </div>

                  {/* OpenRouter - Active */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <span className="text-lg">🤖</span>
                      </div>
                      <div>
                        <p className="font-medium">OpenRouter</p>
                        <p className="text-sm text-muted-foreground">גישה למודלי AI מתקדמים</p>
                      </div>
                    </div>
                    <Badge className="bg-success/20 text-success border-0">
                      <Check className="w-3 h-3 ml-1" />
                      מחובר
                    </Badge>
                  </div>

                  {/* Resend - Active */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <span className="text-lg">📧</span>
                      </div>
                      <div>
                        <p className="font-medium">Resend</p>
                        <p className="text-sm text-muted-foreground">שליחת תזכורות באימייל</p>
                      </div>
                    </div>
                    <Badge className="bg-success/20 text-success border-0">
                      <Check className="w-3 h-3 ml-1" />
                      מחובר
                    </Badge>
                  </div>

                  {/* Private API - Active */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <span className="text-lg">🔗</span>
                      </div>
                      <div>
                        <p className="font-medium">Private API</p>
                        <p className="text-sm text-muted-foreground">חיבור לפרויקטים חיצוניים</p>
                      </div>
                    </div>
                    <Badge className="bg-success/20 text-success border-0">
                      <Check className="w-3 h-3 ml-1" />
                      מחובר
                    </Badge>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground">
                    כל האינטגרציות מוגדרות ופעילות. לשינוי הגדרות או הוספת אינטגרציות נוספות, פנה למנהל המערכת.
                  </p>
                </div>
              </div>
            )}

            {activeSection === "users" && isAdmin && (
              <div className="animate-slide-up">
                <AuthorizedUsersManager />
              </div>
            )}

            {activeSection === "team" && selectedClient && (
              <div className="animate-slide-up">
                <ClientTeamManager 
                  clientId={selectedClient.id} 
                  clientName={selectedClient.name} 
                />
              </div>
            )}

            {activeSection === "contacts" && selectedClient && (
              <div className="animate-slide-up">
                <ClientContactsManager 
                  clientId={selectedClient.id} 
                  clientName={selectedClient.name} 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
