export function formatTime(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString([], {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || minutes <= 0) return "0m";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

export function getStatusBadgeVariant(
  status: string | null | undefined
): "success" | "warning" | "danger" | "info" | "neutral" {
  switch (status?.toUpperCase()) {
    case "PRESENT":
      return "success";
    case "LATE":
      return "warning";
    case "HALF_DAY":
      return "info";
    case "ABSENT":
      return "danger";
    default:
      return "neutral";
  }
}

export function getStatusLabel(status: string | null | undefined): string {
  switch (status?.toUpperCase()) {
    case "PRESENT":
      return "Present";
    case "LATE":
      return "Late";
    case "HALF_DAY":
      return "Half Day";
    case "ABSENT":
      return "Absent";
    default:
      return status || "Unknown";
  }
}

export function getTodayISODate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
