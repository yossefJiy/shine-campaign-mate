import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleFieldProps {
  label: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  hasValue?: boolean;
  children: React.ReactNode;
}

export function CollapsibleField({ label, icon, isExpanded, onToggle, hasValue, children }: CollapsibleFieldProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden transition-all duration-200">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        className={cn(
          "w-full flex items-center justify-between p-3 text-sm transition-colors cursor-pointer",
          isExpanded ? "bg-muted/50" : "bg-muted/30 hover:bg-muted/50",
          hasValue && !isExpanded && "border-r-2 border-success"
        )}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          {hasValue && !isExpanded ? (
            <Check className="w-4 h-4 text-success" />
          ) : (
            icon
          )}
          <span className={cn(hasValue && !isExpanded && "text-success")}>{label}</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} />
      </div>
      {isExpanded && (
        <div
          className="p-3 pt-0 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pt-3">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
