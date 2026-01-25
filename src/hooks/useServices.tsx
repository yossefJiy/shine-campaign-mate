import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  base_price: number;
  pricing_type: "fixed" | "hourly" | "package" | "retainer" | "commission";
  unit: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ClientService {
  id: string;
  client_id: string;
  service_id: string;
  custom_price: number | null;
  quantity: number;
  billing_cycle: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
  services?: Service;
}

export function useServices() {
  const queryClient = useQueryClient();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data as Service[];
    },
  });

  const createService = useMutation({
    mutationFn: async (data: Omit<Service, "id" | "created_at" | "updated_at">) => {
      const { data: result, error } = await supabase
        .from("services")
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("השירות נוצר בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה ביצירת השירות: " + error.message);
    },
  });

  const updateService = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Service> & { id: string }) => {
      const { error } = await supabase
        .from("services")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("השירות עודכן");
    },
    onError: (error) => {
      toast.error("שגיאה בעדכון: " + error.message);
    },
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("השירות נמחק");
    },
    onError: (error) => {
      toast.error("שגיאה במחיקה: " + error.message);
    },
  });

  return {
    services,
    isLoading,
    createService,
    updateService,
    deleteService,
  };
}

export function useClientServices(clientId?: string) {
  const queryClient = useQueryClient();

  const { data: clientServices = [], isLoading } = useQuery({
    queryKey: ["client-services", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from("client_services")
        .select("*, services(*)")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as ClientService[];
    },
    enabled: !!clientId,
  });

  const addServiceToClient = useMutation({
    mutationFn: async (data: { client_id: string; service_id: string; custom_price?: number; quantity?: number; billing_cycle?: string }) => {
      const { error } = await supabase
        .from("client_services")
        .insert({
          client_id: data.client_id,
          service_id: data.service_id,
          custom_price: data.custom_price,
          quantity: data.quantity || 1,
          billing_cycle: data.billing_cycle || "monthly",
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-services"] });
      toast.success("השירות נוסף ללקוח");
    },
    onError: (error) => {
      toast.error("שגיאה בהוספת השירות: " + error.message);
    },
  });

  const updateClientService = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ClientService> & { id: string }) => {
      const { error } = await supabase
        .from("client_services")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-services"] });
      toast.success("עודכן");
    },
  });

  const removeClientService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("client_services")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-services"] });
      toast.success("השירות הוסר");
    },
  });

  return {
    clientServices,
    isLoading,
    addServiceToClient,
    updateClientService,
    removeClientService,
  };
}
