import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DomainErrorBoundary } from "@/components/shared/DomainErrorBoundary";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, 
  Plus, 
  Loader2, 
  Globe,
  MoreVertical,
  Pencil,
  Trash2,
  Star,
  Crown,
  ExternalLink,
  CheckSquare,
  FolderKanban
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useClient } from "@/hooks/useClient";

interface ClientRow {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  is_master_account: boolean;
  is_agency_brand: boolean | null;
  is_favorite: boolean | null;
  is_active: boolean | null;
  account_type: string | null;
  created_at: string;
}

export default function Clients() {
  const queryClient = useQueryClient();
  const { setSelectedClient } = useClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    website: "",
    description: "",
    logo_url: "",
    account_type: "basic_client",
    is_agency_brand: false,
  });

  // Fetch clients
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients-page"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .is("deleted_at", null)
        .order("is_master_account", { ascending: false })
        .order("is_favorite", { ascending: false })
        .order("name");
      if (error) throw error;
      return data as ClientRow[];
    },
  });

  // Fetch task counts per client
  const { data: taskCounts = {} } = useQuery({
    queryKey: ["client-task-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("client_id, status");
      if (error) throw error;
      
      const counts: Record<string, { total: number; completed: number; pending: number }> = {};
      (data || []).forEach(task => {
        if (task.client_id) {
          if (!counts[task.client_id]) {
            counts[task.client_id] = { total: 0, completed: 0, pending: 0 };
          }
          counts[task.client_id].total++;
          if (task.status === "completed") {
            counts[task.client_id].completed++;
          } else {
            counts[task.client_id].pending++;
          }
        }
      });
      return counts;
    },
  });

  // Fetch project counts per client
  const { data: projectCounts = {} } = useQuery({
    queryKey: ["client-project-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("client_id");
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      (data || []).forEach(project => {
        if (project.client_id) {
          counts[project.client_id] = (counts[project.client_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: formData.name,
        industry: formData.industry || null,
        website: formData.website || null,
        description: formData.description || null,
        logo_url: formData.logo_url || null,
        account_type: formData.account_type,
        is_agency_brand: formData.is_agency_brand,
      };

      if (editingClient) {
        const { error } = await supabase
          .from("clients")
          .update(payload)
          .eq("id", editingClient.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingClient ? "הלקוח עודכן" : "הלקוח נוצר");
      queryClient.invalidateQueries({ queryKey: ["clients-page"] });
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
      closeDialog();
    },
    onError: () => {
      toast.error("שגיאה בשמירת הלקוח");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clients")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("הלקוח נמחק");
      queryClient.invalidateQueries({ queryKey: ["clients-page"] });
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from("clients")
        .update({ is_favorite: isFavorite })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients-page"] });
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
    },
  });

  const closeDialog = () => {
    setShowCreateDialog(false);
    setEditingClient(null);
    setFormData({
      name: "",
      industry: "",
      website: "",
      description: "",
      logo_url: "",
      account_type: "basic_client",
      is_agency_brand: false,
    });
  };

  const openEdit = (client: ClientRow) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      industry: client.industry || "",
      website: client.website || "",
      description: client.description || "",
      logo_url: client.logo_url || "",
      account_type: client.account_type || "basic_client",
      is_agency_brand: client.is_agency_brand || false,
    });
    setShowCreateDialog(true);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <DomainErrorBoundary domain="clients">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <PageHeader 
              title="לקוחות"
              description={`${clients.length} לקוחות במערכת`}
            />
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 ml-2" />
              לקוח חדש
            </Button>
          </div>

          {clients.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">אין לקוחות עדיין</h3>
                <p className="text-muted-foreground mb-4">צור לקוח חדש כדי להתחיל</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  צור לקוח ראשון
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <Card 
                  key={client.id} 
                  className={cn(
                    "hover:shadow-lg transition-shadow group cursor-pointer",
                    client.is_master_account && "border-primary/50 bg-primary/5"
                  )}
                  onClick={() => setSelectedClient(client as any)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {client.logo_url ? (
                          <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
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
                          <CardTitle className="text-base flex items-center gap-2">
                            {client.name}
                            {client.is_favorite && (
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            )}
                          </CardTitle>
                          {client.industry && (
                            <p className="text-sm text-muted-foreground">{client.industry}</p>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={(e) => { 
                            e.stopPropagation(); 
                            toggleFavoriteMutation.mutate({ 
                              id: client.id, 
                              isFavorite: !client.is_favorite 
                            }); 
                          }}>
                            <Star className={cn(
                              "w-4 h-4 ml-2",
                              client.is_favorite && "fill-yellow-400 text-yellow-400"
                            )} />
                            {client.is_favorite ? "הסר ממועדפים" : "הוסף למועדפים"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(client); }}>
                            <Pencil className="w-4 h-4 ml-2" />
                            עריכה
                          </DropdownMenuItem>
                          {!client.is_master_account && (
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(client.id); }}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 ml-2" />
                              מחיקה
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                  </CardHeader>
                  <CardContent>
                    {/* Statistics */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <CheckSquare className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{taskCounts[client.id]?.total || 0}</span>
                        <span className="text-muted-foreground">משימות</span>
                        {(taskCounts[client.id]?.pending || 0) > 0 && (
                          <Badge variant="secondary" className="text-xs h-5">
                            {taskCounts[client.id]?.pending} פתוחות
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <FolderKanban className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{projectCounts[client.id] || 0}</span>
                        <span className="text-muted-foreground">פרויקטים</span>
                      </div>
                    </div>
                    
                    {client.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {client.description}
                      </p>
                    )}
                    {client.website && (
                      <a 
                        href={client.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Globe className="w-3 h-3" />
                        {client.website.replace(/^https?:\/\//, '')}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create/Edit Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={(open) => !open && closeDialog()}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? "עריכת לקוח" : "לקוח חדש"}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>שם הלקוח *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="שם הלקוח"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>סוג חשבון</Label>
                    <Select 
                      value={formData.account_type} 
                      onValueChange={(v) => setFormData({ ...formData, account_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic_client">בסיסי</SelectItem>
                        <SelectItem value="premium_client">פרמיום</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Checkbox
                    id="is_agency_brand"
                    checked={formData.is_agency_brand}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_agency_brand: checked === true })}
                  />
                  <label htmlFor="is_agency_brand" className="text-sm font-medium cursor-pointer">
                    מותג של הסוכנות
                  </label>
                </div>

                <div className="space-y-2">
                  <Label>תחום</Label>
                  <Input
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="לדוגמה: טכנולוגיה, אופנה..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>אתר אינטרנט</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label>לוגו (URL)</Label>
                  <Input
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label>תיאור</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="תיאור קצר על הלקוח"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    ביטול
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      editingClient ? "עדכן" : "צור לקוח"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </DomainErrorBoundary>
    </MainLayout>
  );
}
