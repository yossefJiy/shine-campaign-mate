import { motion } from "framer-motion";
import { Trophy, Flame, Medal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  rank: number;
  points: number;
  tasks_completed: number;
  current_streak: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  period?: "weekly" | "monthly" | "all_time";
}

export function Leaderboard({ 
  entries, 
  currentUserId,
  period = "weekly" 
}: LeaderboardProps) {
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bg: "bg-gradient-to-r from-yellow-500/20 to-amber-500/20",
          border: "border-yellow-500/30",
          icon: "🥇",
        };
      case 2:
        return {
          bg: "bg-gradient-to-r from-gray-300/20 to-slate-400/20",
          border: "border-gray-400/30",
          icon: "🥈",
        };
      case 3:
        return {
          bg: "bg-gradient-to-r from-amber-600/20 to-orange-600/20",
          border: "border-amber-600/30",
          icon: "🥉",
        };
      default:
        return {
          bg: "bg-muted/50",
          border: "border-border",
          icon: null,
        };
    }
  };

  const periodLabels = {
    weekly: "השבוע",
    monthly: "החודש",
    all_time: "כל הזמנים",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          לידרבורד - {periodLabels[period]}
        </h3>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Medal className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>אין נתונים עדיין</p>
          <p className="text-sm">השלם משימות כדי להופיע בלידרבורד!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => {
            const rankStyle = getRankStyle(entry.rank);
            const isCurrentUser = entry.user_id === currentUserId;

            return (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all",
                  rankStyle.bg,
                  rankStyle.border,
                  isCurrentUser && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
              >
                {/* Rank */}
                <div className="w-8 text-center shrink-0">
                  {rankStyle.icon ? (
                    <span className="text-xl">{rankStyle.icon}</span>
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">
                      {entry.rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className={cn(
                    "text-sm font-medium",
                    entry.rank <= 3 ? "bg-primary/20 text-primary" : "bg-muted"
                  )}>
                    {entry.user_name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {entry.user_name}
                    {isCurrentUser && (
                      <span className="text-xs text-primary mr-1">(אתה)</span>
                    )}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{entry.tasks_completed} משימות</span>
                    {entry.current_streak > 0 && (
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        {entry.current_streak}
                      </span>
                    )}
                  </div>
                </div>

                {/* Points */}
                <div className="text-left shrink-0">
                  <p className="font-bold text-primary">{entry.points.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">נקודות</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
