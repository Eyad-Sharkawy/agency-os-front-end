export interface UserProfile {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  roles: string[];
  token: string | null;
  isLoading: boolean;
  error: string | null;
}
