import { Service, inject, ResourceRef, Signal } from "@angular/core";
import { HttpClient, httpResource, HttpResourceOptions } from "@angular/common/http";
import { Observable } from "rxjs";
import { ENVIRONMENT } from "../../../tokens/enviroment/environment.token";
import { InvoiceRequest, InvoiceResponse } from "../../models/invoice.models";

@Service()
export class InvoiceApi {
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT);
  readonly baseUrl = `${this.env.apiUrl}/invoices`;

  /**
   * Signal-based reactive HTTP resource for listing invoices.
   */
  getInvoicesResource(
    options?: HttpResourceOptions<InvoiceResponse[], unknown>,
  ): ResourceRef<InvoiceResponse[] | undefined> {
    return httpResource<InvoiceResponse[]>(() => this.baseUrl, options);
  }

  /**
   * Signal-based reactive HTTP resource for streaming invoice vector PDF as a Blob.
   */
  getInvoicePdfResource(
    id: Signal<string | undefined> | (() => string | undefined),
    options?: HttpResourceOptions<Blob, Blob>,
  ): ResourceRef<Blob | undefined> {
    return httpResource.blob(() => {
      const invoiceId = typeof id === "function" ? id() : id;
      return invoiceId ? `${this.baseUrl}/${invoiceId}/pdf` : undefined;
    }, options);
  }

  getInvoices(): Observable<InvoiceResponse[]> {
    return this.http.get<InvoiceResponse[]>(this.baseUrl);
  }

  createInvoice(req: InvoiceRequest): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(this.baseUrl, req);
  }

  downloadInvoicePdf(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/pdf`, {
      responseType: "blob",
    });
  }
}
