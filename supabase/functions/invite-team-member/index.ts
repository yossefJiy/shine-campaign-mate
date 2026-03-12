import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  name: string;
  role?: string;
  teamMemberId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await callerClient.auth.getUser(token);
    
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin privilege
    const { data: privData } = await callerClient
      .from("user_privileges")
      .select("is_admin, is_super_admin")
      .eq("user_id", caller.id)
      .single();

    const isAdmin = privData?.is_admin || privData?.is_super_admin;
    
    // Also check user_roles as fallback
    if (!isAdmin) {
      const { data: roleData } = await callerClient
        .from("user_roles")
        .select("role")
        .eq("user_id", caller.id)
        .in("role", ["admin", "super_admin"]);
      
      if (!roleData || roleData.length === 0) {
        // Check if caller is a manager (can invite their reports)
        const { data: callerTeam } = await callerClient
          .from("team")
          .select("operational_role")
          .eq("user_id", caller.id)
          .single();
        
        if (!callerTeam || !["department_manager", "team_manager"].includes(callerTeam.operational_role || "")) {
          return new Response(JSON.stringify({ error: "Only admins and managers can invite users" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const { email, name, role, teamMemberId }: InviteRequest = await req.json();

    if (!email || !name) {
      return new Response(JSON.stringify({ error: "Email and name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[invite-team-member] Inviting ${email} (${name})`);

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      // User exists — send password reset instead
      userId = existingUser.id;
      console.log(`[invite-team-member] User already exists (${userId}), sending password reset`);
      
      const { error: resetError } = await adminClient.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo: `${SUPABASE_URL.replace('.supabase.co', '.lovable.app')}/set-password`,
        },
      });

      if (resetError) {
        console.error("[invite-team-member] Reset link error:", resetError);
      }
    } else {
      // Create new user with temporary password, then send reset
      const tempPassword = crypto.randomUUID() + "Aa1!";
      
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm so they can use recovery link
        user_metadata: { full_name: name },
      });

      if (createError) {
        console.error("[invite-team-member] Create user error:", createError);
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = newUser.user.id;
      console.log(`[invite-team-member] Created user ${userId}`);
    }

    // Link team member to auth user
    if (teamMemberId) {
      await adminClient
        .from("team")
        .update({ user_id: userId, updated_at: new Date().toISOString() })
        .eq("id", teamMemberId);
    }

    // Generate recovery link for password setup
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    if (linkError) {
      console.error("[invite-team-member] Link generation error:", linkError);
      return new Response(JSON.stringify({ error: "Failed to generate invite link" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the redirect URL with the token
    const actionLink = linkData?.properties?.action_link;
    // Extract token from the action link and build our custom URL  
    const hashed = linkData?.properties?.hashed_token;
    
    // Get the app URL from environment or derive it
    const siteUrl = Deno.env.get("SITE_URL") || "https://shine-campaign-mate.lovable.app";
    const setPasswordUrl = `${siteUrl}/set-password`;

    // Send branded invite email via Resend
    if (RESEND_API_KEY) {
      const roleLabel = role ? {
        department_manager: "מנהל מחלקה",
        team_manager: "מנהל צוות",
        team_employee: "חבר צוות",
        employee: "חבר צוות",
      }[role] || role : "חבר צוות";

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Converto <tasks@converto.co.il>",
          to: [email],
          subject: "הוזמנת להצטרף למערכת Converto",
          html: `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; padding: 20px; margin: 0;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 24px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 22px;">ברוכים הבאים ל-Converto 🎉</h1>
    </div>
    <div style="padding: 24px; text-align: center;">
      <p style="font-size: 18px; color: #111827; font-weight: 600; margin: 0 0 8px;">שלום ${name}!</p>
      <p style="font-size: 15px; color: #374151; margin: 0 0 16px;">
        הוזמנת להצטרף למערכת הניהול בתפקיד <strong>${roleLabel}</strong>
      </p>
      <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px;">
        לחץ על הכפתור למטה כדי לקבוע את הסיסמה שלך ולהתחבר למערכת
      </p>
      <a href="${actionLink}" 
         style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
        קבע סיסמה והתחבר →
      </a>
      <p style="font-size: 12px; color: #9ca3af; margin: 16px 0 0;">
        הלינק תקף ל-24 שעות
      </p>
    </div>
    <div style="padding: 16px; background: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">Converto by JIY</p>
    </div>
  </div>
</body>
</html>`,
        }),
      });

      const emailResult = await emailRes.json();
      console.log("[invite-team-member] Email result:", emailResult);
    }

    // Update team member invited_at
    if (teamMemberId) {
      // Update authorized_emails with invited_at
      await adminClient
        .from("authorized_emails")
        .update({ invited_at: new Date().toISOString() })
        .eq("email", email);
    }

    return new Response(
      JSON.stringify({ success: true, userId, message: `הזמנה נשלחה ל-${email}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[invite-team-member] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
