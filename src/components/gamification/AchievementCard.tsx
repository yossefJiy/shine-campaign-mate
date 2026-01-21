import { motion } from "framer-motion";
import { 
  Trophy, 
  Flame, 
  Star, 
  Zap, 
  Rocket, 
  Crown, 
  Sparkles,
  Gem,
  Folder,
  Briefcase,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AchievementCardProps {
  name: string;
  description: string;
  icon: string;
  rarity: string;
  pointsReward: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  onClick?: () => void;
}

const iconMap: Record<string, LucideIcon> = {
  trophy: Trophy,
  flame: Flame,
  fire: Flame,
  star: Star,
  zap: Zap,
  rocket: Rocket,
  crown: Crown,
  sparkles: Sparkles,
  gem: Gem,
  folder: Folder,
  briefcase: Briefcase,
};

const rarityConfig = {
  common: {
    bg: "bg-muted",
    border: "border-border",
    text: "text-foreground",
    badge: "bg-muted text-muted-foreground",
    label: "נפוץ",
  },
  rare: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-500",
    badge: "bg-blue-500/20 text-blue-500",
    label: "נדיר",
  },
  epic: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-500",
    badge: "bg-purple-500/20 text-purple-500",
    label: "אפי",
  },
  legendary: {
    bg: "bg-gradient-to-br from-yellow-500/20 to-orange-500/20",
    border: "border-yellow-500/30",
    text: "text-yellow-500",
    badge: "bg-yellow-500/20 text-yellow-500",
    label: "אגדי",
  },
};

export function AchievementCard({
  name,
  description,
  icon,
  rarity,
  pointsReward,
  isUnlocked,
  unlockedAt,
  onClick,
}: AchievementCardProps) {
  const IconComponent = iconMap[icon] || Trophy;
  const config = rarityConfig[rarity as keyof typeof rarityConfig] || rarityConfig.common;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={isUnlocked ? { scale: 1.02 } : undefined}
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl border transition-all cursor-pointer",
        isUnlocked ? config.bg : "bg-muted/50",
        isUnlocked ? config.border : "border-border",
        !isUnlocked && "opacity-50 grayscale"
      )}
    >
      {/* Rarity Badge */}
      <Badge className={cn("absolute top-2 left-2 text-xs", config.badge)}>
        {config.label}
      </Badge>

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          isUnlocked ? config.bg : "bg-muted"
        )}>
          <IconComponent className={cn(
            "w-6 h-6",
            isUnlocked ? config.text : "text-muted-foreground"
          )} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1">{name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
          
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 text-xs text-primary">
              <Trophy className="w-3 h-3" />
              <span>+{pointsReward}</span>
            </div>
            {isUnlocked && unlockedAt && (
              <span className="text-xs text-muted-foreground">
                {new Date(unlockedAt).toLocaleDateString("he-IL")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Locked overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl">
          <span className="text-2xl">🔒</span>
        </div>
      )}

      {/* Legendary glow */}
      {isUnlocked && rarity === "legendary" && (
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10 pointer-events-none"
        />
      )}
    </motion.div>
  );
}
