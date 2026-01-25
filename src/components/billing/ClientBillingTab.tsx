import { useBilling, Invoice, Quote } from "@/hooks/useBilling";
import { useState } from "react";
import { 
  FileText, 
  Plus, 
  Receipt,
  Clock,
  CheckCircle,
  AlertTriangle,
  Ban,
  Eye,
  Send,
  MoreVertical,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { InvoiceDialog } from "@/components/billing/InvoiceDialog";
import { QuoteDialog } from "@/components/billing/QuoteDialog";

interface ClientBillingTabProps {
  clientId: string;
}

const statusConfig: Record<string, { label: string; icon: React.ComponentType<any>; className: string }> = {
  draft: { label: "טיוטה", icon: FileText, className: "bg-muted text-muted-foreground" },
  sent: { label: "נשלח", icon: Send, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  viewed: { label: "נצפה", icon: Eye, className: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  paid: { label: "שולם", icon: CheckCircle, className: "bg-primary/10 text-primary" },
  overdue: { label: "באיחור", icon: AlertTriangle, className: "bg-destructive/10 text-destructive" },
  cancelled: { label: "בוטל", icon: Ban, className: "bg-muted text-muted-foreground line-through" },
  accepted: { label: "התקבל", icon: CheckCircle, className: "bg-primary/10 text-primary" },
  rejected: { label: "נדחה", icon: Ban, className: "bg-destructive/10 text-destructive" },
  expired: { label: "פג תוקף", icon: Clock, className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
};

const typeLabels: Record<string, string> = {
  invoice: "חשבונית מס",
  receipt: "קבלה",
  proforma: "חשבונית עסקה",
  credit_note: "זיכוי",
};

export function ClientBillingTab({ clientId }: ClientBillingTabProps) {
  const { invoices, quotes, stats, isLoading, updateInvoiceStatus, updateQuoteStatus } = useBilling(clientId);
  const [activeTab, setActiveTab] = useState("invoices");
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', { 
      style: 'currency', 
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">שולם</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(stats.totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">ממתין</p>
            <p className="text-xl font-bold">{formatCurrency(stats.totalPending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">באיחור</p>
            <p className="text-xl font-bold text-destructive">{formatCurrency(stats.totalOverdue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="invoices" className="gap-2">
              <Receipt className="w-4 h-4" />
              חשבוניות ({invoices.length})
            </TabsTrigger>
            <TabsTrigger value="quotes" className="gap-2">
              <FileText className="w-4 h-4" />
              הצעות מחיר ({quotes.length})
            </TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            {activeTab === "invoices" ? (
              <Button size="sm" onClick={() => { setEditingInvoice(null); setShowInvoiceDialog(true); }}>
                <Plus className="w-4 h-4 ml-1" />
                חשבונית
              </Button>
            ) : (
              <Button size="sm" onClick={() => { setEditingQuote(null); setShowQuoteDialog(true); }}>
                <Plus className="w-4 h-4 ml-1" />
                הצעת מחיר
              </Button>
            )}
          </div>
        </div>

        {/* Invoices */}
        <TabsContent value="invoices">
          {invoices.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Receipt className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">אין חשבוניות עדיין</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">מספר</TableHead>
                    <TableHead className="text-right">סוג</TableHead>
                    <TableHead className="text-right">תאריך</TableHead>
                    <TableHead className="text-right">סכום</TableHead>
                    <TableHead className="text-right">סטטוס</TableHead>
                    <TableHead className="text-right w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const status = statusConfig[invoice.status] || statusConfig.draft;
                    const StatusIcon = status.icon;
                    
                    return (
                      <TableRow 
                        key={invoice.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => { setEditingInvoice(invoice); setShowInvoiceDialog(true); }}
                      >
                        <TableCell className="font-mono text-sm">{invoice.invoice_number}</TableCell>
                        <TableCell className="text-sm">{typeLabels[invoice.type]}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(invoice.issue_date), "dd/MM/yy")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(invoice.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("gap-1 text-xs", status.className)}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {invoice.status === "draft" && (
                                <DropdownMenuItem onClick={() => updateInvoiceStatus({ id: invoice.id, status: "sent" })}>
                                  <Send className="w-4 h-4 ml-2" />
                                  שלח
                                </DropdownMenuItem>
                              )}
                              {["sent", "viewed"].includes(invoice.status) && (
                                <DropdownMenuItem onClick={() => updateInvoiceStatus({ id: invoice.id, status: "paid" })}>
                                  <CheckCircle className="w-4 h-4 ml-2" />
                                  שולם
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Quotes */}
        <TabsContent value="quotes">
          {quotes.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">אין הצעות מחיר עדיין</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">מספר</TableHead>
                    <TableHead className="text-right">כותרת</TableHead>
                    <TableHead className="text-right">תוקף</TableHead>
                    <TableHead className="text-right">סכום</TableHead>
                    <TableHead className="text-right">סטטוס</TableHead>
                    <TableHead className="text-right w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((quote) => {
                    const status = statusConfig[quote.status] || statusConfig.draft;
                    const StatusIcon = status.icon;
                    
                    return (
                      <TableRow 
                        key={quote.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => { setEditingQuote(quote); setShowQuoteDialog(true); }}
                      >
                        <TableCell className="font-mono text-sm">{quote.quote_number}</TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate">{quote.title}</TableCell>
                        <TableCell className="text-sm">
                          {quote.valid_until 
                            ? format(new Date(quote.valid_until), "dd/MM/yy")
                            : "—"
                          }
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(quote.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("gap-1 text-xs", status.className)}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {quote.status === "draft" && (
                                <DropdownMenuItem onClick={() => updateQuoteStatus({ id: quote.id, status: "sent" })}>
                                  <Send className="w-4 h-4 ml-2" />
                                  שלח
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <InvoiceDialog 
        open={showInvoiceDialog} 
        onOpenChange={setShowInvoiceDialog}
        invoice={editingInvoice}
      />
      <QuoteDialog 
        open={showQuoteDialog} 
        onOpenChange={setShowQuoteDialog}
        quote={editingQuote}
      />
    </div>
  );
}
