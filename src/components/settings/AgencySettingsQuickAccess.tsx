import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AgencySettingsSection } from "@/components/settings/AgencySettingsSection";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AgencySettingsQuickAccess() {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>הגדרות סוכנות</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent 
        align="start" 
        className="w-[420px] p-0 max-h-[80vh] overflow-y-auto"
        sideOffset={8}
      >
        <AgencySettingsSection />
      </PopoverContent>
    </Popover>
  );
}
