import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DomainErrorBoundary } from "@/components/shared/DomainErrorBoundary";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useProposals, proposalStatusConfig, Proposal } from "@/hooks/useProposals";
import { 
  FileText, 
  Plus, 
  Loader2, 
  Calendar,
  DollarSign,
  MoreVertical,
  Send,
  Copy,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Filter
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ProposalDialog } from "@/components/proposals/ProposalDialog";
import { ProposalDetailDialog } from "@/components/proposals/ProposalDetailDialog";
import { microcopy } from "@/lib/microcopy";

export default function Proposals() {
  const { selectedClient, isAgencyView } = useClient();
  const { 
    proposals, 
    isLoading, 
    stats,
    sendProposal,
    duplicateProposal,
    deleteProposal,
    isSending,
  } = useProposals(selectedClient?.id);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
      month: "short",
      year: "numeric",
    });
  };

  // Filter proposals
  const filteredProposals = proposals.filter(p => {
    if (statusFilter === "all") return true;
    return p.status === statusFilter;
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <DomainErrorBoundary domain="proposals">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <PageHeader 
              title="הצעות מחיר"
              description={selectedClient ? `הצעות ל${selectedClient.name}` : "כל ההצעות"}
            />
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 ml-2" />
              {microcopy.buttons.newProposal.replace("➕ ", "")}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">סה״כ</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <FileText className="w-8 h-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">טיוטות</p>
                    <p className="text-2xl font-bold">{stats.drafts}</p>
                  </div>
                  <Clock className="w-8 h-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-info/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-info">נשלחו</p>
                    <p className="text-2xl font-bold text-info">{stats.sent}</p>
                  </div>
                  <Send className="w-8 h-8 text-info/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-success/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-success">אושרו</p>
                    <p className="text-2xl font-bold text-success">{stats.accepted}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-success/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-success/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-success">שווי מאושר</p>
                    <p className="text-xl font-bold text-success">{formatCurrency(stats.acceptedValue)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-success/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">הכל</SelectItem>
                  <SelectItem value="draft">טיוטה</SelectItem>
                  <SelectItem value="sent">נשלחה</SelectItem>
                  <SelectItem value="viewed">נצפתה</SelectItem>
                  <SelectItem value="accepted">אושרה</SelectItem>
                  <SelectItem value="rejected">נדחתה</SelectItem>
                  <SelectItem value="expired">פגה תוקף</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Proposals List */}
          {filteredProposals.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">אין הצעות מחיר עדיין</h3>
                <p className="text-muted-foreground mb-4">
                  {microcopy.proposals.isCommitment}
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  צור הצעה ראשונה
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredProposals.map((proposal) => {
                const statusConfig = proposalStatusConfig[proposal.status];
                
                return (
                  <Card 
                    key={proposal.id}
                    className="hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => setSelectedProposalId(proposal.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        {/* Left side - Info */}
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            statusConfig.bgColor
                          )}>
                            <FileText className={cn("w-5 h-5", statusConfig.color)} />
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{proposal.title}</h3>
                              <Badge 
                                variant="outline" 
                                className={cn(statusConfig.bgColor, statusConfig.color, "border-0")}
                              >
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              {(proposal.clients?.name || proposal.leads?.name) && (
                                <span>{proposal.clients?.name || proposal.leads?.name}</span>
                              )}
                              <span className="text-xs">#{proposal.quote_number}</span>
                              {proposal.valid_until && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(proposal.valid_until)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right side - Amount & Actions */}
                        <div className="flex items-center gap-4">
                          <div className="text-left">
                            <p className="text-lg font-bold">
                              {formatCurrency(proposal.total_amount)}
                            </p>
                            {proposal.discount_percent > 0 && (
                              <p className="text-xs text-success">
                                -{proposal.discount_percent}% הנחה
                              </p>
                            )}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={() => setSelectedProposalId(proposal.id)}>
                                <Eye className="w-4 h-4 ml-2" />
                                צפה בפרטים
                              </DropdownMenuItem>
                              
                              {proposal.status === "draft" && (
                                <DropdownMenuItem 
                                  onClick={() => sendProposal(proposal.id)}
                                  disabled={isSending}
                                >
                                  <Send className="w-4 h-4 ml-2" />
                                  שלח ללקוח
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem onClick={() => duplicateProposal(proposal.id)}>
                                <Copy className="w-4 h-4 ml-2" />
                                שכפל הצעה
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {proposal.status === "draft" && (
                                <DropdownMenuItem 
                                  onClick={() => deleteProposal(proposal.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 ml-2" />
                                  מחק
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Dialog */}
        <ProposalDialog 
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />

        {/* Detail Dialog */}
        <ProposalDetailDialog
          proposalId={selectedProposalId}
          open={!!selectedProposalId}
          onOpenChange={(open) => !open && setSelectedProposalId(null)}
        />
      </DomainErrorBoundary>
    </MainLayout>
  );
}
