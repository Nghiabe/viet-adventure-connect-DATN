import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type RoleCardProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  isSelected?: boolean;
  onClick?: () => void;
};

export default function RoleCard({ icon, title, subtitle, isSelected, onClick }: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-xl bg-card p-4 text-left transition-transform duration-200 ease-in-out hover:scale-[1.03]",
        isSelected ? "border-2 border-primary" : "border border-border"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="text-primary">{icon}</div>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}


