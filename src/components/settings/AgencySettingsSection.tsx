import { useState, useEffect } from "react";
import { useAgencySettings } from "@/hooks/useAgencySettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Clock, Calendar, AlertTriangle, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const TIMEZONES = [
  { value: "Asia/Jerusalem", label: "ישראל (Asia/Jerusalem)" },
  { value: "Europe/London", label: "לונדון (Europe/London)" },
  { value: "America/New_York", label: "ניו יורק (America/New_York)" },
  { value: "America/Los_Angeles", label: "לוס אנג'לס (America/Los_Angeles)" },
  { value: "Europe/Paris", label: "פריז (Europe/Paris)" },
  { value: "Asia/Dubai", label: "דובאי (Asia/Dubai)" },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "ראשון" },
  { value: 1, label: "שני" },
  { value: 2, label: "שלישי" },
  { value: 3, label: "רביעי" },
  { value: 4, label: "חמישי" },
  { value: 5, label: "שישי" },
  { value: 6, label: "שבת" },
];

export function AgencySettingsSection() {
  const { settings, isLoading, updateSettings, isUpdating } = useAgencySettings();
  
  const [formData, setFormData] = useState({
    timezone: "Asia/Jerusalem",
    work_hours_start: "09:00",
    work_hours_end: "18:00",
    work_days: [0, 1, 2, 3, 4] as number[],
    client_delay_threshold_days: 4,
    project_stalled_threshold_days: 4,
    payment_overdue_grace_days: 0,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        timezone: settings.timezone || "Asia/Jerusalem",
        work_hours_start: settings.work_hours_start || "09:00",
        work_hours_end: settings.work_hours_end || "18:00",
        work_days: settings.work_days || [0, 1, 2, 3, 4],
        client_delay_threshold_days: settings.client_delay_threshold_days || 4,
        project_stalled_threshold_days: settings.project_stalled_threshold_days || 4,
        payment_overdue_grace_days: settings.payment_overdue_grace_days || 0,
      });
    }
  }, [settings]);

  const handleWorkDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      work_days: prev.work_days.includes(day)
        ? prev.work_days.filter(d => d !== day)
        : [...prev.work_days, day].sort((a, b) => a - b)
    }));
  };

  const handleSave = () => {
    updateSettings(formData);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          הגדרות סוכנות
        </CardTitle>
        <CardDescription>
          הגדרות כלליות לזמני עבודה, התראות וספי זמן
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timezone */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            אזור זמן
          </Label>
          <Select 
            value={formData.timezone} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map(tz => (
                <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Work Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>שעת התחלה</Label>
            <Input
              type="time"
              value={formData.work_hours_start}
              onChange={(e) => setFormData(prev => ({ ...prev, work_hours_start: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>שעת סיום</Label>
            <Input
              type="time"
              value={formData.work_hours_end}
              onChange={(e) => setFormData(prev => ({ ...prev, work_hours_end: e.target.value }))}
            />
          </div>
        </div>

        {/* Work Days */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            ימי עבודה
          </Label>
          <div className="flex flex-wrap gap-3">
            {DAYS_OF_WEEK.map(day => (
              <div key={day.value} className="flex items-center gap-2">
                <Checkbox
                  id={`day-${day.value}`}
                  checked={formData.work_days.includes(day.value)}
                  onCheckedChange={() => handleWorkDayToggle(day.value)}
                />
                <Label htmlFor={`day-${day.value}`} className="text-sm cursor-pointer">
                  {day.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Thresholds */}
        <div className="space-y-4 pt-4 border-t">
          <Label className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            ספי התראות
          </Label>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                עיכוב לקוח (ימים)
              </Label>
              <Input
                type="number"
                min={1}
                max={14}
                value={formData.client_delay_threshold_days}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  client_delay_threshold_days: parseInt(e.target.value) || 4 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                התראה כשמשימה ממתינה ללקוח מעל X ימים
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                פרויקט תקוע (ימים)
              </Label>
              <Input
                type="number"
                min={1}
                max={14}
                value={formData.project_stalled_threshold_days}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  project_stalled_threshold_days: parseInt(e.target.value) || 4 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                התראה כשאין פעילות בפרויקט מעל X ימים
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                חסד לתשלום (ימים)
              </Label>
              <Input
                type="number"
                min={0}
                max={30}
                value={formData.payment_overdue_grace_days}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  payment_overdue_grace_days: parseInt(e.target.value) || 0 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                ימי חסד לפני סימון תשלום כבאיחור
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 flex justify-end">
          <Button onClick={handleSave} disabled={isUpdating}>
            <Save className="h-4 w-4 ml-2" />
            {isUpdating ? "שומר..." : "שמור הגדרות"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
