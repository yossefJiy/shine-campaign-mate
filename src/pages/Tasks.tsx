import { useState, useMemo, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DomainErrorBoundary } from "@/components/shared/DomainErrorBoundary";
import { StyledDatePicker } from "@/components/ui/styled-date-picker";
import { TaskQuickActions } from "@/components/tasks/TaskQuickActions";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  User,
  Building2,
  Plus,
  Loader2,
  CheckSquare,
  List,
  LayoutGrid,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Edit2,
  Bell,
  Mail,
  Phone,
  ChevronDown,
  ChevronLeft,
  ListTree,
  Copy,
  Upload,
  Archive,
  RotateCcw,
  LayoutDashboard,
  Settings2,
  Eye,
  UserPlus,
  Check,
  X,
  Paperclip,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { TeamDashboard } from "@/components/tasks/TeamDashboard";
import { MyDayBoard } from "@/components/tasks/MyDayBoard";
import { TimeSlotBoard } from "@/components/tasks/TimeSlotBoard";
import { BulkTaskImport } from "@/components/tasks/BulkTaskImport";
import { TaskBulkActions } from "@/components/tasks/TaskBulkActions";
import { TaskShareDialog } from "@/components/tasks/TaskShareDialog";
import { TaskAttachments } from "@/components/tasks/TaskAttachments";
import { TaskAttachmentsBadge } from "@/components/tasks/TaskAttachmentsBadge";
import { NewTaskAttachments, PendingAttachment } from "@/components/tasks/NewTaskAttachments";
import { NotificationHistoryDialog } from "@/components/tasks/NotificationHistoryDialog";
import { SubtaskList } from "@/components/tasks/SubtaskList";
import { TaskSubtaskProgress } from "@/components/tasks/TaskSubtaskProgress";

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
}

interface Project {
  id: string;
  name: string;
  color: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  emails: string[];
  phones: string[];
  departments: string[];
  avatar_color?: string | null;
}

const statusConfig: Record<string, { color: string; bg: string; label: string; icon: typeof Circle }> = {
  pending: { color: "text-warning", bg: "bg-warning/10", label: "ממתין", icon: Circle },
  "in-progress": { color: "text-info", bg: "bg-info/10", label: "בתהליך", icon: Clock },
  completed: { color: "text-success", bg: "bg-success/10", label: "הושלם", icon: CheckCircle2 },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: "bg-muted", label: "נמוכה" },
  medium: { color: "bg-warning", label: "בינונית" },
  high: { color: "bg-destructive", label: "גבוהה" },
};

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

// Time options for scheduler
const timeOptions = Array.from({ length: 24 }, (_, h) => 
  ["00", "30"].map(m => `${h.toString().padStart(2, "0")}:${m}`)
).flat();

