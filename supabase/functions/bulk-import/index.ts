import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ImportTask {
  title: string;
  description?: string;
  assignee?: string;
  priority?: string;
  task_language?: string;
  status?: string;
  due_date?: string;
  task_tag?: string;
}

interface ImportStage {
  stage_name: string;
  tasks: ImportTask[];
}

interface ImportPayload {
  client: string; // client name or ID
  project: string; // project name
  stages: ImportStage[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify caller is admin
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin privilege
    const { data: isAdmin } = await supabase.rpc('has_admin_privilege', { _user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ success: false, error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload: ImportPayload = await req.json();

    // Validate payload
    if (!payload.client || !payload.project || !payload.stages?.length) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields: client, project, stages' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve client - by name or UUID
    let clientId: string;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(payload.client)) {
      clientId = payload.client;
    } else {
      const { data: clientData, error: clientErr } = await supabase
        .from('clients')
        .select('id')
        .ilike('name', payload.client)
        .limit(1)
        .single();
      if (clientErr || !clientData) {
        return new Response(JSON.stringify({ success: false, error: `Client not found: ${payload.client}` }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      clientId = clientData.id;
    }

    // Resolve assignees (name → team member ID)
    const assigneeNames = new Set<string>();
    for (const stage of payload.stages) {
      for (const task of stage.tasks) {
        if (task.assignee) assigneeNames.add(task.assignee.toLowerCase());
      }
    }

    const assigneeMap: Record<string, string> = {};
    if (assigneeNames.size > 0) {
      const { data: teamMembers } = await supabase
        .from('team')
        .select('id, name')
        .in('name', Array.from(assigneeNames).map(n => 
          // Try case-insensitive match
          n.charAt(0).toUpperCase() + n.slice(1)
        ));
      
      // Also try exact names
      const { data: teamMembers2 } = await supabase
        .from('team')
        .select('id, name');
      
      if (teamMembers2) {
        for (const member of teamMembers2) {
          if (assigneeNames.has(member.name.toLowerCase())) {
            assigneeMap[member.name.toLowerCase()] = member.id;
          }
        }
      }
    }

    // Create project
    const { data: project, error: projectErr } = await supabase
      .from('projects')
      .insert({
        name: payload.project,
        client_id: clientId,
        status: 'active',
        work_state: 'work_ok',
        last_activity_at: new Date().toISOString(),
        source: 'bulk_import',
      })
      .select('id')
      .single();

    if (projectErr) {
      return new Response(JSON.stringify({ success: false, error: `Failed to create project: ${projectErr.message}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = {
      project_id: project.id,
      stages_created: 0,
      tasks_created: 0,
      assignee_warnings: [] as string[],
    };

    // Create stages and tasks
    for (let i = 0; i < payload.stages.length; i++) {
      const stageData = payload.stages[i];

      const { data: stage, error: stageErr } = await supabase
        .from('project_stages')
        .insert({
          project_id: project.id,
          name: stageData.stage_name,
          sort_order: i,
          status: 'pending',
        })
        .select('id')
        .single();

      if (stageErr) {
        console.error(`Stage creation error: ${stageErr.message}`);
        continue;
      }

      results.stages_created++;

      // Batch insert tasks for this stage
      const taskRows = stageData.tasks.map(task => {
        const assigneeLower = task.assignee?.toLowerCase();
        const resolvedAssignee = assigneeLower ? assigneeMap[assigneeLower] : null;

        if (task.assignee && !resolvedAssignee) {
          results.assignee_warnings.push(`Assignee not found: "${task.assignee}" for task "${task.title}"`);
        }

        return {
          project_id: project.id,
          stage_id: stage.id,
          client_id: clientId,
          title: task.title,
          description: task.description || null,
          assignee: resolvedAssignee || null,
          priority: task.priority?.toLowerCase() || 'medium',
          task_language: task.task_language?.toLowerCase() || 'en',
          status: task.status?.toLowerCase() || 'todo',
          task_tag: task.task_tag || 'operational',
        };
      });

      if (taskRows.length > 0) {
        const { data: insertedTasks, error: tasksErr } = await supabase
          .from('tasks')
          .insert(taskRows)
          .select('id');

        if (tasksErr) {
          console.error(`Tasks insert error: ${tasksErr.message}`);
        } else {
          results.tasks_created += insertedTasks?.length || 0;
        }
      }
    }

    return new Response(JSON.stringify({ success: true, data: results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Bulk import error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
