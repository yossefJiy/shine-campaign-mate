// Tasks API

import { BaseAPI } from './base';

// Matching actual database schema
export interface TaskRow {
  id: string;
  client_id: string;
  campaign_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  department: string | null;
  assignee: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  reminder_at: string | null;
  notification_email: boolean | null;
  notification_sms: boolean | null;
  notification_phone: string | null;
  notification_email_address: string | null;
  reminder_sent: boolean | null;
  category: string | null;
  scheduled_time: string | null;
  duration_minutes: number | null;
  credits_cost: number | null;
  recurrence_type: string | null;
  recurrence_end_date: string | null;
  task_language: string;
}

export interface CreateTaskInput {
  client_id: string;
  title: string;
  description?: string;
  priority?: string;
  assignee?: string;
  due_date?: string;
  department?: string;
  category?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  due_date?: string;
  department?: string;
  category?: string;
}

export class TasksAPI extends BaseAPI {
  async list(clientId: string) {
    return this.request<TaskRow[]>(async () => {
      return this.client
        .from('tasks')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
    });
  }

  async getById(id: string) {
    return this.request<TaskRow>(async () => {
      return this.client
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();
    });
  }

  async create(data: CreateTaskInput) {
    return this.request<TaskRow>(async () => {
      return this.client
        .from('tasks')
        .insert({
          client_id: data.client_id,
          title: data.title,
          description: data.description ?? null,
          priority: data.priority ?? 'medium',
          assignee: data.assignee ?? null,
          due_date: data.due_date ?? null,
          department: data.department ?? null,
          category: data.category ?? null,
        })
        .select()
        .single();
    });
  }

  async update(id: string, data: UpdateTaskInput) {
    return this.request<TaskRow>(async () => {
      return this.client
        .from('tasks')
        .update(data as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();
    });
  }

  async delete(id: string) {
    return this.request<null>(async () => {
      return this.client
        .from('tasks')
        .delete()
        .eq('id', id);
    });
  }

  async getByAssignee(assignee: string) {
    return this.request<TaskRow[]>(async () => {
      return this.client
        .from('tasks')
        .select('*')
        .eq('assignee', assignee)
        .order('due_date', { ascending: true });
    });
  }

  async getOverdue(clientId: string) {
    const now = new Date().toISOString().split('T')[0]; // date only
    const { data, error } = await this.client
      .from('tasks')
      .select('*')
      .eq('client_id', clientId)
      .lt('due_date', now);
    
    if (error) {
      return { data: null, error: error.message, success: false };
    }
    
    // Filter out completed tasks
    const overdueTasks = (data || []).filter((t) => t.status !== 'completed');
    return { data: overdueTasks as unknown as TaskRow[], error: null, success: true };
  }
}

export const tasksAPI = new TasksAPI();
