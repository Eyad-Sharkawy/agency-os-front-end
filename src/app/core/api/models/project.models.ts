export type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "DELIVERED";

export interface ProjectRequest {
  name: string;
  description?: string;
  budget?: number;
  status: ProjectStatus;
  clientId: string;
  billingRate: number;
}

export interface ProjectResponse {
  id: string;
  name: string;
  description?: string;
  budget?: number;
  status: ProjectStatus;
  clientId: string;
  billingRate: number;
  createdAt: string;
  updatedAt: string;
}
