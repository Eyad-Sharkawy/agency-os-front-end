export type ClientStatus = "ACTIVE" | "INACTIVE";

export interface ClientRequest {
  name: string;
  email: string;
  status: ClientStatus;
}

export interface ClientResponse {
  id: string;
  name: string;
  email: string;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
}
