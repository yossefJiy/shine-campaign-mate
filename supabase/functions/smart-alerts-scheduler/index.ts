import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const today = new Date().toISOString().split('T')[0];
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const alertsToCreate: any[] = [];

    // Get all admin users for notifications
    const { data: adminUsers } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['super_admin', 'admin']);

    const adminUserIds = adminUsers?.map(u => u.user_id) || [];

    // 1. Find overdue tasks
    const { data: overdueTasks } = await supabase
      .from('tasks')
      .select('id, title, client_id, assignee, clients(name)')
      .lt('due_date', today)
      .neq('status', 'completed')
      .neq('status', 'blocked');

    for (const task of overdueTasks || []) {
      for (const userId of adminUserIds) {
        alertsToCreate.push({
          to_user_id: userId,
          alert_type: 'task_overdue',
          entity_type: 'task',
          entity_id: task.id,
          title: `משימה באיחור: ${task.title}`,
          message: `לקוח: ${(task.clients as any)?.name || 'לא ידוע'}`,
          priority: 'high',
        });
      }
    }

    // 2. Find client delays (waiting_since > 3 days)
    const { data: clientDelays } = await supabase
      .from('tasks')
      .select('id, title, client_id, waiting_since, clients(name)')
      .eq('task_tag', 'client_dependent')
      .lte('waiting_since', threeDaysAgo)
      .neq('status', 'completed');

    for (const task of clientDelays || []) {
      for (const userId of adminUserIds) {
        const daysSince = Math.floor(
          (Date.now() - new Date(task.waiting_since!).getTime()) / (1000 * 60 * 60 * 24)
        );
        alertsToCreate.push({
          to_user_id: userId,
          alert_type: 'client_delay',
          entity_type: 'task',
          entity_id: task.id,
          title: `עיכוב לקוח: ${task.title}`,
          message: `ממתין כבר ${daysSince} ימים`,
          priority: daysSince > 7 ? 'urgent' : 'high',
        });
      }
    }

    // 3. Update and alert on overdue payments
    const { data: overduePayments } = await supabase
      .from('billing_records')
      .select('id, client_id, total_amount, due_date, clients(name)')
      .eq('status', 'pending')
      .lt('due_date', today);

    // Update status to overdue
    if (overduePayments && overduePayments.length > 0) {
      await supabase
        .from('billing_records')
        .update({ status: 'overdue' })
        .in('id', overduePayments.map(p => p.id));

      for (const payment of overduePayments) {
        const daysOverdue = Math.floor(
          (Date.now() - new Date(payment.due_date!).getTime()) / (1000 * 60 * 60 * 24)
        );
        for (const userId of adminUserIds) {
          alertsToCreate.push({
            to_user_id: userId,
            alert_type: 'payment_overdue',
            entity_type: 'billing_record',
            entity_id: payment.id,
            title: `תשלום באיחור: ${(payment.clients as any)?.name}`,
            message: `₪${payment.total_amount?.toLocaleString() || 0} - ${daysOverdue} ימים באיחור`,
            priority: 'urgent',
          });
        }
      }
    }

    // 4. Find stalled projects (no activity > 5 days)
    const { data: stalledProjects } = await supabase
      .from('projects')
      .select('id, name, client_id, last_activity_at, clients(name)')
      .eq('status', 'active')
      .lt('last_activity_at', fiveDaysAgo);

    for (const project of stalledProjects || []) {
      const daysSince = Math.floor(
        (Date.now() - new Date(project.last_activity_at!).getTime()) / (1000 * 60 * 60 * 24)
      );
      for (const userId of adminUserIds) {
        alertsToCreate.push({
          to_user_id: userId,
          alert_type: 'project_stalled',
          entity_type: 'project',
          entity_id: project.id,
          title: `פרויקט תקוע: ${project.name}`,
          message: `${(project.clients as any)?.name} - אין תזוזה ${daysSince} ימים`,
          priority: 'normal',
        });
      }
    }

    // 5. Check if no income tasks due today/tomorrow
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: incomeTasks, count: incomeCount } = await supabase
      .from('tasks')
      .select('id', { count: 'exact' })
      .eq('task_tag', 'income_generating')
      .neq('status', 'completed')
      .lte('due_date', tomorrow)
      .gte('due_date', today);

    if (incomeCount === 0) {
      for (const userId of adminUserIds) {
        alertsToCreate.push({
          to_user_id: userId,
          alert_type: 'no_income_tasks',
          entity_type: null,
          entity_id: null,
          title: 'אין משימת כסף קרובה',
          message: 'אין משימות מכניסות כסף היום או מחר - זה זמן ליזום',
          priority: 'normal',
        });
      }
    }

    // Deduplicate alerts - don't create if similar alert exists in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const newAlerts: any[] = [];
    for (const alert of alertsToCreate) {
      const { count } = await supabase
        .from('smart_alerts')
        .select('id', { count: 'exact' })
        .eq('to_user_id', alert.to_user_id)
        .eq('alert_type', alert.alert_type)
        .eq('entity_id', alert.entity_id)
        .gte('created_at', oneDayAgo);

      if (count === 0) {
        newAlerts.push(alert);
      }
    }

    // Insert new alerts
    if (newAlerts.length > 0) {
      const { error: insertError } = await supabase
        .from('smart_alerts')
        .insert(newAlerts);

      if (insertError) {
        console.error('Error inserting alerts:', insertError);
        throw insertError;
      }
    }

    console.log(`Smart alerts scheduler completed: ${newAlerts.length} new alerts created`);

    return new Response(
      JSON.stringify({
        success: true,
        alertsCreated: newAlerts.length,
        summary: {
          overdueTasks: overdueTasks?.length || 0,
          clientDelays: clientDelays?.length || 0,
          overduePayments: overduePayments?.length || 0,
          stalledProjects: stalledProjects?.length || 0,
          noIncomeTasks: incomeCount === 0,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Smart alerts scheduler error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
