import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Paperclip,
  Link as LinkIcon,
  Image,
  Video,
  FileText,
  Trash2,
  Plus,
  Upload,
  ExternalLink,
  Loader2,
  X,
  Camera,
  MonitorUp,
  Clipboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskAttachment {
  id: string;
  task_id: string;
  attachment_type: "file" | "link" | "image" | "video";
  name: string;
  url: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

interface TaskAttachmentsProps {
  taskId: string;
  compact?: boolean;
  onCountChange?: (count: number) => void;
}

const attachmentTypeIcons = {
  file: FileText,
  link: LinkIcon,
  image: Image,
  video: Video,
};

const attachmentTypeLabels = {
  file: "קובץ",
  link: "קישור",
  image: "תמונה",
  video: "סרטון",
};

export function TaskAttachments({ taskId, compact = false, onCountChange }: TaskAttachmentsProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ["task-attachments", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      onCountChange?.(data?.length || 0);
      return data as TaskAttachment[];
    },
    enabled: !!taskId,
  });

  const addAttachmentMutation = useMutation({
    mutationFn: async (attachment: Omit<TaskAttachment, "id" | "created_at">) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("task_attachments")
        .insert({
          ...attachment,
          created_by: userData.user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-attachments", taskId] });
      toast.success("נספח נוסף בהצלחה");
      setAddDialogOpen(false);
      setLinkUrl("");
      setLinkName("");
    },
    onError: () => toast.error("שגיאה בהוספת נספח"),
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const attachment = attachments.find(a => a.id === attachmentId);
      
      // Delete from storage if it's a file
      if (attachment && attachment.attachment_type !== "link") {
        const path = attachment.url.split("/task-attachments/")[1];
        if (path) {
          await supabase.storage.from("task-attachments").remove([path]);
        }
      }
      
      const { error } = await supabase
        .from("task_attachments")
        .delete()
        .eq("id", attachmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-attachments", taskId] });
      toast.success("נספח נמחק");
    },
    onError: () => toast.error("שגיאה במחיקת נספח"),
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${taskId}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from("task-attachments")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("task-attachments")
        .getPublicUrl(fileName);

      const attachmentType = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : "file";

      await addAttachmentMutation.mutateAsync({
        task_id: taskId,
        attachment_type: attachmentType,
        name: file.name,
        url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("שגיאה בהעלאת קובץ");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;

    const name = linkName.trim() || new URL(linkUrl).hostname;
    addAttachmentMutation.mutate({
      task_id: taskId,
      attachment_type: "link",
      name,
      url: linkUrl,
      file_size: null,
      mime_type: null,
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAddDialogOpen(true)}
          className="h-8 px-2 gap-1"
        >
          <Paperclip className="w-4 h-4" />
          {attachments.length > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {attachments.length}
            </Badge>
          )}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
        />

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Paperclip className="w-5 h-5" />
                נספחים למשימה
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Existing attachments */}
              {attachments.length > 0 && (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {attachments.map((attachment) => {
                      const Icon = attachmentTypeIcons[attachment.attachment_type];
                      const isImage = attachment.attachment_type === "image" || 
                        (attachment.mime_type && attachment.mime_type.startsWith("image/"));
                      const isPdf = attachment.mime_type === "application/pdf";
                      const isVideo = attachment.attachment_type === "video" || 
                        (attachment.mime_type && attachment.mime_type.startsWith("video/"));
                      
                      return (
                        <div
                          key={attachment.id}
                          className="rounded-lg border border-border bg-card overflow-hidden"
                        >
                          {/* Inline preview */}
                          {isImage && (
                            <div className="p-2 bg-background">
                              <img 
                                src={attachment.url} 
                                alt={attachment.name} 
                                className="max-h-40 w-auto rounded object-contain mx-auto"
                              />
                            </div>
                          )}
                          {isPdf && (
                            <div className="bg-background">
                              <iframe 
                                src={attachment.url} 
                                className="w-full h-48 border-0"
                                title={attachment.name}
                              />
                            </div>
                          )}
                          {isVideo && (
                            <div className="p-2 bg-background">
                              <video src={attachment.url} controls className="max-h-40 w-full rounded" />
                            </div>
                          )}
                          {/* File info */}
                          <div className="flex items-center gap-3 p-2 hover:bg-muted/50 transition-colors">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{attachment.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {attachmentTypeLabels[attachment.attachment_type]}
                                {attachment.file_size && ` • ${formatFileSize(attachment.file_size)}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => window.open(attachment.url, "_blank")}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}

              {/* Add new */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    העלאת קובץ
                  </Button>
                  <div className="flex gap-2">
                    <Input
                      placeholder="הדבק קישור..."
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="flex-1 text-right"
                      dir="rtl"
                    />
                  </div>
                </div>

                {linkUrl && (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">שם הקישור (אופציונלי)</Label>
                      <Input
                        placeholder="שם לתצוגה"
                        value={linkName}
                        onChange={(e) => setLinkName(e.target.value)}
                        className="text-right mt-1"
                        dir="rtl"
                      />
                    </div>
                    <Button onClick={handleAddLink} disabled={addAttachmentMutation.isPending}>
                      <Plus className="w-4 h-4 ml-1" />
                      הוסף
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                סגור
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Full view for task dialog
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Paperclip className="w-4 h-4" />
          נספחים
          {attachments.length > 0 && (
            <Badge variant="secondary" className="text-xs">{attachments.length}</Badge>
          )}
        </Label>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
      />

      {attachments.length > 0 ? (
        <div className="space-y-3">
          {attachments.map((attachment) => {
            const Icon = attachmentTypeIcons[attachment.attachment_type];
            const isImage = attachment.attachment_type === "image" || 
              (attachment.mime_type && attachment.mime_type.startsWith("image/"));
            const isPdf = attachment.mime_type === "application/pdf";
            const isVideo = attachment.attachment_type === "video" || 
              (attachment.mime_type && attachment.mime_type.startsWith("video/"));

            return (
              <div key={attachment.id} className="rounded-lg border border-border bg-muted/30 overflow-hidden">
                {/* Inline preview */}
                {isImage && (
                  <div className="p-2 bg-background">
                    <img 
                      src={attachment.url} 
                      alt={attachment.name} 
                      className="max-h-48 w-auto rounded object-contain mx-auto"
                    />
                  </div>
                )}
                {isPdf && (
                  <div className="bg-background">
                    <iframe 
                      src={attachment.url} 
                      className="w-full h-64 border-0"
                      title={attachment.name}
                    />
                  </div>
                )}
                {isVideo && (
                  <div className="p-2 bg-background">
                    <video 
                      src={attachment.url} 
                      controls 
                      className="max-h-48 w-full rounded"
                    />
                  </div>
                )}
                {/* File info bar */}
                <div className="flex items-center gap-3 p-2">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {attachmentTypeLabels[attachment.attachment_type]}
                      {attachment.file_size && ` • ${formatFileSize(attachment.file_size)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => window.open(attachment.url, "_blank")}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
          <Paperclip className="w-6 h-6 mx-auto mb-2 opacity-50" />
          אין נספחים
        </div>
      )}

      {/* Add link inline */}
      <div className="flex gap-2">
        <Input
          placeholder="הדבק קישור..."
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          className="flex-1 text-right text-sm"
          dir="rtl"
        />
        {linkUrl && (
          <Button size="sm" onClick={handleAddLink} disabled={addAttachmentMutation.isPending}>
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
