import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePermissions } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield,
  Plug,
  Check,
  Building2,
  Plus,
  Loader2,
  Star,
  Crown,
  ArrowLeft,
  User,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuthorizedUsersManager } from "@/components/admin/AuthorizedUsersManager";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";

const settingsSections = [
  { id: "profile", icon: User, title: "פרופיל", description: "פרטים אישיים ותמונה" },
  { id: "notifications", icon: Bell, title: "התראות", description: "העדפות התראות ותזכורות" },
  { id: "clients", icon: Building2, title: "לקוחות", description: "ניהול לקוחות ומותגים" },
  { id: "integrations", icon: Plug, title: "אינטגרציות", description: "חיבורים למערכות חיצוניות" },
  { id: "users", icon: Shield, title: "משתמשים מורשים", description: "ניהול גישה למערכת", adminOnly: true },
];

interface ClientRow {
  id: string;
  name: string;
  industry: string | null;
  logo_url: string | null;
  is_master_account: boolean;
  is_agency_brand: boolean | null;
  is_favorite: boolean | null;
  account_type: string | null;
}

export default function Settings() {
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();
  const [activeSection, setActiveSection] = useState("profile");

  const visibleSections = settingsSections.filter(section => {
    if (section.adminOnly && !isAdmin) return false;
    return true;
  });

  // Fetch clients for the clients section
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ["settings-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, industry, logo_url, is_master_account, is_agency_brand, is_favorite, account_type")
        .is("deleted_at", null)
        .order("is_master_account", { ascending: false })
        .order("is_favorite", { ascending: false })
        .order("name");
      if (error) throw error;
      return data as ClientRow[];
    },
    enabled: activeSection === "clients",
  });

  return (
    <MainLayout>
      <div className="p-8 max-w-6xl mx-auto">
        <PageHeader 
          title="הגדרות"
          description="ניהול מערכת והגדרות כלליות"
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
            {/* Profile Section */}
            {activeSection === "profile" && (
              <div className="animate-slide-up">
                <ProfileSection />
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === "notifications" && (
              <div className="animate-slide-up">
                <NotificationsSection />
              </div>
            )}

            {/* Clients Section */}
            {activeSection === "clients" && (
              <div className="card-clean p-6 animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">לקוחות</h2>
                    <p className="text-sm text-muted-foreground">ניהול לקוחות ומותגים במערכת</p>
                  </div>
                  <Button onClick={() => navigate("/clients")}>
                    <Plus className="w-4 h-4 ml-2" />
                    לקוח חדש
                  </Button>
                </div>
                
                {isLoadingClients ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : clients.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">אין לקוחות במערכת</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        onClick={() => navigate(`/clients/${client.id}`)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                          client.is_master_account 
                            ? "border-primary/30 bg-primary/5 hover:bg-primary/10" 
                            : "hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {client.logo_url ? (
                            <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center overflow-hidden shrink-0">
                              <img 
                                src={client.logo_url} 
                                alt={client.name}
                                className="w-full h-full object-contain p-0.5"
                              />
                            </div>
                          ) : (
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shrink-0",
                              client.is_master_account 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-primary/10 text-primary"
                            )}>
                              {client.is_master_account ? (
                                <Crown className="w-5 h-5" />
                              ) : (
                                client.name.charAt(0)
                              )}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{client.name}</span>
                              {client.is_favorite && (
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {client.industry && (
                                <span className="text-xs text-muted-foreground">{client.industry}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {client.is_master_account && (
                            <Badge className="bg-primary text-primary-foreground">סוכנות</Badge>
                          )}
                          {client.is_agency_brand && (
                            <Badge variant="outline" className="border-primary/50 text-primary">מותג</Badge>
                          )}
                          {client.account_type === "premium_client" && (
                            <Badge variant="outline" className="border-yellow-500/50 text-yellow-600">פרמיום</Badge>
                          )}
                          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Integrations Section */}
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

                  {/* Extra API - Active */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <span className="text-lg">⚡</span>
                      </div>
                      <div>
                        <p className="font-medium">Extra API</p>
                        <p className="text-sm text-muted-foreground">שירותי API נוספים</p>
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
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
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

            {/* Users Section */}
            {activeSection === "users" && isAdmin && (
              <div className="animate-slide-up">
                <AuthorizedUsersManager />
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
