import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCounterProps {
  streak: number;
  longestStreak?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function StreakCounter({ 
  streak, 
  longestStreak, 
  size = "md",
  showLabel = true 
}: StreakCounterProps) {
  const isActive = streak > 0;
  const isHot = streak >= 7;
  const isOnFire = streak >= 30;

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-28 h-28",
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "relative rounded-full flex flex-col items-center justify-center",
          sizeClasses[size],
          isActive 
            ? "bg-gradient-to-br from-orange-400 to-red-500" 
            : "bg-muted"
        )}
      >
        {/* Glow effect for hot streaks */}
        {isHot && (
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="absolute inset-0 rounded-full bg-orange-500/30 blur-md"
          />
        )}

        {/* Fire particles for on-fire streaks */}
        {isOnFire && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [-5, -20],
                  x: [0, (i - 1) * 10],
                  opacity: [1, 0],
                  scale: [1, 0.5],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="absolute top-0 w-2 h-2 rounded-full bg-yellow-400"
              />
            ))}
          </>
        )}

        <Flame 
          className={cn(
            iconSizes[size],
            isActive ? "text-white" : "text-muted-foreground",
            isActive && "drop-shadow-lg"
          )} 
        />
        <span className={cn(
          "font-bold mt-0.5",
          textSizes[size],
          isActive ? "text-white" : "text-muted-foreground"
        )}>
          {streak}
        </span>
      </motion.div>

      {showLabel && (
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {isOnFire ? "🔥 On Fire!" : isHot ? "חם!" : isActive ? "רצף פעיל" : "התחל רצף"}
          </p>
          {longestStreak !== undefined && longestStreak > 0 && (
            <p className="text-xs text-muted-foreground">
              שיא: {longestStreak} ימים
            </p>
          )}
        </div>
      )}
    </div>
  );
}
