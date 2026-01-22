import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DomainErrorBoundary } from "@/components/shared/DomainErrorBoundary";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTaskForm } from "@/hooks/useTaskForm";
import {
  User,
  Building2,
  Plus,
  Loader2,
  CheckSquare,
  List,
  LayoutGrid,
  Clock,
  Calendar,
  Bell,
  Upload,
  Archive,
  LayoutDashboard,
  Settings2,
  X,
  FolderKanban
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { MyDayBoard } from "@/components/tasks/MyDayBoard";
import { TimeSlotBoard } from "@/components/tasks/TimeSlotBoard";
import { BulkTaskImport } from "@/components/tasks/BulkTaskImport";
import { TaskBulkActions } from "@/components/tasks/TaskBulkActions";
import { TaskShareDialog } from "@/components/tasks/TaskShareDialog";
import { NotificationHistoryDialog } from "@/components/tasks/NotificationHistoryDialog";
import { TaskEditDialog } from "@/components/tasks/TaskEditDialog";
import { TaskTableRow } from "@/components/tasks/TaskTableRow";
import { TaskGridCard } from "@/components/tasks/TaskGridCard";
import { PendingAttachment } from "@/components/tasks/NewTaskAttachments";
import { TeamMember, Project } from "@/types/domains/tasks";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  scheduled_time: string | null;
  assignee: string | null;
  department: string | null;
  client_id: string | null;
  project_id: string | null;
  category: string | null;
  reminder_at: string | null;
  notification_email: boolean;
  notification_sms: boolean;
  notification_phone: string | null;
  notification_email_address: string | null;
  reminder_sent: boolean;
  duration_minutes: number;
  credits_cost: number | null;
  recurrence_type: string | null;
  recurrence_end_date: string | null;
  clients?: { name: string; is_master_account?: boolean } | null;
  projects?: Project | null;
}

const categoryOptions = [
  "אסטרטגיה ותכנון",
  "קריאייטיב ועיצוב",
  "קמפיינים ופרסום",
  "ניתוח נתונים",
  "תפעול וניהול",
  "פיתוח ומערכות",
  "תוכן ו-SEO",
  "לקוחות ומכירות",
  "מנהל מוצר",
];

const timeOptions = Array.from({ length: 24 }, (_, h) =>
  ["00", "30"].map(m => `${h.toString().padStart(2, "0")}:${m}`)
).flat();

