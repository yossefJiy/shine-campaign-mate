import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DomainErrorBoundary } from "@/components/shared/DomainErrorBoundary";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight,
  Building2, 
  Loader2,
  Globe,
  Crown,
  Star,
  CheckSquare,
  FolderKanban,
  Receipt,
  Users,
  Settings,
  ExternalLink
} from "lucide-react";
import { ClientBillingTab } from "@/components/billing/ClientBillingTab";
import { cn } from "@/lib/utils";

interface ClientData {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  is_master_account: boolean;
  is_agency_brand: boolean | null;
  is_favorite: boolean | null;
  account_type: string | null;
  created_at: string;
}

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch client details
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ["client-profile", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as ClientData;
    },
    enabled: !!id,
  });

  // Fetch tasks for this client
  const { data: tasks = [] } = useQuery({
    queryKey: ["client-tasks", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, priority, due_date")
        .eq("client_id", id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch projects for this client
  const { data: projects = [] } = useQuery({
    queryKey: ["client-projects", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status, created_at")
        .eq("client_id", id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch team members for this client
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["client-team", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("client_team")
        .select("*, profiles(id, full_name, avatar_url)")
        .eq("client_id", id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Stats calculation
  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status !== "completed").length,
    completed: tasks.filter(t => t.status === "completed").length,
  };

  if (isLoadingClient) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!client) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">לקוח לא נמצא</h2>
          <Button variant="outline" onClick={() => navigate("/clients")}>
            <ArrowRight className="w-4 h-4 ml-2" />
            חזרה לרשימת לקוחות
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <DomainErrorBoundary domain="clients">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/clients")}
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-4">
                {client.logo_url ? (
                  <div className="w-16 h-16 rounded-xl bg-white border border-border flex items-center justify-center overflow-hidden shadow-sm">
                    <img 
                      src={client.logo_url} 
                      alt={client.name}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                ) : (
                  <div className={cn(
                    "w-16 h-16 rounded-xl flex items-center justify-center font-bold text-2xl",
                    client.is_master_account 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-primary/10 text-primary"
                  )}>
                    {client.is_master_account ? (
                      <Crown className="w-8 h-8" />
                    ) : (
                      client.name.charAt(0)
                    )}
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{client.name}</h1>
                    {client.is_favorite && (
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {client.industry && (
                      <span className="text-muted-foreground">{client.industry}</span>
                    )}
                    {client.website && (
                      <a 
                        href={client.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline text-sm"
                      >
                        <Globe className="w-3 h-3" />
                        {client.website.replace(/^https?:\/\//, '')}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {client.is_master_account && (
                      <Badge className="bg-primary text-primary-foreground">חשבון סוכנות</Badge>
                    )}
                    {client.is_agency_brand && (
                      <Badge variant="outline" className="border-primary/50 text-primary">מותג סוכנות</Badge>
                    )}
                    {client.account_type === "premium_client" && (
                      <Badge variant="outline" className="border-yellow-500/50 text-yellow-600">פרמיום</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-2xl grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                סקירה
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                משימות
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4" />
                פרויקטים
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                חיובים
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                צוות
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">משימות</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{taskStats.total}</div>
                    <p className="text-xs text-muted-foreground">
                      {taskStats.pending} פתוחות, {taskStats.completed} הושלמו
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">פרויקטים</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{projects.length}</div>
                    <p className="text-xs text-muted-foreground">פרויקטים פעילים</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">אנשי צוות</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{teamMembers.length}</div>
                    <p className="text-xs text-muted-foreground">משתמשים משויכים</p>
                  </CardContent>
                </Card>
              </div>

              {client.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>אודות</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{client.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Recent Tasks */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>משימות אחרונות</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("tasks")}>
                    הצג הכל
                  </Button>
                </CardHeader>
                <CardContent>
                  {tasks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">אין משימות</p>
                  ) : (
                    <div className="space-y-2">
                      {tasks.slice(0, 5).map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                          <span className="font-medium">{task.title}</span>
                          <Badge variant={task.status === "completed" ? "secondary" : "outline"}>
                            {task.status === "completed" ? "הושלם" : "פתוח"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle>משימות</CardTitle>
                </CardHeader>
                <CardContent>
                  {tasks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">אין משימות ללקוח זה</p>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <span className="font-medium">{task.title}</span>
                            {task.due_date && (
                              <p className="text-xs text-muted-foreground">
                                תאריך יעד: {new Date(task.due_date).toLocaleDateString('he-IL')}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {task.priority && (
                              <Badge variant="outline">{task.priority}</Badge>
                            )}
                            <Badge variant={task.status === "completed" ? "secondary" : "outline"}>
                              {task.status === "completed" ? "הושלם" : task.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects">
              <Card>
                <CardHeader>
                  <CardTitle>פרויקטים</CardTitle>
                </CardHeader>
                <CardContent>
                  {projects.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">אין פרויקטים ללקוח זה</p>
                  ) : (
                    <div className="space-y-2">
                      {projects.map((project) => (
                        <div key={project.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <span className="font-medium">{project.name}</span>
                            <p className="text-xs text-muted-foreground">
                              נוצר: {new Date(project.created_at).toLocaleDateString('he-IL')}
                            </p>
                          </div>
                          <Badge variant="outline">{project.status || "פעיל"}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing">
              <ClientBillingTab clientId={id!} />
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team">
              <Card>
                <CardHeader>
                  <CardTitle>אנשי צוות משויכים</CardTitle>
                </CardHeader>
                <CardContent>
                  {teamMembers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">אין אנשי צוות משויכים ללקוח זה</p>
                  ) : (
                    <div className="space-y-2">
                      {teamMembers.map((member: any) => (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              {member.profiles?.avatar_url ? (
                                <img 
                                  src={member.profiles.avatar_url} 
                                  alt={member.profiles.full_name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <Users className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <span className="font-medium">{member.profiles?.full_name || "משתמש"}</span>
                          </div>
                          <Badge variant="outline">{member.role || "member"}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DomainErrorBoundary>
    </MainLayout>
  );
}
