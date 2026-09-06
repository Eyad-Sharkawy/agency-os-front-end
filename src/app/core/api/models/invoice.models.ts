export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "VOID" | "OVERDUE";

export interface InvoiceRequest {
  clientId: string;
  status: InvoiceStatus;
}

export interface InvoiceResponse {
  id: string;
  clientId: string;
  totalAmount: number;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceStatusMeta {
  label: string;
  badgeClass: string;
  dotClass: string;
}

export const INVOICE_STATUS_META: Record<InvoiceStatus, InvoiceStatusMeta> = {
  DRAFT: {
    label: "Draft",
    badgeClass: "bg-soft-stone text-body-muted border-hairline",
    dotClass: "bg-muted",
  },
  SENT: {
    label: "Sent",
    badgeClass:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800",
    dotClass: "bg-sky-500",
  },
  PAID: {
    label: "Paid",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  OVERDUE: {
    label: "Overdue",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    dotClass: "bg-amber-500",
  },
  VOID: {
    label: "Void",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
    dotClass: "bg-rose-500",
  },
};
