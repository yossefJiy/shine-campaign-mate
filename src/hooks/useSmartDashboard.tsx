import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays } from "date-fns";

export type TaskTag = 'income_generating' | 'operational' | 'client_dependent';

export interface SmartTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  task_tag: TaskTag;
  income_value: number | null;
  assignee: string | null;
  client_id: string;
  client_name?: string;
  project_name?: string;
  stage_name?: string;
}

export interface DashboardStats {
  incomeGeneratingTasks: SmartTask[];
  clientDependentTasks: SmartTask[];
  overduePayments: {
    id: string;
    client_id: string;
    client_name: string;
    amount: number;
    due_date: string;
    days_overdue: number;
  }[];
  stalledProjects: {
    id: string;
    name: string;
    client_name: string;
    days_since_activity: number;
    last_task_update: string | null;
  }[];
  todayStats: {
    totalTasks: number;
    completedTasks: number;
    incomeValue: number;
  };
}

export function useSmartDashboard(clientId?: string) {
  const today = startOfDay(new Date()).toISOString();
  
  return useQuery({
    queryKey: ["smart-dashboard", clientId],
    queryFn: async (): Promise<DashboardStats> => {
      // 1. Get top income-generating tasks for today
      let incomeQuery = supabase
        .from("tasks")
        .select(`
          id, title, status, priority, due_date, task_tag, income_value, assignee, client_id,
          clients!tasks_client_id_fkey(name)
        `)
        .in("task_tag", ["income_generating", "operational"])
        .neq("status", "completed")
        .order("priority", { ascending: true })
        .limit(5);
      
      if (clientId) {
        incomeQuery = incomeQuery.eq("client_id", clientId);
      }

      const { data: incomeTasks } = await incomeQuery;

      // 2. Get client-dependent (waiting) tasks
      let clientDepQuery = supabase
        .from("tasks")
        .select(`
          id, title, status, priority, due_date, task_tag, income_value, assignee, client_id,
          clients!tasks_client_id_fkey(name)
        `)
        .in("status", ["waiting", "blocked"])
        .neq("status", "completed")
        .order("due_date", { ascending: true })
        .limit(10);
      
      if (clientId) {
        clientDepQuery = clientDepQuery.eq("client_id", clientId);
      }

      const { data: clientDepTasks } = await clientDepQuery;

      // 3. Get overdue payments
      let paymentsQuery = supabase
        .from("billing_records")
        .select(`
          id, client_id, total_amount, due_date,
          clients!billing_records_client_id_fkey(name)
        `)
        .eq("status", "pending")
        .lt("due_date", today);
      
      if (clientId) {
        paymentsQuery = paymentsQuery.eq("client_id", clientId);
      }

      const { data: overduePaymentsRaw } = await paymentsQuery;

      // 4. Get stalled projects (no activity in 7+ days)
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      
      let projectsQuery = supabase
        .from("projects")
        .select(`
          id, name, client_id, updated_at,
          clients(name)
        `)
        .neq("status", "completed")
        .lt("updated_at", sevenDaysAgo);
      
      if (clientId) {
        projectsQuery = projectsQuery.eq("client_id", clientId);
      }

      const { data: stalledProjectsRaw } = await projectsQuery;

      // 5. Today's stats
      let todayQuery = supabase
        .from("tasks")
        .select("id, status, income_value, task_tag")
        .gte("due_date", today)
        .lte("due_date", today + "T23:59:59");
      
      if (clientId) {
        todayQuery = todayQuery.eq("client_id", clientId);
      }

      const { data: todayTasks } = await todayQuery;

      // Transform data
      const incomeGeneratingTasks: SmartTask[] = (incomeTasks || []).map((t: any) => ({
        ...t,
        client_name: t.clients?.name,
      }));

      const clientDependentTasks: SmartTask[] = (clientDepTasks || []).map((t: any) => ({
        ...t,
        client_name: t.clients?.name,
      }));

      const overduePayments = (overduePaymentsRaw || []).map((p: any) => ({
        id: p.id,
        client_id: p.client_id,
        client_name: p.clients?.name || "לקוח לא ידוע",
        amount: p.total_amount || 0,
        due_date: p.due_date,
        days_overdue: Math.floor((Date.now() - new Date(p.due_date).getTime()) / (1000 * 60 * 60 * 24)),
      }));

      const stalledProjects = (stalledProjectsRaw || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        client_name: p.clients?.name || "לקוח לא ידוע",
        days_since_activity: Math.floor((Date.now() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24)),
        last_task_update: p.updated_at,
      }));

      const completedToday = (todayTasks || []).filter((t: any) => t.status === "completed");
      const incomeToday = completedToday
        .filter((t: any) => t.task_tag === "income_generating")
        .reduce((sum: number, t: any) => sum + (t.income_value || 0), 0);

      return {
        incomeGeneratingTasks,
        clientDependentTasks,
        overduePayments,
        stalledProjects,
        todayStats: {
          totalTasks: (todayTasks || []).length,
          completedTasks: completedToday.length,
          incomeValue: incomeToday,
        },
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
