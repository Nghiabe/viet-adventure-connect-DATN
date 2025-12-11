import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ErrorMessageProps {
  error?: string;
  onRetry?: () => void;
}

const ErrorMessage = ({ error, onRetry }: ErrorMessageProps) => {
  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <Alert className="border-destructive">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="mt-2">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-destructive mb-2">
                    Không thể tải dữ liệu cộng đồng
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {error || "Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau."}
                  </p>
                </div>
                
                {onRetry && (
                  <Button 
                    onClick={onRetry}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Thử lại
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
