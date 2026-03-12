import tasksLogo from "@/assets/tasks-logo.svg";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Logo with pulse animation */}
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center animate-pulse">
            <img 
              src={logoIcon} 
              alt="Converto Logo" 
              className="w-16 h-16 animate-fade-in"
              style={{ animationDelay: "0.2s", animationFillMode: "both" }}
            />
          </div>
          {/* Spinning ring */}
          <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 border-t-primary animate-spin" style={{ animationDuration: "1.5s" }} />
        </div>
        
        {/* Slogan */}
        <div 
          className="text-center animate-fade-in" 
          style={{ animationDelay: "0.4s", animationFillMode: "both" }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-2">Converto</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            קמפיינים, משימות, צוות ולקוחות במקום אחד
          </p>
        </div>
        
        {/* Loading dots */}
        <div 
          className="flex gap-1.5 animate-fade-in"
          style={{ animationDelay: "0.6s", animationFillMode: "both" }}
        >
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        
        {/* Optional message */}
        {message && (
          <p 
            className="text-xs text-muted-foreground animate-fade-in"
            style={{ animationDelay: "0.8s", animationFillMode: "both" }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}