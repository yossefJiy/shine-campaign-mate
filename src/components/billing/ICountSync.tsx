import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { RefreshCw, CheckCircle, XCircle, Download, FileText, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface ICountDocument {
  docnum: string;
  doctype: string;
  client_name: string;
  dateissued: string;
  duedate: string;
  totalwithvat: number;
  status: number;
  pdf_link?: string;
}

export function ICountSync() {
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const queryClient = useQueryClient();

  // Check iCount connection status
  const { data: connectionStatus, isLoading: checkingConnection } = useQuery({
    queryKey: ["icount-status"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/icount-integration?action=status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        if (error.setup_required) {
          return { configured: false, error: error.message };
        }
        throw new Error(error.message);
      }
      
      return response.json();
    },
  });

  // Fetch documents from iCount
  const { data: documents, isLoading: loadingDocs, refetch: refetchDocs } = useQuery({
    queryKey: ["icount-documents", startDate, endDate],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/icount-integration?action=list`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            start_date: startDate,
            end_date: endDate,
            doctype: "invoice,receipt,invrec",
            detail_level: 5,
            limit: 100,
          }),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch documents");
      }
      
      const result = await response.json();
      return result.data?.results_list || [];
    },
    enabled: connectionStatus?.configured === true,
  });

  // Sync documents to local database
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/icount-integration?action=sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            start_date: startDate,
            end_date: endDate,
          }),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`סונכרנו ${data.synced || 0} מסמכים`);
      queryClient.invalidateQueries({ queryKey: ["billing-records"] });
      queryClient.invalidateQueries({ queryKey: ["billing-stats"] });
    },
    onError: (error) => {
      toast.error("שגיאה בסנכרון: " + error.message);
    },
  });

  const getDocTypeLabel = (doctype: string) => {
    const labels: Record<string, string> = {
      invoice: "חשבונית",
      receipt: "קבלה",
      invrec: "חשבונית-קבלה",
      quote: "הצעת מחיר",
      proforma: "חשבון עסקה",
      credit: "זיכוי",
    };
    return labels[doctype] || doctype;
  };

  const getStatusBadge = (status: number) => {
    if (status === 1) {
      return <Badge className="bg-green-100 text-green-800">שולם</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-800">פתוח</Badge>;
  };

  if (!connectionStatus?.configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            חיבור iCount נדרש
          </CardTitle>
          <CardDescription>
            כדי לסנכרן מסמכים מ-iCount, יש להגדיר את פרטי הגישה
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            נא להגדיר את הסודות הבאים בהגדרות המערכת:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li><code>ICOUNT_CID</code> - מזהה החברה</li>
            <li><code>ICOUNT_USER</code> - שם משתמש</li>
            <li><code>ICOUNT_PASS</code> - סיסמה</li>
          </ul>
          <Button variant="outline" asChild>
            <a href="https://app.icount.co.il" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 ml-2" />
              כניסה ל-iCount
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {connectionStatus?.configured ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                חיבור iCount
              </CardTitle>
              <CardDescription>
                {connectionStatus?.configured 
                  ? `מחובר לחשבון: ${connectionStatus.cid}`
                  : "לא מחובר"
                }
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={() => refetchDocs()}
              disabled={loadingDocs}
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${loadingDocs ? "animate-spin" : ""}`} />
              רענן
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Date Filter & Sync */}
      <Card>
        <CardHeader>
          <CardTitle>סנכרון מסמכים</CardTitle>
          <CardDescription>בחר טווח תאריכים לסנכרון מ-iCount</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>מתאריך</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>עד תאריך</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button 
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              <Download className={`h-4 w-4 ml-2 ${syncMutation.isPending ? "animate-bounce" : ""}`} />
              סנכרן למערכת
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>מסמכים ב-iCount</CardTitle>
          <CardDescription>
            {documents?.length || 0} מסמכים נמצאו בטווח הנבחר
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loadingDocs ? (
            <div className="p-8 text-center text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              טוען מסמכים...
            </div>
          ) : documents?.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">אין מסמכים</h3>
              <p className="text-muted-foreground">לא נמצאו מסמכים בטווח התאריכים הנבחר</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מספר</TableHead>
                  <TableHead>סוג</TableHead>
                  <TableHead>לקוח</TableHead>
                  <TableHead>תאריך</TableHead>
                  <TableHead>סכום</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents?.map((doc: ICountDocument) => (
                  <TableRow key={`${doc.doctype}-${doc.docnum}`}>
                    <TableCell className="font-mono">{doc.docnum}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getDocTypeLabel(doc.doctype)}</Badge>
                    </TableCell>
                    <TableCell>{doc.client_name}</TableCell>
                    <TableCell>
                      {new Date(doc.dateissued).toLocaleDateString("he-IL")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(doc.totalwithvat)}
                    </TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell>
                      {doc.pdf_link && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={doc.pdf_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
