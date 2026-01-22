// Tasks domain types

import { BaseEntity, Status } from '../common';

export interface Task extends BaseEntity {
  client_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  tags: string[];
  parent_task_id: string | null;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Subtask extends BaseEntity {
  task_id: string;
  title: string;
  is_completed: boolean;
  order_index: number;
}

export interface TaskAttachment extends BaseEntity {
  task_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
}

export interface TaskComment extends BaseEntity {
  task_id: string;
  user_id: string;
  content: string;
  is_internal: boolean;
}

export interface CreateTaskDTO {
  client_id: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigned_to?: string;
  due_date?: string;
  estimated_hours?: number;
  tags?: string[];
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  tags?: string[];
}

// TeamMember type for tasks components
export interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  emails: string[];
  phones: string[];
  departments: string[];
  avatar_color?: string | null;
}

// Project type for tasks components
export interface Project {
  id: string;
  name: string;
  color: string | null;
}
