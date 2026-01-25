import { useState } from "react";
import { usePerformanceFees, useReportRevenue, useUpdateFeeStatus } from "@/hooks/usePerformanceFees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Receipt, CheckCircle, Clock, Percent } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

interface PerformanceFeesManagerProps {
  projectId?: string;
  clientId?: string;
}

const MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
];

export function PerformanceFeesManager({ projectId, clientId }: PerformanceFeesManagerProps) {
  const { data: fees, isLoading } = usePerformanceFees(projectId, clientId);
  const reportRevenue = useReportRevenue();
  const updateStatus = useUpdateFeeStatus();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    revenue: "",
    percentage: "10",
  });

  const handleSubmit = async () => {
    if (!projectId || !clientId) return;
    
    await reportRevenue.mutateAsync({
      projectId,
      clientId,
      month: formData.month,
      year: formData.year,
      revenue: parseFloat(formData.revenue),
      percentage: parseFloat(formData.percentage),
    });
    
    setIsDialogOpen(false);
    setFormData({ ...formData, revenue: "" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> ממתין לחיוב</Badge>;
      case "invoiced":
        return <Badge variant="secondary" className="gap-1"><Receipt className="w-3 h-3" /> הופק חשבון</Badge>;
      case "paid":
        return <Badge className="gap-1 bg-tag-income"><CheckCircle className="w-3 h-3" /> שולם</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">טוען...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Percent className="w-5 h-5" />
          עמלות מביצועים
        </CardTitle>
        
        {projectId && clientId && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 ml-2" />
                דיווח מחזור
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>דיווח מחזור חודשי</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>חודש</Label>
                    <Select
                      value={formData.month.toString()}
                      onValueChange={(v) => setFormData({ ...formData, month: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((name, i) => (
                          <SelectItem key={i} value={(i + 1).toString()}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>שנה</Label>
                    <Input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <Label>מחזור מדווח (₪)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.revenue}
                    onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                  />
                </div>

                <div>
                  <Label>אחוז עמלה (%)</Label>
                  <Input
                    type="number"
                    value={formData.percentage}
                    onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                  />
                </div>

                {formData.revenue && (
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <span className="text-muted-foreground">עמלה מחושבת: </span>
                    <span className="font-bold text-lg">
                      ₪{(parseFloat(formData.revenue || "0") * parseFloat(formData.percentage) / 100).toLocaleString()}
                    </span>
                  </div>
                )}

                <Button 
                  onClick={handleSubmit} 
                  className="w-full"
                  disabled={!formData.revenue || reportRevenue.isPending}
                >
                  דווח מחזור
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>

      <CardContent>
        {!fees?.length ? (
          <p className="text-center text-muted-foreground py-8">
            אין עמלות מביצועים עדיין
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תקופה</TableHead>
                <TableHead>מחזור</TableHead>
                <TableHead>אחוז</TableHead>
                <TableHead>עמלה</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell>
                    {MONTHS[fee.month - 1]} {fee.year}
                  </TableCell>
                  <TableCell>₪{fee.revenue_reported.toLocaleString()}</TableCell>
                  <TableCell>{fee.percentage}%</TableCell>
                  <TableCell className="font-medium">
                    ₪{fee.calculated_fee.toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(fee.status)}</TableCell>
                  <TableCell>
                    {fee.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus.mutate({ feeId: fee.id, status: "invoiced" })}
                      >
                        הפק חשבון
                      </Button>
                    )}
                    {fee.status === "invoiced" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus.mutate({ feeId: fee.id, status: "paid" })}
                      >
                        סמן כשולם
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
  );
}
