import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ClientProvider } from "@/hooks/useClient";
import { RoleSimulationProvider } from "@/hooks/useRoleSimulation";
import ProtectedRoute from "@/components/ProtectedRoute";

// Core pages
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Projects from "./pages/Projects";
import Proposals from "./pages/Proposals";
import Clients from "./pages/Clients";
import ClientProfile from "./pages/ClientProfile";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import ClientProposalView from "./pages/ClientProposalView";
import SetPassword from "./pages/SetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RoleSimulationProvider>
        <ClientProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Redirect root to dashboard */}
                <Route path="/" element={<Navigate to="/projects" replace />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/set-password" element={<SetPassword />} />
                
                {/* Public client views */}
                <Route path="/p/:token" element={<ClientProposalView />} />
                
                {/* Protected routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                <Route path="/proposals" element={<ProtectedRoute><Proposals /></ProtectedRoute>} />
                <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
                <Route path="/clients/:id" element={<ProtectedRoute><ClientProfile /></ProtectedRoute>} />
                <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
                <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                
                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ClientProvider>
      </RoleSimulationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
