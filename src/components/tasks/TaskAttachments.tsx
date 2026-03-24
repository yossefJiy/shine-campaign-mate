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
  Maximize2,
  VideoIcon,
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
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
  const [fullscreenType, setFullscreenType] = useState<"image" | "video" | "pdf" | null>(null);

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
      if (attachment && attachment.attachment_type !== "link") {
        const path = attachment.url.split("/task-attachments/")[1];
        if (path) {
          await supabase.storage.from("task-attachments").remove([decodeURIComponent(path)]);
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
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadFileToStorage(file);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const uploadFileToStorage = async (file: File) => {
    const fileExt = file.name.split(".").pop() || "bin";
    const fileName = `${taskId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
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
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    const name = linkName.trim() || (() => { try { return new URL(linkUrl).hostname; } catch { return linkUrl; } })();
    addAttachmentMutation.mutate({
      task_id: taskId,
      attachment_type: "link",
      name,
      url: linkUrl,
      file_size: null,
      mime_type: null,
    });
  };

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      await uploadFileToStorage(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("שגיאה בהעלאת קובץ");
    } finally {
      setIsUploading(false);
    }
  }, [taskId]);

  // Paste handler
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.kind === "file") {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const name = file.name === "image.png" ? `paste-${Date.now()}.png` : file.name;
          const renamedFile = new File([file], name, { type: file.type });
          await uploadFile(renamedFile);
        }
        return;
      }
    }
  }, [uploadFile]);

  // Drag & Drop
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    for (const file of Array.from(e.dataTransfer.files)) {
      await uploadFile(file);
    }
  }, [uploadFile]);

  // Screen capture (screenshot)
  const handleScreenCapture = useCallback(async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" } as any,
      });
      const track = stream.getVideoTracks()[0];
      const imageCapture = new (window as any).ImageCapture(track);
      const bitmap = await imageCapture.grabFrame();
      stream.getTracks().forEach(t => t.stop());

      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png");
      });

      const file = new File([blob], `screenshot-${Date.now()}.png`, { type: "image/png" });
      await uploadFile(file);
      toast.success("צילום מסך הועלה בהצלחה");
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Screen capture error:", error);
        toast.error("שגיאה בצילום מסך");
      }
    } finally {
      setIsCapturing(false);
    }
  }, [uploadFile]);

  // Screen recording
  const handleScreenRecord = useCallback(async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" } as any,
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
          ? 'video/webm;codecs=vp9' 
          : 'video/webm',
      });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: "video/webm" });
        await uploadFile(file);
        toast.success("הקלטת מסך הועלתה בהצלחה");
        setIsCapturing(false);
      };

      // Stop when user stops sharing
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
        }
      };

      mediaRecorder.start();
      toast.info("מקליט... לחץ על 'הפסק שיתוף' לסיום");
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Screen record error:", error);
        toast.error("שגיאה בהקלטת מסך");
      }
      setIsCapturing(false);
    }
  }, [uploadFile]);

  // Register paste listener
  useEffect(() => {
    if (addDialogOpen || !compact) {
      document.addEventListener("paste", handlePaste);
      return () => document.removeEventListener("paste", handlePaste);
    }
  }, [addDialogOpen, compact, handlePaste]);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const openFullscreen = (url: string, type: "image" | "video" | "pdf") => {
    setFullscreenUrl(url);
    setFullscreenType(type);
  };

  const renderPreview = (attachment: TaskAttachment, maxHeight = "max-h-60") => {
    const isImage = attachment.attachment_type === "image" || 
      (attachment.mime_type && attachment.mime_type.startsWith("image/"));
    const isPdf = attachment.mime_type === "application/pdf";
    const isVideo = attachment.attachment_type === "video" || 
      (attachment.mime_type && attachment.mime_type.startsWith("video/"));

    if (isImage) {
      return (
        <div className="relative group p-2 bg-background cursor-pointer" onClick={() => openFullscreen(attachment.url, "image")}>
          <img 
            src={attachment.url} 
            alt={attachment.name} 
            className={`${maxHeight} w-full rounded object-contain`}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Maximize2 className="w-6 h-6 text-white drop-shadow-lg" />
          </div>
        </div>
      );
    }
    if (isPdf) {
      return (
        <div className="bg-background cursor-pointer" onClick={() => openFullscreen(attachment.url, "pdf")}>
          <iframe src={attachment.url} className="w-full h-48 border-0 pointer-events-none" title={attachment.name} />
        </div>
      );
    }
    if (isVideo) {
      return (
        <div className="p-2 bg-background">
          <video 
            src={attachment.url} 
            controls 
            className={`${maxHeight} w-full rounded cursor-pointer`}
            onClick={(e) => { e.preventDefault(); openFullscreen(attachment.url, "video"); }}
          />
        </div>
      );
    }
    return null;
  };

  // Fullscreen dialog
  const FullscreenViewer = () => (
    <Dialog open={!!fullscreenUrl} onOpenChange={() => { setFullscreenUrl(null); setFullscreenType(null); }}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-2">
        <DialogHeader className="sr-only">
          <DialogTitle>תצוגת קובץ</DialogTitle>
        </DialogHeader>
        {fullscreenType === "image" && fullscreenUrl && (
          <img src={fullscreenUrl} alt="" className="w-full h-full max-h-[90vh] object-contain" />
        )}
        {fullscreenType === "video" && fullscreenUrl && (
          <video src={fullscreenUrl} controls autoPlay className="w-full max-h-[90vh]" />
        )}
        {fullscreenType === "pdf" && fullscreenUrl && (
          <iframe src={fullscreenUrl} className="w-full h-[90vh] border-0" title="PDF" />
        )}
      </DialogContent>
    </Dialog>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setAddDialogOpen(true)} className="h-8 px-2 gap-1">
          <Paperclip className="w-4 h-4" />
          {attachments.length > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">{attachments.length}</Badge>
          )}
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" />
        <FullscreenViewer />

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Paperclip className="w-5 h-5" />
                נספחים למשימה
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {attachments.length > 0 && (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {attachments.map((attachment) => {
                      const Icon = attachmentTypeIcons[attachment.attachment_type];
                      return (
                        <div key={attachment.id} className="rounded-lg border border-border bg-card overflow-hidden">
                          {renderPreview(attachment, "max-h-40")}
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
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(attachment.url, "_blank")}>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteAttachmentMutation.mutate(attachment.id)}>
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
              <div className="space-y-3 pt-2 border-t border-border">
                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
                    isDragging ? "border-primary bg-primary/5" : "border-border",
                    isUploading && "opacity-50 pointer-events-none"
                  )}
                >
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  ) : (
                    <>
                      <Clipboard className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">גרור קבצים לכאן או הדבק (Ctrl+V)</p>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    <Upload className="w-3.5 h-3.5" />
                    קובץ
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleScreenCapture} disabled={isCapturing || isUploading}>
                    {isCapturing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MonitorUp className="w-3.5 h-3.5" />}
                    צילום
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleScreenRecord} disabled={isCapturing || isUploading}>
                    <VideoIcon className="w-3.5 h-3.5" />
                    הקלטה
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled={isUploading}>
                    <LinkIcon className="w-3.5 h-3.5" />
                    קישור
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input placeholder="הדבק קישור..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="flex-1 text-right text-sm" dir="rtl" />
                </div>
                {linkUrl && (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">שם הקישור (אופציונלי)</Label>
                      <Input placeholder="שם לתצוגה" value={linkName} onChange={(e) => setLinkName(e.target.value)} className="text-right mt-1" dir="rtl" />
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
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>סגור</Button>
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
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={handleScreenCapture} disabled={isCapturing || isUploading} title="צילום מסך">
            {isCapturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <MonitorUp className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleScreenRecord} disabled={isCapturing || isUploading} title="הקלטת מסך">
            <VideoIcon className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading} title="העלאת קובץ">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" multiple />

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-3 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border",
          isUploading && "opacity-50"
        )}
      >
        <Clipboard className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">גרור קבצים או הדבק (Ctrl+V)</p>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-3">
          {attachments.map((attachment) => {
            const Icon = attachmentTypeIcons[attachment.attachment_type];
            return (
              <div key={attachment.id} className="rounded-lg border border-border bg-muted/30 overflow-hidden">
                {renderPreview(attachment)}
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
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(attachment.url, "_blank")}>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteAttachmentMutation.mutate(attachment.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add link inline */}
      <div className="flex gap-2">
        <Input placeholder="הדבק קישור..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="flex-1 text-right text-sm" dir="rtl" />
        {linkUrl && (
          <Button size="sm" onClick={handleAddLink} disabled={addAttachmentMutation.isPending}>
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      <FullscreenViewer />
    </div>
  );
}