export default function Tasks() {
  const { selectedClient } = useClient();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectFilterId = searchParams.get("project");
  
  const [showDashboard, setShowDashboard] = useState(false);
  const [showTimeBoard, setShowTimeBoard] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [filter, setFilter] = useState<"all" | "assignee" | "department" | "date" | "client" | "project">(projectFilterId ? "project" : "all");
  const [selectedValue, setSelectedValue] = useState(projectFilterId || "");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [bulkImportDialogOpen, setBulkImportDialogOpen] = useState(false);
  const [integrationsDialogOpen, setIntegrationsDialogOpen] = useState(false);
  
  // Duplicate with date dialog
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [taskToDuplicate, setTaskToDuplicate] = useState<Task | null>(null);
  const [duplicateDate, setDuplicateDate] = useState<Date | undefined>(undefined);

  // Bulk selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  // Notification history dialog
  const [notificationHistoryOpen, setNotificationHistoryOpen] = useState(false);
  const [notificationHistoryTaskId, setNotificationHistoryTaskId] = useState<string | undefined>();

  // Pending attachments for new tasks
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);

  // Toggle single task selection
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['title']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState("pending");
  const [formPriority, setFormPriority] = useState("medium");
  const [formDueDate, setFormDueDate] = useState("");
  const [formScheduledTime, setFormScheduledTime] = useState("");
  const [formAssignee, setFormAssignee] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formProjectId, setFormProjectId] = useState("");
  const [formReminderAt, setFormReminderAt] = useState("");
  const [formNotificationEmail, setFormNotificationEmail] = useState(false);
  const [formNotificationSms, setFormNotificationSms] = useState(false);
  const [formNotificationPhone, setFormNotificationPhone] = useState("");
  const [formNotificationEmailAddress, setFormNotificationEmailAddress] = useState("");
  const [showReminderPreview, setShowReminderPreview] = useState(false);
  
  // Quick reminder options
  type ReminderOption = 'at_time' | 'hour_before' | 'day_before' | 'custom';
  const [selectedReminders, setSelectedReminders] = useState<ReminderOption[]>([]);
  
  // Add contact dialog state
  const [addContactDialogOpen, setAddContactDialogOpen] = useState(false);
  const [addContactType, setAddContactType] = useState<'email' | 'phone'>('email');
  const [newContactValue, setNewContactValue] = useState("");

  // Toggle reminder option
  const toggleReminderOption = (option: ReminderOption) => {
    setSelectedReminders(prev => 
      prev.includes(option) 
        ? prev.filter(r => r !== option)
        : [...prev, option]
    );
  };

  // Calculate reminder time based on option
  const calculateReminderTime = (option: ReminderOption, dueDate: string, scheduledTime: string): string | null => {
    if (!dueDate) return null;
    const baseDate = new Date(`${dueDate}T${scheduledTime || '09:00'}:00`);
    switch (option) {
      case 'at_time':
        return baseDate.toISOString();
      case 'hour_before':
        return new Date(baseDate.getTime() - 60 * 60 * 1000).toISOString();
      case 'day_before':
        return new Date(baseDate.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case 'custom':
        return formReminderAt ? new Date(formReminderAt).toISOString() : null;
      default:
        return null;
    }
  };

// Collapsible Field Component for innovative dialog
interface CollapsibleFieldProps {
  label: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  hasValue?: boolean;
  children: React.ReactNode;
}

const CollapsibleField = ({ label, icon, isExpanded, onToggle, hasValue, children }: CollapsibleFieldProps) => (
  <div className="border border-border rounded-lg overflow-hidden transition-all duration-200">
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => e.key === 'Enter' && onToggle()}
      className={cn(
        "w-full flex items-center justify-between p-3 text-sm transition-colors cursor-pointer",
        isExpanded ? "bg-muted/50" : "bg-muted/30 hover:bg-muted/50",
        hasValue && !isExpanded && "border-r-2 border-success"
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {hasValue && !isExpanded ? (
          <Check className="w-4 h-4 text-success" />
        ) : (
          icon
        )}
        <span className={cn(hasValue && !isExpanded && "text-success")}>{label}</span>
      </div>
      <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} />
    </div>
    {isExpanded && (
      <div 
        className="p-3 pt-0 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-3">
          {children}
        </div>
      </div>
    )}
  </div>
);

  // Fetch ALL tasks (or filtered by client if selected)
  const { data: allClients = [] } = useQuery({
    queryKey: ["all-clients-tasks"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, name, is_master_account");
      return data || [];
    },
  });

  // Fetch projects for filter and form
  const { data: projects = [] } = useQuery({
    queryKey: ["projects-for-tasks", selectedClient?.id],
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("id, name, color")
        .order("name");
      
      if (selectedClient) {
        // When a client is selected, still include internal (agency) projects
        query = query.or(`client_id.eq.${selectedClient.id},client_id.is.null`);
      }
      const { data } = await query;
      return (data || []) as Project[];
    },
  });

  // Get current project name for header when filtering
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
      })) as (Task & { clients?: { name: string; is_master_account?: boolean } | null; projects?: Project | null })[];
    },
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  // All tasks are treated as parent tasks (parent_id feature not yet in DB)
  const parentTasks = tasks;
  const childTasksMap = new Map<string, Task[]>();

  // Smart auto-assignment based on category and department
  const getSmartAssignee = (category: string, department: string): string => {
    if (!category && !department) return "";
    
    // Find team members that match the department
    const matchingMembers = teamMembers.filter(m => 
      m.departments.includes(department) || 
      (category && m.departments.some(d => d.toLowerCase().includes(category.toLowerCase())))
    );
    
    if (matchingMembers.length > 0) {
      // Return the first matching member (could be enhanced with load balancing)
      return matchingMembers[0].name;
    }
    
    return "";
  };

  // Auto-fill email and phone when assignee changes
  const handleAssigneeChange = (name: string) => {
    setFormAssignee(name);
    const member = teamMembers.find(m => m.name === name);
    if (member) {
      // Set email from member's emails array or primary email
      if (!formNotificationEmailAddress) {
        const primaryEmail = member.emails?.[0] || member.email;
        if (primaryEmail) {
          setFormNotificationEmailAddress(primaryEmail);
        }
      }
      // Set phone from member's phones array
      if (!formNotificationPhone && member.phones?.[0]) {
        setFormNotificationPhone(member.phones[0]);
      }
      // Also set department from member's primary department
      if (member.departments?.[0] && !formDepartment) {
        setFormDepartment(member.departments[0]);
      }
    }
  };

  // Auto-suggest assignee when category/department changes
  const handleCategoryChange = (category: string) => {
    setFormCategory(category);
    if (!formAssignee && category) {
      const suggested = getSmartAssignee(category, formDepartment);
      if (suggested) {
        handleAssigneeChange(suggested);
        toast.info(`שויך אוטומטית ל: ${suggested}`);
      }
    }
  };

  const handleDepartmentChange = (department: string) => {
    setFormDepartment(department);
    if (!formAssignee && department) {
      const suggested = getSmartAssignee(formCategory, department);
      if (suggested) {
        handleAssigneeChange(suggested);
        toast.info(`שויך אוטומטית ל: ${suggested}`);
      }
    }
  };

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
        const { error } = await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", task.id);
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
      // Upload pending attachments if any
      if (pendingAttachments.length > 0 && newTaskId) {
        for (const attachment of pendingAttachments) {
          try {
            const fileExt = attachment.file.name.split('.').pop();
            const fileName = `${newTaskId}/${crypto.randomUUID()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('task-attachments')
              .upload(fileName, attachment.file);
            
            if (!uploadError) {
              const { data: urlData } = supabase.storage
                .from('task-attachments')
                .getPublicUrl(fileName);
              
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
    onError: (err) => {
      console.error("Bulk task import failed", err);
      const message =
        typeof err === "object" && err && "message" in err
          ? String((err as any).message)
          : "שגיאה בייבוא משימות";
      toast.error(message);
    },
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
  
  // Open duplicate dialog
  const openDuplicateDialog = (task: Task) => {
    setTaskToDuplicate(task);
    setDuplicateDate(task.due_date ? new Date(task.due_date) : undefined);
    setDuplicateDialogOpen(true);
  };
  
  // Handle duplicate with date
  const handleDuplicateWithDate = () => {
    if (!taskToDuplicate) return;
    duplicateMutation.mutate({
      task: taskToDuplicate,
      newDate: duplicateDate ? format(duplicateDate, "yyyy-MM-dd") : undefined,
    });
  };

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

  // Add contact to team member mutation
  const addContactMutation = useMutation({
    mutationFn: async ({ memberId, type, value }: { memberId: string; type: 'email' | 'phone'; value: string }) => {
      const member = teamMembers.find(m => m.id === memberId);
      if (!member) throw new Error("Team member not found");
      
      if (type === 'email') {
        const newEmails = [...(member.emails || []), value];
        const { error } = await supabase.from("team").update({ emails: newEmails }).eq("id", memberId);
        if (error) throw error;
      } else {
        const newPhones = [...(member.phones || []), value];
        const { error } = await supabase.from("team").update({ phones: newPhones }).eq("id", memberId);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team-active"] });
      toast.success(variables.type === 'email' ? "מייל נוסף בהצלחה" : "טלפון נוסף בהצלחה");
      setAddContactDialogOpen(false);
      setNewContactValue("");
      // Auto-select the new value
      if (variables.type === 'email') {
        setFormNotificationEmailAddress(variables.value);
      } else {
        setFormNotificationPhone(variables.value);
      }
    },
    onError: () => toast.error("שגיאה בהוספת פרטי קשר"),
  });

  // Open add contact dialog
  const openAddContactDialog = (type: 'email' | 'phone') => {
    setAddContactType(type);
    setNewContactValue("");
    setAddContactDialogOpen(true);
  };

  // Generate reminder preview message
  const getReminderPreview = () => {
    if (!formReminderAt) return null;
    const reminderDate = new Date(formReminderAt);
    const formattedDate = reminderDate.toLocaleDateString("he-IL");
    const formattedTime = reminderDate.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
    
    const message = `תזכורת: ${formTitle || "משימה ללא כותרת"}
${formDescription ? `תיאור: ${formDescription}` : ""}
תאריך יעד: ${formDueDate ? new Date(formDueDate).toLocaleDateString("he-IL") : "לא נקבע"}${formScheduledTime ? ` בשעה ${formScheduledTime}` : ""}
נשלח ל: ${formAssignee || "לא שויך"}
זמן שליחה: ${formattedDate} בשעה ${formattedTime}`;
    
    return message;
  };

  const openDialog = (task?: Task) => {
    setSelectedTask(task || null);
    setFormTitle(task?.title || "");
    setFormDescription(task?.description || "");
    setFormStatus(task?.status || "pending");
    setFormPriority(task?.priority || "medium");
    setFormDueDate(task?.due_date || "");
    setFormScheduledTime(task?.scheduled_time?.slice(0, 5) || "");
    setFormAssignee(task?.assignee || "");
    setFormDepartment(task?.department || "");
    setFormCategory(task?.category || "");
    setFormProjectId(task?.project_id || projectFilterId || "");
    setFormReminderAt(task?.reminder_at ? task.reminder_at.slice(0, 16) : "");
    setFormNotificationEmail(task?.notification_email || false);
    setFormNotificationSms(task?.notification_sms || false);
    setFormNotificationPhone(task?.notification_phone || "");
    setFormNotificationEmailAddress(task?.notification_email_address || "");
    setSelectedReminders([]);
    setShowReminderPreview(false);
    setExpandedSections(new Set(task?.id ? ["title", "subtasks"] : ["title"]));
    setEditDialogOpen(true);
  };

  const closeDialog = () => {
    setEditDialogOpen(false);
    setSelectedTask(null);
    setFormTitle("");
    setFormDescription("");
    setFormStatus("pending");
    setFormPriority("medium");
    setFormDueDate("");
    setFormScheduledTime("");
    setFormAssignee("");
    setFormDepartment("");
    setFormCategory("");
    setFormProjectId("");
    setFormReminderAt("");
    setFormNotificationEmail(false);
    setFormNotificationSms(false);
    setFormNotificationPhone("");
    setFormNotificationEmailAddress("");
    setSelectedReminders([]);
    setShowReminderPreview(false);
    setPendingAttachments([]);
    setExpandedSections(new Set(["title"]));
  };

  const handleSave = () => {
    if (!formTitle.trim()) {
      toast.error("נא להזין כותרת");
      return;
    }
    saveMutation.mutate({
      id: selectedTask?.id,
      title: formTitle,
      description: formDescription,
      status: formStatus,
      priority: formPriority,
      due_date: formDueDate || null,
      scheduled_time: formScheduledTime ? `${formScheduledTime}:00` : null,
      assignee: formAssignee || null,
      department: formDepartment || null,
      category: formCategory || null,
      project_id: formProjectId || null,
      reminder_at: formReminderAt ? new Date(formReminderAt).toISOString() : null,
      notification_email: formNotificationEmail,
      notification_sms: formNotificationSms,
      notification_phone: formNotificationPhone || null,
      notification_email_address: formNotificationEmailAddress || null,
      reminder_sent: false,
      duration_minutes: 60,
    });
  };

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Get unique values for filters
  const assignees = [...new Set(tasks.map(t => t.assignee).filter(Boolean))];
  const departments = [...new Set([
    ...tasks.map(t => t.department).filter(Boolean),
    ...teamMembers.flatMap(m => m.departments)
  ])];

  // Separate active and archived (completed) tasks
  const activeTasks = parentTasks.filter(task => task.status !== "completed");
  const archivedTasks = parentTasks.filter(task => task.status === "completed");

  // Get client names for filtering
  const clientsForFilter = allClients.filter(c => {
    return tasks.some(t => t.client_id === c.id);
  });

  const filteredTasks = (showArchive ? archivedTasks : activeTasks).filter(task => {
    // Date filter
    if (filter === "date" && selectedDate) {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date).toDateString();
      const filterDate = selectedDate.toDateString();
      if (taskDate !== filterDate) return false;
    }
    // Assignee/Department filter
    if ((filter === "assignee" || filter === "department") && selectedValue) {
      if (filter === "assignee" && task.assignee !== selectedValue) return false;
      if (filter === "department" && task.department !== selectedValue) return false;
    }
    // Client filter
    if (filter === "client" && selectedValue) {
      if (task.client_id !== selectedValue) return false;
    }
    // Project filter
    if (filter === "project" && selectedValue) {
      if (task.project_id !== selectedValue) return false;
    }
    return true;
  });

  // Toggle all tasks selection
  const toggleSelectAll = () => {
    if (selectedTaskIds.size === filteredTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map(t => t.id)));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedTaskIds(new Set());
  };

  // Get selected tasks objects for bulk actions
  const selectedTasksObjects = tasks.filter(t => selectedTaskIds.has(t.id));

  // Map assignee ID to name and color
  const assigneeIdToName: Record<string, string> = {};
  const assigneeIdToColor: Record<string, string> = {};
  teamMembers.forEach(m => {
    if (m.id) {
      assigneeIdToName[m.id] = m.name;
      if (m.avatar_color) {
        assigneeIdToColor[m.id] = m.avatar_color;
      }
    }
  });

  // Helper function to get assignee display info
  const getAssigneeInfo = (assigneeId: string | null) => {
    if (!assigneeId) return null;
    const name = assigneeIdToName[assigneeId] || assigneeId;
    const color = assigneeIdToColor[assigneeId] || '#6366f1';
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
    return { name, color, initials };
  };

  // Format time for display
  const formatTime = (time: string | null) => {
    if (!time) return null;
    return time.slice(0, 5);
  };

  // Render task row (used for both parent and child tasks)
  const renderTaskRow = (task: Task, isSubtask = false) => {
    const status = statusConfig[task.status] || statusConfig.pending;
    const priority = priorityConfig[task.priority] || priorityConfig.medium;
    const StatusIcon = status.icon;
    const childTasks = childTasksMap.get(task.id) || [];
    const hasChildren = childTasks.length > 0;
    const isExpanded = expandedTasks.has(task.id);
    
    return (
      <div key={task.id}>
        <div className={cn(
          "p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors group",
          isSubtask && "bg-muted/20 pr-12",
          selectedTaskIds.has(task.id) && "bg-primary/5"
        )}>
          <div className="flex items-start gap-3">
            {/* Checkbox for selection */}
            {!isSubtask && (
              <Checkbox
                checked={selectedTaskIds.has(task.id)}
                onCheckedChange={() => toggleTaskSelection(task.id)}
                className="mt-2"
              />
            )}
            {!isSubtask && hasChildren ? (
              <button
                onClick={() => toggleExpanded(task.id)}
                className="p-2 rounded-lg transition-colors hover:bg-muted flex-shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  const nextStatus = task.status === "pending" ? "in-progress" : task.status === "in-progress" ? "completed" : "pending";
                  updateStatusMutation.mutate({ id: task.id, status: nextStatus });
                }}
                className={cn("p-2 rounded-lg transition-colors hover:opacity-80 flex-shrink-0", status.bg)}
              >
                <StatusIcon className={cn("w-5 h-5", status.color)} />
              </button>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {isSubtask && <ListTree className="w-4 h-4 text-muted-foreground" />}
                <h3 className={cn("font-medium", task.status === "completed" && "line-through text-muted-foreground")}>
                  {task.title}
                </h3>
                <span className={cn("w-2 h-2 rounded-full flex-shrink-0", priority.color)} title={priority.label} />
                {hasChildren && (
                  <Badge variant="secondary" className="text-xs">
                    {childTasks.length} תתי-משימות
                  </Badge>
                )}
                {(task as any).projects && (
                  <Badge 
                    variant="outline" 
                    className="text-xs flex items-center gap-1"
                    style={{ borderColor: (task as any).projects.color || '#3B82F6' }}
                  >
                    <FolderKanban className="w-3 h-3" style={{ color: (task as any).projects.color || '#3B82F6' }} />
                    {(task as any).projects.name}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                {task.department && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {task.department}
                  </span>
                )}
                {task.due_date && (
                  <span className={cn(
                    "flex items-center gap-1",
                    new Date(task.due_date) < new Date() && task.status !== "completed" && "text-destructive"
                  )}>
                    <Calendar className="w-3 h-3" />
                    {new Date(task.due_date).toLocaleDateString("he-IL")}
                    {task.scheduled_time && (
                      <span className="mr-1">
                        <Clock className="w-3 h-3 inline ml-1" />
                        {formatTime(task.scheduled_time)}
                      </span>
                    )}
                  </span>
                )}
              </div>

              {task.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-1">{task.description}</p>
              )}

              {/* Subtask progress indicator */}
              <TaskSubtaskProgress 
                taskId={task.id} 
                className="mt-2" 
                onOpenEdit={() => openDialog(task)}
              />

              {/* Attachments badge */}
              <TaskAttachmentsBadge taskId={task.id} className="mt-2" />
            </div>

            {/* Assignee Avatar */}
            {task.assignee && (() => {
              const info = getAssigneeInfo(task.assignee);
              return info ? (
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0"
                  style={{ backgroundColor: info.color }}
                  title={info.name}
                >
                  {info.initials}
                </div>
              ) : null;
            })()}

            <div className="flex items-center gap-1 flex-shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              {showArchive ? (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success" onClick={() => restoreMutation.mutate(task.id)} title="שחזר">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog()} title="משימה חדשה">
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDuplicateDialog(task)} title="שכפל עם בחירת תאריך">
                    <Copy className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(task)}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setTaskToDelete(task); setDeleteDialogOpen(true); }}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <TaskQuickActions
                taskId={task.id}
                currentStatus={task.status}
                currentTime={task.scheduled_time}
                compact
              />
            </div>
          </div>
        </div>
        
        {/* Render child tasks */}
        {hasChildren && isExpanded && (
          <div className="border-r-2 border-primary/20 mr-6">
            {childTasks.map(child => renderTaskRow(child, true))}
          </div>
        )}
      </div>
    );
  };

  // Show time slot board view
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

  // Show dashboard view
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
              <Button 
                variant={showArchive ? "default" : "outline"} 
                size="sm" 
                onClick={() => setShowArchive(!showArchive)}
              >
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
              <FolderKanban className="w-5 h-5" style={{ color: currentProject.color || '#3B82F6' }} />
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
              <button
                onClick={() => { setFilter("all"); setSelectedValue(""); setSearchParams({}); }}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  filter === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                הכל
              </button>
              <button
                onClick={() => setFilter("assignee")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
                  filter === "assignee" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                <User className="w-3 h-3" />
                עובד
              </button>
              <button
                onClick={() => setFilter("department")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
                  filter === "department" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                <Building2 className="w-3 h-3" />
                מחלקה
              </button>
              <button
                onClick={() => setFilter("date")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
                  filter === "date" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                <Calendar className="w-3 h-3" />
                תאריך
              </button>
              <button
                onClick={() => setFilter("client")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
                  filter === "client" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                <Building2 className="w-3 h-3" />
                לקוח
              </button>
              <button
                onClick={() => setFilter("project")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
                  filter === "project" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                <FolderKanban className="w-3 h-3" />
                פרויקט
              </button>
            </div>

            {(filter === "assignee" || filter === "department" || filter === "client" || filter === "project") && (
              <Select value={selectedValue} onValueChange={(v) => {
                setSelectedValue(v);
                // Update URL when project filter changes
                if (filter === "project") {
                  if (v) {
                    setSearchParams({ project: v });
                  } else {
                    setSearchParams({});
                  }
                }
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={
                    filter === "assignee" ? "בחר עובד" : 
                    filter === "department" ? "בחר מחלקה" : 
                    filter === "client" ? "בחר לקוח" :
                    "בחר פרויקט"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {filter === "assignee" && assignees.map(a => <SelectItem key={a} value={a!}>{a}</SelectItem>)}
                  {filter === "department" && departments.map(d => <SelectItem key={d} value={d!}>{d}</SelectItem>)}
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
            {/* Header with select all */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/30">
              <Checkbox
                checked={filteredTasks.length > 0 && selectedTaskIds.size === filteredTasks.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedTaskIds.size > 0 ? `${selectedTaskIds.size} נבחרו` : "בחר הכל"}
              </span>
            </div>
            {filteredTasks.map((task) => renderTaskRow(task))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task, index) => {
              const status = statusConfig[task.status] || statusConfig.pending;
              const priority = priorityConfig[task.priority] || priorityConfig.medium;
              const childTasks = childTasksMap.get(task.id) || [];
              
              return (
                <div 
                  key={task.id}
                  className={cn(
                    "glass rounded-xl card-shadow opacity-0 animate-slide-up group",
                    selectedTaskIds.has(task.id) && "ring-2 ring-primary"
                  )}
                  style={{ animationDelay: `${0.1 + index * 0.05}s`, animationFillMode: "forwards" }}
                >
                  <div className="p-4 md:p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedTaskIds.has(task.id)}
                          onCheckedChange={() => toggleTaskSelection(task.id)}
                        />
                        <span className={cn("w-2 h-2 rounded-full", priority.color)} />
                        <span className="text-xs text-muted-foreground">{priority.label}</span>
                      </div>
                      <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog()}>
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog(task)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setTaskToDelete(task); setDeleteDialogOpen(true); }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <h3 className={cn("font-medium mb-2", task.status === "completed" && "line-through text-muted-foreground")}>
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                    )}

                    {/* Subtask progress in grid */}
                    <TaskSubtaskProgress 
                      taskId={task.id} 
                      className="mb-2" 
                      onOpenEdit={() => openDialog(task)}
                    />

                    {/* Attachments badge in grid */}
                    <TaskAttachmentsBadge taskId={task.id} className="mb-2" />

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {task.assignee && <span>{task.assignee}</span>}
                        {task.due_date && (
                          <span className={cn(new Date(task.due_date) < new Date() && task.status !== "completed" && "text-destructive")}>
                            {new Date(task.due_date).toLocaleDateString("he-IL")}
                            {task.scheduled_time && ` ${formatTime(task.scheduled_time)}`}
                          </span>
                        )}
                      </div>
                      <Badge variant="outline" className={cn("text-xs", status.bg, status.color)}>
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit/Create Dialog - Innovative Collapsible Design */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
          {/* Header with centered title and save button on left */}
          <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background z-10">
            <Button 
              onClick={handleSave} 
              disabled={saveMutation.isPending || !formTitle.trim()}
              size="sm"
              className="gap-2"
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              שמור
            </Button>
            <DialogTitle className="text-center flex-1 font-semibold">
              {selectedTask ? "עריכת משימה" : "משימה חדשה"}
            </DialogTitle>
            <div className="w-8" /> {/* Spacer for balance */}
          </div>

          <div className="p-4 space-y-2">
            {/* Title - Always visible with green check when filled */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {formTitle.trim() && <Check className="w-4 h-4 text-success flex-shrink-0" />}
                <Input 
                  value={formTitle} 
                  onChange={(e) => setFormTitle(e.target.value)} 
                  placeholder="כותרת המשימה" 
                  className="text-lg font-medium border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary flex-1"
                />
              </div>
            </div>

            {/* Description - Always visible like title with green check when filled */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {formDescription.trim() && <Check className="w-4 h-4 text-success flex-shrink-0" />}
                <Textarea 
                  value={formDescription} 
                  onChange={(e) => setFormDescription(e.target.value)} 
                  placeholder="תיאור המשימה" 
                  rows={3}
                  className="border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary flex-1 resize-none"
                />
              </div>
            </div>

            {/* Status & Priority - Collapsible */}
            <CollapsibleField
              label="סטטוס ועדיפות"
              icon={<Circle className="w-4 h-4" />}
              isExpanded={expandedSections.has('status')}
              onToggle={() => toggleSection('status')}
              hasValue={formStatus !== 'pending' || formPriority !== 'medium'}
            >
              <div className="grid grid-cols-2 gap-3">
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">ממתין</SelectItem>
                    <SelectItem value="in-progress">בתהליך</SelectItem>
                    <SelectItem value="completed">הושלם</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={formPriority} onValueChange={setFormPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">נמוכה</SelectItem>
                    <SelectItem value="medium">בינונית</SelectItem>
                    <SelectItem value="high">גבוהה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleField>

            {/* Assignee & Department - Collapsible */}
            <CollapsibleField
              label="אחראי ומחלקה"
              icon={<User className="w-4 h-4" />}
              isExpanded={expandedSections.has('assignee')}
              onToggle={() => toggleSection('assignee')}
              hasValue={!!formAssignee || !!formDepartment}
            >
              <div className="grid grid-cols-2 gap-3">
                <Select value={formAssignee || "none"} onValueChange={(v) => handleAssigneeChange(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="בחר אחראי" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    {teamMembers.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={formDepartment || "none"} onValueChange={(v) => handleDepartmentChange(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="בחר מחלקה" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    {departments.map((d) => <SelectItem key={d} value={d!}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleField>

            {/* Category - Collapsible */}
            <CollapsibleField
              label="קטגוריה"
              icon={<ListTree className="w-4 h-4" />}
              isExpanded={expandedSections.has('category')}
              onToggle={() => toggleSection('category')}
              hasValue={!!formCategory}
            >
              <Select value={formCategory || "none"} onValueChange={(v) => handleCategoryChange(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="בחר קטגוריה" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </CollapsibleField>

            {/* Project - Collapsible */}
            {projects.length > 0 && (
              <CollapsibleField
                label="פרויקט"
                icon={<FolderKanban className="w-4 h-4" />}
                isExpanded={expandedSections.has('project')}
                onToggle={() => toggleSection('project')}
                hasValue={!!formProjectId}
              >
                <Select value={formProjectId || "none"} onValueChange={(v) => setFormProjectId(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="בחר פרויקט" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || '#3B82F6' }} />
                          {p.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CollapsibleField>
            )}

            {/* Date, Time & Reminders - Collapsible */}
            <CollapsibleField
              label="תאריך, שעה ותזכורות"
              icon={<Calendar className="w-4 h-4" />}
              isExpanded={expandedSections.has('datetime')}
              onToggle={() => toggleSection('datetime')}
              hasValue={!!formDueDate || !!formScheduledTime || selectedReminders.length > 0}
            >
              <div className="space-y-4">
                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <StyledDatePicker
                    value={formDueDate ? parseISO(formDueDate) : undefined}
                    onChange={(date) => setFormDueDate(date ? format(date, "yyyy-MM-dd") : "")}
                    placeholder="בחר תאריך"
                  />
                  <Select value={formScheduledTime || "none"} onValueChange={(v) => setFormScheduledTime(v === "none" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="בחר שעה" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-</SelectItem>
                      {timeOptions.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick Reminder Options */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">תזכורות</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={selectedReminders.includes('at_time') ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleReminderOption('at_time')}
                      className="gap-1"
                    >
                      {selectedReminders.includes('at_time') && <Check className="w-3 h-3" />}
                      בשעת המשימה
                    </Button>
                    <Button
                      type="button"
                      variant={selectedReminders.includes('hour_before') ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleReminderOption('hour_before')}
                      className="gap-1"
                    >
                      {selectedReminders.includes('hour_before') && <Check className="w-3 h-3" />}
                      שעה לפני
                    </Button>
                    <Button
                      type="button"
                      variant={selectedReminders.includes('day_before') ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleReminderOption('day_before')}
                      className="gap-1"
                    >
                      {selectedReminders.includes('day_before') && <Check className="w-3 h-3" />}
                      יום לפני
                    </Button>
                    <Button
                      type="button"
                      variant={selectedReminders.includes('custom') ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleReminderOption('custom')}
                      className="gap-1"
                    >
                      {selectedReminders.includes('custom') && <Check className="w-3 h-3" />}
                      מותאם אישית
                    </Button>
                  </div>
                  
                  {/* Custom reminder time */}
                  {selectedReminders.includes('custom') && (
                    <div className="mt-3 animate-fade-in">
                      <Input 
                        type="datetime-local" 
                        value={formReminderAt} 
                        onChange={(e) => setFormReminderAt(e.target.value)} 
                        placeholder="בחר זמן תזכורת"
                      />
                    </div>
                  )}
                </div>

                {/* Notification Settings - Only show when reminders selected */}
                {selectedReminders.length > 0 && (
                  <div className="border-t border-border pt-4 space-y-3 animate-fade-in">
                    <div className="text-sm font-medium text-muted-foreground">שלח התראה ל:</div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">מייל</span>
                      </div>
                      <Switch checked={formNotificationEmail} onCheckedChange={setFormNotificationEmail} />
                    </div>
                    {formNotificationEmail && (
                      <div className="space-y-2 animate-fade-in">
                        {(() => {
                          const member = teamMembers.find(m => m.name === formAssignee);
                          const availableEmails = [...(member?.emails || [])];
                          if (member?.email && !availableEmails.includes(member.email)) {
                            availableEmails.unshift(member.email);
                          }
                          
                          return (
                            <div className="space-y-2">
                              {availableEmails.length > 0 ? (
                                <Select value={formNotificationEmailAddress} onValueChange={setFormNotificationEmailAddress}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="בחר כתובת מייל" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableEmails.map((email) => (
                                      <SelectItem key={email} value={email}>{email}</SelectItem>
                                    ))}
                                    <SelectItem value="_custom">הזן ידנית...</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : formAssignee ? (
                                <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm text-muted-foreground">
                                  <span>אין מייל</span>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 gap-1"
                                    onClick={() => openAddContactDialog('email')}
                                  >
                                    <Plus className="w-3 h-3" />
                                    הוסף
                                  </Button>
                                </div>
                              ) : null}
                              {formNotificationEmailAddress === '_custom' && (
                                <Input 
                                  type="email" 
                                  placeholder="כתובת מייל" 
                                  onChange={(e) => setFormNotificationEmailAddress(e.target.value)} 
                                />
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">SMS</span>
                      </div>
                      <Switch checked={formNotificationSms} onCheckedChange={setFormNotificationSms} />
                    </div>
                    {formNotificationSms && (
                      <div className="space-y-2 animate-fade-in">
                        {(() => {
                          const member = teamMembers.find(m => m.name === formAssignee);
                          const availablePhones = member?.phones || [];
                          
                          return (
                            <div className="space-y-2">
                              {availablePhones.length > 0 ? (
                                <Select value={formNotificationPhone} onValueChange={setFormNotificationPhone}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="בחר מספר טלפון" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availablePhones.map((phone) => (
                                      <SelectItem key={phone} value={phone}>{phone}</SelectItem>
                                    ))}
                                    <SelectItem value="_custom">הזן ידנית...</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : formAssignee ? (
                                <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm text-muted-foreground">
                                  <span>אין טלפון</span>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 gap-1"
                                    onClick={() => openAddContactDialog('phone')}
                                  >
                                    <Plus className="w-3 h-3" />
                                    הוסף
                                  </Button>
                                </div>
                              ) : null}
                              {formNotificationPhone === '_custom' && (
                                <Input 
                                  type="tel" 
                                  placeholder="מספר טלפון" 
                                  onChange={(e) => setFormNotificationPhone(e.target.value)} 
                                />
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Reminder Preview */}
                    {(selectedReminders.length > 0 && (formNotificationEmail || formNotificationSms)) && (
                      <div className="border-t border-border pt-3 mt-3">
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm" 
                          className="w-full gap-2 text-muted-foreground"
                          onClick={() => setShowReminderPreview(!showReminderPreview)}
                        >
                          <Eye className="w-4 h-4" />
                          {showReminderPreview ? "הסתר" : "הצג"} תצוגה מקדימה
                        </Button>
                        {showReminderPreview && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border animate-fade-in">
                            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                              <Bell className="w-3 h-3" />
                              תזכורות שיישלחו:
                            </div>
                            <div className="space-y-1 text-sm">
                              {selectedReminders.includes('at_time') && (
                                <div className="flex items-center gap-2">
                                  <Check className="w-3 h-3 text-success" />
                                  <span>בשעת המשימה</span>
                                </div>
                              )}
                              {selectedReminders.includes('hour_before') && (
                                <div className="flex items-center gap-2">
                                  <Check className="w-3 h-3 text-success" />
                                  <span>שעה לפני</span>
                                </div>
                              )}
                              {selectedReminders.includes('day_before') && (
                                <div className="flex items-center gap-2">
                                  <Check className="w-3 h-3 text-success" />
                                  <span>יום לפני</span>
                                </div>
                              )}
                              {selectedReminders.includes('custom') && formReminderAt && (
                                <div className="flex items-center gap-2">
                                  <Check className="w-3 h-3 text-success" />
                                  <span>{new Date(formReminderAt).toLocaleString("he-IL")}</span>
                                </div>
                              )}
                            </div>
                            <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                              {formNotificationEmail && formNotificationEmailAddress && (
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  למייל: {formNotificationEmailAddress}
                                </div>
                              )}
                              {formNotificationSms && formNotificationPhone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  ל-SMS: {formNotificationPhone}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CollapsibleField>

            {/* Subtasks */}
            <CollapsibleField
              label="תתי-משימות"
              icon={<ListTree className="w-4 h-4" />}
              isExpanded={expandedSections.has('subtasks')}
              onToggle={() => toggleSection('subtasks')}
              hasValue={false}
            >
              {selectedTask ? (
                <SubtaskList parentTaskId={selectedTask.id} />
              ) : (
                <div className="text-sm text-muted-foreground">
                  שמור את המשימה כדי להוסיף תתי-משימות.
                </div>
              )}
            </CollapsibleField>

            {/* Attachments - Show for both new and existing tasks */}
            <CollapsibleField
              label="נספחים"
              icon={<Paperclip className="w-4 h-4" />}
              isExpanded={expandedSections.has('attachments')}
              onToggle={() => toggleSection('attachments')}
              hasValue={selectedTask ? false : pendingAttachments.length > 0}
            >
              {selectedTask ? (
                <TaskAttachments taskId={selectedTask.id} />
              ) : (
                <NewTaskAttachments 
                  attachments={pendingAttachments}
                  onAttachmentsChange={setPendingAttachments}
                />
              )}
            </CollapsibleField>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog - Advanced Component */}
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
              <Label>בחר תאריך יעד חדש</Label>
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
              {childTasksMap.get(taskToDelete?.id || "")?.length ? (
                <span className="block mt-2 text-destructive">
                  שים לב: {childTasksMap.get(taskToDelete?.id || "")?.length} תתי-משימות ימחקו גם כן!
                </span>
              ) : null}
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

      {/* Add Contact Dialog */}
      <Dialog open={addContactDialogOpen} onOpenChange={setAddContactDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {addContactType === 'email' ? 'הוסף כתובת מייל' : 'הוסף מספר טלפון'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              הוספה עבור: <span className="font-medium text-foreground">{formAssignee}</span>
            </p>
            <Input 
              type={addContactType === 'email' ? 'email' : 'tel'}
              placeholder={addContactType === 'email' ? 'example@email.com' : '050-1234567'}
              value={newContactValue}
              onChange={(e) => setNewContactValue(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddContactDialogOpen(false)}>ביטול</Button>
            <Button 
              onClick={() => {
                const member = teamMembers.find(m => m.name === formAssignee);
                if (member && newContactValue) {
                  addContactMutation.mutate({
                    memberId: member.id,
                    type: addContactType,
                    value: newContactValue
                  });
                }
              }}
              disabled={addContactMutation.isPending || !newContactValue}
            >
              {addContactMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              הוסף
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Bar */}
      <TaskBulkActions
        selectedTasks={selectedTasksObjects}
        onClearSelection={clearSelection}
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
