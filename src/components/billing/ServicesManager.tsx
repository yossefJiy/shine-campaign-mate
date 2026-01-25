import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useServices, Service } from "@/hooks/useServices";
import { formatCurrency } from "@/lib/formatters";
import { Plus, Edit, Trash2, Package, Clock, Repeat, Percent, DollarSign } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PRICING_TYPES = [
  { value: "fixed", label: "מחיר קבוע", icon: DollarSign },
  { value: "hourly", label: "לשעה", icon: Clock },
  { value: "package", label: "חבילה", icon: Package },
  { value: "retainer", label: "ריטיינר", icon: Repeat },
  { value: "commission", label: "אחוזים", icon: Percent },
];

const CATEGORIES = [
  { value: "general", label: "כללי" },
  { value: "marketing", label: "שיווק" },
  { value: "design", label: "עיצוב" },
  { value: "development", label: "פיתוח" },
  { value: "consulting", label: "ייעוץ" },
  { value: "advertising", label: "פרסום" },
];

interface ServiceFormData {
  name: string;
  description: string;
  category: string;
  base_price: number;
  pricing_type: Service["pricing_type"];
  unit: string;
  is_active: boolean;
  sort_order: number;
}

const emptyFormData: ServiceFormData = {
  name: "",
  description: "",
  category: "general",
  base_price: 0,
  pricing_type: "fixed",
  unit: "יחידה",
  is_active: true,
  sort_order: 0,
};

export function ServicesManager() {
  const { services, isLoading, createService, updateService, deleteService } = useServices();
  const [showDialog, setShowDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(emptyFormData);

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      category: service.category,
      base_price: service.base_price,
      pricing_type: service.pricing_type,
      unit: service.unit,
      is_active: service.is_active,
      sort_order: service.sort_order,
    });
    setShowDialog(true);
  };

  const handleCreate = () => {
    setEditingService(null);
    setFormData(emptyFormData);
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) return;

    if (editingService) {
      await updateService.mutateAsync({ id: editingService.id, ...formData });
    } else {
      await createService.mutateAsync(formData);
    }
    setShowDialog(false);
  };

  const handleDelete = async (id: string) => {
    await deleteService.mutateAsync(id);
    setDeleteConfirm(null);
  };

  const getPricingIcon = (type: string) => {
    const pricing = PRICING_TYPES.find((p) => p.value === type);
    if (!pricing) return null;
    const Icon = pricing.icon;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>מחירון שירותים</CardTitle>
            <CardDescription>הגדר שירותים ומחירים בסיסיים</CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 ml-2" />
            שירות חדש
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם השירות</TableHead>
                <TableHead>קטגוריה</TableHead>
                <TableHead>סוג תמחור</TableHead>
                <TableHead>מחיר בסיס</TableHead>
                <TableHead>יחידה</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{service.name}</div>
                      {service.description && (
                        <div className="text-sm text-muted-foreground">{service.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {CATEGORIES.find((c) => c.value === service.category)?.label || service.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPricingIcon(service.pricing_type)}
                      {PRICING_TYPES.find((p) => p.value === service.pricing_type)?.label}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(service.base_price)}</TableCell>
                  <TableCell>{service.unit}</TableCell>
                  <TableCell>
                    {service.is_active ? (
                      <Badge className="bg-green-100 text-green-800">פעיל</Badge>
                    ) : (
                      <Badge variant="secondary">לא פעיל</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(service.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {services.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <p className="text-muted-foreground">אין שירותים עדיין</p>
                    <Button variant="outline" className="mt-4" onClick={handleCreate}>
                      <Plus className="h-4 w-4 ml-2" />
                      הוסף שירות ראשון
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Service Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingService ? "עריכת שירות" : "שירות חדש"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>שם השירות *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ניהול קמפיינים"
              />
            </div>
            <div className="space-y-2">
              <Label>תיאור</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="תיאור קצר של השירות"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>קטגוריה</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>סוג תמחור</Label>
                <Select
                  value={formData.pricing_type}
                  onValueChange={(v) => setFormData({ ...formData, pricing_type: v as Service["pricing_type"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICING_TYPES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>מחיר בסיס (₪)</Label>
                <Input
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>יחידה</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="שעה / חודש / פריט"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
              <Label>שירות פעיל</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>ביטול</Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.name || createService.isPending || updateService.isPending}
            >
              {editingService ? "שמור" : "צור"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת שירות</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את השירות? פעולה זו בלתי הפיכה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
