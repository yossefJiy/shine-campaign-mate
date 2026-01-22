import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate API Key
  const apiKey = req.headers.get('X-API-Key');
  const expectedKey = Deno.env.get('PRIVATE_API_KEY');
  
  if (!apiKey || apiKey !== expectedKey) {
    console.error('Unauthorized: Invalid or missing API key');
    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: 'Invalid or missing API key' }), 
      { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Create Supabase client with service role
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const url = new URL(req.url);
  const type = url.searchParams.get('type');

  // Validate type parameter - expanded to include contacts, team, projects
  const validTypes = ['clients', 'leads', 'tasks', 'contacts', 'team', 'projects'];
  if (!type || !validTypes.includes(type)) {
    return new Response(
      JSON.stringify({ 
        error: 'Bad Request', 
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}` 
      }), 
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // GET - Fetch data
    if (req.method === 'GET') {
      console.log(`Fetching ${type}...`);
      
      let query;
      switch(type) {
        case 'clients':
          query = supabase
            .from('clients')
            .select('*')
            .is('deleted_at', null)
            .order('name');
          break;
        case 'leads':
          query = supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });
          break;
        case 'tasks':
          query = supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });
          break;
        case 'contacts':
          query = supabase
            .from('client_contacts')
            .select('*, clients(id, name)')
            .order('created_at', { ascending: false });
          break;
        case 'team':
          query = supabase
            .from('team')
            .select('*')
            .order('name');
          break;
        case 'projects':
          query = supabase
            .from('projects')
            .select('*, clients(id, name)')
            .order('created_at', { ascending: false });
          break;
      }
      
      const { data, error } = await query!;
      
      if (error) {
        console.error(`Error fetching ${type}:`, error);
        throw error;
      }
      
      console.log(`Successfully fetched ${data?.length || 0} ${type}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          type,
          count: data?.length || 0,
          data 
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Create data
    if (req.method === 'POST') {
      const body = await req.json();
      
      if (!body.data) {
        return new Response(
          JSON.stringify({ 
            error: 'Bad Request', 
            message: 'Missing "data" field in request body' 
          }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`Creating ${type}...`, Array.isArray(body.data) ? `${body.data.length} records` : '1 record');
      
      let result;
      switch(type) {
        case 'clients':
          result = await supabase.from('clients').insert(body.data).select();
          break;
        case 'leads':
          result = await supabase.from('leads').insert(body.data).select();
          break;
        case 'tasks':
          result = await supabase.from('tasks').insert(body.data).select();
          break;
        case 'contacts':
          result = await supabase.from('client_contacts').insert(body.data).select();
          break;
        case 'team':
          result = await supabase.from('team').insert(body.data).select();
          break;
        case 'projects':
          result = await supabase.from('projects').insert(body.data).select();
          break;
      }
      
      if (result!.error) {
        console.error(`Error creating ${type}:`, result!.error);
        throw result!.error;
      }
      
      console.log(`Successfully created ${type}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          type,
          data: result!.data 
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method Not Allowed' }), 
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: errorMessage 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});