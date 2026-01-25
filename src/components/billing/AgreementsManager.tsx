import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAgreements, ClientAgreement } from "@/hooks/useAgreements";
import { AgreementDialog } from "./AgreementDialog";
import { formatCurrency } from "@/lib/formatters";
import { Plus, Search, Edit, Trash2, FileText, Calendar, Percent } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const categoryLabels: Record<string, string> = {
  retainer: "ריטיינר",
  project: "פרויקט",
  commission: "עמלה",
  media: "מדיה",
  custom: "מותאם",
};

const cycleLabels: Record<string, string> = {
  "one-time": "חד פעמי",
  monthly: "חודשי",
  quarterly: "רבעוני",
  yearly: "שנתי",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  paused: "bg-amber-100 text-amber-800",
  ended: "bg-gray-100 text-gray-800",
  pending: "bg-blue-100 text-blue-800",
};

export function AgreementsManager() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<ClientAgreement | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { agreements, isLoading, deleteAgreement } = useAgreements();

  const filteredAgreements = agreements?.filter((a) => {
    const matchesSearch =
      a.service_name.toLowerCase().includes(search.toLowerCase()) ||
      a.clients?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (agreement: ClientAgreement) => {
    setEditingAgreement(agreement);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteAgreement.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש הסכם..."
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
              <SelectItem value="active">פעיל</SelectItem>
              <SelectItem value="paused">מושהה</SelectItem>
              <SelectItem value="ended">הסתיים</SelectItem>
              <SelectItem value="pending">ממתין</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setEditingAgreement(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 ml-2" />
          הסכם חדש
        </Button>
      </div>

      {/* Agreements Grid */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">טוען...</div>
      ) : filteredAgreements?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">אין הסכמים</h3>
            <p className="text-muted-foreground mb-4">צור הסכם שירות חדש להתחלת מעקב</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              הסכם חדש
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgreements?.map((agreement) => (
            <Card key={agreement.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{agreement.service_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{agreement.clients?.name}</p>
                  </div>
                  <Badge className={statusColors[agreement.status]}>
                    {agreement.status === "active" ? "פעיל" : 
                     agreement.status === "paused" ? "מושהה" :
                     agreement.status === "ended" ? "הסתיים" : "ממתין"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Category & Cycle */}
                <div className="flex gap-2">
                  <Badge variant="outline">{categoryLabels[agreement.category] || agreement.category}</Badge>
                  <Badge variant="outline">{cycleLabels[agreement.billing_cycle] || agreement.billing_cycle}</Badge>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2 text-lg font-semibold">
                  {formatCurrency(agreement.base_price)}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {cycleLabels[agreement.billing_cycle]}
                  </span>
                </div>

                {/* Commission if exists */}
                {agreement.commission_percent && (
                  <div className="flex items-center gap-2 text-sm">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <span>{agreement.commission_percent}% עמלה</span>
                    {agreement.commission_base && (
                      <span className="text-muted-foreground">
                        ({agreement.commission_base === "media_spend" ? "הוצאות מדיה" :
                          agreement.commission_base === "revenue" ? "הכנסות" : "רווח"})
                      </span>
                    )}
                  </div>
                )}

                {/* Dates */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(agreement.start_date).toLocaleDateString("he-IL")}
                    {agreement.end_date && ` - ${new Date(agreement.end_date).toLocaleDateString("he-IL")}`}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(agreement)}>
                    <Edit className="h-4 w-4 ml-1" />
                    עריכה
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteId(agreement.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <AgreementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        agreement={editingAgreement}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת הסכם</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק הסכם זה? פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
