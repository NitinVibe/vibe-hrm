import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { LoginRequest, UserMeResponse } from "../types/auth";
import { apiClient, ApiError } from "../api/client";
import { getStoredToken, removeStoredToken, setStoredToken } from "../lib/session";

export interface AuthContextValue {
  user: UserMeResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<UserMeResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<UserMeResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore and validate session on initial application load
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await apiClient.auth.getMe(storedToken);
        if (isMounted) {
          if (currentUser.is_active) {
            setUser(currentUser);
            setToken(storedToken);
          } else {
            removeStoredToken();
            setUser(null);
            setToken(null);
          }
        }
      } catch {
        // Stored token is expired, invalid, or server is unreachable
        if (isMounted) {
          removeStoredToken();
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (credentials: LoginRequest): Promise<UserMeResponse> => {
      // 1. Authenticate with email and password
      const tokenResponse = await apiClient.auth.login(credentials);
      const newAccessToken = tokenResponse.access_token;

      // 2. Persist access token
      setStoredToken(newAccessToken);

      try {
        // 3. Immediately verify user against GET /api/v1/auth/me using the bearer token
        const verifiedUser = await apiClient.auth.getMe(newAccessToken);

        if (!verifiedUser.is_active) {
          removeStoredToken();
          throw new ApiError(
            "User account is inactive. Please contact your administrator.",
            403
          );
        }

        setToken(newAccessToken);
        setUser(verifiedUser);
        return verifiedUser;
      } catch (err) {
        removeStoredToken();
        setToken(null);
        setUser(null);
        throw err;
      }
    },
    []
  );

  const logout = useCallback(() => {
    removeStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
