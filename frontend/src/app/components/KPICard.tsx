import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  gradient?: string;
}

const iconBg: Record<string, string> = {
  indigo: "bg-primary",
  cyan: "bg-[#5DADE2]",
  emerald: "bg-brand-green",
  amber: "bg-warning",
  rose: "bg-destructive",
  violet: "bg-[#1A5276]",
};

export default function KPICard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  gradient = "indigo",
}: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-surface p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs sm:text-sm mb-1 truncate">{title}</p>
          <h3 className="text-lg sm:text-2xl font-bold truncate">{value}</h3>
          {change && (
            <p
              className={`text-xs mt-1 ${
                changeType === "positive"
                  ? "text-success"
                  : changeType === "negative"
                    ? "text-destructive"
                    : "text-muted-foreground"
              }`}
            >
              {change}
            </p>
          )}
        </div>
        <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${iconBg[gradient] || iconBg.indigo}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}
