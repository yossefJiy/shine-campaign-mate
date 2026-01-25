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
import { useBillingRecords, BillingRecord } from "@/hooks/useBillingRecords";
import { useClient } from "@/hooks/useClient";
import { useAgreements } from "@/hooks/useAgreements";

const recordSchema = z.object({
  client_id: z.string().min(1, "נדרש לקוח"),
  agreement_id: z.string().optional().nullable(),
  period_start: z.string().min(1, "נדרש תאריך התחלה"),
  period_end: z.string().min(1, "נדרש תאריך סיום"),
  year: z.coerce.number(),
  month: z.coerce.number().optional().nullable(),
  base_amount: z.coerce.number().min(0),
  commission_amount: z.coerce.number().min(0).optional().nullable(),
  additional_amount: z.coerce.number().min(0).optional().nullable(),
  amount_billed: z.coerce.number().min(0),
  amount_paid: z.coerce.number().min(0),
  status: z.string().default("pending"),
  due_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type RecordFormData = z.infer<typeof recordSchema>;

interface BillingRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: BillingRecord | null;
}

export function BillingRecordDialog({ open, onOpenChange, record }: BillingRecordDialogProps) {
  const { clients } = useClient();
  const { createRecord, updateRecord } = useBillingRecords();

  const form = useForm<RecordFormData>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      client_id: "",
      agreement_id: null,
      period_start: new Date().toISOString().split("T")[0],
      period_end: new Date().toISOString().split("T")[0],
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      base_amount: 0,
      commission_amount: null,
      additional_amount: null,
      amount_billed: 0,
      amount_paid: 0,
      status: "pending",
      due_date: null,
      notes: null,
    },
  });

  const selectedClientId = form.watch("client_id");
  const { agreements } = useAgreements(selectedClientId || undefined);

  useEffect(() => {
    if (record) {
      form.reset({
        client_id: record.client_id,
        agreement_id: record.agreement_id,
        period_start: record.period_start,
        period_end: record.period_end,
        year: record.year,
        month: record.month,
        base_amount: record.base_amount,
        commission_amount: record.commission_amount,
        additional_amount: record.additional_amount,
        amount_billed: record.amount_billed,
        amount_paid: record.amount_paid,
        status: record.status,
        due_date: record.due_date,
        notes: record.notes,
      });
    } else {
      form.reset({
        client_id: "",
        agreement_id: null,
        period_start: new Date().toISOString().split("T")[0],
        period_end: new Date().toISOString().split("T")[0],
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        base_amount: 0,
        commission_amount: null,
        additional_amount: null,
        amount_billed: 0,
        amount_paid: 0,
        status: "pending",
        due_date: null,
        notes: null,
      });
    }
  }, [record, form]);

  // Auto-fill from agreement
  const handleAgreementChange = (agreementId: string) => {
    form.setValue("agreement_id", agreementId);
    const agreement = agreements?.find((a) => a.id === agreementId);
    if (agreement) {
      form.setValue("base_amount", agreement.base_price);
    }
  };

  const onSubmit = async (data: RecordFormData) => {
    try {
      if (record) {
        await updateRecord.mutateAsync({ id: record.id, ...data });
      } else {
        await createRecord.mutateAsync(data);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving record:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{record ? "עריכת רשומה" : "רשומת חיוב חדשה"}</DialogTitle>
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

            {/* Agreement */}
            {selectedClientId && agreements && agreements.length > 0 && (
              <FormField
                control={form.control}
                name="agreement_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>הסכם</FormLabel>
                    <Select 
                      onValueChange={handleAgreementChange} 
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר הסכם (אופציונלי)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {agreements.map((agreement) => (
                          <SelectItem key={agreement.id} value={agreement.id}>
                            {agreement.service_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Period */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="period_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תחילת תקופה *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="period_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סוף תקופה *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="base_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סכום בסיס</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={0.01} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commission_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>עמלה</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additional_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>נוסף</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Billed & Paid */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount_billed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סכום שחויב</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={0.01} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount_paid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סכום ששולם</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={0.01} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status & Due Date */}
            <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem value="pending">ממתין</SelectItem>
                        <SelectItem value="invoiced">חויב</SelectItem>
                        <SelectItem value="partial">חלקי</SelectItem>
                        <SelectItem value="paid">שולם</SelectItem>
                        <SelectItem value="overdue">באיחור</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תאריך יעד</FormLabel>
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

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הערות</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="הערות..."
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
              <Button type="submit" disabled={createRecord.isPending || updateRecord.isPending}>
                {record ? "עדכן" : "צור"} רשומה
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
