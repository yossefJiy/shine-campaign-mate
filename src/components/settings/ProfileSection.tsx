import { useState, useRef } from "react";
import { User, Camera, Phone, Briefcase, FileText, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Skeleton } from "@/components/ui/skeleton";

const TIMEZONES = [
  { value: "Asia/Jerusalem", label: "ישראל (GMT+2/+3)" },
  { value: "Europe/London", label: "לונדון (GMT+0/+1)" },
  { value: "America/New_York", label: "ניו יורק (GMT-5/-4)" },
  { value: "America/Los_Angeles", label: "לוס אנג'לס (GMT-8/-7)" },
  { value: "Europe/Paris", label: "פריז (GMT+1/+2)" },
];

export function ProfileSection() {
  const { profile, isLoading, updateProfile, isUpdating, uploadAvatar, isUploadingAvatar } = useUserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    job_title: profile?.job_title || "",
    phone: profile?.phone || "",
    bio: profile?.bio || "",
    timezone: profile?.timezone || "Asia/Jerusalem",
    interface_language: (profile as any)?.interface_language || "he",
    preferred_task_language: (profile as any)?.preferred_task_language || "he",
  });

  // Update form when profile loads
  useState(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        job_title: profile.job_title || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        timezone: profile.timezone || "Asia/Jerusalem",
        interface_language: (profile as any)?.interface_language || "he",
        preferred_task_language: (profile as any)?.preferred_task_language || "he",
      });
    }
  });

  const handleSave = () => {
    updateProfile(formData);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return; // Max 5MB
      }
      uploadAvatar(file);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-20 rounded-full" />
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
          <User className="w-5 h-5" />
          פרופיל אישי
        </CardTitle>
        <CardDescription>
          עדכן את הפרטים האישיים שלך
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-20 h-20 cursor-pointer" onClick={handleAvatarClick}>
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xl">
                {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
            >
              <Camera className="w-3 h-3" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div>
            <p className="font-medium">{profile?.full_name || "שם לא הוגדר"}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </div>

        {/* Form fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              שם מלא
            </Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="הכנס שם מלא"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_title" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              תפקיד
            </Label>
            <Input
              id="job_title"
              value={formData.job_title}
              onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
              placeholder="למשל: מנהל פרויקטים"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              טלפון
            </Label>
            <Input
              id="phone"
              type="tel"
              dir="ltr"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="050-1234567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
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
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Language preferences */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="interface_language" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              שפת ממשק
            </Label>
            <Select
              value={formData.interface_language}
              onValueChange={(value) => setFormData(prev => ({ ...prev, interface_language: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="he">עברית</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_task_language" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              שפת משימות מועדפת
            </Label>
            <Select
              value={formData.preferred_task_language}
              onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_task_language: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="he">עברית</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            אודות
          </Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="ספר קצת על עצמך..."
            rows={3}
          />
        </div>

        <Button onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? "שומר..." : "שמור שינויים"}
        </Button>
      </CardContent>
    </Card>
  );
}
