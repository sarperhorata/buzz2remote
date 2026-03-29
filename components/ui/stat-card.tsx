import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn("glass-card p-6 hover-lift group", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
          {trend && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">{trend}</p>
          )}
        </div>
        <div className="gradient-primary rounded-xl p-3 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
          <Icon className="size-6" />
        </div>
      </div>
    </div>
  );
}
