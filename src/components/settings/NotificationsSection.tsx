import { useState, useEffect } from "react";
import { Bell, Mail, Clock, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Skeleton } from "@/components/ui/skeleton";

const REMINDER_HOURS = [
  { value: "1", label: "שעה לפני" },
  { value: "2", label: "שעתיים לפני" },
  { value: "4", label: "4 שעות לפני" },
  { value: "12", label: "12 שעות לפני" },
  { value: "24", label: "יום לפני" },
  { value: "48", label: "יומיים לפני" },
];

const REMINDER_TIMES = [
  { value: "08:00", label: "08:00" },
  { value: "09:00", label: "09:00" },
  { value: "10:00", label: "10:00" },
  { value: "12:00", label: "12:00" },
  { value: "14:00", label: "14:00" },
  { value: "18:00", label: "18:00" },
];

export function NotificationsSection() {
  const { preferences, isLoading, updatePreferences, isUpdating } = useUserPreferences();
  
  const [formData, setFormData] = useState({
    email_task_assigned: true,
    email_task_due_reminder: true,
    email_task_completed: false,
    email_daily_summary: false,
    email_weekly_report: true,
    push_enabled: true,
    push_mentions: true,
    push_task_updates: true,
    reminder_hours_before: 24,
    reminder_time: "09:00",
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        email_task_assigned: preferences.email_task_assigned,
        email_task_due_reminder: preferences.email_task_due_reminder,
        email_task_completed: preferences.email_task_completed,
        email_daily_summary: preferences.email_daily_summary,
        email_weekly_report: preferences.email_weekly_report,
        push_enabled: preferences.push_enabled,
        push_mentions: preferences.push_mentions,
        push_task_updates: preferences.push_task_updates,
        reminder_hours_before: preferences.reminder_hours_before,
        reminder_time: preferences.reminder_time,
      });
    }
  }, [preferences]);

  const handleSave = () => {
    updatePreferences(formData);
  };

  const handleToggle = (key: keyof typeof formData) => {
    setFormData(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          הגדרות התראות
        </CardTitle>
        <CardDescription>
          בחר אילו התראות תרצה לקבל ובאיזה אופן
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="w-4 h-4" />
            התראות באימייל
          </div>
          
          <div className="space-y-3 pr-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="email_task_assigned" className="flex-1">
                משימה הוקצתה אליי
              </Label>
              <Switch
                id="email_task_assigned"
                checked={formData.email_task_assigned}
                onCheckedChange={() => handleToggle("email_task_assigned")}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="email_task_due_reminder" className="flex-1">
                תזכורת לפני תאריך יעד
              </Label>
              <Switch
                id="email_task_due_reminder"
                checked={formData.email_task_due_reminder}
                onCheckedChange={() => handleToggle("email_task_due_reminder")}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="email_task_completed" className="flex-1">
                משימה שלי הושלמה
              </Label>
              <Switch
                id="email_task_completed"
                checked={formData.email_task_completed}
                onCheckedChange={() => handleToggle("email_task_completed")}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="email_daily_summary" className="flex-1">
                סיכום יומי
              </Label>
              <Switch
                id="email_daily_summary"
                checked={formData.email_daily_summary}
                onCheckedChange={() => handleToggle("email_daily_summary")}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="email_weekly_report" className="flex-1">
                דוח שבועי
              </Label>
              <Switch
                id="email_weekly_report"
                checked={formData.email_weekly_report}
                onCheckedChange={() => handleToggle("email_weekly_report")}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Push Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Smartphone className="w-4 h-4" />
            התראות באפליקציה
          </div>
          
          <div className="space-y-3 pr-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="push_enabled" className="flex-1">
                הפעל התראות
              </Label>
              <Switch
                id="push_enabled"
                checked={formData.push_enabled}
                onCheckedChange={() => handleToggle("push_enabled")}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="push_mentions" className="flex-1">
                כשמישהו מזכיר אותי
              </Label>
              <Switch
                id="push_mentions"
                checked={formData.push_mentions}
                onCheckedChange={() => handleToggle("push_mentions")}
                disabled={!formData.push_enabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="push_task_updates" className="flex-1">
                עדכונים על משימות
              </Label>
              <Switch
                id="push_task_updates"
                checked={formData.push_task_updates}
                onCheckedChange={() => handleToggle("push_task_updates")}
                disabled={!formData.push_enabled}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Reminder Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="w-4 h-4" />
            הגדרות תזכורות
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 pr-6">
            <div className="space-y-2">
              <Label htmlFor="reminder_hours">תזכורת מראש</Label>
              <Select
                value={String(formData.reminder_hours_before)}
                onValueChange={(value) => setFormData(prev => ({ ...prev, reminder_hours_before: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_HOURS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reminder_time">שעת תזכורת יומית</Label>
              <Select
                value={formData.reminder_time}
                onValueChange={(value) => setFormData(prev => ({ ...prev, reminder_time: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_TIMES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? "שומר..." : "שמור הגדרות"}
        </Button>
      </CardContent>
    </Card>
  );
}
