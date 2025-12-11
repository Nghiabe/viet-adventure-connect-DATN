import { Button } from "@/components/ui/button";
import { Search, Filter, RefreshCw } from "lucide-react";

interface EmptyStateProps {
  title: string;
  message: string;
  showClearFilters?: boolean;
  showRefresh?: boolean;
  onClearFilters?: () => void;
  onRefresh?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  message, 
  showClearFilters = false,
  showRefresh = false,
  onClearFilters,
  onRefresh,
  icon,
  className = ""
}) => {
  return (
    <div className={`text-center py-20 px-6 bg-card rounded-xl border ${className}`}>
      {/* Icon */}
      <div className="flex justify-center mb-6">
        {icon || (
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center">
            <Search className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
      </div>
      
      {/* Title */}
      <h3 className="text-2xl font-semibold text-foreground mb-4">{title}</h3>
      
      {/* Message */}
      <p className="text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed text-base">
        {message}
      </p>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {showClearFilters && onClearFilters && (
          <Button 
            variant="outline" 
            onClick={onClearFilters}
            className="flex items-center gap-2 px-6 py-2"
          >
            <Filter className="w-4 h-4" />
            Xóa tất cả bộ lọc
          </Button>
        )}
        
        {showRefresh && onRefresh && (
          <Button 
            variant="default" 
            onClick={onRefresh}
            className="flex items-center gap-2 px-6 py-2"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;




