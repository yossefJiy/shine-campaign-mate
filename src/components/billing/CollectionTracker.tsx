import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBillingRecords, BillingRecord } from "@/hooks/useBillingRecords";
import { formatCurrency } from "@/lib/formatters";
import { Search, CheckCircle, AlertTriangle, Clock, Send, Plus, MoreHorizontal, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BillingRecordDialog } from "./BillingRecordDialog";

const statusLabels: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "ממתין", color: "bg-amber-100 text-amber-800", icon: Clock },
  invoiced: { label: "חויב", color: "bg-blue-100 text-blue-800", icon: FileText },
  partial: { label: "חלקי", color: "bg-purple-100 text-purple-800", icon: AlertTriangle },
  paid: { label: "שולם", color: "bg-green-100 text-green-800", icon: CheckCircle },
  overdue: { label: "באיחור", color: "bg-red-100 text-red-800", icon: AlertTriangle },
};

interface CollectionTrackerProps {
  clientId?: string;
}

export function CollectionTracker({ clientId }: CollectionTrackerProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BillingRecord | null>(null);

  const { records, isLoading, markAsPaid } = useBillingRecords({
    clientId,
    year: yearFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const filteredRecords = records?.filter((r) => {
    const matchesSearch =
      r.clients?.name.toLowerCase().includes(search.toLowerCase()) ||
      r.client_agreements?.service_name?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleEdit = (record: BillingRecord) => {
    setEditingRecord(record);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לקוח..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              <SelectItem value="pending">ממתין</SelectItem>
              <SelectItem value="invoiced">חויב</SelectItem>
              <SelectItem value="partial">חלקי</SelectItem>
              <SelectItem value="paid">שולם</SelectItem>
              <SelectItem value="overdue">באיחור</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(yearFilter)} onValueChange={(v) => setYearFilter(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setEditingRecord(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 ml-2" />
          רשומה חדשה
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">טוען...</div>
          ) : filteredRecords?.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">אין רשומות חיוב</h3>
              <p className="text-muted-foreground mb-4">צור רשומת חיוב חדשה למעקב</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                רשומה חדשה
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>לקוח</TableHead>
                  <TableHead>תקופה</TableHead>
                  <TableHead>סכום</TableHead>
                  <TableHead>שולם</TableHead>
                  <TableHead>נותר</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>iCount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords?.map((record) => {
                  const status = statusLabels[record.status] || statusLabels.pending;
                  const StatusIcon = status.icon;
                  const remaining = (record.total_amount || 0) - (record.amount_paid || 0);

                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{record.clients?.name}</p>
                          {record.client_agreements?.service_name && (
                            <p className="text-sm text-muted-foreground">
                              {record.client_agreements.service_name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {new Date(record.period_start).toLocaleDateString("he-IL")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.period_end).toLocaleDateString("he-IL")}
                        </p>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(record.total_amount)}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(record.amount_paid)}
                      </TableCell>
                      <TableCell className={remaining > 0 ? "text-amber-600 font-medium" : ""}>
                        {formatCurrency(remaining)}
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>
                          <StatusIcon className="h-3 w-3 ml-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.icount_doc_id ? (
                          <Badge variant="outline" className="text-xs">
                            #{record.icount_doc_id}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(record)}>
                              עריכה
                            </DropdownMenuItem>
                            {record.status !== "paid" && (
                              <DropdownMenuItem onClick={() => markAsPaid.mutate(record.id)}>
                                <CheckCircle className="h-4 w-4 ml-2" />
                                סמן כשולם
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Send className="h-4 w-4 ml-2" />
                              שלח תזכורת
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
        </CardContent>
      </Card>

      {/* Dialog */}
      <BillingRecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        record={editingRecord}
      />
    </div>
  );
}
