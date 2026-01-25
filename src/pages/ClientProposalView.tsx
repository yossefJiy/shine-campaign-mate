import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  FileText, 
  CheckCircle2, 
  MessageSquare,
  Loader2,
  Calendar,
  Building2,
  Shield,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { microcopy } from "@/lib/microcopy";
import logoIcon from "@/assets/logo-icon.svg";

export default function ClientProposalView() {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();
  const [confirmed, setConfirmed] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [comment, setComment] = useState("");

  // Fetch proposal by public token
  const { data: proposal, isLoading, error } = useQuery({
    queryKey: ["public-proposal", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*, clients(id, name)")
        .eq("client_view_token", token)
        .single();

      if (error) throw error;

      // Mark as viewed if sent
      if (data.status === "sent") {
        await supabase
          .from("quotes")
          .update({ status: "viewed" })
          .eq("id", data.id);
      }

      // Fetch items
      const { data: items } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", data.id)
        .order("sort_order");

      return { ...data, items: items || [] };
    },
    enabled: !!token,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!proposal) throw new Error("הצעה לא נמצאה");
      if (!confirmed) throw new Error("יש לאשר את התנאים");

      const { error } = await supabase
        .from("quotes")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
          client_confirmed_terms: true,
        })
        .eq("id", proposal.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-proposal", token] });
      toast.success("ההצעה אושרה בהצלחה!", {
        description: "תודה! ניצור איתך קשר בהקדם להתחלת העבודה.",
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async () => {
      if (!proposal || !comment.trim()) return;
      
      // Add comment to notes or create a notification
      const { error } = await supabase
        .from("quotes")
        .update({
          notes: proposal.notes 
            ? `${proposal.notes}\n\n📝 הערת לקוח:\n${comment}` 
            : `📝 הערת לקוח:\n${comment}`,
        })
        .eq("id", proposal.id);

      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      setCommentDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["public-proposal", token] });
      toast.success("ההערה נשלחה");
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', { 
      style: 'currency', 
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 space-y-4">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive/50" />
            <h1 className="text-xl font-semibold mb-2">הצעה לא נמצאה</h1>
            <p className="text-muted-foreground">
              הקישור אינו תקף או שההצעה אינה קיימת
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = proposal.valid_until && new Date(proposal.valid_until) < new Date();
  const isApproved = proposal.status === "accepted";
  const isRejected = proposal.status === "rejected";
  const canApprove = !isExpired && !isApproved && !isRejected;

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={logoIcon} alt="Logo" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">{proposal.title}</h1>
          <p className="text-muted-foreground">#{proposal.quote_number}</p>
        </div>

        {/* Status Banner */}
        {isApproved && (
          <Card className="border-success bg-success/10">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-success" />
              <div>
                <p className="font-medium text-success">ההצעה אושרה</p>
                <p className="text-sm text-muted-foreground">
                  אושרה ב-{formatDate(proposal.accepted_at)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isExpired && !isApproved && (
          <Card className="border-warning bg-warning/10">
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-warning" />
              <p className="font-medium text-warning">ההצעה פגה תוקף</p>
            </CardContent>
          </Card>
        )}

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              שירותים כלולים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proposal.items?.map((item: any, idx: number) => (
                <div 
                  key={item.id || idx}
                  className={cn(
                    "p-4 rounded-lg border",
                    item.is_optional && "bg-muted/50"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </p>
                      )}
                      {item.is_optional && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          אופציונלי
                        </Badge>
                      )}
                    </div>
                    <p className="font-bold">{formatCurrency(item.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">סכום ביניים</span>
              <span>{formatCurrency(proposal.subtotal)}</span>
            </div>
            
            {proposal.discount_percent > 0 && (
              <div className="flex justify-between text-success">
                <span>הנחה ({proposal.discount_percent}%)</span>
                <span>-{formatCurrency(proposal.discount_amount)}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">מע״מ ({proposal.tax_rate}%)</span>
              <span>{formatCurrency(proposal.tax_amount)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between text-xl font-bold">
              <span>סה״כ לתשלום</span>
              <span>{formatCurrency(proposal.total_amount)}</span>
            </div>

            {proposal.valid_until && !isExpired && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                ההצעה תקפה עד {formatDate(proposal.valid_until)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Terms */}
        {proposal.terms && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">תנאים והבהרות</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                {proposal.terms}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {canApprove && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="confirm" 
                  checked={confirmed}
                  onCheckedChange={(c) => setConfirmed(!!c)}
                />
                <label 
                  htmlFor="confirm" 
                  className="text-sm cursor-pointer leading-relaxed"
                >
                  {microcopy.clientPortal.confirmAndApprove}
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 gap-2"
                  size="lg"
                  onClick={() => approveMutation.mutate()}
                  disabled={!confirmed || approveMutation.isPending}
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {microcopy.buttons.approve}
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  onClick={() => setCommentDialogOpen(true)}
                >
                  <MessageSquare className="w-4 h-4" />
                  {microcopy.buttons.iHaveComment}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4">
          <div className="flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" />
            <span>מסמך מאובטח</span>
          </div>
        </div>

        {/* Comment Dialog */}
        <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>הוספת הערה</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="כתוב את ההערה שלך כאן..."
                rows={4}
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCommentDialogOpen(false)}
                  className="flex-1"
                >
                  ביטול
                </Button>
                <Button 
                  onClick={() => commentMutation.mutate()}
                  disabled={!comment.trim() || commentMutation.isPending}
                  className="flex-1"
                >
                  {commentMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  שלח הערה
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
