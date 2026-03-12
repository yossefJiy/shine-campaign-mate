import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ImportTask {
  title: string;
  description?: string;
  expected_result?: string;
  reference_links?: string[];
  owner?: string;
  assignee?: string; // alias for owner
  department?: string;
  team_name?: string;
  department_manager?: string;
  assignment_scope?: string;
  priority?: string;
  status?: string;
  task_type?: string;
  task_language?: string;
  task_tag?: string;
  notes?: string;
  due_date?: string;
  ready_for_qa?: boolean;
  qa_result?: string;
  completion_proof?: string[];
  depends_on?: string[]; // task titles this depends on
}

interface ImportStage {
  stage_name: string;
  tasks: ImportTask[];
}

interface ImportPayload {
  client_name?: string;
  client?: string; // alias
  project_name?: string;
  project?: string; // alias
  project_source?: string;
  billing_mode?: string;
  project_status?: string;
  work_state?: string;
  reference_links?: string[];
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

    // Verify caller
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_admin_privilege', { _user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ success: false, error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload: ImportPayload = await req.json();
    const clientName = payload.client_name || payload.client;
    const projectName = payload.project_name || payload.project;

    if (!clientName || !projectName || !payload.stages?.length) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields: client, project, stages' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === Resolve client ===
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let clientId: string;
    if (uuidRegex.test(clientName)) {
      clientId = clientName;
    } else {
      const { data: clientData, error: clientErr } = await supabase
        .from('clients').select('id').ilike('name', clientName).limit(1).single();
      if (clientErr || !clientData) {
        return new Response(JSON.stringify({ success: false, error: `Client not found: ${clientName}` }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      clientId = clientData.id;
    }

    // === Resolve team members (name → id) with alias support ===
    const { data: allTeam } = await supabase.from('team').select('id, name');
    const teamMap: Record<string, string> = {};
    const nameAliases: Record<string, string[]> = {
      'yosef': ['יוסף', 'yosef', 'yossef'],
      'alex': ['אלכס', 'alex'],
      'milan': ['מילן', 'milan'],
    };
    if (allTeam) {
      for (const m of allTeam) {
        teamMap[m.name.toLowerCase()] = m.id;
        // Also map first-name aliases
        for (const [alias, variants] of Object.entries(nameAliases)) {
          if (variants.some(v => m.name.toLowerCase().includes(v))) {
            teamMap[alias] = m.id;
          }
        }
      }
    }

    // === Resolve departments & org_teams ===
    const { data: allDepts } = await supabase.from('departments').select('id, name');
    const deptMap: Record<string, string> = {};
    if (allDepts) {
      for (const d of allDepts) {
        deptMap[d.name.toLowerCase()] = d.id;
      }
    }

    const { data: allOrgTeams } = await supabase.from('org_teams').select('id, name');
    const orgTeamMap: Record<string, string> = {};
    if (allOrgTeams) {
      for (const t of allOrgTeams) {
        orgTeamMap[t.name.toLowerCase()] = t.id;
      }
    }

    // === Resolve or create project ===
    let projectId: string;
    const { data: existingProject } = await supabase
      .from('projects').select('id')
      .eq('client_id', clientId).ilike('name', projectName).limit(1).single();

    if (existingProject) {
      projectId = existingProject.id;
      console.log(`Appending to existing project: ${projectId}`);
    } else {
      const { data: newProject, error: projectErr } = await supabase
        .from('projects')
        .insert({
          name: projectName,
          client_id: clientId,
          status: payload.project_status || 'active',
          work_state: payload.work_state || 'work_ok',
          last_activity_at: new Date().toISOString(),
          source: payload.project_source || 'bulk_import',
        })
        .select('id').single();

      if (projectErr) {
        return new Response(JSON.stringify({ success: false, error: `Failed to create project: ${projectErr.message}` }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      projectId = newProject.id;
      console.log(`Created new project: ${projectId}`);
    }

    // Get existing stage count for sort_order
    const { data: existingStages } = await supabase
      .from('project_stages').select('id, name')
      .eq('project_id', projectId).order('sort_order', { ascending: false }).limit(1);
    let sortOffset = existingStages?.length ? (existingStages.length) : 0;
    // Actually get count
    const { count: stageCount } = await supabase
      .from('project_stages').select('id', { count: 'exact', head: true })
      .eq('project_id', projectId);
    sortOffset = stageCount || 0;

    const results = {
      project_id: projectId,
      project_created: !existingProject,
      stages_created: 0,
      stages_appended: 0,
      tasks_created: 0,
      assignee_warnings: [] as string[],
      dependency_warnings: [] as string[],
    };

    // Track all created task title→id for dependency resolution
    const taskTitleToId: Record<string, string> = {};

    // Also load existing tasks in project for dependency resolution
    const { data: existingTasks } = await supabase
      .from('tasks').select('id, title').eq('project_id', projectId);
    if (existingTasks) {
      for (const t of existingTasks) {
        taskTitleToId[t.title.toLowerCase()] = t.id;
      }
    }

    // === Process stages ===
    for (let i = 0; i < payload.stages.length; i++) {
      const stageData = payload.stages[i];

      // Check if stage already exists in project
      let stageId: string;
      const { data: existingStage } = await supabase
        .from('project_stages').select('id')
        .eq('project_id', projectId).ilike('name', stageData.stage_name).limit(1).single();

      if (existingStage) {
        stageId = existingStage.id;
        results.stages_appended++;
        console.log(`Appending tasks to existing stage: ${stageData.stage_name}`);
      } else {
        const { data: newStage, error: stageErr } = await supabase
          .from('project_stages')
          .insert({
            project_id: projectId,
            name: stageData.stage_name,
            sort_order: sortOffset + i,
            status: 'pending',
          })
          .select('id').single();

        if (stageErr) {
          console.error(`Stage creation error: ${stageErr.message}`);
          continue;
        }
        stageId = newStage.id;
        results.stages_created++;
      }

      // === Build task rows ===
      const taskRows = stageData.tasks.map(task => {
        const ownerName = task.owner || task.assignee;
        const ownerLower = ownerName?.toLowerCase();
        const resolvedOwner = ownerLower ? teamMap[ownerLower] : null;

        if (ownerName && !resolvedOwner) {
          results.assignee_warnings.push(`Owner not found: "${ownerName}" for task "${task.title}"`);
        }

        // Resolve department_id
        const deptLower = task.department?.toLowerCase();
        const departmentId = deptLower ? deptMap[deptLower] : null;

        // Resolve org_team_id
        const teamLower = task.team_name?.toLowerCase();
        const orgTeamId = teamLower ? orgTeamMap[teamLower] : null;

        // Map status
        const statusMap: Record<string, string> = {
          'to do': 'todo', 'todo': 'todo',
          'in progress': 'in_progress', 'in_progress': 'in_progress',
          'waiting': 'waiting', 'blocked': 'blocked',
          'review': 'review', 'completed': 'completed', 'done': 'completed',
        };
        const status = statusMap[(task.status || 'todo').toLowerCase()] || 'todo';

        // Map task_language
        const langMap: Record<string, string> = {
          'hebrew': 'he', 'he': 'he', 'עברית': 'he',
          'english': 'en', 'en': 'en', 'אנגלית': 'en',
        };
        const taskLang = langMap[(task.task_language || 'en').toLowerCase()] || 'en';

        // Map task_tag from task_type
        const tagMap: Record<string, string> = {
          'operations': 'operational', 'operational': 'operational',
          'development': 'operational', 'design': 'operational',
          'seo': 'operational', 'qa': 'operational',
          'income': 'income_generating', 'income_generating': 'income_generating',
          'client': 'client_dependent', 'client_dependent': 'client_dependent',
        };
        const taskTag = task.task_tag || tagMap[(task.task_type || 'operational').toLowerCase()] || 'operational';

        return {
          project_id: projectId,
          stage_id: stageId,
          client_id: clientId,
          title: task.title,
          description: task.description || null,
          expected_result: task.expected_result || null,
          reference_links: task.reference_links || [],
          assignee: resolvedOwner || null,
          department: task.department || null,
          department_id: departmentId || null,
          org_team_id: orgTeamId || null,
          assignment_scope: task.assignment_scope || 'individual',
          priority: (task.priority || 'medium').toLowerCase(),
          task_language: taskLang,
          status,
          task_tag: taskTag,
          task_type: task.task_type?.toLowerCase() || 'operational',
          notes: task.notes || null,
          ready_for_qa: task.ready_for_qa || false,
          qa_result: task.qa_result || null,
          completion_proof: task.completion_proof || [],
          depends_on: [], // resolved after insert
        };
      });

      if (taskRows.length > 0) {
        const { data: insertedTasks, error: tasksErr } = await supabase
          .from('tasks').insert(taskRows).select('id, title');

        if (tasksErr) {
          console.error(`Tasks insert error: ${tasksErr.message}`);
        } else if (insertedTasks) {
          results.tasks_created += insertedTasks.length;
          // Track for dependency resolution
          for (const t of insertedTasks) {
            taskTitleToId[t.title.toLowerCase()] = t.id;
          }
        }
      }
    }

    // === Resolve dependencies ===
    for (const stageData of payload.stages) {
      for (const task of stageData.tasks) {
        if (task.depends_on && task.depends_on.length > 0) {
          const taskId = taskTitleToId[task.title.toLowerCase()];
          if (!taskId) continue;

          const depIds: string[] = [];
          for (const depTitle of task.depends_on) {
            const depId = taskTitleToId[depTitle.toLowerCase()];
            if (depId) {
              depIds.push(depId);
            } else {
              results.dependency_warnings.push(`Dependency not found: "${depTitle}" for task "${task.title}"`);
            }
          }

          if (depIds.length > 0) {
            await supabase.from('tasks').update({ depends_on: depIds }).eq('id', taskId);
          }
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
