import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useBillingDashboard, MonthlyBillingView } from "@/hooks/useBillingDashboard";
import { formatCurrency } from "@/lib/formatters";
import { 
  CheckCircle, XCircle, Clock, AlertTriangle, 
  FileText, ExternalLink, TrendingUp, Target,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

const MONTHS = [
  { value: 1, label: "ינואר" },
  { value: 2, label: "פברואר" },
  { value: 3, label: "מרץ" },
  { value: 4, label: "אפריל" },
  { value: 5, label: "מאי" },
  { value: 6, label: "יוני" },
  { value: 7, label: "יולי" },
  { value: 8, label: "אוגוסט" },
  { value: 9, label: "ספטמבר" },
  { value: 10, label: "אוקטובר" },
  { value: 11, label: "נובמבר" },
  { value: 12, label: "דצמבר" },
];

function getStatusIcon(status: string, isSent: boolean) {
  if (!isSent) return <XCircle className="h-4 w-4 text-muted-foreground" />;
  switch (status) {
    case "paid":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "overdue":
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case "sent":
    case "pending":
    default:
      return <Clock className="h-4 w-4 text-amber-500" />;
  }
}

function getCommissionStatusBadge(status: string) {
  switch (status) {
    case "collected":
      return <Badge className="bg-green-100 text-green-800">נגבה</Badge>;
    case "partial":
      return <Badge className="bg-amber-100 text-amber-800">חלקי</Badge>;
    case "overdue":
      return <Badge className="bg-red-100 text-red-800">באיחור</Badge>;
    default:
      return <Badge variant="outline">ממתין</Badge>;
  }
}

export function MonthlyBillingDashboard() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState<number>(currentMonth);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [goalValue, setGoalValue] = useState("");

  const { billingData, agencyGoals, totals, isLoading, updateCommission, updateGoal } = useBillingDashboard(year, month);

  const agencyMonthGoal = agencyGoals?.find(g => g.month === month);

  const handleSaveGoal = async (clientId: string | null, field: "revenue_target" | "commission_target") => {
    try {
      await updateGoal.mutateAsync({
        client_id: clientId,
        year,
        month,
        [field]: parseFloat(goalValue) || 0,
      });
      toast.success("היעד נשמר");
      setEditingGoal(null);
    } catch {
      toast.error("שגיאה בשמירת היעד");
    }
  };

  const handleUpdateCommission = async (item: MonthlyBillingView, collected: number) => {
    try {
      await updateCommission.mutateAsync({
        client_id: item.clientId,
        year: item.year,
        month: item.month,
        collected_amount: collected,
        status: collected >= item.expectedCommission ? "collected" : collected > 0 ? "partial" : "pending",
        collected_at: collected > 0 ? new Date().toISOString() : null,
      });
      toast.success("הגבייה עודכנה");
    } catch {
      toast.error("שגיאה בעדכון הגבייה");
    }
  };

  const progressToGoal = agencyMonthGoal?.revenue_target 
    ? ((totals?.totalPaid || 0) / agencyMonthGoal.revenue_target) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">שנה:</span>
              <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">חודש:</span>
              <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">סה"כ חויב</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals?.totalBilled || 0)}</div>
            <p className="text-xs text-muted-foreground">כולל מע"מ: {formatCurrency(totals?.totalWithVat || 0)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">סה"כ שולם</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals?.totalPaid || 0)}</div>
            {agencyMonthGoal?.revenue_target ? (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>יעד: {formatCurrency(agencyMonthGoal.revenue_target)}</span>
                  <span>{progressToGoal.toFixed(0)}%</span>
                </div>
                <Progress value={Math.min(progressToGoal, 100)} className="h-2" />
              </div>
            ) : (
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto text-xs"
                onClick={() => {
                  setEditingGoal("agency-revenue");
                  setGoalValue("");
                }}
              >
                <Target className="h-3 w-3 ml-1" /> הגדר יעד
              </Button>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">עמלות צפויות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals?.totalExpectedCommission || 0)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">עמלות נגבו</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals?.totalCollectedCommission || 0)}</div>
            <p className="text-xs text-muted-foreground">
              חסר: {formatCurrency((totals?.totalExpectedCommission || 0) - (totals?.totalCollectedCommission || 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agency Goal Editor */}
      {editingGoal === "agency-revenue" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <span>יעד הכנסה חודשי לסוכנות:</span>
              <Input
                type="number"
                value={goalValue}
                onChange={(e) => setGoalValue(e.target.value)}
                className="w-40"
                placeholder="סכום"
              />
              <Button onClick={() => handleSaveGoal(null, "revenue_target")}>שמור</Button>
              <Button variant="ghost" onClick={() => setEditingGoal(null)}>ביטול</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            סטטוס חיוב וגבייה - {MONTHS.find(m => m.value === month)?.label} {year}
          </CardTitle>
          <CardDescription>
            {billingData?.length || 0} לקוחות פעילים
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>לקוח</TableHead>
                  <TableHead className="text-center">חשבונית</TableHead>
                  <TableHead className="text-center">סטטוס</TableHead>
                  <TableHead>סכום + מע"מ</TableHead>
                  <TableHead>אחוזים</TableHead>
                  <TableHead>הוצ' פרסום</TableHead>
                  <TableHead>עמלה צפויה</TableHead>
                  <TableHead>נגבה</TableHead>
                  <TableHead>יעד</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingData?.map((item) => (
                  <TableRow key={`${item.clientId}-${item.month}`}>
                    <TableCell className="font-medium">{item.clientName}</TableCell>
                    <TableCell className="text-center">
                      {getStatusIcon(item.invoiceStatus || "pending", item.invoiceSent)}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.invoiceStatus === "paid" ? (
                        <Badge className="bg-green-100 text-green-800">שולם</Badge>
                      ) : item.invoiceStatus === "overdue" ? (
                        <Badge className="bg-red-100 text-red-800">באיחור</Badge>
                      ) : item.invoiceSent ? (
                        <Badge className="bg-amber-100 text-amber-800">נשלח</Badge>
                      ) : (
                        <Badge variant="outline">טרם נשלח</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>{formatCurrency(item.amountWithVat)}</div>
                      <div className="text-xs text-muted-foreground">לפני מע"מ: {formatCurrency(item.amountBilled)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.commissionPercent}%</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(item.adSpend)}</TableCell>
                    <TableCell>{formatCurrency(item.expectedCommission)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {formatCurrency(item.collectedCommission)}
                        {getCommissionStatusBadge(item.commissionStatus || "pending")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.revenueTarget > 0 ? (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {formatCurrency(item.revenueTarget)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.icountDocUrl && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={item.icountDocUrl} target="_blank" rel="noopener noreferrer">
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
