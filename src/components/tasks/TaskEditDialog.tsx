import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  User,
  Plus,
  Loader2,
  Calendar,
  Bell,
  Mail,
  Phone,
  ListTree,
  Eye,
  Check,
  Paperclip,
  FolderKanban,
  Building2
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { StyledDatePicker } from "@/components/ui/styled-date-picker";
import { CollapsibleField } from "./CollapsibleField";
import { TaskAttachments } from "./TaskAttachments";
import { NewTaskAttachments, PendingAttachment } from "./NewTaskAttachments";
import { SubtaskList } from "./SubtaskList";
import { TaskFormData, ReminderOption } from "@/hooks/useTaskForm";

interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  emails: string[];
  phones: string[];
  departments: string[];
}

interface Project {
  id: string;
  name: string;
  color: string | null;
}

interface ClientOption {
  id: string;
  name: string;
  is_master_account?: boolean;
}

interface TaskEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTaskId: string | null;
  formData: TaskFormData;
  updateField: <K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) => void;
  expandedSections: Set<string>;
  toggleSection: (section: string) => void;
  selectedReminders: ReminderOption[];
  toggleReminderOption: (option: ReminderOption) => void;
  showReminderPreview: boolean;
  setShowReminderPreview: (value: boolean) => void;
  onSave: () => void;
  isSaving: boolean;
  teamMembers: TeamMember[];
  projects: Project[];
  departments: string[];
  categoryOptions: string[];
  timeOptions: string[];
  handleAssigneeChange: (name: string) => void;
  handleCategoryChange: (category: string) => void;
  handleDepartmentChange: (department: string) => void;
  pendingAttachments: PendingAttachment[];
  setPendingAttachments: (attachments: PendingAttachment[]) => void;
  // Client selection for agency view
  showClientSelector?: boolean;
  clients?: ClientOption[];
  selectedClientId?: string | null;
  onClientChange?: (clientId: string | null) => void;
}

const statusOptions = [
  { value: "pending", label: "ממתין" },
  { value: "in-progress", label: "בתהליך" },
  { value: "completed", label: "הושלם" },
];

const priorityOptions = [
  { value: "low", label: "נמוכה" },
  { value: "medium", label: "בינונית" },
  { value: "high", label: "גבוהה" },
];

