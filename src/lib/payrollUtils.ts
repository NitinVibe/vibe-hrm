import type { PayrollRunStatus, PayslipPaymentStatus } from "../types/payroll";

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "₹0.00";
  }
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) {
    return "₹0.00";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPeriod(periodKey: string | null | undefined): string {
  if (!periodKey || !periodKey.includes("-")) {
    return periodKey || "—";
  }
  const [yearStr, monthStr] = periodKey.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const d = new Date(year, month, 1);
  if (isNaN(d.getTime())) {
    return periodKey;
  }
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function getPayrollStatusBadgeVariant(
  status: PayrollRunStatus,
): "neutral" | "info" | "warning" | "success" | "danger" {
  switch (status) {
    case "DRAFT":
      return "neutral";
    case "PROCESSED":
      return "info";
    case "APPROVED":
      return "warning";
    case "PAID":
      return "success";
    default:
      return "neutral";
  }
}


export function getPaymentStatusBadgeVariant(
  status: PayslipPaymentStatus,
): "warning" | "success" {
  return status === "PAID" ? "success" : "warning";
}
