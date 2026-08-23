export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "VOID" | "OVERDUE";

export interface InvoiceRequest {
  clientId: string;
}

export interface InvoiceResponse {
  id: string;
  clientId: string;
  totalAmount: number;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}
