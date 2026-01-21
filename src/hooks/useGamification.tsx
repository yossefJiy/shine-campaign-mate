import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  current_level: number;
  level_progress: number;
  weekly_points: number;
  monthly_points: number;
  all_time_points: number;
}

export interface DailyStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_start_date: string | null;
  total_active_days: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points_reward: number;
  requirement_type: string;
  requirement_value: number;
  rarity: string;
  is_active: boolean;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  notified: boolean;
  achievement?: Achievement;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  period: string;
  rank: number;
  points: number;
  tasks_completed: number;
  current_streak: number;
}

export function useGamification() {
  const { user } = useAuth();

  // Fetch user points
  const { data: points, refetch: refetchPoints } = useQuery({
    queryKey: ["user-points", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("user_points")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error && error.code !== "PGRST116") {
        console.error("Error fetching points:", error);
        return null;
      }
      
      return data as UserPoints | null;
    },
    enabled: !!user?.id,
  });

  // Fetch daily streak
  const { data: streak, refetch: refetchStreak } = useQuery({
    queryKey: ["daily-streak", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("daily_streaks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error && error.code !== "PGRST116") {
        console.error("Error fetching streak:", error);
        return null;
      }
      
      return data as DailyStreak | null;
    },
    enabled: !!user?.id,
  });

  // Fetch achievements
  const { data: allAchievements = [] } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("is_active", true)
        .order("requirement_value", { ascending: true });
      
      if (error) {
        console.error("Error fetching achievements:", error);
        return [];
      }
      
      return data as Achievement[];
    },
  });

  // Fetch user achievements
  const { data: userAchievements = [], refetch: refetchUserAchievements } = useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("user_achievements")
        .select("*, achievement:achievements(*)")
        .eq("user_id", user.id)
        .order("unlocked_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching user achievements:", error);
        return [];
      }
      
      return data as UserAchievement[];
    },
    enabled: !!user?.id,
  });

  // Fetch leaderboard
  const { data: leaderboard = [] } = useQuery({
    queryKey: ["leaderboard", "weekly"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard_cache")
        .select("*")
        .eq("period", "weekly")
        .order("rank", { ascending: true })
        .limit(10);
      
      if (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
      }
      
      return data as LeaderboardEntry[];
    },
  });

  // Calculate level from points
  const calculateLevel = (totalPoints: number) => {
    // Level thresholds: 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500...
    const baseThreshold = 100;
    let level = 1;
    let threshold = baseThreshold;
    let pointsRemaining = totalPoints;
    
    while (pointsRemaining >= threshold) {
      pointsRemaining -= threshold;
      level++;
      threshold = baseThreshold + (level * 50);
    }
    
    const nextThreshold = baseThreshold + (level * 50);
    const progress = Math.round((pointsRemaining / nextThreshold) * 100);
    
    return { level, progress, pointsToNextLevel: nextThreshold - pointsRemaining };
  };

  const levelInfo = calculateLevel(points?.total_points || 0);

  // Check for unnotified achievements
  const unnotifiedAchievements = userAchievements.filter(ua => !ua.notified);

  const refetchAll = () => {
    refetchPoints();
    refetchStreak();
    refetchUserAchievements();
  };

  return {
    points,
    streak,
    allAchievements,
    userAchievements,
    leaderboard,
    levelInfo,
    unnotifiedAchievements,
    refetchAll,
  };
}
