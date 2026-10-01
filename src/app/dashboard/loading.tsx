import { Zap } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="w-full h-full min-h-[500px] flex-1 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-200">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap className="w-6 h-6 text-primary animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span className="text-sm font-semibold tracking-wide text-foreground">
          Đang tải dữ liệu hệ thống...
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          Đang đồng bộ hóa Pool Quota & AG Proxy Engine
        </span>
      </div>
    </div>
  );
}
