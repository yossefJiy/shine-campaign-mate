import { motion } from "framer-motion";
import { Trophy, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface PointsBadgeProps {
  points: number;
  level: number;
  progress: number;
  size?: "sm" | "md" | "lg";
  showLevel?: boolean;
}

export function PointsBadge({ 
  points, 
  level, 
  progress,
  size = "md",
  showLevel = true 
}: PointsBadgeProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  };

  // SVG circle properties
  const circleSize = size === "sm" ? 56 : size === "md" ? 88 : 120;
  const strokeWidth = size === "sm" ? 3 : 4;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={cn("relative", sizeClasses[size])}>
        {/* Progress Ring */}
        <svg
          className="absolute inset-0 -rotate-90"
          width={circleSize}
          height={circleSize}
        >
          {/* Background circle */}
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted"
          />
          {/* Progress circle */}
          <motion.circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-primary"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Trophy className={cn(iconSizes[size], "text-primary")} />
          <motion.span
            key={points}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn("font-bold", textSizes[size])}
          >
            {points.toLocaleString()}
          </motion.span>
        </div>
      </div>

      {showLevel && (
        <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
          <Star className="w-4 h-4 text-primary fill-primary" />
          <span className="text-sm font-medium">רמה {level}</span>
        </div>
      )}
    </div>
  );
}
