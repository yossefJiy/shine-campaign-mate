import { useState, useMemo } from "react";
import { Building2, ChevronDown, Check, X, Plus, Loader2, Crown, Search, Eye, Star } from "lucide-react";
import { useClient } from "@/hooks/useClient";
import { useRoleSimulation } from "@/hooks/useRoleSimulation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateClientDialog } from "@/components/client/CreateClientDialog";
import { AgencySettingsQuickAccess } from "@/components/settings/AgencySettingsQuickAccess";
import logoIcon from "@/assets/logo-icon.svg";
import logoText from "@/assets/logo-text.svg";
import { toast } from "sonner";

interface ClientSwitcherProps {
  collapsed?: boolean;
}

export function ClientSwitcher({ collapsed = false }: ClientSwitcherProps) {
  const { selectedClient, setSelectedClient, clients, isLoading, isSingleClientMode } = useClient();
  const { isSimulating, simulatedClientName, simulatedContactName } = useRoleSimulation();
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Check if selected client is the master account (JIY) - must be before early returns
  const { data: masterClient } = useQuery({
    queryKey: ["master-client-switcher"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, name")
        .eq("is_master_account", true)
        .single();
      return data;
    },
  });

  // Toggle favorite mutation - must be before early returns
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ clientId, isFavorite }: { clientId: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from("clients")
        .update({ is_favorite: isFavorite })
        .eq("id", clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: () => {
      toast.error("שגיאה בעדכון מועדף");
    },
  });

  const isClientMasterAccount = (client: { id: string; is_master_account?: boolean }) => {
    return client.id === masterClient?.id || (client as any).is_master_account === true;
  };

  const isClientAgencyBrand = (client: any) => {
    return client.is_agency_brand === true;
  };

  // Separate favorites, regular clients, agency brands, and master accounts - must be before early returns
  const { favoriteClients, regularClients, agencyBrands, masterAccounts } = useMemo(() => {
    const favorites: typeof clients = [];
    const regular: typeof clients = [];
    const brands: typeof clients = [];
    const master: typeof clients = [];
    
    clients.forEach(client => {
      if (isClientMasterAccount(client)) {
        master.push(client);
      } else if ((client as any).is_favorite) {
        favorites.push(client);
      } else if (isClientAgencyBrand(client)) {
        brands.push(client);
      } else {
        regular.push(client);
      }
    });

    // Filter by search
    const filterFn = (c: typeof clients[0]) => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry?.toLowerCase().includes(searchQuery.toLowerCase());

    return {
      favoriteClients: favorites.filter(filterFn).sort((a, b) => a.name.localeCompare(b.name, 'he')),
      regularClients: regular.filter(filterFn).sort((a, b) => a.name.localeCompare(b.name, 'he')),
      agencyBrands: brands.filter(filterFn).sort((a, b) => a.name.localeCompare(b.name, 'he')),
      masterAccounts: master.filter(filterFn),
    };
  }, [clients, searchQuery, masterClient]);

  const isSelectedMaster = selectedClient && isClientMasterAccount(selectedClient);

  const handleToggleFavorite = (e: React.MouseEvent, clientId: string, currentFavorite: boolean) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavoriteMutation.mutate({ clientId, isFavorite: !currentFavorite });
  };
  
  // Hide switcher for single-client contacts - just show their client name (after all hooks)
  if (isSingleClientMode && selectedClient && !isSimulating) {
    return (
      <div className={cn(
        "w-full h-12 px-3 bg-muted/30 border border-border/50 rounded-md flex items-center gap-3",
        collapsed && "px-2 justify-center"
      )}>
        {selectedClient.logo_url ? (
          <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
            <img src={selectedClient.logo_url} alt={selectedClient.name} className="w-full h-full object-contain p-0.5" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center font-bold text-sm shrink-0 text-primary">
            {selectedClient.name.charAt(0)}
          </div>
        )}
        {!collapsed && (
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium truncate">{selectedClient.name}</span>
            {selectedClient.industry && (
              <span className="text-xs text-muted-foreground truncate">{selectedClient.industry}</span>
            )}
          </div>
        )}
      </div>
    );
  }


  // Render client item
  const renderClientItem = (client: typeof clients[0], showFavoriteStar = true) => (
    <DropdownMenuItem
      key={client.id}
      onClick={() => setSelectedClient(client)}
      className="flex items-center gap-3 cursor-pointer group"
    >
      {showFavoriteStar && (
        <button
          onClick={(e) => handleToggleFavorite(e, client.id, (client as any).is_favorite || false)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Star 
            className={cn(
              "w-4 h-4",
              (client as any).is_favorite 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-muted-foreground hover:text-yellow-400"
            )} 
          />
        </button>
      )}
      {client.logo_url ? (
        <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
          <img 
            src={client.logo_url} 
            alt={client.name}
            className="w-full h-full object-contain p-0.5"
          />
        </div>
      ) : (
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
          isClientAgencyBrand(client) ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
        )}>
          {client.name.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{client.name}</p>
        {client.industry && (
          <p className="text-xs text-muted-foreground truncate">{client.industry}</p>
        )}
      </div>
      {selectedClient?.id === client.id && (
        <Check className="w-4 h-4 text-primary shrink-0" />
      )}
    </DropdownMenuItem>
  );

  // When simulating, show locked simulation display
  if (isSimulating && simulatedClientName) {
    return (
      <div className={cn(
        "w-full h-auto px-3 py-2.5 bg-blue-500/10 border border-blue-500/30 rounded-md flex items-center gap-3",
        collapsed && "px-2 justify-center"
      )}>
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
          <Eye className="w-4 h-4 text-blue-500" />
        </div>
        {!collapsed && (
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground truncate">{simulatedClientName}</span>
            </div>
            {simulatedContactName && (
              <span className="text-xs text-blue-500 truncate">
                👤 {simulatedContactName}
              </span>
            )}
            <span className="text-[10px] text-blue-500/70 font-medium">
              מצב סימולציה
            </span>
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn(
        "w-full h-12 px-3 bg-muted/30 border border-border/50 rounded-md flex items-center gap-3",
        collapsed && "px-2 justify-center"
      )}>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center animate-pulse">
          <img src={logoIcon} alt="" className="w-5 h-5 animate-fade-in" />
        </div>
        {!collapsed && (
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">טוען...</span>
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
            </div>
            <span className="text-xs text-muted-foreground/60">
              קמפיינים, משימות, צוות ולקוחות
            </span>
          </div>
        )}
      </div>
    );
  }

  // Check if current selection is master account (agency view)
  const isAgencyView = selectedClient && isClientMasterAccount(selectedClient);

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "flex-1 justify-between gap-2 h-12 px-3 bg-muted/30 hover:bg-muted/50 border border-border/50",
              collapsed && "px-2 justify-center"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                selectedClient ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {selectedClient ? (
                  <span className="font-bold text-sm">{selectedClient.name.charAt(0)}</span>
                ) : (
                  <Building2 className="w-4 h-4" />
                )}
              </div>
              {!collapsed && (
                <div className="flex flex-col items-start text-right truncate">
                  <span className="text-sm font-medium truncate max-w-[140px]">
                    {selectedClient?.name || "בחר לקוח"}
                  </span>
                  {selectedClient?.industry && (
                    <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                      {selectedClient.industry}
                    </span>
                  )}
                </div>
              )}
            </div>
            {!collapsed && <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
          </Button>
        </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 max-h-[calc(100vh-200px)] overflow-hidden flex flex-col">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>לקוחות</span>
          {selectedClient && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.preventDefault();
                setSelectedClient(null);
              }}
            >
              <X className="w-3 h-3 ml-1" />
              נקה
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Search Input */}
        <div className="px-2 py-2">
          <div className="relative">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לקוח..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-8 h-8 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <DropdownMenuSeparator />
        
        <div className="flex-1 overflow-y-auto">
          {clients.length === 0 ? (
            <div className="px-2 py-4 text-sm text-center text-muted-foreground">
              אין לקוחות עדיין
            </div>
          ) : (
            <>
              {/* Master accounts section - at the top */}
              {masterAccounts.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    חשבון סוכנות
                  </DropdownMenuLabel>
                  {masterAccounts.map((client) => (
                    <DropdownMenuItem
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className="flex items-center gap-3 cursor-pointer bg-muted/30"
                    >
                      {client.logo_url ? (
                        <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                          <img src={client.logo_url} alt={client.name} className="w-full h-full object-contain p-0.5" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 bg-primary/20 text-primary">
                          <Crown className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{client.name}</p>
                        <p className="text-xs text-muted-foreground">חשבון על</p>
                      </div>
                      {selectedClient?.id === client.id && (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  
                  {/* Agency brands - below master account */}
                  {agencyBrands.length > 0 && (
                    <>
                      <div className="px-2 py-1">
                        <p className="text-[10px] text-muted-foreground/60">מותגי הסוכנות</p>
                      </div>
                      {agencyBrands.map((client) => renderClientItem(client, false))}
                    </>
                  )}
                  
                  {/* Gold separator between agency and clients */}
                  <div className="my-2 mx-2">
                    <div className="h-[2px] bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent" />
                  </div>
                </>
              )}

              {/* Favorite clients - at the top of search results */}
              {favoriteClients.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    מועדפים
                  </DropdownMenuLabel>
                  {favoriteClients.map((client) => renderClientItem(client))}
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Regular clients */}
              {regularClients.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    לקוחות
                  </DropdownMenuLabel>
                  {regularClients.map((client) => renderClientItem(client))}
                </>
              )}

              {regularClients.length === 0 && favoriteClients.length === 0 && searchQuery && (
                <div className="px-2 py-4 text-sm text-center text-muted-foreground">
                  לא נמצאו לקוחות
                </div>
              )}
            </>
          )}
        </div>
        
        <DropdownMenuSeparator />
        <div className="p-1">
          <CreateClientDialog 
            trigger={
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-primary">
                <Plus className="w-4 h-4" />
                לקוח חדש
              </Button>
            }
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
    {/* Show agency settings icon only when master account is selected */}
    {isAgencyView && !collapsed && <AgencySettingsQuickAccess />}
    </div>
  );
}
