import { WorkspaceRole } from "./workspace.models";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";

export interface WorkspaceInvitationRequest {
  username?: string;
  email?: string;
  role: WorkspaceRole;
  clientId?: string | null;
}

export interface WorkspaceInvitationResponse {
  id: string;
  workspaceId: string;
  workspaceName: string;
  username: string;
  invitedByUsername: string;
  role: WorkspaceRole;
  clientId?: string | null;
  status: InvitationStatus;
  createdAt: string;
}
