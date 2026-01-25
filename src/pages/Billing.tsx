import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DomainErrorBoundary } from "@/components/shared/DomainErrorBoundary";
import { PageHeader } from "@/components/layout/PageHeader";
import { useBilling, Invoice, Quote } from "@/hooks/useBilling";
import { useClient } from "@/hooks/useClient";
import { 
  FileText, 
  Plus, 
  Loader2, 
  Receipt,
  Clock,
  CheckCircle,
  AlertTriangle,
  Ban,
  Eye,
  Send,
  MoreVertical,
  FileCheck,
  FilePlus,
  Printer,
  Download,
  Filter,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { he } from "date-fns/locale";
import { InvoiceDialog } from "@/components/billing/InvoiceDialog";
import { QuoteDialog } from "@/components/billing/QuoteDialog";

const statusConfig: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
  draft: { label: "טיוטה", icon: FileText, color: "bg-muted text-muted-foreground" },
  sent: { label: "נשלח", icon: Send, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  viewed: { label: "נצפה", icon: Eye, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  paid: { label: "שולם", icon: CheckCircle, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  overdue: { label: "באיחור", icon: AlertTriangle, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  cancelled: { label: "בוטל", icon: Ban, color: "bg-muted text-muted-foreground line-through" },
  accepted: { label: "התקבל", icon: CheckCircle, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  rejected: { label: "נדחה", icon: Ban, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  expired: { label: "פג תוקף", icon: Clock, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
};

const typeLabels: Record<string, string> = {
  invoice: "חשבונית מס",
  receipt: "קבלה",
  proforma: "חשבונית עסקה",
  credit_note: "זיכוי",
};

export default function Billing() {
  const { selectedClient, isAgencyView } = useClient();
  const clientId = isAgencyView ? undefined : selectedClient?.id;
  const { invoices, quotes, stats, isLoading, updateInvoiceStatus, updateQuoteStatus } = useBilling(clientId);
  
  const [activeTab, setActiveTab] = useState("invoices");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  const filteredInvoices = invoices.filter(inv => 
    inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredQuotes = quotes.filter(q => 
    q.quote_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.leads?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <DomainErrorBoundary domain="billing">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <PageHeader 
              title="חיובים"
              description={isAgencyView ? "ניהול חשבוניות והצעות מחיר" : `חיובים עבור ${selectedClient?.name || ''}`}
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => { setEditingQuote(null); setShowQuoteDialog(true); }}>
                <FilePlus className="w-4 h-4 ml-2" />
                הצעת מחיר
              </Button>
              <Button onClick={() => { setEditingInvoice(null); setShowInvoiceDialog(true); }}>
                <Plus className="w-4 h-4 ml-2" />
                חשבונית חדשה
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">שולם</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">ממתין לתשלום</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalPending)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">באיחור</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalOverdue)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">הצעות מחיר</p>
                    <p className="text-2xl font-bold">{stats.quotesAccepted} / {stats.quotesPending + stats.quotesAccepted}</p>
                    <p className="text-xs text-muted-foreground">התקבלו / סה"כ</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
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
              
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9 w-64"
                />
              </div>
            </div>

            {/* Invoices Tab */}
            <TabsContent value="invoices">
              <Card>
                {filteredInvoices.length === 0 ? (
                  <CardContent className="py-12 text-center">
                    <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium mb-2">אין חשבוניות עדיין</h3>
                    <p className="text-muted-foreground mb-4">צור חשבונית חדשה כדי להתחיל</p>
                    <Button onClick={() => { setEditingInvoice(null); setShowInvoiceDialog(true); }}>
                      <Plus className="w-4 h-4 ml-2" />
                      חשבונית ראשונה
                    </Button>
                  </CardContent>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">מספר</TableHead>
                        <TableHead className="text-right">לקוח</TableHead>
                        <TableHead className="text-right">סוג</TableHead>
                        <TableHead className="text-right">תאריך</TableHead>
                        <TableHead className="text-right">סכום</TableHead>
                        <TableHead className="text-right">סטטוס</TableHead>
                        <TableHead className="text-right w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => {
                        const status = statusConfig[invoice.status] || statusConfig.draft;
                        const StatusIcon = status.icon;
                        
                        return (
                          <TableRow 
                            key={invoice.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => { setEditingInvoice(invoice); setShowInvoiceDialog(true); }}
                          >
                            <TableCell className="font-mono font-medium">{invoice.invoice_number}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {invoice.clients?.logo_url && (
                                  <img 
                                    src={invoice.clients.logo_url} 
                                    alt="" 
                                    className="w-6 h-6 rounded object-contain bg-white border"
                                  />
                                )}
                                {invoice.clients?.name || "—"}
                              </div>
                            </TableCell>
                            <TableCell>{typeLabels[invoice.type] || invoice.type}</TableCell>
                            <TableCell>
                              {format(new Date(invoice.issue_date), "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(invoice.total_amount)}
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("gap-1", status.color)}>
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setEditingInvoice(invoice); setShowInvoiceDialog(true); }}>
                                    <Eye className="w-4 h-4 ml-2" />
                                    צפייה
                                  </DropdownMenuItem>
                                  {invoice.status === "draft" && (
                                    <DropdownMenuItem onClick={() => updateInvoiceStatus({ id: invoice.id, status: "sent" })}>
                                      <Send className="w-4 h-4 ml-2" />
                                      שלח ללקוח
                                    </DropdownMenuItem>
                                  )}
                                  {["sent", "viewed", "overdue"].includes(invoice.status) && (
                                    <DropdownMenuItem onClick={() => updateInvoiceStatus({ id: invoice.id, status: "paid" })}>
                                      <CheckCircle className="w-4 h-4 ml-2" />
                                      סמן כשולם
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Printer className="w-4 h-4 ml-2" />
                                    הדפסה
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Download className="w-4 h-4 ml-2" />
                                    הורדה כ-PDF
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>

            {/* Quotes Tab */}
            <TabsContent value="quotes">
              <Card>
                {filteredQuotes.length === 0 ? (
                  <CardContent className="py-12 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium mb-2">אין הצעות מחיר עדיין</h3>
                    <p className="text-muted-foreground mb-4">צור הצעת מחיר חדשה כדי להתחיל</p>
                    <Button onClick={() => { setEditingQuote(null); setShowQuoteDialog(true); }}>
                      <Plus className="w-4 h-4 ml-2" />
                      הצעת מחיר ראשונה
                    </Button>
                  </CardContent>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">מספר</TableHead>
                        <TableHead className="text-right">כותרת</TableHead>
                        <TableHead className="text-right">לקוח / ליד</TableHead>
                        <TableHead className="text-right">תוקף עד</TableHead>
                        <TableHead className="text-right">סכום</TableHead>
                        <TableHead className="text-right">סטטוס</TableHead>
                        <TableHead className="text-right w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuotes.map((quote) => {
                        const status = statusConfig[quote.status] || statusConfig.draft;
                        const StatusIcon = status.icon;
                        
                        return (
                          <TableRow 
                            key={quote.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => { setEditingQuote(quote); setShowQuoteDialog(true); }}
                          >
                            <TableCell className="font-mono font-medium">{quote.quote_number}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{quote.title}</TableCell>
                            <TableCell>
                              {quote.clients?.name || quote.leads?.name || "—"}
                            </TableCell>
                            <TableCell>
                              {quote.valid_until 
                                ? format(new Date(quote.valid_until), "dd/MM/yyyy")
                                : "—"
                              }
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(quote.total_amount)}
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("gap-1", status.color)}>
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setEditingQuote(quote); setShowQuoteDialog(true); }}>
                                    <Eye className="w-4 h-4 ml-2" />
                                    צפייה
                                  </DropdownMenuItem>
                                  {quote.status === "draft" && (
                                    <DropdownMenuItem onClick={() => updateQuoteStatus({ id: quote.id, status: "sent" })}>
                                      <Send className="w-4 h-4 ml-2" />
                                      שלח ללקוח
                                    </DropdownMenuItem>
                                  )}
                                  {quote.status === "accepted" && (
                                    <DropdownMenuItem>
                                      <Receipt className="w-4 h-4 ml-2" />
                                      המר לחשבונית
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Download className="w-4 h-4 ml-2" />
                                    הורדה כ-PDF
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

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
      </DomainErrorBoundary>
    </MainLayout>
  );
}
