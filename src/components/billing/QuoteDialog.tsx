import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Quote, QuoteItem, useBilling } from "@/hooks/useBilling";
import { useClient } from "@/hooks/useClient";
import { useProposalTemplates, ProposalTemplate } from "@/hooks/useProposalTemplates";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, FileText, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface QuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote | null;
}

interface LineItem {
  id?: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  total: number;
  is_optional: boolean;
  is_selected: boolean;
  creates_stage: boolean;
  preset_tasks: string[];
}

export function QuoteDialog({ open, onOpenChange, quote }: QuoteDialogProps) {
  const queryClient = useQueryClient();
  const { selectedClient, isAgencyView } = useClient();
  const { createQuote } = useBilling();
  const { templates, isLoading: templatesLoading } = useProposalTemplates();
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [leadId, setLeadId] = useState<string>("");
  const [title, setTitle] = useState("הצעת מחיר");
  const [validUntil, setValidUntil] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxRate, setTaxRate] = useState(18);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { name: "", description: "", quantity: 1, unit_price: 0, discount_percent: 0, total: 0, is_optional: false, is_selected: true, creates_stage: true, preset_tasks: [] }
  ]);

  // Fetch clients for selection
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-for-quote"],
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

  // Fetch leads for selection
  const { data: leads = [] } = useQuery({
    queryKey: ["leads-for-quote"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch quote items when editing
  const { data: quoteItems = [] } = useQuery({
    queryKey: ["quote-items", quote?.id],
    queryFn: async () => {
      if (!quote?.id) return [];
      const { data, error } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", quote.id)
        .order("sort_order");
      if (error) throw error;
      return data as QuoteItem[];
    },
    enabled: !!quote?.id,
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (quote) {
        setClientId(quote.client_id || "");
        setLeadId(quote.lead_id || "");
        setTitle(quote.title);
        setValidUntil(quote.valid_until || "");
        setDiscountPercent(quote.discount_percent);
        setTaxRate(quote.tax_rate);
        setNotes(quote.notes || "");
        setTerms(quote.terms || "");
        if (quoteItems.length > 0) {
          setItems(quoteItems.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description || "",
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percent: item.discount_percent || 0,
            total: item.total,
            is_optional: item.is_optional,
            is_selected: item.is_selected,
            creates_stage: true,
            preset_tasks: [],
          })));
        }
      } else {
        setClientId(selectedClient?.id || "");
        setLeadId("");
        setTitle("הצעת מחיר");
        // Default: 30 days from now
        const defaultValidUntil = new Date();
        defaultValidUntil.setDate(defaultValidUntil.getDate() + 30);
        setValidUntil(defaultValidUntil.toISOString().split("T")[0]);
        setDiscountPercent(0);
        setTaxRate(18);
        setNotes("");
        setTerms("");
        setItems([{ name: "", description: "", quantity: 1, unit_price: 0, discount_percent: 0, total: 0, is_optional: false, is_selected: true, creates_stage: true, preset_tasks: [] }]);
      }
    }
  }, [open, quote, quoteItems, selectedClient]);

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
    setItems([...items, { name: "", description: "", quantity: 1, unit_price: 0, discount_percent: 0, total: 0, is_optional: false, is_selected: true, creates_stage: true, preset_tasks: [] }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Calculate totals (only include selected items)
  const selectedItems = items.filter(item => item.is_selected || !item.is_optional);
  const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmount;

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
      if (!clientId && !leadId) throw new Error("יש לבחור לקוח או ליד");
      if (items.every(item => !item.name)) throw new Error("יש להוסיף לפחות פריט אחד");

      const quoteData = {
        client_id: clientId || null,
        lead_id: leadId || null,
        title,
        valid_until: validUntil || null,
        subtotal,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: total,
        notes: notes || null,
        terms: terms || null,
        items: items.filter(item => item.name),
      };

      createQuote(quoteData);
    },
    onSuccess: () => {
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "שגיאה בשמירה");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {quote ? `עריכת הצעת מחיר #${quote.quote_number}` : "הצעת מחיר חדשה"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>כותרת</Label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="כותרת ההצעה"
              />
            </div>

            {isAgencyView && (
              <>
                <div className="space-y-2">
                  <Label>לקוח</Label>
                  <Select value={clientId} onValueChange={(v) => { setClientId(v); setLeadId(""); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר לקוח" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">ללא</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>או ליד</Label>
                  <Select value={leadId} onValueChange={(v) => { setLeadId(v); setClientId(""); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר ליד" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">ללא</SelectItem>
                      {leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label>תוקף עד</Label>
              <Input 
                type="date" 
                value={validUntil} 
                onChange={(e) => setValidUntil(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label>הנחה כללית (%)</Label>
              <Input 
                type="number" 
                value={discountPercent} 
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                min={0}
                max={100}
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

            <div className="space-y-2" dir="rtl">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
                <div className="col-span-3 text-right">שם</div>
                <div className="col-span-2 text-right">תיאור</div>
                <div className="col-span-1 text-right">כמות</div>
                <div className="col-span-2 text-right">מחיר</div>
                <div className="col-span-1 text-right">הנחה %</div>
                <div className="col-span-1 text-center">אופציונלי</div>
                <div className="col-span-1 text-right">סה"כ</div>
                <div className="col-span-1"></div>
              </div>

              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3">
                    <Input
                      placeholder="שם הפריט"
                      value={item.name}
                      onChange={(e) => updateItem(index, "name", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="תיאור"
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                    />
                  </div>
                  <div className="col-span-1">
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
                  <div className="col-span-1 flex items-center justify-center">
                    <Checkbox
                      checked={item.is_optional}
                      onCheckedChange={(checked) => updateItem(index, "is_optional", checked)}
                    />
                  </div>
                  <div className="col-span-1 text-sm font-medium text-right">
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
              {discountPercent > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>הנחה ({discountPercent}%):</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">מע"מ ({taxRate}%):</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>סה"כ:</span>
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
                placeholder="הערות להצעה..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>תנאים</Label>
              <Textarea 
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="תנאי ההצעה..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 flex-wrap gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button 
            variant="outline"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            <FileText className="w-4 h-4 ml-2" />
            שמור טיוטה
          </Button>
          <Button 
            onClick={() => {
              // Save and send to client
              saveMutation.mutate();
              toast.success("ההצעה נשלחה ללקוח", {
                description: "הלקוח יקבל הודעה לאישור ההצעה"
              });
            }}
            disabled={saveMutation.isPending || (!clientId && !leadId)}
          >
            {saveMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            <Send className="w-4 h-4 ml-2" />
            שלח ללקוח
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
