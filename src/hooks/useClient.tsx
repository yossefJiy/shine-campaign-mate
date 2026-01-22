import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, usePermissions } from "@/hooks/useAuth";

interface Client {
  id: string;
  name: string;
  industry: string | null;
  logo_url: string | null;
  description: string | null;
  website: string | null;
  is_master_account?: boolean;
}

interface ClientContextType {
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
  clients: Client[];
  isLoading: boolean;
  masterAccount: Client | null;
  /** Returns selectedClient if set, otherwise masterAccount */
  effectiveClient: Client | null;
  /** True if user is viewing agency/master context (no specific client selected) */
  isAgencyView: boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [selectedClient, setSelectedClientState] = useState<Client | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { isClient } = usePermissions();
  const queryClient = useQueryClient();

  // Refetch clients when user changes
  useEffect(() => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
    }
  }, [user, queryClient]);

  // Fetch clients that the user has access to
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["all-clients", user?.id],
    queryFn: async () => {
      // For client users, only fetch their assigned clients
      if (isClient && user) {
        const { data: clientUsers } = await supabase
          .from("client_users")
          .select("client_id")
          .eq("user_id", user.id);
        
        if (clientUsers && clientUsers.length > 0) {
          const clientIds = clientUsers.map(cu => cu.client_id);
          const { data, error } = await supabase
            .from("clients")
            .select("*")
            .in("id", clientIds)
            .is("deleted_at", null)
            .order("name", { ascending: true });
          if (error) throw error;
          return data as Client[];
        }
        return [];
      }
      
      // For agency users, fetch all active (non-deleted) clients
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .is("deleted_at", null)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Client[];
    },
    enabled: !authLoading && !!user,
  });

  // Get master account from clients list
  const masterAccount = useMemo(() => {
    return clients.find(c => c.is_master_account) || null;
  }, [clients]);

  // Effective client: selectedClient or masterAccount as fallback
  const effectiveClient = useMemo(() => {
    return selectedClient || masterAccount;
  }, [selectedClient, masterAccount]);

  // Is user viewing agency context (no specific client selected)
  const isAgencyView = !selectedClient || selectedClient.is_master_account === true;

  // Load from localStorage on mount and validate
  // For client users, auto-select their client if they only have one
  useEffect(() => {
    if (clients.length === 0) return;
    
    const saved = localStorage.getItem("selectedClientId");
    
    // For client users with only one client, auto-select it
    if (isClient && clients.length === 1 && !selectedClient) {
      setSelectedClientState(clients[0]);
      localStorage.setItem("selectedClientId", clients[0].id);
      return;
    }
    
    // Try to restore from localStorage
    if (saved) {
      const client = clients.find(c => c.id === saved);
      if (client) {
        setSelectedClientState(client);
      } else {
        // Client doesn't exist anymore - clean up localStorage
        localStorage.removeItem("selectedClientId");
        // For client users, auto-select first available
        if (isClient && clients.length > 0) {
          setSelectedClientState(clients[0]);
          localStorage.setItem("selectedClientId", clients[0].id);
        } else {
          setSelectedClientState(null);
        }
      }
    } else if (isClient && clients.length > 0) {
      // No saved client, but user is a client - auto-select
      setSelectedClientState(clients[0]);
      localStorage.setItem("selectedClientId", clients[0].id);
    }
  }, [clients, isClient]);

  const setSelectedClient = (client: Client | null) => {
    setSelectedClientState(client);
    if (client) {
      localStorage.setItem("selectedClientId", client.id);
    } else {
      localStorage.removeItem("selectedClientId");
    }
  };

  return (
    <ClientContext.Provider value={{ 
      selectedClient, 
      setSelectedClient, 
      clients, 
      isLoading: isLoading || authLoading,
      masterAccount,
      effectiveClient,
      isAgencyView,
    }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error("useClient must be used within ClientProvider");
  }
  return context;
}
