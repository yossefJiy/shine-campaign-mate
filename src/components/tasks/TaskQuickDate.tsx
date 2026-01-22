import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

interface TaskQuickDateProps {
  taskId: string;
  currentDate: string | null;
  currentTime: string | null;
  compact?: boolean;
  onUpdate?: () => void;
}

const timeOptions = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8;
  return [
    `${hour.toString().padStart(2, "0")}:00`,
    `${hour.toString().padStart(2, "0")}:30`,
  ];
}).flat();

export function TaskQuickDate({
  taskId,
  currentDate,
  currentTime,
  compact = false,
  onUpdate,
}: TaskQuickDateProps) {
  const queryClient = useQueryClient();
  const [dateOpen, setDateOpen] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async (updates: { due_date?: string | null; scheduled_time?: string | null }) => {
      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId);
      if (error) throw error;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData(["tasks"]);
      
      queryClient.setQueriesData({ queryKey: ["tasks"] }, (old: any) => {
        if (!old) return old;
        return old.map((task: any) => 
          task.id === taskId ? { ...task, ...updates } : task
        );
      });
      
      return { previousTasks };
    },
    onError: (err, updates, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
      toast.error("שגיאה בעדכון");
    },
    onSuccess: () => {
      toast.success("עודכן בהצלחה");
      onUpdate?.();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const handleDateChange = (date: Date | undefined) => {
    updateMutation.mutate({ 
      due_date: date ? format(date, "yyyy-MM-dd") : null 
    });
    setDateOpen(false);
  };

  const handleTimeChange = (time: string | null) => {
    updateMutation.mutate({ 
      scheduled_time: time ? `${time}:00` : null 
    });
  };

  const formatDisplayDate = () => {
    if (!currentDate) return null;
    return format(new Date(currentDate), "dd/MM");
  };

  const formatDisplayTime = () => {
    if (!currentTime) return null;
    return currentTime.slice(0, 5);
  };

  return (
    <div className="flex items-center gap-1">
      {/* Date Picker */}
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 gap-1",
              currentDate ? "text-foreground" : "text-muted-foreground",
              compact && "h-6 px-1.5"
            )}
            title="בחר תאריך"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            {currentDate ? (
              <span className="text-xs">{formatDisplayDate()}</span>
            ) : (
              <span className="text-xs">תאריך</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={currentDate ? new Date(currentDate) : undefined}
            onSelect={handleDateChange}
            initialFocus
            className="p-3 pointer-events-auto"
          />
          {currentDate && (
            <div className="border-t p-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-destructive hover:text-destructive"
                onClick={() => handleDateChange(undefined)}
              >
                <X className="w-4 h-4 ml-2" />
                נקה תאריך
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Time Picker */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 gap-1",
              currentTime ? "text-foreground" : "text-muted-foreground",
              compact && "h-6 px-1.5"
            )}
            title="בחר שעה"
          >
            <Clock className="w-3.5 h-3.5" />
            {currentTime ? (
              <span className="text-xs">{formatDisplayTime()}</span>
            ) : (
              <span className="text-xs">שעה</span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuLabel>בחר שעה</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => handleTimeChange(null)}
            className={cn(!currentTime && "bg-muted")}
          >
            <Clock className="w-4 h-4 ml-2 text-muted-foreground" />
            ללא שעה
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="max-h-48 overflow-y-auto">
            {timeOptions.map((time) => (
              <DropdownMenuItem
                key={time}
                onClick={() => handleTimeChange(time)}
                className={cn(currentTime?.startsWith(time) && "bg-muted")}
              >
                <Clock className="w-4 h-4 ml-2 text-muted-foreground" />
                {time}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
