import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorMessageProps {
  title: string;
  message: string;
  showRetry?: boolean;
  onRetry?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  title, 
  message, 
  showRetry = false,
  onRetry,
  className = ""
}) => {
  return (
    <div className={`text-center py-20 px-6 bg-card rounded-xl border border-destructive/20 ${className}`}>
      {/* Error Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>
      </div>
      
      {/* Error Title */}
      <h3 className="text-2xl font-semibold text-destructive mb-4">{title}</h3>
      
      {/* Error Message */}
      <p className="text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed text-base">
        {message}
      </p>
      
      {/* Retry Button */}
      {showRetry && onRetry && (
        <Button 
          variant="default" 
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-2"
        >
          <RefreshCw className="w-4 h-4" />
          Thử lại
        </Button>
      )}
    </div>
  );
};

export default ErrorMessage;




