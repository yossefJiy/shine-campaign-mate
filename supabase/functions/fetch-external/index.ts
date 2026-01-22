import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// External project URL (the other Lovable project)
const EXTERNAL_PROJECT_URL = 'https://ovkuabbfubtiwnlksmxd.supabase.co/functions/v1/private-api';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('PRIVATE_API_KEY');
  
  if (!apiKey) {
    console.error('PRIVATE_API_KEY not configured');
    return new Response(
      JSON.stringify({ error: 'Configuration Error', message: 'PRIVATE_API_KEY not configured' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const action = url.searchParams.get('action') || 'fetch'; // fetch or sync

  // Valid types to fetch
  const validTypes = ['clients', 'leads', 'tasks', 'contacts', 'team', 'projects', 'all'];
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
    // Fetch from external project
    if (type === 'all') {
      // Fetch all types in parallel
      const types = ['clients', 'projects', 'contacts', 'team'];
      const results = await Promise.all(
        types.map(async (t) => {
          try {
            const response = await fetch(`${EXTERNAL_PROJECT_URL}?type=${t}`, {
              method: 'GET',
              headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json',
              },
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`Error fetching ${t}:`, errorText);
              return { type: t, success: false, error: errorText, data: [] };
            }
            
            const data = await response.json();
            return { type: t, success: true, count: data.count || 0, data: data.data || [] };
          } catch (err) {
            console.error(`Error fetching ${t}:`, err);
            return { type: t, success: false, error: String(err), data: [] };
          }
        })
      );
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          results 
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch single type
    console.log(`Fetching ${type} from external project...`);
    
    const response = await fetch(`${EXTERNAL_PROJECT_URL}?type=${type}`, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching ${type}:`, response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'External API Error', 
          status: response.status,
          message: errorText 
        }), 
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const data = await response.json();
    console.log(`Successfully fetched ${data.count || 0} ${type} from external project`);
    
    // If action is 'sync', import the data into local database
    if (action === 'sync' && data.data && data.data.length > 0) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      console.log(`Syncing ${data.data.length} ${type} to local database...`);
      
      // Transform and upsert data based on type
      let syncResult;
      switch(type) {
        case 'clients':
          // Map external client data to local schema - only include columns that exist in this project
          const clientsToSync = data.data.map((c: Record<string, unknown>) => ({
            id: c.id,
            name: c.name,
            industry: c.industry || null,
            website: c.website || null,
            is_active: c.is_active !== false,
            is_master_account: c.is_master_account || false,
            is_agency_brand: c.is_agency_brand || false,
            is_favorite: c.is_favorite || false,
            modules_enabled: c.modules_enabled || {},
            modules_order: c.modules_order || {},
            logo_url: c.logo_url || null,
            description: c.description || null,
            account_type: c.account_type || 'basic_client',
            facebook_url: c.facebook_url || null,
            instagram_url: c.instagram_url || null,
            linkedin_url: c.linkedin_url || null,
            twitter_url: c.twitter_url || null,
            tiktok_url: c.tiktok_url || null,
            google_ads_manager_url: c.google_ads_manager_url || null,
            facebook_ads_manager_url: c.facebook_ads_manager_url || null,
            shopify_email: c.shopify_email || null,
            avg_profit_margin: c.avg_profit_margin || 0,
            jiy_commission_percent: c.jiy_commission_percent || 0,
          }));
          syncResult = await supabase.from('clients').upsert(clientsToSync, { onConflict: 'id' }).select();
          break;
          
        case 'projects':
          const projectsToSync = data.data.map((p: Record<string, unknown>) => ({
            id: p.id,
            name: p.name,
            description: p.description || null,
            status: p.status || 'active',
            client_id: p.client_id,
            priority_category: p.priority_category || null,
            start_date: p.start_date || null,
            target_date: p.target_date || null,
            budget_hours: p.budget_hours || null,
            color: p.color || null,
          }));
          syncResult = await supabase.from('projects').upsert(projectsToSync, { onConflict: 'id' }).select();
          break;
          
        case 'contacts':
          const contactsToSync = data.data.map((c: Record<string, unknown>) => ({
            id: c.id,
            client_id: c.client_id,
            name: c.name,
            email: c.email || null,
            phone: c.phone || null,
            role: c.role || null,
            is_primary: c.is_primary || false,
            has_portal_access: c.has_portal_access || false,
            receive_task_updates: c.receive_task_updates || false,
          }));
          syncResult = await supabase.from('client_contacts').upsert(contactsToSync, { onConflict: 'id' }).select();
          break;
          
        case 'team':
          const teamToSync = data.data.map((t: Record<string, unknown>) => ({
            id: t.id,
            name: t.name,
            role: t.role || null,
            email: t.email || null,
            phone: t.phone || null,
            emails: t.emails || [],
            phones: t.phones || [],
            departments: t.departments || [],
            avatar_url: t.avatar_url || null,
            status: t.status || 'active',
            is_active: t.is_active !== false,
          }));
          syncResult = await supabase.from('team').upsert(teamToSync, { onConflict: 'id' }).select();
          break;
          
        default:
          syncResult = { data: [], error: 'Sync not supported for this type' };
      }
      
      if (syncResult.error) {
        console.error(`Error syncing ${type}:`, syncResult.error);
        const errorMsg = typeof syncResult.error === 'string' ? syncResult.error : syncResult.error.message;
        return new Response(
          JSON.stringify({ 
            success: false, 
            fetched: data.count,
            syncError: errorMsg 
          }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`Successfully synced ${syncResult.data?.length || 0} ${type}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          type,
          fetched: data.count,
          synced: syncResult.data?.length || 0,
          data: syncResult.data 
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify(data), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
