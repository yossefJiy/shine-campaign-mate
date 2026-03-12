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
  Plus,
  Loader2,
  CheckSquare,
  List,
  LayoutGrid,
  X,
  FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
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
import { Calendar } from "lucide-react";
import { TaskBulkActions } from "@/components/tasks/TaskBulkActions";
import { TaskEditDialog } from "@/components/tasks/TaskEditDialog";
import { TaskTableRow } from "@/components/tasks/TaskTableRow";
import { TaskGridCard } from "@/components/tasks/TaskGridCard";
import { TaskInbox } from "@/components/tasks/TaskInbox";
import { TaskStatusTabs, TaskStatusTab } from "@/components/tasks/TaskStatusTabs";
import { PendingAttachment } from "@/components/tasks/NewTaskAttachments";
import { TeamMember, Project } from "@/types/domains/tasks";
import { microcopy } from "@/lib/microcopy";

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
  stage_id: string | null;
  task_tag: string | null;
  income_value: number | null;
  waiting_since: string | null;
  is_blocking: boolean | null;
  created_at?: string;
  clients?: { name: string; is_master_account?: boolean } | null;
  projects?: Project | null;
  task_language?: string | null;
  department_id?: string | null;
  org_team_id?: string | null;
  assignment_scope?: string | null;
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
  const { selectedClient, effectiveClient, isAgencyView, clients } = useClient();
  const { user } = useAuth();
  const [newTaskClientId, setNewTaskClientId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectFilterId = searchParams.get("project");

  // View state
  const [currentTab, setCurrentTab] = useState<TaskStatusTab>("active");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Filter state
  const [filterAssignee, setFilterAssignee] = useState<string>("");
  const [filterDepartment, setFilterDepartment] = useState<string>("");
  const [filterTeam, setFilterTeam] = useState<string>("");
  const [filterLanguage, setFilterLanguage] = useState<string>("");

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [taskToDuplicate, setTaskToDuplicate] = useState<Task | null>(null);
  const [duplicateDate, setDuplicateDate] = useState<Date | undefined>(undefined);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);

  // Task form hook
  const taskForm = useTaskForm();

  // Data fetching
  const { data: allClients = [] } = useQuery({
    queryKey: ["all-clients-tasks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, name, is_master_account")
        .is("deleted_at", null);
      return data || [];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-for-tasks", selectedClient?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, color, client_id, clients:clients!projects_client_id_fkey(is_master_account)")
        .order("name");

      if (error) throw error;

      const rows = (data || []) as Array<{
        id: string;
        name: string;
        color: string | null;
        client_id: string | null;
        clients?: { is_master_account?: boolean } | null;
      }>;

      const filtered = (selectedClient && !selectedClient.is_master_account)
        ? rows.filter((p) => p.client_id === selectedClient.id)
        : rows;

      return filtered.map((p) => ({ id: p.id, name: p.name, color: p.color })) as Project[];
    },
  });

  const currentProject = projects.find(p => p.id === projectFilterId);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", selectedClient?.id],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*, clients!tasks_client_id_fkey(name, is_master_account, deleted_at), projects:projects!tasks_project_id_fkey(id, name, color)")
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("scheduled_time", { ascending: true, nullsFirst: false });

      if (selectedClient && !selectedClient.is_master_account) {
        query = query.eq("client_id", selectedClient.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const filteredData = (data || []).filter(task => {
        const taskClients = (task as any).clients;
        return !taskClients?.deleted_at;
      });
      
      return filteredData.map(task => ({
        ...task,
        scheduled_time: (task as any).scheduled_time || null,
        clients: (task as any).clients || null,
        projects: (task as any).projects || null,
        waiting_since: (task as any).waiting_since || null,
        is_blocking: (task as any).is_blocking || false,
        created_at: (task as any).created_at || new Date().toISOString(),
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

  const { data: orgTeams = [] } = useQuery({
    queryKey: ["org-teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("org_teams").select("id, name").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: depts = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("id, name").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // Derived state - Task categorization based on status tabs
  const departments = [...new Set([
    ...tasks.map(t => t.department).filter(Boolean),
    ...teamMembers.flatMap(m => m.departments)
  ])] as string[];

  // Categorize tasks by status
  const inboxTasks = tasks.filter(task => !task.project_id && task.status !== "completed");
  const activeTasks = tasks.filter(task => 
    task.project_id && 
    task.status !== "completed" && 
    task.status !== "waiting" &&
    task.status !== "blocked"
  );
  const waitingTasks = tasks.filter(task => 
    task.status === "waiting" || task.status === "blocked"
  );
  const doneTasks = tasks.filter(task => task.status === "completed");

  // Tab counts
  const tabCounts = useMemo(() => ({
    inbox: inboxTasks.length,
    active: activeTasks.length,
    waiting: waitingTasks.length,
    done: doneTasks.length,
  }), [inboxTasks.length, activeTasks.length, waitingTasks.length, doneTasks.length]);

  // Filtered tasks based on current tab
  const filteredTasks = useMemo(() => {
    let baseTasks: Task[] = [];
    
    switch (currentTab) {
      case "inbox":
        baseTasks = inboxTasks;
        break;
      case "active":
        baseTasks = activeTasks;
        break;
      case "waiting":
        baseTasks = waitingTasks;
        break;
      case "done":
        baseTasks = doneTasks;
        break;
    }

    // Apply project filter if set
    if (projectFilterId) {
      baseTasks = baseTasks.filter(task => task.project_id === projectFilterId);
    }

    // Apply additional filters
    if (filterAssignee) {
      baseTasks = baseTasks.filter(task => task.assignee === filterAssignee);
    }
    if (filterDepartment) {
      baseTasks = baseTasks.filter(task => task.department_id === filterDepartment || task.department === filterDepartment);
    }
    if (filterTeam) {
      baseTasks = baseTasks.filter(task => task.org_team_id === filterTeam);
    }
    if (filterLanguage) {
      baseTasks = baseTasks.filter(task => task.task_language === filterLanguage);
    }

    return baseTasks;
  }, [currentTab, inboxTasks, activeTasks, waitingTasks, doneTasks, projectFilterId, filterAssignee, filterDepartment, filterTeam, filterLanguage]);

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
    mutationFn: async (task: Partial<Task> & { id?: string; client_id?: string }) => {
      const targetClientId = task.id 
        ? (newTaskClientId || undefined)
        : (task.client_id || newTaskClientId || effectiveClient?.id);
      
      if (!task.id && !targetClientId) {
        throw new Error("יש לבחור לקוח לפני יצירת משימה");
      }

      const taskData: Record<string, unknown> = {
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
        stage_id: task.stage_id || null,
        task_tag: task.task_tag || null,
        income_value: task.income_value || null,
        reminder_at: task.reminder_at || null,
        notification_email: task.notification_email || false,
        notification_sms: task.notification_sms || false,
        notification_phone: task.notification_phone || null,
        notification_email_address: task.notification_email_address || null,
        reminder_sent: false,
        duration_minutes: task.duration_minutes || 60,
        assignment_scope: (task as any).assignment_scope || 'individual',
        org_team_id: (task as any).org_team_id || null,
        department_id: (task as any).department_id || null,
        task_language: (task as any).task_language || 'he',
      };

      if (task.id) {
        if (targetClientId) {
          taskData.client_id = targetClientId;
        }
        const { error } = await supabase.from("tasks").update(taskData).eq("id", task.id);
        if (error) throw error;
        return task.id;
      } else {
        taskData.client_id = targetClientId;
        const { data, error } = await supabase.from("tasks").insert(taskData as any).select('id').single();
        if (error) throw error;
        return data.id;
      }
    },
    onSuccess: async (newTaskId) => {
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
    onError: (error: Error) => {
      if (error.message.includes("יש לבחור לקוח")) {
        toast.error("יש לבחור לקוח לפני יצירת משימה", {
          description: "בחר לקוח מהתפריט או צור משימה מתוך דף לקוח ספציפי"
        });
      } else {
        toast.error("שגיאה בשמירת משימה");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: Record<string, unknown> = { status };
      
      // Handle waiting_since based on status
      if (status === "waiting" || status === "blocked") {
        updateData.waiting_since = new Date().toISOString().split('T')[0];
      } else {
        updateData.waiting_since = null;
      }

      const { error } = await supabase.from("tasks").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => toast.error("שגיאה בעדכון סטטוס"),
  });

  const duplicateMutation = useMutation({
    mutationFn: async ({ task, newDate }: { task: Task; newDate?: string }) => {
      const { id, created_at, clients, projects, ...taskData } = task;
      const { error } = await supabase.from("tasks").insert({
        ...taskData,
        title: `${task.title} (עותק)`,
        status: "pending",
        due_date: newDate || task.due_date,
        waiting_since: null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("המשימה שוכפלה");
      setDuplicateDialogOpen(false);
      setTaskToDuplicate(null);
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

  const assignToProjectMutation = useMutation({
    mutationFn: async ({ taskId, projectId }: { taskId: string; projectId: string }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ project_id: projectId })
        .eq("id", taskId);
      if (error) throw error;

      // Update project last_activity_at
      await supabase
        .from("projects")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("id", projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("המשימה שויכה לפרויקט");
    },
    onError: () => toast.error("שגיאה בשיוך משימה"),
  });

  // Handlers
  const openDialog = (task?: Task) => {
    setSelectedTask(task || null);
    if (task?.client_id) {
      setNewTaskClientId(task.client_id);
    } else {
      setNewTaskClientId(null);
    }
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
        stageId: task.stage_id || "",
        taskTag: (task.task_tag as 'income_generating' | 'operational' | 'client_dependent') || "operational",
        incomeValue: task.income_value?.toString() || "",
        reminderAt: task.reminder_at || "",
        notificationEmail: task.notification_email,
        notificationSms: task.notification_sms,
        notificationPhone: task.notification_phone || "",
        notificationEmailAddress: task.notification_email_address || "",
        taskType: ((task as any).task_type as any) || "operations",
        expectedResult: (task as any).expected_result || "",
        referenceLinks: (task as any).reference_links || [],
        notes: (task as any).notes || "",
        dependsOn: (task as any).depends_on || [],
        qaResult: (task as any).qa_result || "",
        completionProof: (task as any).completion_proof || "",
        completionNotes: (task as any).completion_notes || "",
        readyForQa: (task as any).ready_for_qa || false,
        assignmentScope: (task as any).assignment_scope || "individual",
        orgTeamId: (task as any).org_team_id || "",
        departmentId: (task as any).department_id || "",
        taskLanguage: (task as any).task_language || "he",
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
    setNewTaskClientId(null);
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
      stage_id: taskForm.formData.stageId || null,
      task_tag: taskForm.formData.taskTag || null,
      income_value: taskForm.formData.incomeValue ? parseFloat(taskForm.formData.incomeValue) : null,
      reminder_at: taskForm.formData.reminderAt ? new Date(taskForm.formData.reminderAt).toISOString() : null,
      notification_email: taskForm.formData.notificationEmail,
      notification_sms: taskForm.formData.notificationSms,
      notification_phone: taskForm.formData.notificationPhone || null,
      notification_email_address: taskForm.formData.notificationEmailAddress || null,
      reminder_sent: false,
      duration_minutes: 60,
      task_type: taskForm.formData.taskType || 'operations',
      expected_result: taskForm.formData.expectedResult || null,
      reference_links: taskForm.formData.referenceLinks.length > 0 ? taskForm.formData.referenceLinks : null,
      qa_result: taskForm.formData.qaResult || null,
      completion_proof: taskForm.formData.completionProof || null,
      completion_notes: taskForm.formData.completionNotes || null,
      ready_for_qa: taskForm.formData.readyForQa,
      assignment_scope: taskForm.formData.assignmentScope || 'individual',
      org_team_id: taskForm.formData.orgTeamId || null,
      department_id: taskForm.formData.departmentId || null,
      task_language: taskForm.formData.taskLanguage || 'he',
    } as any);
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

  const updateStatus = (taskId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
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
  const childTasksMap = new Map<string, Task[]>();

  return (
    <MainLayout>
      <DomainErrorBoundary domain="tasks">
        <div className="p-4 md:p-8">
          <PageHeader
            title={currentProject ? `משימות - ${currentProject.name}` : (selectedClient ? `משימות - ${selectedClient.name}` : "ניהול משימות")}
            description={currentProject ? `${filteredTasks.length} משימות בפרויקט` : "ניהול משימות לפי סטטוס"}
            actions={
              <Button onClick={() => openDialog()}>
                <Plus className="w-4 h-4 ml-2" />
                משימה חדשה
              </Button>
            }
          />

          {/* Inbox Section - Tasks without project (shown on Inbox tab) */}
          {currentTab === "inbox" && inboxTasks.length > 0 && (
            <TaskInbox
              tasks={inboxTasks.map(t => ({
                id: t.id,
                title: t.title,
                created_at: t.created_at || new Date().toISOString(),
                assignee: t.assignee,
                priority: t.priority,
                client_name: t.clients?.name,
              }))}
              projects={projects}
              onAssignToProject={(taskId, projectId) => assignToProjectMutation.mutate({ taskId, projectId })}
              isAssigning={assignToProjectMutation.isPending}
            />
          )}

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
                }}
              >
                <X className="w-4 h-4 ml-1" />
                הצג הכל
              </Button>
            </div>
          )}

          {/* Status Tabs & View Toggle & Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <TaskStatusTabs
                currentTab={currentTab}
                onTabChange={setCurrentTab}
                counts={tabCounts}
              />

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

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">כל העובדים</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>

              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">כל המחלקות</option>
                {depts.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">כל הצוותים</option>
                {orgTeams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              <select
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">כל השפות</option>
                <option value="he">עברית</option>
                <option value="en">English</option>
              </select>

              {(filterAssignee || filterDepartment || filterTeam || filterLanguage) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    setFilterAssignee("");
                    setFilterDepartment("");
                    setFilterTeam("");
                    setFilterLanguage("");
                  }}
                >
                  <X className="w-3 h-3 ml-1" />
                  נקה פילטרים
                </Button>
              )}
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
              <h3 className="text-lg font-semibold mb-2">
                {currentTab === "inbox" ? "אין משימות ב-Inbox" : 
                 currentTab === "waiting" ? "אין משימות ממתינות" :
                 currentTab === "done" ? "אין משימות שהושלמו" : "אין משימות פעילות"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {currentTab === "inbox" ? "כל המשימות משויכות לפרויקטים 👍" : "צור משימה חדשה להתחלה"}
              </p>
              {currentTab !== "inbox" && currentTab !== "done" && (
                <Button onClick={() => openDialog()}>
                  <Plus className="w-4 h-4 ml-2" />
                  משימה חדשה
                </Button>
              )}
            </div>
          ) : viewMode === "list" ? (
            <div className="glass rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowCheckboxes(!showCheckboxes);
                      if (showCheckboxes) {
                        setSelectedTaskIds(new Set());
                      }
                    }}
                    className={cn(
                      "text-sm font-medium transition-colors px-3 py-1 rounded-md",
                      showCheckboxes 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {showCheckboxes ? `${selectedTaskIds.size > 0 ? `${selectedTaskIds.size} נבחרו` : "בחירה מרובה"}` : "בחירה מרובה"}
                  </button>
                  {showCheckboxes && (
                    <button
                      onClick={toggleSelectAll}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {filteredTasks.length > 0 && selectedTaskIds.size === filteredTasks.length ? "בטל הכל" : "בחר הכל"}
                    </button>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary hover:text-primary"
                  onClick={() => openDialog()}
                  title="משימה חדשה"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {filteredTasks.map((task) => (
                <TaskTableRow
                  key={task.id}
                  task={task}
                  isSelected={selectedTaskIds.has(task.id)}
                  isExpanded={expandedTasks.has(task.id)}
                  childTasks={childTasksMap.get(task.id) || []}
                  showArchive={currentTab === "done"}
                  showCheckboxes={showCheckboxes}
                  assigneeInfo={getAssigneeInfo(task.assignee)}
                  onToggleSelect={toggleTaskSelection}
                  onToggleExpand={toggleExpanded}
                  onStatusChange={updateStatus}
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
                  onToggleStatus={(id, current) => updateStatus(id, current === "pending" ? "in-progress" : current === "in-progress" ? "completed" : "pending")}
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
          showClientSelector={isAgencyView}
          clients={clients}
          selectedClientId={newTaskClientId || effectiveClient?.id}
          onClientChange={setNewTaskClientId}
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
        />
      </DomainErrorBoundary>
    </MainLayout>
  );
}
