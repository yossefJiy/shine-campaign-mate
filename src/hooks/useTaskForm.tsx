import { useState, useCallback } from "react";
import { TeamMember, Project } from "@/types/domains/tasks";

export type TaskType = 'development' | 'design' | 'qa' | 'seo' | 'content' | 'operations';

export type AssignmentScope = 'individual' | 'team' | 'department';

export interface TaskFormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  scheduledTime: string;
  assignee: string;
  department: string;
  category: string;
  projectId: string;
  stageId: string;
  taskTag: 'income_generating' | 'operational' | 'client_dependent';
  incomeValue: string;
  reminderAt: string;
  notificationEmail: boolean;
  notificationSms: boolean;
  notificationPhone: string;
  notificationEmailAddress: string;
  // Universal execution fields
  taskType: TaskType;
  expectedResult: string;
  referenceLinks: string[];
  notes: string;
  dependsOn: string[];
  qaResult: string;
  completionProof: string;
  completionNotes: string;
  readyForQa: boolean;
  // Operational ownership fields
  assignmentScope: AssignmentScope;
  orgTeamId: string;
  departmentId: string;
  taskLanguage: string;
}

export type ReminderOption = 'at_time' | 'hour_before' | 'day_before' | 'custom';

export interface UseTaskFormReturn {
  formData: TaskFormData;
  setFormData: React.Dispatch<React.SetStateAction<TaskFormData>>;
  updateField: <K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) => void;
  resetForm: () => void;
  initFromTask: (task: TaskFormData & { id?: string }, projectFilterId?: string) => void;
  expandedSections: Set<string>;
  toggleSection: (section: string) => void;
  selectedReminders: ReminderOption[];
  toggleReminderOption: (option: ReminderOption) => void;
  showReminderPreview: boolean;
  setShowReminderPreview: (value: boolean) => void;
  handleAssigneeChange: (name: string, teamMembers: TeamMember[]) => void;
  getSmartAssignee: (category: string, department: string, teamMembers: TeamMember[]) => string;
  calculateReminderTime: (option: ReminderOption, dueDate: string, scheduledTime: string) => string | null;
}

const initialFormData: TaskFormData = {
  title: "",
  description: "",
  status: "pending",
  priority: "medium",
  dueDate: "",
  scheduledTime: "",
  assignee: "",
  department: "",
  category: "",
  projectId: "",
  stageId: "",
  taskTag: "operational",
  incomeValue: "",
  reminderAt: "",
  notificationEmail: false,
  notificationSms: false,
  notificationPhone: "",
  notificationEmailAddress: "",
  taskType: "operations",
  expectedResult: "",
  referenceLinks: [],
  notes: "",
  dependsOn: [],
  qaResult: "",
  completionProof: "",
  completionNotes: "",
  readyForQa: false,
  assignmentScope: "individual",
  orgTeamId: "",
  departmentId: "",
  taskLanguage: "he",
};

export function useTaskForm(): UseTaskFormReturn {
  const [formData, setFormData] = useState<TaskFormData>(initialFormData);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['title']));
  const [selectedReminders, setSelectedReminders] = useState<ReminderOption[]>([]);
  const [showReminderPreview, setShowReminderPreview] = useState(false);

  const updateField = useCallback(<K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setExpandedSections(new Set(['title']));
    setSelectedReminders([]);
    setShowReminderPreview(false);
  }, []);

  const initFromTask = useCallback((task: Partial<TaskFormData> & { id?: string }, projectFilterId?: string) => {
    setFormData({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "pending",
      priority: task.priority || "medium",
      dueDate: task.dueDate || "",
      scheduledTime: task.scheduledTime?.slice(0, 5) || "",
      assignee: task.assignee || "",
      department: task.department || "",
      category: task.category || "",
      projectId: task.projectId || projectFilterId || "",
      stageId: task.stageId || "",
      taskTag: task.taskTag || "operational",
      incomeValue: task.incomeValue || "",
      reminderAt: task.reminderAt ? task.reminderAt.slice(0, 16) : "",
      notificationEmail: task.notificationEmail || false,
      notificationSms: task.notificationSms || false,
      notificationPhone: task.notificationPhone || "",
      notificationEmailAddress: task.notificationEmailAddress || "",
      taskType: task.taskType || "operations",
      expectedResult: task.expectedResult || "",
      referenceLinks: task.referenceLinks || [],
      notes: task.notes || "",
      dependsOn: task.dependsOn || [],
      qaResult: task.qaResult || "",
      completionProof: task.completionProof || "",
      completionNotes: task.completionNotes || "",
      readyForQa: task.readyForQa || false,
      assignmentScope: task.assignmentScope || "individual",
      orgTeamId: task.orgTeamId || "",
      departmentId: task.departmentId || "",
      taskLanguage: task.taskLanguage || "he",
    });
    setExpandedSections(new Set(task.id ? ["title", "subtasks"] : ["title"]));
    setSelectedReminders([]);
    setShowReminderPreview(false);
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  const toggleReminderOption = useCallback((option: ReminderOption) => {
    setSelectedReminders(prev =>
      prev.includes(option)
        ? prev.filter(r => r !== option)
        : [...prev, option]
    );
  }, []);

  const getSmartAssignee = useCallback((category: string, department: string, teamMembers: TeamMember[]): string => {
    if (!category && !department) return "";
    const matchingMembers = teamMembers.filter(m =>
      m.departments.includes(department) ||
      (category && m.departments.some(d => d.toLowerCase().includes(category.toLowerCase())))
    );
    if (matchingMembers.length > 0) return matchingMembers[0].name;
    return "";
  }, []);

  const handleAssigneeChange = useCallback((name: string, teamMembers: TeamMember[]) => {
    const member = teamMembers.find(m => m.name === name);
    setFormData(prev => {
      const updates: Partial<TaskFormData> = { assignee: name };
      if (member) {
        if (!prev.notificationEmailAddress) {
          const primaryEmail = member.emails?.[0] || member.email;
          if (primaryEmail) updates.notificationEmailAddress = primaryEmail;
        }
        if (!prev.notificationPhone && member.phones?.[0]) {
          updates.notificationPhone = member.phones[0];
        }
        if (member.departments?.[0] && !prev.department) {
          updates.department = member.departments[0];
        }
      }
      return { ...prev, ...updates };
    });
  }, []);

  const calculateReminderTime = useCallback((option: ReminderOption, dueDate: string, scheduledTime: string): string | null => {
    if (!dueDate) return null;
    const baseDate = new Date(`${dueDate}T${scheduledTime || '09:00'}:00`);
    switch (option) {
      case 'at_time': return baseDate.toISOString();
      case 'hour_before': return new Date(baseDate.getTime() - 60 * 60 * 1000).toISOString();
      case 'day_before': return new Date(baseDate.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case 'custom': return formData.reminderAt ? new Date(formData.reminderAt).toISOString() : null;
      default: return null;
    }
  }, [formData.reminderAt]);

  return {
    formData, setFormData, updateField, resetForm, initFromTask,
    expandedSections, toggleSection,
    selectedReminders, toggleReminderOption,
    showReminderPreview, setShowReminderPreview,
    handleAssigneeChange, getSmartAssignee, calculateReminderTime,
  };
}
