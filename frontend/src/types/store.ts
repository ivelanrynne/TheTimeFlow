import type { User } from "./user";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (accessToken: string | null) => void;
  clearState: () => void;

  signUp: (
    username: string,
    password: string,
    email: string,
    displayName: string,
  ) => Promise<void>;

  signIn: (
    username: string,
    password: string,
  ) => Promise<void>;

  signOut: () => Promise<void>;

  fetchMe: () => Promise<void>;

  refreshToken: () => Promise<void>;
}
