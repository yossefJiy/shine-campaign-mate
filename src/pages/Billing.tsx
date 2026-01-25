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
  Search,
  LayoutDashboard,
  Handshake,
  Wallet,
  Cloud,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { InvoiceDialog } from "@/components/billing/InvoiceDialog";
import { QuoteDialog } from "@/components/billing/QuoteDialog";
import { BillingOverview } from "@/components/billing/BillingOverview";
import { AgreementsManager } from "@/components/billing/AgreementsManager";
import { CollectionTracker } from "@/components/billing/CollectionTracker";
import { ICountSync } from "@/components/billing/ICountSync";

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
  const { invoices, quotes, isLoading, updateInvoiceStatus, updateQuoteStatus } = useBilling(clientId);
  
  const [activeTab, setActiveTab] = useState("overview");
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
              description={isAgencyView ? "ניהול הסכמים, חשבוניות וגבייה" : `חיובים עבור ${selectedClient?.name || ''}`}
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

          {/* Enhanced Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview" className="gap-2">
                <LayoutDashboard className="w-4 h-4" />
                סקירה
              </TabsTrigger>
              <TabsTrigger value="agreements" className="gap-2">
                <Handshake className="w-4 h-4" />
                הסכמים
              </TabsTrigger>
              <TabsTrigger value="invoices" className="gap-2">
                <Receipt className="w-4 h-4" />
                חשבוניות ({invoices.length})
              </TabsTrigger>
              <TabsTrigger value="collection" className="gap-2">
                <Wallet className="w-4 h-4" />
                גבייה
              </TabsTrigger>
              <TabsTrigger value="icount" className="gap-2">
                <Cloud className="w-4 h-4" />
                iCount
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <BillingOverview year={2026} />
            </TabsContent>

            {/* Agreements Tab */}
            <TabsContent value="agreements">
              <AgreementsManager />
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices">
              <div className="space-y-4">
                <div className="flex justify-end">
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
              </div>
            </TabsContent>

            {/* Collection Tab */}
            <TabsContent value="collection">
              <CollectionTracker clientId={clientId} />
            </TabsContent>

            {/* iCount Tab */}
            <TabsContent value="icount">
              <ICountSync />
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
      </DomainErrorBoundary>
    </MainLayout>
  );
}
