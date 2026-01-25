import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProposals, proposalStatusConfig, Proposal, ProposalItem } from "@/hooks/useProposals";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Send,
  Copy,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  DollarSign,
  Building2,
  Layers,
  MessageSquare,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { microcopy } from "@/lib/microcopy";

interface ProposalDetailDialogProps {
  proposalId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProposalDetailDialog({ proposalId, open, onOpenChange }: ProposalDetailDialogProps) {
  const { 
    fetchProposalWithItems, 
    sendProposal, 
    approveProposal, 
    rejectProposal,
    duplicateProposal,
    isSending,
    isApproving 
  } = useProposals();

  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Fetch proposal with items
  const { data: proposal, isLoading } = useQuery({
    queryKey: ["proposal-detail", proposalId],
    queryFn: () => proposalId ? fetchProposalWithItems(proposalId) : null,
    enabled: !!proposalId && open,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', { 
      style: 'currency', 
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getTaskTagLabel = (tag?: string) => {
    switch (tag) {
      case "income_generating": return { label: "💸 Core", color: "bg-success/10 text-success" };
      case "operational": return { label: "⚙️ תפעול", color: "bg-muted text-muted-foreground" };
      case "client_dependent": return { label: "👤 לקוח", color: "bg-info/10 text-info" };
      default: return { label: "💸 Core", color: "bg-success/10 text-success" };
    }
  };

  const handleApprove = () => {
    if (proposalId) {
      approveProposal({ proposalId, confirmedTerms: true });
    }
  };

  const handleReject = () => {
    if (proposalId) {
      rejectProposal({ proposalId, reason: rejectionReason });
      setShowRejectForm(false);
      setRejectionReason("");
    }
  };

  if (!open) return null;

  const statusConfig = proposal ? proposalStatusConfig[proposal.status] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !proposal ? (
          <div className="p-6 text-center text-muted-foreground">
            הצעה לא נמצאה
          </div>
        ) : (
          <>
            {/* Header */}
            <DialogHeader className="p-6 pb-0">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-xl">{proposal.title}</DialogTitle>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span>#{proposal.quote_number}</span>
                    {proposal.clients?.name && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {proposal.clients.name}
                      </span>
                    )}
                    {proposal.valid_until && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        תוקף עד {formatDate(proposal.valid_until)}
                      </span>
                    )}
                  </div>
                </div>
                {statusConfig && (
                  <Badge className={cn(statusConfig.bgColor, statusConfig.color, "border-0")}>
                    {statusConfig.label}
                  </Badge>
                )}
              </div>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-200px)]">
              <Tabs defaultValue="items" className="p-6">
                <TabsList className="mb-4">
                  <TabsTrigger value="items" className="gap-2">
                    <Layers className="w-4 h-4" />
                    סעיפים
                  </TabsTrigger>
                  <TabsTrigger value="summary" className="gap-2">
                    <DollarSign className="w-4 h-4" />
                    סיכום
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    הערות
                  </TabsTrigger>
                </TabsList>

                {/* Items Tab */}
                <TabsContent value="items" className="space-y-3">
                  {(proposal.items || []).length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      אין סעיפים בהצעה זו
                    </p>
                  ) : (
                    proposal.items?.map((item, index) => {
                      const tagInfo = getTaskTagLabel(item.task_tag);
                      
                      return (
                        <Card key={item.id || index} className={cn(
                          item.is_optional && !item.is_selected && "opacity-50"
                        )}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{item.name}</h4>
                                  {item.is_optional && (
                                    <Badge variant="outline" className="text-xs">
                                      אופציונלי
                                    </Badge>
                                  )}
                                  {item.creates_stage && (
                                    <Badge variant="outline" className="text-xs bg-primary/5">
                                      פותח שלב
                                    </Badge>
                                  )}
                                  <Badge className={cn("text-xs border-0", tagInfo.color)}>
                                    {tagInfo.label}
                                  </Badge>
                                </div>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-left">
                                <p className="font-bold">{formatCurrency(item.total)}</p>
                                {item.quantity > 1 && (
                                  <p className="text-xs text-muted-foreground">
                                    {item.quantity} × {formatCurrency(item.unit_price)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </TabsContent>

                {/* Summary Tab */}
                <TabsContent value="summary">
                  <Card>
                    <CardContent className="p-6 space-y-4">
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
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes" className="space-y-4">
                  {proposal.notes && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">הערות</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{proposal.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {proposal.terms && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">תנאים</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{proposal.terms}</p>
                      </CardContent>
                    </Card>
                  )}

                  {proposal.rejection_reason && (
                    <Card className="border-destructive/50 bg-destructive/5">
                      <CardHeader>
                        <CardTitle className="text-sm text-destructive">סיבת דחייה</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{proposal.rejection_reason}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Edit restriction notice */}
                  {(proposal.status !== "draft") && (
                    <Card className="border-info/50 bg-info/5">
                      <CardContent className="p-4">
                        <p className="text-sm text-info">
                          {microcopy.proposals.cannotEditAfterSent}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="p-6 pt-4 border-t bg-muted/30 flex items-center justify-between">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => duplicateProposal(proposal.id)}
                >
                  <Copy className="w-4 h-4 ml-2" />
                  שכפל
                </Button>
                
                {proposal.client_view_token && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Copy client link
                      const url = `${window.location.origin}/p/${proposal.client_view_token}`;
                      navigator.clipboard.writeText(url);
                    }}
                  >
                    <ExternalLink className="w-4 h-4 ml-2" />
                    העתק קישור לקוח
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                {/* Show reject form */}
                {showRejectForm ? (
                  <div className="flex items-center gap-2">
                    <Textarea
                      placeholder="סיבת הדחייה..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-48 h-10"
                    />
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleReject}
                    >
                      אשר דחייה
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowRejectForm(false)}
                    >
                      ביטול
                    </Button>
                  </div>
                ) : (
                  <>
                    {proposal.status === "draft" && (
                      <Button 
                        onClick={() => sendProposal(proposal.id)}
                        disabled={isSending}
                      >
                        {isSending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                        <Send className="w-4 h-4 ml-2" />
                        שלח ללקוח
                      </Button>
                    )}

                    {(proposal.status === "sent" || proposal.status === "viewed") && (
                      <>
                        <Button 
                          variant="outline"
                          onClick={() => setShowRejectForm(true)}
                        >
                          <XCircle className="w-4 h-4 ml-2" />
                          דחה
                        </Button>
                        <Button 
                          onClick={handleApprove}
                          disabled={isApproving}
                          className="bg-success hover:bg-success/90"
                        >
                          {isApproving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                          <CheckCircle2 className="w-4 h-4 ml-2" />
                          אשר הצעה
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
