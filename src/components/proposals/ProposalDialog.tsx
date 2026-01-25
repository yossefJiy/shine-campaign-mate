import { useState, useEffect } from "react";
import { useClient } from "@/hooks/useClient";
import { useProposals, ProposalItem, CreateProposalDTO } from "@/hooks/useProposals";
import { useProposalTemplates, ProposalTemplate, StageTemplate } from "@/hooks/useProposalTemplates";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Trash2, 
  Loader2, 
  FileText, 
  Send, 
  Sparkles,
  DollarSign,
  Layers
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LineItem extends Omit<ProposalItem, 'id' | 'quote_id'> {
  tempId: string;
}

const paymentModelLabels = {
  retainer: "ריטיינר חודשי",
  retainer_plus_percentage: "ריטיינר + אחוזים ממכר",
  one_time: "חד פעמי",
};

export function ProposalDialog({ open, onOpenChange }: ProposalDialogProps) {
  const { selectedClient, isAgencyView, clients } = useClient();
  const { createProposal, isCreating, sendProposal } = useProposals();
  const { templates } = useProposalTemplates();

  // Form state
  const [clientId, setClientId] = useState<string>("");
  const [title, setTitle] = useState("הצעת מחיר");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [validUntil, setValidUntil] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxRate, setTaxRate] = useState(17);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(
    "העבודה מתחילה לאחר אישור ההצעה ותשלום הריטיינר.\nשירותים משלימים נועדו לתמוך בקמפיין הממומן."
  );
  const [paymentModel, setPaymentModel] = useState<'retainer' | 'retainer_plus_percentage' | 'one_time'>('retainer');
  const [retainerAmount, setRetainerAmount] = useState<number>(0);
  const [percentageRate, setPercentageRate] = useState<number>(0);

  const [items, setItems] = useState<LineItem[]>([
    createEmptyItem()
  ]);

  function createEmptyItem(): LineItem {
    return {
      tempId: crypto.randomUUID(),
      name: "",
      description: null,
      quantity: 1,
      unit_price: 0,
      discount_percent: 0,
      total: 0,
      is_optional: false,
      is_selected: true,
      creates_stage: true,
      task_tag: "income_generating",
      sort_order: 0,
    };
  }

  // Fetch clients for selection
  const { data: allClients = [] } = useQuery({
    queryKey: ["clients-for-proposal"],
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

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setClientId(selectedClient?.id || "");
      setTitle("הצעת מחיר");
      setSelectedTemplateId("");
      
      const defaultValidUntil = new Date();
      defaultValidUntil.setDate(defaultValidUntil.getDate() + 30);
      setValidUntil(defaultValidUntil.toISOString().split("T")[0]);
      
      setDiscountPercent(0);
      setTaxRate(17);
      setNotes("");
      setPaymentModel("retainer");
      setRetainerAmount(4350);
      setPercentageRate(0);
      setItems([createEmptyItem()]);
    }
  }, [open, selectedClient]);

  // Apply template
  const applyTemplate = (template: ProposalTemplate) => {
    setTitle(`${template.name}`);
    
    const newItems: LineItem[] = [];
    
    template.stages_json.forEach((stage, stageIndex) => {
      // Add the stage as an item
      newItems.push({
        tempId: crypto.randomUUID(),
        name: stage.name,
        description: stage.description || null,
        quantity: 1,
        unit_price: 0, // User will fill in
        discount_percent: 0,
        total: 0,
        is_optional: false,
        is_selected: true,
        creates_stage: true,
        stage_name: stage.name,
        task_tag: "income_generating",
        sort_order: stageIndex,
      });
    });

    if (newItems.length > 0) {
      setItems(newItems);
    }
  };

  const calculateItemTotal = (item: LineItem) => {
    const subtotal = item.quantity * item.unit_price;
    const discount = subtotal * (item.discount_percent / 100);
    return subtotal - discount;
  };

  const updateItem = (tempId: string, field: keyof LineItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.tempId !== tempId) return item;
      const updated = { ...item, [field]: value };
      updated.total = calculateItemTotal(updated);
      return updated;
    }));
  };

  const addItem = () => {
    setItems(prev => [...prev, createEmptyItem()]);
  };

  const removeItem = (tempId: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.tempId !== tempId));
    }
  };

  // Calculations
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

  const handleSave = async (sendToClient = false) => {
    if (!clientId) {
      toast.error("יש לבחור לקוח");
      return;
    }

    if (items.every(item => !item.name)) {
      toast.error("יש להוסיף לפחות פריט אחד");
      return;
    }

    const dto: CreateProposalDTO = {
      client_id: clientId,
      title,
      valid_until: validUntil || undefined,
      subtotal,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_amount: total,
      notes: notes || undefined,
      terms: terms || undefined,
      payment_model: paymentModel,
      retainer_amount: retainerAmount,
      percentage_rate: percentageRate,
      items: items
        .filter(item => item.name)
        .map(({ tempId, ...item }, index) => ({
          ...item,
          sort_order: index,
        })),
    };

    createProposal(dto, {
      onSuccess: (proposal) => {
        if (sendToClient && proposal?.id) {
          sendProposal(proposal.id);
        }
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            הצעת מחיר חדשה
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>כותרת ההצעה</Label>
                <Input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="כותרת ההצעה"
                />
              </div>

              {isAgencyView && (
                <div className="space-y-2">
                  <Label>לקוח *</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר לקוח" />
                    </SelectTrigger>
                    <SelectContent>
                      {allClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>תוקף עד</Label>
                <Input 
                  type="date" 
                  value={validUntil} 
                  onChange={(e) => setValidUntil(e.target.value)} 
                />
              </div>
            </div>

            {/* Template Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                בחר תבנית
              </Label>
              <div className="flex flex-wrap gap-2">
                {templates.map((template) => (
                  <Badge
                    key={template.id}
                    variant={selectedTemplateId === template.id ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => {
                      setSelectedTemplateId(template.id);
                      applyTemplate(template);
                    }}
                  >
                    {template.name}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  סעיפי ההצעה
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 ml-1" />
                  הוסף סעיף
                </Button>
              </div>

              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
                  <div className="col-span-3">שם השירות</div>
                  <div className="col-span-2">תיאור</div>
                  <div className="col-span-2">מחיר</div>
                  <div className="col-span-1 text-center">אופציונלי</div>
                  <div className="col-span-1 text-center">פותח שלב</div>
                  <div className="col-span-1">תג</div>
                  <div className="col-span-1 text-left">סה״כ</div>
                  <div className="col-span-1"></div>
                </div>

                {items.map((item, index) => (
                  <div 
                    key={item.tempId} 
                    className={cn(
                      "grid grid-cols-12 gap-2 items-center p-2 rounded-lg border",
                      item.is_optional && !item.is_selected && "opacity-50"
                    )}
                  >
                    <div className="col-span-3">
                      <Input
                        placeholder="שם השירות"
                        value={item.name}
                        onChange={(e) => updateItem(item.tempId, "name", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        placeholder="תיאור קצר"
                        value={item.description || ""}
                        onChange={(e) => updateItem(item.tempId, "description", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min={0}
                        value={item.unit_price}
                        onChange={(e) => updateItem(item.tempId, "unit_price", Number(e.target.value))}
                        placeholder="₪"
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <Checkbox
                        checked={item.is_optional}
                        onCheckedChange={(checked) => updateItem(item.tempId, "is_optional", checked)}
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <Checkbox
                        checked={item.creates_stage}
                        onCheckedChange={(checked) => updateItem(item.tempId, "creates_stage", checked)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Select 
                        value={item.task_tag || "income_generating"}
                        onValueChange={(v) => updateItem(item.tempId, "task_tag", v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income_generating">💸 Core</SelectItem>
                          <SelectItem value="operational">⚙️ תפעול</SelectItem>
                          <SelectItem value="client_dependent">👤 לקוח</SelectItem>
                        </SelectContent>
                      </Select>
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
                        onClick={() => removeItem(item.tempId)}
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
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">הנחה כללית (%)</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-20 text-left"
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">סכום ביניים:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>הנחה ({discountPercent}%):</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">מע״מ ({taxRate}%):</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>סה״כ:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Payment Model */}
            <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                מודל תשלום
              </Label>

              <RadioGroup
                value={paymentModel}
                onValueChange={(v) => setPaymentModel(v as typeof paymentModel)}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="retainer" id="retainer" />
                  <Label htmlFor="retainer" className="cursor-pointer">
                    ריטיינר חודשי
                  </Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="retainer_plus_percentage" id="retainer_plus" />
                  <Label htmlFor="retainer_plus" className="cursor-pointer">
                    ריטיינר + אחוזים ממכר
                  </Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="one_time" id="one_time" />
                  <Label htmlFor="one_time" className="cursor-pointer">
                    חד פעמי
                  </Label>
                </div>
              </RadioGroup>

              {(paymentModel === "retainer" || paymentModel === "retainer_plus_percentage") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>סכום ריטיינר (₪)</Label>
                    <Input
                      type="number"
                      value={retainerAmount}
                      onChange={(e) => setRetainerAmount(Number(e.target.value))}
                    />
                  </div>
                  {paymentModel === "retainer_plus_percentage" && (
                    <div className="space-y-2">
                      <Label>אחוז ממכר (%)</Label>
                      <Input
                        type="number"
                        value={percentageRate}
                        onChange={(e) => setPercentageRate(Number(e.target.value))}
                        min={0}
                        max={100}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Notes & Terms */}
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
                <Label>תנאים והבהרות</Label>
                <Textarea 
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t bg-muted/30">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button 
            variant="secondary"
            onClick={() => handleSave(false)}
            disabled={isCreating}
          >
            {isCreating && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            <FileText className="w-4 h-4 ml-2" />
            שמור טיוטה
          </Button>
          <Button 
            onClick={() => handleSave(true)}
            disabled={isCreating || !clientId}
          >
            {isCreating && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            <Send className="w-4 h-4 ml-2" />
            שמור ושלח ללקוח
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
