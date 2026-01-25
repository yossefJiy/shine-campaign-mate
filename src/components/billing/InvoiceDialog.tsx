import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceItem, useBilling } from "@/hooks/useBilling";
import { useClient } from "@/hooks/useClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
}

interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  total: number;
}

export function InvoiceDialog({ open, onOpenChange, invoice }: InvoiceDialogProps) {
  const queryClient = useQueryClient();
  const { selectedClient, isAgencyView } = useClient();
  const { services, createInvoice } = useBilling();
  
  const [clientId, setClientId] = useState<string>("");
  const [type, setType] = useState<"invoice" | "receipt" | "proforma" | "credit_note">("invoice");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [taxRate, setTaxRate] = useState(17);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unit_price: 0, discount_percent: 0, total: 0 }
  ]);

  // Fetch clients for selection
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-for-invoice"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .is("deleted_at", null)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: isAgencyView,
  });

  // Fetch invoice items when editing
  const { data: invoiceItems = [] } = useQuery({
    queryKey: ["invoice-items", invoice?.id],
    queryFn: async () => {
      if (!invoice?.id) return [];
      const { data, error } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoice.id)
        .order("sort_order");
      if (error) throw error;
      return data as InvoiceItem[];
    },
    enabled: !!invoice?.id,
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (invoice) {
        setClientId(invoice.client_id);
        setType(invoice.type);
        setIssueDate(invoice.issue_date);
        setDueDate(invoice.due_date || "");
        setTaxRate(invoice.tax_rate);
        setNotes(invoice.notes || "");
        setTerms(invoice.terms || "");
        if (invoiceItems.length > 0) {
          setItems(invoiceItems.map(item => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percent: item.discount_percent || 0,
            total: item.total,
          })));
        }
      } else {
        setClientId(selectedClient?.id || "");
        setType("invoice");
        setIssueDate(new Date().toISOString().split("T")[0]);
        setDueDate("");
        setTaxRate(17);
        setNotes("");
        setTerms("");
        setItems([{ description: "", quantity: 1, unit_price: 0, discount_percent: 0, total: 0 }]);
      }
    }
  }, [open, invoice, invoiceItems, selectedClient]);

  const calculateItemTotal = (item: LineItem) => {
    const subtotal = item.quantity * item.unit_price;
    const discount = subtotal * (item.discount_percent / 100);
    return subtotal - discount;
  };

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    newItems[index].total = calculateItemTotal(newItems[index]);
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unit_price: 0, discount_percent: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', { 
      style: 'currency', 
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!clientId) throw new Error("יש לבחור לקוח");
      if (items.every(item => !item.description)) throw new Error("יש להוסיף לפחות פריט אחד");

      const invoiceData = {
        client_id: clientId,
        type,
        issue_date: issueDate,
        due_date: dueDate || null,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: total,
        notes: notes || null,
        terms: terms || null,
        items: items.filter(item => item.description),
      };

      createInvoice(invoiceData);
    },
    onSuccess: () => {
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "שגיאה בשמירה");
    },
  });

  const typeLabels: Record<string, string> = {
    invoice: "חשבונית מס",
    receipt: "קבלה",
    proforma: "חשבונית עסקה",
    credit_note: "זיכוי",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {invoice ? `עריכת ${typeLabels[invoice.type]} #${invoice.invoice_number}` : "חשבונית חדשה"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {isAgencyView && (
              <div className="space-y-2 col-span-2">
                <Label>לקוח *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר לקוח" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>סוג מסמך</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice">חשבונית מס</SelectItem>
                  <SelectItem value="receipt">קבלה</SelectItem>
                  <SelectItem value="proforma">חשבונית עסקה</SelectItem>
                  <SelectItem value="credit_note">זיכוי</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>תאריך הפקה</Label>
              <Input 
                type="date" 
                value={issueDate} 
                onChange={(e) => setIssueDate(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label>תאריך תשלום</Label>
              <Input 
                type="date" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label>מע"מ (%)</Label>
              <Input 
                type="number" 
                value={taxRate} 
                onChange={(e) => setTaxRate(Number(e.target.value))}
                min={0}
                max={100}
              />
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">פריטים</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 ml-1" />
                הוסף פריט
              </Button>
            </div>

            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
                <div className="col-span-5">תיאור</div>
                <div className="col-span-2">כמות</div>
                <div className="col-span-2">מחיר</div>
                <div className="col-span-1">הנחה %</div>
                <div className="col-span-2 text-left">סה"כ</div>
              </div>

              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <Input
                      placeholder="תיאור הפריט"
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={0}
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, "unit_price", Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={item.discount_percent}
                      onChange={(e) => updateItem(index, "discount_percent", Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-1 text-sm font-medium text-left">
                    {formatCurrency(item.total)}
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">סכום ביניים:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">מע"מ ({taxRate}%):</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>סה"כ לתשלום:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>הערות</Label>
              <Textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="הערות לחשבונית..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>תנאי תשלום</Label>
              <Textarea 
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="תנאי תשלום..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button 
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            {invoice ? "שמירה" : "צור חשבונית"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
