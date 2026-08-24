import { Service, inject, ResourceRef, Signal } from "@angular/core";
import { HttpClient, httpResource, HttpResourceOptions } from "@angular/common/http";
import { Observable } from "rxjs";
import { ENVIRONMENT } from "../../../tokens/enviroment/environment.token";
import { ClientRequest, ClientResponse } from "../../models/client.models";

@Service()
export class ClientApi {
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT);
  readonly baseUrl = `${this.env.apiUrl}/clients`;

  /**
   * Signal-based reactive HTTP resource for listing all clients.
   */
  getClientsResource(
    options?: HttpResourceOptions<ClientResponse[], unknown>,
  ): ResourceRef<ClientResponse[] | undefined> {
    return httpResource<ClientResponse[]>(() => this.baseUrl, options);
  }

  /**
   * Signal-based reactive HTTP resource for a single client by ID.
   */
  getClientResource(
    id: Signal<string | undefined> | (() => string | undefined),
    options?: HttpResourceOptions<ClientResponse, unknown>,
  ): ResourceRef<ClientResponse | undefined> {
    return httpResource<ClientResponse>(() => {
      const clientId = typeof id === "function" ? id() : id;
      return clientId ? `${this.baseUrl}/${clientId}` : undefined;
    }, options);
  }

  getClients(): Observable<ClientResponse[]> {
    return this.http.get<ClientResponse[]>(this.baseUrl);
  }

  getClientById(id: string): Observable<ClientResponse> {
    return this.http.get<ClientResponse>(`${this.baseUrl}/${id}`);
  }

  createClient(req: ClientRequest): Observable<ClientResponse> {
    return this.http.post<ClientResponse>(this.baseUrl, req);
  }

  updateClient(id: string, req: ClientRequest): Observable<ClientResponse> {
    return this.http.put<ClientResponse>(`${this.baseUrl}/${id}`, req);
  }

  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
