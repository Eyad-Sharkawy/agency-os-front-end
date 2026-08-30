export interface KeycloakUserProfile {
  id?: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  emailVerified?: boolean;
  userProfileMetadata?: {
    attributes?: {
      name: string;
      displayName?: string;
      required?: boolean;
      readOnly?: boolean;
    }[];
  };
  attributes?: Record<string, string[]>;
}

export interface LinkedAccount {
  providerName: string;
  providerAlias: string;
  displayName?: string;
  connected?: boolean;
  linked?: boolean;
  social?: boolean;
  userName?: string;
  connectedAs?: string;
  linkUrl?: string;
}

export interface UserSession {
  id: string;
  ipAddress?: string;
  started?: number;
  lastAccess?: number;
  expires?: number;
  browser?: string;
  current?: boolean;
  clients?: {
    clientId: string;
    clientName?: string;
  }[];
}

export interface PasswordChangeRequest {
  currentPassword?: string;
  newPassword: string;
  confirmation: string;
}
