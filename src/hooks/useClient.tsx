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
  /** True if user is viewing agency/master context (no specific client selected or master selected) */
  isAgencyView: boolean;
  /** True if user is a contact with single-client access (no switcher) */
  isSingleClientMode: boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [selectedClient, setSelectedClientState] = useState<Client | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { isClient, isEmployee, isTeamManager, isAgencyManager, isAdmin } = usePermissions();
  const queryClient = useQueryClient();

  // Refetch clients when user changes
  useEffect(() => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
    }
  }, [user, queryClient]);

  // Fetch clients that the user has access to based on their role
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["all-clients", user?.id],
    queryFn: async () => {
      // For client users (contacts) - only fetch their assigned clients via client_users
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
      
      // For team members (employees, team managers) - fetch clients they're assigned to via client_team
      if ((isEmployee || isTeamManager) && !isAgencyManager && !isAdmin && user) {
        // Get team member ID from user email
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser?.email) return [];
        
        const { data: teamMember } = await supabase
          .from("team")
          .select("id")
          .eq("email", authUser.email)
          .eq("is_active", true)
          .single();
        
        if (!teamMember) return [];
        
        // Get clients assigned to this team member
        const { data: clientAssignments } = await supabase
          .from("client_team")
          .select("client_id")
          .eq("team_member_id", teamMember.id);
        
        if (clientAssignments && clientAssignments.length > 0) {
          const clientIds = clientAssignments.map(ca => ca.client_id);
          
          // Also include master account for agency context
          const { data, error } = await supabase
            .from("clients")
            .select("*")
            .or(`id.in.(${clientIds.join(',')}),is_master_account.eq.true`)
            .is("deleted_at", null)
            .order("name", { ascending: true });
          if (error) throw error;
          return data as Client[];
        }
        
        // If no assignments, still show master account
        const { data: masterOnly } = await supabase
          .from("clients")
          .select("*")
          .eq("is_master_account", true)
          .is("deleted_at", null);
        return (masterOnly || []) as Client[];
      }
      
      // For agency managers and admins - fetch all active (non-deleted) clients
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

  // Is user viewing agency context (no specific client selected or master selected)
  const isAgencyView = !selectedClient || selectedClient.is_master_account === true;
  
  // Is user a contact with single-client access (should not see switcher)
  const isSingleClientMode = isClient && clients.length === 1;

  // Load from localStorage on mount and validate
  // For client users, auto-select their client if they only have one
  useEffect(() => {
    if (clients.length === 0) return;
    
    const saved = localStorage.getItem("selectedClientId");
    
    // For client users with only one client, auto-select it (no switcher needed)
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
      isSingleClientMode,
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