export function TaskEditDialog({
  open,
  onOpenChange,
  selectedTaskId,
  formData,
  updateField,
  expandedSections,
  toggleSection,
  selectedReminders,
  toggleReminderOption,
  showReminderPreview,
  setShowReminderPreview,
  onSave,
  isSaving,
  teamMembers,
  projects,
  departments,
  categoryOptions,
  timeOptions,
  handleAssigneeChange,
  handleCategoryChange,
  handleDepartmentChange,
  pendingAttachments,
  setPendingAttachments,
  showClientSelector = false,
  clients = [],
  selectedClientId,
  onClientChange,
}: TaskEditDialogProps) {
  const [addContactDialogOpen, setAddContactDialogOpen] = useState(false);
  const [addContactType, setAddContactType] = useState<'email' | 'phone'>('email');
  const [newContactValue, setNewContactValue] = useState("");

  const openAddContactDialog = (type: 'email' | 'phone') => {
    setAddContactType(type);
    setNewContactValue("");
    setAddContactDialogOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{selectedTaskId ? "עריכת משימה" : "משימה חדשה"}</DialogTitle>
          <Button onClick={onSave} disabled={isSaving} size="sm">
            {isSaving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            שמור
          </Button>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Title - Always expanded */}
          <CollapsibleField
            label="כותרת ותיאור"
            icon={<ListTree className="w-4 h-4" />}
            isExpanded={expandedSections.has('title')}
            onToggle={() => toggleSection('title')}
            hasValue={!!formData.title}
          >
            <div className="space-y-3">
              <Input
                placeholder="כותרת המשימה *"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="text-base font-medium"
                autoFocus
              />
              <Textarea
                placeholder="תיאור (אופציונלי)"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={2}
              />
              <div className="grid grid-cols-2 gap-3">
                <Select value={formData.status} onValueChange={(v) => updateField('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={formData.priority} onValueChange={(v) => updateField('priority', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleField>

          {/* Client Selection - Only for new tasks in agency view */}
          {showClientSelector && !selectedTaskId && clients.length > 0 && (
            <CollapsibleField
              label="לקוח"
              icon={<Building2 className="w-4 h-4" />}
              isExpanded={true}
              onToggle={() => {}}
              hasValue={!!selectedClientId}
            >
              <Select 
                value={selectedClientId || "agency"} 
                onValueChange={(v) => onClientChange?.(v === "agency" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר לקוח" />
                </SelectTrigger>
                <SelectContent>
                  {clients.filter(c => c.is_master_account).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3 h-3 text-primary" />
                        {c.name} (סוכנות)
                      </div>
                    </SelectItem>
                  ))}
                  {clients.filter(c => !c.is_master_account).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CollapsibleField>
          )}

          {/* Assignee & Department */}
          <CollapsibleField
            label="שיוך ומחלקה"
            icon={<User className="w-4 h-4" />}
            isExpanded={expandedSections.has('assignee')}
            onToggle={() => toggleSection('assignee')}
            hasValue={!!formData.assignee || !!formData.department}
          >
            <div className="grid grid-cols-2 gap-3">
              <Select value={formData.assignee || "none"} onValueChange={(v) => handleAssigneeChange(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="בחר אחראי" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {teamMembers.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={formData.department || "none"} onValueChange={(v) => handleDepartmentChange(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="בחר מחלקה" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CollapsibleField>

          {/* Category */}
          <CollapsibleField
            label="קטגוריה"
            icon={<ListTree className="w-4 h-4" />}
            isExpanded={expandedSections.has('category')}
            onToggle={() => toggleSection('category')}
            hasValue={!!formData.category}
          >
            <Select value={formData.category || "none"} onValueChange={(v) => handleCategoryChange(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="בחר קטגוריה" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-</SelectItem>
                {categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </CollapsibleField>

          {/* Project */}
          {projects.length > 0 && (
            <CollapsibleField
              label="פרויקט"
              icon={<FolderKanban className="w-4 h-4" />}
              isExpanded={expandedSections.has('project')}
              onToggle={() => toggleSection('project')}
              hasValue={!!formData.projectId}
            >
              <Select value={formData.projectId || "none"} onValueChange={(v) => updateField('projectId', v === "none" ? "" : v)}>
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

          {/* Date, Time & Reminders */}
          <CollapsibleField
            label="תאריך, שעה ותזכורות"
            icon={<Calendar className="w-4 h-4" />}
            isExpanded={expandedSections.has('datetime')}
            onToggle={() => toggleSection('datetime')}
            hasValue={!!formData.dueDate || !!formData.scheduledTime || selectedReminders.length > 0}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <StyledDatePicker
                  value={formData.dueDate ? parseISO(formData.dueDate) : undefined}
                  onChange={(date) => updateField('dueDate', date ? format(date, "yyyy-MM-dd") : "")}
                  placeholder="בחר תאריך"
                />
                <Select value={formData.scheduledTime || "none"} onValueChange={(v) => updateField('scheduledTime', v === "none" ? "" : v)}>
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
                  {(['at_time', 'hour_before', 'day_before', 'custom'] as ReminderOption[]).map((option) => (
                    <Button
                      key={option}
                      type="button"
                      variant={selectedReminders.includes(option) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleReminderOption(option)}
                      className="gap-1"
                    >
                      {selectedReminders.includes(option) && <Check className="w-3 h-3" />}
                      {option === 'at_time' && 'בשעת המשימה'}
                      {option === 'hour_before' && 'שעה לפני'}
                      {option === 'day_before' && 'יום לפני'}
                      {option === 'custom' && 'מותאם אישית'}
                    </Button>
                  ))}
                </div>

                {selectedReminders.includes('custom') && (
                  <div className="mt-3 animate-fade-in">
                    <Input
                      type="datetime-local"
                      value={formData.reminderAt}
                      onChange={(e) => updateField('reminderAt', e.target.value)}
                      placeholder="בחר זמן תזכורת"
                    />
                  </div>
                )}
              </div>

              {/* Notification Settings */}
              {selectedReminders.length > 0 && (
                <div className="border-t border-border pt-4 space-y-3 animate-fade-in">
                  <div className="text-sm font-medium text-muted-foreground">שלח התראה ל:</div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">מייל</span>
                    </div>
                    <Switch checked={formData.notificationEmail} onCheckedChange={(v) => updateField('notificationEmail', v)} />
                  </div>
                  
                  {formData.notificationEmail && (
                    <EmailSelector
                      formData={formData}
                      updateField={updateField}
                      teamMembers={teamMembers}
                      onAddContact={() => openAddContactDialog('email')}
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">SMS</span>
                    </div>
                    <Switch checked={formData.notificationSms} onCheckedChange={(v) => updateField('notificationSms', v)} />
                  </div>
                  
                  {formData.notificationSms && (
                    <PhoneSelector
                      formData={formData}
                      updateField={updateField}
                      teamMembers={teamMembers}
                      onAddContact={() => openAddContactDialog('phone')}
                    />
                  )}

                  {/* Reminder Preview */}
                  {(formData.notificationEmail || formData.notificationSms) && (
                    <ReminderPreview
                      showPreview={showReminderPreview}
                      setShowPreview={setShowReminderPreview}
                      selectedReminders={selectedReminders}
                      formData={formData}
                    />
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
            {selectedTaskId ? (
              <SubtaskList parentTaskId={selectedTaskId} />
            ) : (
              <div className="text-sm text-muted-foreground">
                שמור את המשימה כדי להוסיף תתי-משימות.
              </div>
            )}
          </CollapsibleField>

          {/* Attachments */}
          <CollapsibleField
            label="נספחים"
            icon={<Paperclip className="w-4 h-4" />}
            isExpanded={expandedSections.has('attachments')}
            onToggle={() => toggleSection('attachments')}
            hasValue={selectedTaskId ? false : pendingAttachments.length > 0}
          >
            {selectedTaskId ? (
              <TaskAttachments taskId={selectedTaskId} />
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
  );
}

// Helper components
function EmailSelector({ formData, updateField, teamMembers, onAddContact }: {
  formData: TaskFormData;
  updateField: <K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) => void;
  teamMembers: TeamMember[];
  onAddContact: () => void;
}) {
  const member = teamMembers.find(m => m.name === formData.assignee);
  const availableEmails = [...(member?.emails || [])];
  if (member?.email && !availableEmails.includes(member.email)) {
    availableEmails.unshift(member.email);
  }

  if (availableEmails.length > 0) {
    return (
      <div className="space-y-2 animate-fade-in">
        <Select value={formData.notificationEmailAddress} onValueChange={(v) => updateField('notificationEmailAddress', v)}>
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
        {formData.notificationEmailAddress === '_custom' && (
          <Input
            type="email"
            placeholder="כתובת מייל"
            onChange={(e) => updateField('notificationEmailAddress', e.target.value)}
          />
        )}
      </div>
    );
  }

  if (formData.assignee) {
    return (
      <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm text-muted-foreground animate-fade-in">
        <span>אין מייל</span>
        <Button type="button" variant="ghost" size="sm" className="h-6 gap-1" onClick={onAddContact}>
          <Plus className="w-3 h-3" />
          הוסף
        </Button>
      </div>
    );
  }

  return null;
}

function PhoneSelector({ formData, updateField, teamMembers, onAddContact }: {
  formData: TaskFormData;
  updateField: <K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) => void;
  teamMembers: TeamMember[];
  onAddContact: () => void;
}) {
  const member = teamMembers.find(m => m.name === formData.assignee);
  const availablePhones = member?.phones || [];

  if (availablePhones.length > 0) {
    return (
      <div className="space-y-2 animate-fade-in">
        <Select value={formData.notificationPhone} onValueChange={(v) => updateField('notificationPhone', v)}>
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
        {formData.notificationPhone === '_custom' && (
          <Input
            type="tel"
            placeholder="מספר טלפון"
            onChange={(e) => updateField('notificationPhone', e.target.value)}
          />
        )}
      </div>
    );
  }

  if (formData.assignee) {
    return (
      <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm text-muted-foreground animate-fade-in">
        <span>אין טלפון</span>
        <Button type="button" variant="ghost" size="sm" className="h-6 gap-1" onClick={onAddContact}>
          <Plus className="w-3 h-3" />
          הוסף
        </Button>
      </div>
    );
  }

  return null;
}

function ReminderPreview({ showPreview, setShowPreview, selectedReminders, formData }: {
  showPreview: boolean;
  setShowPreview: (value: boolean) => void;
  selectedReminders: ReminderOption[];
  formData: TaskFormData;
}) {
  return (
    <div className="border-t border-border pt-3 mt-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full gap-2 text-muted-foreground"
        onClick={() => setShowPreview(!showPreview)}
      >
        <Eye className="w-4 h-4" />
        {showPreview ? "הסתר" : "הצג"} תצוגה מקדימה
      </Button>
      {showPreview && (
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
            {selectedReminders.includes('custom') && formData.reminderAt && (
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-success" />
                <span>{new Date(formData.reminderAt).toLocaleString("he-IL")}</span>
              </div>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
            {formData.notificationEmail && formData.notificationEmailAddress && (
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                למייל: {formData.notificationEmailAddress}
              </div>
            )}
            {formData.notificationSms && formData.notificationPhone && (
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                ל-SMS: {formData.notificationPhone}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
