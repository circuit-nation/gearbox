import { Badge } from "@/components/ui/badge";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  inactive: "outline",
  visible: "secondary",
  hidden: "outline",
  archived: "destructive",
};

type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.trim().toLowerCase();
  const variant = STATUS_VARIANTS[normalizedStatus] ?? "secondary";

  return <Badge variant={variant}>{status}</Badge>;
}
