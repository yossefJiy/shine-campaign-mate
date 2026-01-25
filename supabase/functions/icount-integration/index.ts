import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ICOUNT_API_URL = "https://api.icount.co.il/api/v3.php";

interface ICountConfig {
  cid: string;
  user: string;
  accessToken: string;
  refreshToken: string;
}

interface InvoiceCreateRequest {
  client_name: string;
  client_email?: string;
  client_address?: string;
  doctype: "invoice" | "receipt" | "invrec" | "quote" | "proforma" | "credit";
  items: Array<{
    description: string;
    quantity: number;
    unitprice: number;
    discount_percent?: number;
  }>;
  currency?: string;
  lang?: string;
  send_email?: boolean;
  due_date?: string;
  remarks?: string;
}

interface DocGetRequest {
  doctype: string;
  docnum: string;
}

async function getICountConfig(): Promise<ICountConfig> {
  const cid = Deno.env.get("ICOUNT_CID");
  const user = Deno.env.get("ICOUNT_USER");
  const accessToken = Deno.env.get("ICOUNT_ACCESS_TOKEN");
  const refreshToken = Deno.env.get("ICOUNT_REFRESH_TOKEN");

  if (!cid || !user || !accessToken) {
    throw new Error("Missing iCount credentials. Please configure ICOUNT_CID, ICOUNT_USER, ICOUNT_ACCESS_TOKEN, and ICOUNT_REFRESH_TOKEN secrets.");
  }

  return { cid, user, accessToken, refreshToken: refreshToken || "" };
}

async function createDocument(config: ICountConfig, data: InvoiceCreateRequest) {
  const payload = {
    cid: config.cid,
    user: config.user,
    sid: config.accessToken,
    doctype: data.doctype,
    client_name: data.client_name,
    client_email: data.client_email || "",
    client_address: data.client_address || "",
    items: data.items.map((item, index) => ({
      details: item.description,
      amount: item.quantity,
      unitprice: item.unitprice,
      discount: item.discount_percent || 0,
    })),
    currency_id: data.currency || "ILS",
    lang: data.lang || "he",
    send_email: data.send_email ? 1 : 0,
    duedate: data.due_date || "",
    remarks: data.remarks || "",
    vatType: 1, // 18% VAT included
  };

  const response = await fetch(`${ICOUNT_API_URL}/doc/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  
  if (result.status !== true) {
    throw new Error(result.error_description || "Failed to create document in iCount");
  }

  return {
    doc_id: result.doc_id,
    doc_number: result.doc_number,
    doc_url: result.doc_url,
    pdf_url: result.pdf_url,
  };
}

async function getDocument(config: ICountConfig, doctype: string, docnum: string) {
  const payload = {
    cid: config.cid,
    user: config.user,
    sid: config.accessToken,
    doctype,
    docnum,
  };

  const response = await fetch(`${ICOUNT_API_URL}/doc/get`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  
  if (result.status !== true) {
    throw new Error(result.error_description || "Failed to get document from iCount");
  }

  return result;
}

async function getDocumentPDF(config: ICountConfig, doctype: string, docnum: string) {
  const payload = {
    cid: config.cid,
    user: config.user,
    sid: config.accessToken,
    doctype,
    docnum,
    pdf: 1,
  };

  const response = await fetch(`${ICOUNT_API_URL}/doc/get`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  
  if (result.status !== true) {
    throw new Error(result.error_description || "Failed to get PDF from iCount");
  }

  return {
    pdf_url: result.pdf_url,
    pdf_link: result.pdf_link,
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get iCount config
    let config: ICountConfig;
    try {
      config = await getICountConfig();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return new Response(
        JSON.stringify({ 
          error: "iCount not configured", 
          message: errorMessage,
          setup_required: true 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = req.method === "POST" ? await req.json() : {};

    switch (action) {
      case "create": {
        // Create document in iCount
        const result = await createDocument(config, body as InvoiceCreateRequest);
        
        // Update the local invoice/quote with iCount ID if provided
        if (body.local_id && body.table) {
          const { error: updateError } = await supabase
            .from(body.table)
            .update({
              icount_doc_id: result.doc_id,
              icount_synced_at: new Date().toISOString(),
            })
            .eq("id", body.local_id);
          
          if (updateError) {
            console.error("Failed to update local record:", updateError);
          }
        }

        return new Response(
          JSON.stringify({ success: true, data: result }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get": {
        const { doctype, docnum } = body as DocGetRequest;
        const result = await getDocument(config, doctype, docnum);
        
        return new Response(
          JSON.stringify({ success: true, data: result }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "pdf": {
        const { doctype, docnum } = body as DocGetRequest;
        const result = await getDocumentPDF(config, doctype, docnum);
        
        return new Response(
          JSON.stringify({ success: true, data: result }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "status": {
        // Check if iCount is configured
        return new Response(
          JSON.stringify({ 
            success: true, 
            configured: true,
            cid: config.cid 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action. Use: create, get, pdf, or status" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("iCount integration error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
