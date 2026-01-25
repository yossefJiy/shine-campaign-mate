// Project Stages domain types

import { BaseEntity } from '../common';

export type StageStatus = 'pending' | 'in_progress' | 'waiting_client' | 'approved' | 'completed';

export interface ProjectStage extends BaseEntity {
  project_id: string;
  name: string;
  description: string | null;
  status: StageStatus;
  sort_order: number;
  estimated_hours: number | null;
  actual_hours: number | null;
  estimated_cost: number | null;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  requires_client_approval: boolean;
  client_notes: string | null;
}

export interface StageComment extends BaseEntity {
  stage_id: string;
  user_id: string | null;
  contact_id: string | null;
  content: string;
  is_internal: boolean;
}

export interface StageApproval extends BaseEntity {
  stage_id: string;
  approved_by_user: string | null;
  approved_by_contact: string | null;
  decision: 'approved' | 'rejected' | 'revision_requested';
  notes: string | null;
}

export interface CreateStageDTO {
  project_id: string;
  name: string;
  description?: string;
  estimated_hours?: number;
  estimated_cost?: number;
  due_date?: string;
  requires_client_approval?: boolean;
}

export interface UpdateStageDTO {
  name?: string;
  description?: string;
  status?: StageStatus;
  estimated_hours?: number;
  actual_hours?: number;
  estimated_cost?: number;
  start_date?: string;
  due_date?: string;
  requires_client_approval?: boolean;
  client_notes?: string;
}

// Extended task with stage and tag - uses TaskTag from tasks.ts
import type { TaskTag } from './tasks';

export interface EnhancedTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  task_tag: TaskTag;
  income_value: number | null;
  assignee: string | null;
  client_id: string;
  stage_id: string | null;
}
