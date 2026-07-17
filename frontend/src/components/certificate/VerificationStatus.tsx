import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { CertificateStatus } from "@/types/certificate.types";

interface VerificationStatusProps {
  status: CertificateStatus;
  size?: "sm" | "md" | "lg";
}

const STATUS_CONFIG: Record<CertificateStatus, { label: string; variant: "success" | "danger" | "warning" | "secondary"; icon: typeof CheckCircle2; }> = {
  GENERATED: { label: "Valid", variant: "success", icon: CheckCircle2 },
  REGENERATED: { label: "Valid (Regenerated)", variant: "success", icon: CheckCircle2 },
  REVOKED: { label: "Revoked", variant: "danger", icon: XCircle },
  EXPIRED: { label: "Expired", variant: "warning", icon: AlertTriangle },
};

export function VerificationStatus({ status, size = "sm" }: VerificationStatusProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn("gap-1", size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-3 py-1")}
    >
      <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      {config.label}
    </Badge>
  );
}
