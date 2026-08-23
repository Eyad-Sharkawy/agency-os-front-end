export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "CLIENT";

export interface WorkspaceRequest {
  name: string;
  contactEmail: string;
}

export interface WorkspaceResponse {
  id: string;
  name: string;
  tenantId: string;
  contactEmail: string;
  role?: WorkspaceRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMemberResponse {
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: WorkspaceRole;
}

export interface WorkspaceMemberUpdateRequest {
  role: WorkspaceRole;
}

export interface WorkspaceOwnershipTransferRequest {
  newOwnerId: string;
}
