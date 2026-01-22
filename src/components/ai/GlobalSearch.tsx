import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CheckSquare, FolderKanban, User, Settings, Command } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface SearchResult {
  id: string;
  type: "task" | "project" | "team" | "action";
  title: string;
  subtitle?: string;
  icon: typeof CheckSquare;
  path: string;
}

const quickActions: SearchResult[] = [
  { id: "new-task", type: "action", title: "משימה חדשה", icon: CheckSquare, path: "/tasks?new=true" },
  { id: "new-project", type: "action", title: "פרויקט חדש", icon: FolderKanban, path: "/projects?new=true" },
  { id: "settings", type: "action", title: "הגדרות", icon: Settings, path: "/settings" },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Search tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ["search-tasks", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const { data } = await supabase
        .from("tasks")
        .select("id, title, status")
        .ilike("title", `%${query}%`)
        .limit(5);
      return (data || []).map((t): SearchResult => ({
        id: t.id,
        type: "task",
        title: t.title,
        subtitle: t.status === "completed" ? "הושלם" : t.status === "in-progress" ? "בתהליך" : "ממתין",
        icon: CheckSquare,
        path: `/tasks?highlight=${t.id}`,
      }));
    },
    enabled: query.length >= 2,
  });

  // Search projects
  const { data: projects = [] } = useQuery({
    queryKey: ["search-projects", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const { data } = await supabase
        .from("projects")
        .select("id, name, status")
        .ilike("name", `%${query}%`)
        .limit(5);
      return (data || []).map((p): SearchResult => ({
        id: p.id,
        type: "project",
        title: p.name,
        subtitle: p.status === "active" ? "פעיל" : "מושהה",
        icon: FolderKanban,
        path: `/projects?highlight=${p.id}`,
      }));
    },
    enabled: query.length >= 2,
  });

  // Search team
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["search-team", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const { data } = await supabase
        .from("team")
        .select("id, name, departments")
        .eq("is_active", true)
        .ilike("name", `%${query}%`)
        .limit(3);
      return (data || []).map((m): SearchResult => ({
        id: m.id,
        type: "team",
        title: m.name,
        subtitle: m.departments?.[0] || "חבר צוות",
        icon: User,
        path: `/team?highlight=${m.id}`,
      }));
    },
    enabled: query.length >= 2,
  });

  const results: SearchResult[] = query.length >= 2 
    ? [...tasks, ...projects, ...teamMembers]
    : quickActions;

  const handleSelect = useCallback((result: SearchResult) => {
    setOpen(false);
    setQuery("");
    navigate(result.path);
  }, [navigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, results, selectedIndex, handleSelect]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors w-full max-w-xs"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-right">חיפוש...</span>
        <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 text-xs bg-background border border-border rounded">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חפש משימות, פרויקטים, אנשי צוות..."
              className="border-0 focus-visible:ring-0 text-base h-14"
              autoFocus
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto p-2">
            {results.length === 0 && query.length >= 2 && (
              <div className="py-8 text-center text-muted-foreground">
                לא נמצאו תוצאות
              </div>
            )}

            {query.length < 2 && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                פעולות מהירות
              </div>
            )}

            {results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-right transition-colors",
                  index === selectedIndex 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                )}
              >
                <result.icon className={cn(
                  "w-5 h-5 shrink-0",
                  index === selectedIndex ? "text-primary-foreground" : "text-muted-foreground"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{result.title}</div>
                  {result.subtitle && (
                    <div className={cn(
                      "text-sm truncate",
                      index === selectedIndex ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {result.subtitle}
                    </div>
                  )}
                </div>
                <div className={cn(
                  "text-xs px-1.5 py-0.5 rounded",
                  index === selectedIndex 
                    ? "bg-primary-foreground/20" 
                    : "bg-muted"
                )}>
                  {result.type === "task" && "משימה"}
                  {result.type === "project" && "פרויקט"}
                  {result.type === "team" && "צוות"}
                  {result.type === "action" && "פעולה"}
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 px-4 py-2 text-xs text-muted-foreground border-t border-border bg-muted/30">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">↑↓</kbd>
              ניווט
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">Enter</kbd>
              בחירה
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">Esc</kbd>
              סגירה
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}