import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoleSimulation } from "@/hooks/useRoleSimulation";
import { ClientModules } from "@/hooks/useClientModules";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

interface SimulationProtectedRouteProps {
  children: React.ReactNode;
  moduleKey?: keyof ClientModules;
}

// Map paths to module keys
const PATH_TO_MODULE: Record<string, keyof ClientModules> = {
  '/dashboard': 'dashboard',
  '/projects': 'projects',
  '/tasks': 'tasks',
  '/billing': 'billing',
  '/team': 'team',
};

// Admin-only paths that simulated users should not access
const ADMIN_ONLY_PATHS = [
  '/settings',
  '/clients',
];

const SimulationProtectedRoute = ({ children, moduleKey }: SimulationProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { isSimulating, simulatedModules } = useRoleSimulation();
  const location = useLocation();
  const hasShownToast = useRef(false);

  // Reset toast flag when path changes
  useEffect(() => {
    hasShownToast.current = false;
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check simulation restrictions
  if (isSimulating) {
    const currentPath = location.pathname;

    // Block admin-only paths during simulation
    if (ADMIN_ONLY_PATHS.some(path => currentPath.startsWith(path))) {
      if (!hasShownToast.current) {
        toast.error("אין לך הרשאה לדף זה במצב סימולציה");
        hasShownToast.current = true;
      }
      return <Navigate to="/dashboard" replace />;
    }

    // Check module access
    const pathModuleKey = moduleKey || PATH_TO_MODULE[currentPath];
    if (pathModuleKey && simulatedModules) {
      const hasAccess = simulatedModules[pathModuleKey];
      if (!hasAccess) {
        if (!hasShownToast.current) {
          toast.error("אין לך הרשאה לדף זה");
          hasShownToast.current = true;
        }
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default SimulationProtectedRoute;