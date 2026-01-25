import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAgreements, ClientAgreement } from "@/hooks/useAgreements";
import { useClient } from "@/hooks/useClient";

const agreementSchema = z.object({
  client_id: z.string().min(1, "נדרש לקוח"),
  service_name: z.string().min(1, "נדרש שם שירות"),
  service_description: z.string().optional(),
  category: z.string().default("retainer"),
  base_price: z.coerce.number().min(0, "מחיר חייב להיות חיובי"),
  currency: z.string().default("ILS"),
  billing_cycle: z.string().default("monthly"),
  commission_percent: z.coerce.number().min(0).max(100).optional().nullable(),
  commission_base: z.string().optional().nullable(),
  start_date: z.string().min(1, "נדרש תאריך התחלה"),
  end_date: z.string().optional().nullable(),
  status: z.string().default("active"),
  notes: z.string().optional().nullable(),
});

type AgreementFormData = z.infer<typeof agreementSchema>;

interface AgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreement?: ClientAgreement | null;
}

export function AgreementDialog({ open, onOpenChange, agreement }: AgreementDialogProps) {
  const { clients } = useClient();
  const { createAgreement, updateAgreement } = useAgreements();

  const form = useForm<AgreementFormData>({
    resolver: zodResolver(agreementSchema),
    defaultValues: {
      client_id: "",
      service_name: "",
      service_description: "",
      category: "retainer",
      base_price: 0,
      currency: "ILS",
      billing_cycle: "monthly",
      commission_percent: null,
      commission_base: null,
      start_date: new Date().toISOString().split("T")[0],
      end_date: null,
      status: "active",
      notes: null,
    },
  });

  useEffect(() => {
    if (agreement) {
      form.reset({
        client_id: agreement.client_id,
        service_name: agreement.service_name,
        service_description: agreement.service_description || "",
        category: agreement.category,
        base_price: agreement.base_price,
        currency: agreement.currency,
        billing_cycle: agreement.billing_cycle,
        commission_percent: agreement.commission_percent,
        commission_base: agreement.commission_base,
        start_date: agreement.start_date,
        end_date: agreement.end_date,
        status: agreement.status,
        notes: agreement.notes,
      });
    } else {
      form.reset({
        client_id: "",
        service_name: "",
        service_description: "",
        category: "retainer",
        base_price: 0,
        currency: "ILS",
        billing_cycle: "monthly",
        commission_percent: null,
        commission_base: null,
        start_date: new Date().toISOString().split("T")[0],
        end_date: null,
        status: "active",
        notes: null,
      });
    }
  }, [agreement, form]);

  const onSubmit = async (data: AgreementFormData) => {
    try {
      if (agreement) {
        await updateAgreement.mutateAsync({ id: agreement.id, ...data });
      } else {
        await createAgreement.mutateAsync({
          client_id: data.client_id,
          service_name: data.service_name,
          base_price: data.base_price,
          start_date: data.start_date,
          service_description: data.service_description,
          category: data.category,
          currency: data.currency,
          billing_cycle: data.billing_cycle,
          commission_percent: data.commission_percent ?? undefined,
          commission_base: data.commission_base ?? undefined,
          end_date: data.end_date ?? undefined,
          status: data.status,
          notes: data.notes ?? undefined,
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving agreement:", error);
    }
  };

  const showCommission = form.watch("category") === "commission" || form.watch("commission_percent");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{agreement ? "עריכת הסכם" : "הסכם חדש"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Client */}
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>לקוח *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר לקוח" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Service Name */}
            <FormField
              control={form.control}
              name="service_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם השירות *</FormLabel>
                  <FormControl>
                    <Input placeholder="ניהול מדיה חברתית" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category & Billing Cycle */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>קטגוריה</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="retainer">ריטיינר</SelectItem>
                        <SelectItem value="project">פרויקט</SelectItem>
                        <SelectItem value="commission">עמלה</SelectItem>
                        <SelectItem value="media">מדיה</SelectItem>
                        <SelectItem value="custom">מותאם</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billing_cycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מחזור חיוב</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="one-time">חד פעמי</SelectItem>
                        <SelectItem value="monthly">חודשי</SelectItem>
                        <SelectItem value="quarterly">רבעוני</SelectItem>
                        <SelectItem value="yearly">שנתי</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Price */}
            <FormField
              control={form.control}
              name="base_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>מחיר בסיס (₪) *</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step={0.01} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Commission */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="commission_percent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>אחוז עמלה</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        placeholder="0"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showCommission && (
                <FormField
                  control={form.control}
                  name="commission_base"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>בסיס לעמלה</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="בחר" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="media_spend">הוצאות מדיה</SelectItem>
                          <SelectItem value="revenue">הכנסות</SelectItem>
                          <SelectItem value="profit">רווח</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תאריך התחלה *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תאריך סיום</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>סטטוס</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">פעיל</SelectItem>
                      <SelectItem value="paused">מושהה</SelectItem>
                      <SelectItem value="ended">הסתיים</SelectItem>
                      <SelectItem value="pending">ממתין</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הערות</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="הערות נוספות..."
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={createAgreement.isPending || updateAgreement.isPending}>
                {agreement ? "עדכן" : "צור"} הסכם
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