export default function Tasks() {
  const { selectedClient } = useClient();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectFilterId = searchParams.get("project");

  // View state
  const [showDashboard, setShowDashboard] = useState(false);
  const [showTimeBoard, setShowTimeBoard] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [filter, setFilter] = useState<"all" | "assignee" | "department" | "date" | "client" | "project">(projectFilterId ? "project" : "all");
  const [selectedValue, setSelectedValue] = useState(projectFilterId || "");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [bulkImportDialogOpen, setBulkImportDialogOpen] = useState(false);
  const [integrationsDialogOpen, setIntegrationsDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [taskToDuplicate, setTaskToDuplicate] = useState<Task | null>(null);
  const [duplicateDate, setDuplicateDate] = useState<Date | undefined>(undefined);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [notificationHistoryOpen, setNotificationHistoryOpen] = useState(false);
  const [notificationHistoryTaskId, setNotificationHistoryTaskId] = useState<string | undefined>();
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);

  // Task form hook
  const taskForm = useTaskForm();

  // Data fetching
  const { data: allClients = [] } = useQuery({
    queryKey: ["all-clients-tasks"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, name, is_master_account");
      return data || [];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-for-tasks", selectedClient?.id],
    queryFn: async () => {
      let query = supabase.from("projects").select("id, name, color").order("name");
      if (selectedClient) {
        query = query.or(`client_id.eq.${selectedClient.id},client_id.is.null`);
      }
      const { data } = await query;
      return (data || []) as Project[];
    },
  });

  const currentProject = projects.find(p => p.id === projectFilterId);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", selectedClient?.id],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*, clients!tasks_client_id_fkey(name, is_master_account), projects:projects!tasks_project_id_fkey(id, name, color)")
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("scheduled_time", { ascending: true, nullsFirst: false });

      if (selectedClient) {
        query = query.eq("client_id", selectedClient.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(task => ({
        ...task,
        scheduled_time: (task as any).scheduled_time || null,
        clients: (task as any).clients || null,
        projects: (task as any).projects || null,
      })) as Task[];
    },
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("team").select("*").eq("is_active", true);
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  // Derived state
  const assignees = [...new Set(tasks.map(t => t.assignee).filter(Boolean))];
  const departments = [...new Set([
    ...tasks.map(t => t.department).filter(Boolean),
    ...teamMembers.flatMap(m => m.departments)
  ])] as string[];
  const activeTasks = tasks.filter(task => task.status !== "completed");
  const archivedTasks = tasks.filter(task => task.status === "completed");
  const clientsForFilter = allClients.filter(c => tasks.some(t => t.client_id === c.id));
  const childTasksMap = new Map<string, Task[]>();

  const filteredTasks = useMemo(() => {
    return (showArchive ? archivedTasks : activeTasks).filter(task => {
      if (filter === "date" && selectedDate) {
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date).toDateString();
        const filterDate = selectedDate.toDateString();
        if (taskDate !== filterDate) return false;
      }
      if ((filter === "assignee" || filter === "department") && selectedValue) {
        if (filter === "assignee" && task.assignee !== selectedValue) return false;
        if (filter === "department" && task.department !== selectedValue) return false;
      }
      if (filter === "client" && selectedValue && task.client_id !== selectedValue) return false;
      if (filter === "project" && selectedValue && task.project_id !== selectedValue) return false;
      return true;
    });
  }, [showArchive, archivedTasks, activeTasks, filter, selectedDate, selectedValue]);

  // Assignee helpers
  const assigneeIdToName: Record<string, string> = {};
  const assigneeIdToColor: Record<string, string> = {};
  teamMembers.forEach(m => {
    if (m.id) {
      assigneeIdToName[m.id] = m.name;
      if (m.avatar_color) assigneeIdToColor[m.id] = m.avatar_color;
    }
  });

  const getAssigneeInfo = (assigneeId: string | null) => {
    if (!assigneeId) return null;
    const name = assigneeIdToName[assigneeId] || assigneeId;
    const color = assigneeIdToColor[assigneeId] || 'hsl(var(--primary))';
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
    return { name, color, initials };
  };

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (task: Partial<Task> & { id?: string }) => {
      const taskData = {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date || null,
        scheduled_time: task.scheduled_time || null,
        assignee: task.assignee,
        department: task.department,
        category: task.category || null,
        project_id: task.project_id || null,
        reminder_at: task.reminder_at || null,
        notification_email: task.notification_email || false,
        notification_sms: task.notification_sms || false,
        notification_phone: task.notification_phone || null,
        notification_email_address: task.notification_email_address || null,
        reminder_sent: false,
        duration_minutes: task.duration_minutes || 60,
      };

      if (task.id) {
        const { error } = await supabase.from("tasks").update(taskData).eq("id", task.id);
        if (error) throw error;
        return task.id;
      } else {
        const { data, error } = await supabase.from("tasks").insert({
          ...taskData,
          client_id: selectedClient?.id || null,
        }).select('id').single();
        if (error) throw error;
        return data.id;
      }
    },
    onSuccess: async (newTaskId) => {
      // Upload pending attachments
      if (pendingAttachments.length > 0 && newTaskId) {
        for (const attachment of pendingAttachments) {
          try {
            const fileExt = attachment.file.name.split('.').pop();
            const fileName = `${newTaskId}/${crypto.randomUUID()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('task-attachments').upload(fileName, attachment.file);
            if (!uploadError) {
              const { data: urlData } = supabase.storage.from('task-attachments').getPublicUrl(fileName);
              await supabase.from('task_attachments').insert({
                task_id: newTaskId,
                name: attachment.file.name,
                url: urlData.publicUrl,
                attachment_type: attachment.file.type.startsWith('image/') ? 'image' : 'file',
                mime_type: attachment.file.type,
                file_size: attachment.file.size,
              });
            }
          } catch (err) {
            console.error('Failed to upload attachment:', err);
          }
        }
        setPendingAttachments([]);
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("המשימה נשמרה");
      closeDialog();
    },
    onError: () => toast.error("שגיאה בשמירת משימה"),
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (tasksToCreate: Array<{ title: string; description?: string; due_date?: string; scheduled_time?: string; duration_minutes?: number; assignee?: string; priority?: string; category?: string }>) => {
      const tasksData = tasksToCreate.map((task) => ({
        title: task.title,
        description: task.description || null,
        due_date: task.due_date || null,
        scheduled_time: task.scheduled_time || null,
        duration_minutes: task.duration_minutes || 60,
        assignee: task.assignee || null,
        priority: task.priority || "medium",
        category: task.category || null,
        status: "pending",
        client_id: selectedClient?.id || null,
      }));
      const { error } = await supabase.from("tasks").insert(tasksData);
      if (error) throw error;
      return tasksData.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(`${count} משימות נוספו בהצלחה`);
      setBulkImportDialogOpen(false);
    },
    onError: () => toast.error("שגיאה בייבוא משימות"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("הסטטוס עודכן");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("המשימה נמחקה");
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    },
    onError: () => toast.error("שגיאה במחיקת משימה"),
  });

  const duplicateMutation = useMutation({
    mutationFn: async ({ task, newDate }: { task: Task; newDate?: string }) => {
      const { error } = await supabase.from("tasks").insert({
        title: `${task.title} (העתק)`,
        description: task.description,
        status: "pending",
        priority: task.priority,
        due_date: newDate || task.due_date,
        scheduled_time: task.scheduled_time,
        assignee: task.assignee,
        department: task.department,
        client_id: task.client_id,
        category: task.category,
        duration_minutes: task.duration_minutes,
        notification_email: task.notification_email,
        notification_sms: task.notification_sms,
        notification_phone: task.notification_phone,
        notification_email_address: task.notification_email_address,
        reminder_sent: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("המשימה שוכפלה בהצלחה");
      setDuplicateDialogOpen(false);
      setTaskToDuplicate(null);
      setDuplicateDate(undefined);
    },
    onError: () => toast.error("שגיאה בשכפול משימה"),
  });

  const restoreMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("tasks").update({ status: "pending" }).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("המשימה שוחזרה");
    },
    onError: () => toast.error("שגיאה בשחזור משימה"),
  });

  // Handlers
  const openDialog = (task?: Task) => {
    setSelectedTask(task || null);
    if (task) {
      taskForm.initFromTask({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date || "",
        scheduledTime: task.scheduled_time || "",
        assignee: task.assignee || "",
        department: task.department || "",
        category: task.category || "",
        projectId: task.project_id || "",
        reminderAt: task.reminder_at || "",
        notificationEmail: task.notification_email,
        notificationSms: task.notification_sms,
        notificationPhone: task.notification_phone || "",
        notificationEmailAddress: task.notification_email_address || "",
        id: task.id,
      }, projectFilterId || undefined);
    } else {
      taskForm.resetForm();
      if (projectFilterId) {
        taskForm.updateField('projectId', projectFilterId);
      }
    }
    setEditDialogOpen(true);
  };

  const closeDialog = () => {
    setEditDialogOpen(false);
    setSelectedTask(null);
    taskForm.resetForm();
    setPendingAttachments([]);
  };

  const handleSave = () => {
    if (!taskForm.formData.title.trim()) {
      toast.error("נא להזין כותרת");
      return;
    }
    saveMutation.mutate({
      id: selectedTask?.id,
      title: taskForm.formData.title,
      description: taskForm.formData.description,
      status: taskForm.formData.status,
      priority: taskForm.formData.priority,
      due_date: taskForm.formData.dueDate || null,
      scheduled_time: taskForm.formData.scheduledTime ? `${taskForm.formData.scheduledTime}:00` : null,
      assignee: taskForm.formData.assignee || null,
      department: taskForm.formData.department || null,
      category: taskForm.formData.category || null,
      project_id: taskForm.formData.projectId || null,
      reminder_at: taskForm.formData.reminderAt ? new Date(taskForm.formData.reminderAt).toISOString() : null,
      notification_email: taskForm.formData.notificationEmail,
      notification_sms: taskForm.formData.notificationSms,
      notification_phone: taskForm.formData.notificationPhone || null,
      notification_email_address: taskForm.formData.notificationEmailAddress || null,
      reminder_sent: false,
      duration_minutes: 60,
    });
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.size === filteredTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map(t => t.id)));
    }
  };

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const toggleStatus = (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "pending" ? "in-progress" : currentStatus === "in-progress" ? "completed" : "pending";
    updateStatusMutation.mutate({ id: taskId, status: nextStatus });
  };

  const openDuplicateDialog = (task: Task) => {
    setTaskToDuplicate(task);
    setDuplicateDate(task.due_date ? new Date(task.due_date) : undefined);
    setDuplicateDialogOpen(true);
  };

  const handleDuplicateWithDate = () => {
    if (!taskToDuplicate) return;
    duplicateMutation.mutate({
      task: taskToDuplicate,
      newDate: duplicateDate ? format(duplicateDate, "yyyy-MM-dd") : undefined,
    });
  };

  const selectedTasksObjects = tasks.filter(t => selectedTaskIds.has(t.id));

  // Conditional views
  if (showTimeBoard) {
    return (
      <MainLayout>
        <DomainErrorBoundary domain="tasks">
          <div className="p-4 md:p-8">
            <PageHeader
              title="לוח זמנים יומי"
              description="תכנון משימות לפי שעות"
              actions={
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowDashboard(true)}>
                    <LayoutDashboard className="w-4 h-4 ml-2" />
                    הדשבורד שלי
                  </Button>
                  <Button variant="outline" onClick={() => setShowTimeBoard(false)}>
                    <List className="w-4 h-4 ml-2" />
                    תצוגה מלאה
                  </Button>
                </div>
              }
            />
            <TimeSlotBoard showAllTeam={!selectedClient} />
          </div>
        </DomainErrorBoundary>
      </MainLayout>
    );
  }

  if (showDashboard) {
    return (
      <MainLayout>
        <DomainErrorBoundary domain="tasks">
          <div className="p-4 md:p-8">
            <PageHeader
              title="הדשבורד שלי"
              description="משימות להיום ולקראת"
              actions={
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowTimeBoard(true)}>
                    <Clock className="w-4 h-4 ml-2" />
                    לוח זמנים
                  </Button>
                  <Button variant="outline" onClick={() => setShowDashboard(false)}>
                    <List className="w-4 h-4 ml-2" />
                    תצוגה מלאה
                  </Button>
                </div>
              }
            />
            <MyDayBoard />
          </div>
        </DomainErrorBoundary>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <DomainErrorBoundary domain="tasks">
        <div className="p-4 md:p-8">
          <PageHeader
            title={showArchive ? "ארכיון משימות" : (currentProject ? `משימות - ${currentProject.name}` : (selectedClient ? `משימות - ${selectedClient.name}` : "ניהול משימות"))}
            description={showArchive ? "משימות שהושלמו" : (currentProject ? `${filteredTasks.length} משימות בפרויקט` : "לפי עובד, לקוח ומחלקה")}
            actions={
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => { setNotificationHistoryTaskId(undefined); setNotificationHistoryOpen(true); }}>
                  <Bell className="w-4 h-4 ml-2" />
                  היסטוריית התראות
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIntegrationsDialogOpen(true)}>
                  <Settings2 className="w-4 h-4 ml-2" />
                  אינטגרציות
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowTimeBoard(true)}>
                  <Clock className="w-4 h-4 ml-2" />
                  לוח זמנים
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowDashboard(true)}>
                  <LayoutDashboard className="w-4 h-4 ml-2" />
                  הדשבורד שלי
                </Button>
                <Button variant="outline" size="sm" onClick={() => setBulkImportDialogOpen(true)}>
                  <Upload className="w-4 h-4 ml-2" />
                  ייבוא בכמות
                </Button>
                <Button variant={showArchive ? "default" : "outline"} size="sm" onClick={() => setShowArchive(!showArchive)}>
                  <Archive className="w-4 h-4 ml-2" />
                  ארכיון ({archivedTasks.length})
                </Button>
                <Button className="glow" size="sm" onClick={() => openDialog()}>
                  <Plus className="w-4 h-4 ml-2" />
                  משימה חדשה
                </Button>
              </div>
            }
          />

          {/* Project Filter Banner */}
          {projectFilterId && currentProject && (
            <div className="mb-4 flex items-center justify-between bg-muted/50 rounded-lg p-3 border">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5" style={{ color: currentProject.color || 'hsl(var(--primary))' }} />
                <span className="font-medium">מציג משימות מפרויקט: {currentProject.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchParams({});
                  setFilter("all");
                  setSelectedValue("");
                }}
              >
                <X className="w-4 h-4 ml-1" />
                הצג הכל
              </Button>
            </div>
          )}

          {/* Filters & View Toggle */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                {[
                  { id: "all", label: "הכל" },
                  { id: "assignee", label: "עובד", icon: User },
                  { id: "department", label: "מחלקה", icon: Building2 },
                  { id: "date", label: "תאריך", icon: Calendar },
                  { id: "client", label: "לקוח", icon: Building2 },
                  { id: "project", label: "פרויקט", icon: FolderKanban },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setFilter(id as any); if (id === "all") { setSelectedValue(""); setSearchParams({}); } }}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
                      filter === id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    )}
                  >
                    {Icon && <Icon className="w-3 h-3" />}
                    {label}
                  </button>
                ))}
              </div>

              {(filter === "assignee" || filter === "department" || filter === "client" || filter === "project") && (
                <Select value={selectedValue} onValueChange={(v) => {
                  setSelectedValue(v);
                  if (filter === "project") {
                    if (v) setSearchParams({ project: v });
                    else setSearchParams({});
                  }
                }}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={
                      filter === "assignee" ? "בחר עובד" :
                        filter === "department" ? "בחר מחלקה" :
                          filter === "client" ? "בחר לקוח" : "בחר פרויקט"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {filter === "assignee" && assignees.map(a => <SelectItem key={a} value={a!}>{a}</SelectItem>)}
                    {filter === "department" && departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    {filter === "client" && clientsForFilter.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    {filter === "project" && projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              {filter === "date" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-40 justify-start text-right">
                      <Calendar className="w-4 h-4 ml-2" />
                      {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "בחר תאריך"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-2 rounded-md transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-2 rounded-md transition-colors", viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tasks Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="glass rounded-xl p-8 md:p-12 text-center">
              <CheckSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">אין משימות</h3>
              <p className="text-muted-foreground mb-4">צור את המשימה הראשונה</p>
              <Button onClick={() => openDialog()}>
                <Plus className="w-4 h-4 ml-2" />
                משימה חדשה
              </Button>
            </div>
          ) : viewMode === "list" ? (
            <div className="glass rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/30">
                <Checkbox
                  checked={filteredTasks.length > 0 && selectedTaskIds.size === filteredTasks.length}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedTaskIds.size > 0 ? `${selectedTaskIds.size} נבחרו` : "בחר הכל"}
                </span>
              </div>
              {filteredTasks.map((task) => (
                <TaskTableRow
                  key={task.id}
                  task={task}
                  isSelected={selectedTaskIds.has(task.id)}
                  isExpanded={expandedTasks.has(task.id)}
                  childTasks={childTasksMap.get(task.id) || []}
                  showArchive={showArchive}
                  assigneeInfo={getAssigneeInfo(task.assignee)}
                  onToggleSelect={toggleTaskSelection}
                  onToggleExpand={toggleExpanded}
                  onToggleStatus={toggleStatus}
                  onEdit={openDialog}
                  onDelete={(t) => { setTaskToDelete(t); setDeleteDialogOpen(true); }}
                  onDuplicate={openDuplicateDialog}
                  onRestore={(id) => restoreMutation.mutate(id)}
                  onNewTask={() => openDialog()}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task, index) => (
                <TaskGridCard
                  key={task.id}
                  task={task}
                  index={index}
                  isSelected={selectedTaskIds.has(task.id)}
                  childCount={childTasksMap.get(task.id)?.length || 0}
                  assigneeInfo={getAssigneeInfo(task.assignee)}
                  onToggleSelect={toggleTaskSelection}
                  onToggleStatus={toggleStatus}
                  onEdit={openDialog}
                  onDelete={(t) => { setTaskToDelete(t); setDeleteDialogOpen(true); }}
                  onNewTask={() => openDialog()}
                />
              ))}
            </div>
          )}
        </div>

        {/* Edit Task Dialog */}
        <TaskEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          selectedTaskId={selectedTask?.id || null}
          formData={taskForm.formData}
          updateField={taskForm.updateField}
          expandedSections={taskForm.expandedSections}
          toggleSection={taskForm.toggleSection}
          selectedReminders={taskForm.selectedReminders}
          toggleReminderOption={taskForm.toggleReminderOption}
          showReminderPreview={taskForm.showReminderPreview}
          setShowReminderPreview={taskForm.setShowReminderPreview}
          onSave={handleSave}
          isSaving={saveMutation.isPending}
          teamMembers={teamMembers}
          projects={projects}
          departments={departments}
          categoryOptions={categoryOptions}
          timeOptions={timeOptions}
          handleAssigneeChange={(name) => taskForm.handleAssigneeChange(name, teamMembers)}
          handleCategoryChange={(category) => {
            taskForm.updateField('category', category);
            if (!taskForm.formData.assignee && category) {
              const suggested = taskForm.getSmartAssignee(category, taskForm.formData.department, teamMembers);
              if (suggested) {
                taskForm.handleAssigneeChange(suggested, teamMembers);
                toast.info(`שויך אוטומטית ל: ${suggested}`);
              }
            }
          }}
          handleDepartmentChange={(department) => {
            taskForm.updateField('department', department);
            if (!taskForm.formData.assignee && department) {
              const suggested = taskForm.getSmartAssignee(taskForm.formData.category, department, teamMembers);
              if (suggested) {
                taskForm.handleAssigneeChange(suggested, teamMembers);
                toast.info(`שויך אוטומטית ל: ${suggested}`);
              }
            }
          }}
          pendingAttachments={pendingAttachments}
          setPendingAttachments={setPendingAttachments}
        />

        {/* Bulk Import Dialog */}
        <BulkTaskImport
          open={bulkImportDialogOpen}
          onOpenChange={setBulkImportDialogOpen}
          onImport={(tasks) => bulkImportMutation.mutate(tasks)}
          teamMembers={teamMembers.map(m => ({ id: m.id, name: m.name }))}
          isLoading={bulkImportMutation.isPending}
        />

        {/* Duplicate with Date Dialog */}
        <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>שכפול משימה</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                שכפול: <span className="font-medium text-foreground">{taskToDuplicate?.title}</span>
              </p>
              <div className="space-y-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-right">
                      <Calendar className="w-4 h-4 ml-2" />
                      {duplicateDate ? format(duplicateDate, "dd/MM/yyyy") : "ללא תאריך"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={duplicateDate}
                      onSelect={setDuplicateDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>ביטול</Button>
              <Button onClick={handleDuplicateWithDate} disabled={duplicateMutation.isPending}>
                {duplicateMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                שכפל
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>מחיקת משימה</AlertDialogTitle>
              <AlertDialogDescription>
                האם למחוק את "{taskToDelete?.title}"?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction onClick={() => taskToDelete && deleteMutation.mutate(taskToDelete.id)} className="bg-destructive hover:bg-destructive/90">
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                מחק
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Actions Bar */}
        <TaskBulkActions
          selectedTasks={selectedTasksObjects}
          onClearSelection={() => setSelectedTaskIds(new Set())}
          teamMembers={teamMembers.map(m => ({ id: m.id, name: m.name }))}
          categories={categoryOptions}
          onShareClick={() => setShareDialogOpen(true)}
        />

        {/* Share Dialog */}
        <TaskShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          tasks={selectedTasksObjects}
        />

        {/* Notification History Dialog */}
        <NotificationHistoryDialog
          open={notificationHistoryOpen}
          onOpenChange={setNotificationHistoryOpen}
          taskId={notificationHistoryTaskId}
        />
      </DomainErrorBoundary>
    </MainLayout>
  );
}
