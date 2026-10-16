import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      loading: false,

      setAccessToken: (accessToken: string | null) => {
        set({ accessToken });
      },

      clearState: () => {
        set({ accessToken: null, user: null, loading: false });
      },

      signUp: async (username, password, email, displayName) => {
        try {
          set({ loading: true });

          // Call api
          await authService.signUp(username, password, email, displayName);

          toast.success("Sign up successful");
        } catch (error) {
          toast.error("Error signing up");
          console.error("Error signing up:", error);
        } finally {
          set({ loading: false });
        }
      },

      signIn: async (username, password) => {
        try {
          set({ loading: true });

          const { accessToken, user } = await authService.signIn(
            username,
            password,
          );
          get().setAccessToken(accessToken);

          await get().fetchMe();

          toast.success("Sign in successful");
        } catch (error) {
          toast.error("Error signing in");
          console.error("Error signing in:", error);
        } finally {
          set({ loading: false });
        }
      },

      signOut: async () => {
        try {
          get().clearState();
          await authService.signOut();
          toast.success("Sign out successful");
        } catch (error) {
          toast.error("Error signing out");
          console.error("Error signing out:", error);
        }
      },

      fetchMe: async () => {
        try {
          set({ loading: true });
          const user = await authService.fetchMe();

          set({ user });
        } catch (error) {
          console.error("Error fetching user data:", error);
          set({ user: null, accessToken: null });
          toast.error("Error fetching user data");
        } finally {
          set({ loading: false });
        }
      },

      refreshToken: async () => {
        try {
          set({ loading: true });
          const { user, fetchMe, setAccessToken } = get();
          if (!user) {
            await fetchMe();
          }
          const accessToken = await authService.refreshToken();

          setAccessToken(accessToken);
        } catch (error) {
          console.error("Error refreshing token:", error);
          get().clearState();
          toast.error("Failed to refresh token. Please sign in again.");
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "auth-storage", // localStorage key
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    },
  ),
);
