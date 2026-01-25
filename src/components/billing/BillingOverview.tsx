import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBillingRecords } from "@/hooks/useBillingRecords";
import { useAgreements } from "@/hooks/useAgreements";
import { formatCurrency } from "@/lib/formatters";
import { TrendingUp, Clock, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface BillingOverviewProps {
  year?: number;
}

export function BillingOverview({ year = new Date().getFullYear() }: BillingOverviewProps) {
  const { stats, records } = useBillingRecords({ year });
  const { agreements } = useAgreements();

  // Calculate monthly data for chart
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthRecords = records?.filter((r) => r.month === month) || [];
    const revenue = monthRecords.reduce((sum, r) => sum + (Number(r.amount_paid) || 0), 0);
    const pending = monthRecords.reduce((sum, r) => sum + ((Number(r.total_amount) || 0) - (Number(r.amount_paid) || 0)), 0);

    return {
      month: new Date(year, i).toLocaleDateString("he-IL", { month: "short" }),
      revenue,
      pending,
    };
  });

  const activeAgreements = agreements?.filter((a) => a.status === "active").length || 0;
  const expectedMonthly = agreements
    ?.filter((a) => a.status === "active")
    .reduce((sum, a) => {
      if (a.billing_cycle === "monthly") return sum + a.base_price;
      if (a.billing_cycle === "yearly") return sum + a.base_price / 12;
      if (a.billing_cycle === "quarterly") return sum + a.base_price / 3;
      return sum;
    }, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הכנסות {year}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(stats?.paidAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              מתוך {formatCurrency(stats?.totalRevenue || 0)} סה"כ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ממתין לגבייה</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(stats?.pendingAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {records?.filter((r) => r.status === "pending" || r.status === "invoiced").length || 0} רשומות
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">באיחור</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(stats?.overdueAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {records?.filter((r) => r.status === "overdue").length || 0} רשומות
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הסכמים פעילים</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgreements}</div>
            <p className="text-xs text-muted-foreground">
              צפי חודשי: {formatCurrency(expectedMonthly)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>הכנסות לפי חודש - {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `חודש: ${label}`}
                />
                <Bar dataKey="revenue" name="שולם" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="ממתין" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>פעילות אחרונה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {records?.slice(0, 5).map((record) => (
              <div key={record.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div className="flex items-center gap-3">
                  {record.status === "paid" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : record.status === "overdue" ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-500" />
                  )}
                  <div>
                    <p className="font-medium">{record.clients?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(record.period_start).toLocaleDateString("he-IL")} - {new Date(record.period_end).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-medium">{formatCurrency(record.total_amount)}</p>
                  <p className="text-sm text-muted-foreground">
                    שולם: {formatCurrency(record.amount_paid)}
                  </p>
                </div>
              </div>
            ))}
            {(!records || records.length === 0) && (
              <p className="text-center text-muted-foreground py-4">אין רשומות חיוב</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
