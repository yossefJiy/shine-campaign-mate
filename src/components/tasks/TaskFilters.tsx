import { 
  User, 
  Building2, 
  Calendar, 
  List, 
  LayoutGrid,
  FolderKanban,
  Users,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

export type FilterType = "all" | "assignee" | "department" | "date" | "client" | "project" | "team" | "language";
export type ViewMode = "list" | "grid";

interface Project {
  id: string;
  name: string;
  color: string | null;
}

interface Client {
  id: string;
  name: string;
}

interface TaskFiltersProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  selectedValue: string;
  onSelectedValueChange: (value: string) => void;
  selectedDate: Date | undefined;
  onSelectedDateChange: (date: Date | undefined) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  assignees: string[];
  departments: string[];
  clients: Client[];
  projects: Project[];
  orgTeams?: { id: string; name: string }[];
}

export function TaskFilters({
  filter,
  onFilterChange,
  selectedValue,
  onSelectedValueChange,
  selectedDate,
  onSelectedDateChange,
  viewMode,
  onViewModeChange,
  assignees,
  departments,
  clients,
  projects,
  orgTeams = [],
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          <button
            onClick={() => { onFilterChange("all"); onSelectedValueChange(""); }}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              filter === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            הכל
          </button>
          <button
            onClick={() => onFilterChange("assignee")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
              filter === "assignee" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            <User className="w-3 h-3" />
            עובד
          </button>
          <button
            onClick={() => onFilterChange("department")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
              filter === "department" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            <Building2 className="w-3 h-3" />
            מחלקה
          </button>
          <button
            onClick={() => onFilterChange("date")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
              filter === "date" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            <Calendar className="w-3 h-3" />
            תאריך
          </button>
          <button
            onClick={() => onFilterChange("client")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
              filter === "client" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            <Building2 className="w-3 h-3" />
            לקוח
          </button>
          <button
            onClick={() => onFilterChange("project")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
              filter === "project" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            <FolderKanban className="w-3 h-3" />
            פרויקט
          </button>
          <button
            onClick={() => onFilterChange("team")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
              filter === "team" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            <Users className="w-3 h-3" />
            צוות
          </button>
          <button
            onClick={() => onFilterChange("language")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
              filter === "language" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            <Globe className="w-3 h-3" />
            שפה
          </button>
        </div>

        {(filter === "assignee" || filter === "department" || filter === "client" || filter === "project" || filter === "team" || filter === "language") && (
          <Select value={selectedValue} onValueChange={onSelectedValueChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={
                filter === "assignee" ? "בחר עובד" : 
                filter === "department" ? "בחר מחלקה" : 
                filter === "client" ? "בחר לקוח" :
                filter === "project" ? "בחר פרויקט" :
                filter === "team" ? "בחר צוות" :
                "בחר שפה"
              } />
                "בחר פרויקט"
              } />
            </SelectTrigger>
            <SelectContent>
              {filter === "assignee" && assignees.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              {filter === "department" && departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              {filter === "client" && clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              {filter === "project" && projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              {filter === "team" && orgTeams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              {filter === "language" && (
                <>
                  <SelectItem value="he">עברית</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        )}

        {filter === "date" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-40 justify-start text-right">
                <Calendar className="w-4 h-4 ml-2" />
                {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "בחר תאריך"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={onSelectedDateChange}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
        <button
          onClick={() => onViewModeChange("list")}
          className={cn("p-2 rounded-md transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewModeChange("grid")}
          className={cn("p-2 rounded-md transition-colors", viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
