
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

function getCookie(name) {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : "";
}

function getResponseData(response) {
  return response.data?.data ?? response.data;
}

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    "Something went wrong. Please try again."
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const login = async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      const result = getResponseData(response);

      // The JWT stays in the HttpOnly cookie.
      setUser(result.user ?? result);

      return result;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  };

  const logout = async () => {
    try {
      const csrfToken = getCookie("csrfToken");

      await api.post(
        "/auth/logout",
        {},
        {
          headers: {
            "X-CSRF-Token": csrfToken,
          },
        },
      );
    } finally {
      setUser(null);
    }
  };

  const checkAuth = useCallback(async () => {
    try {
      const response = await api.get("/auth/me");
      const result = getResponseData(response);

      setUser(result.user ?? result);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handleSessionExpired = () => {
      setUser(null);
      setLoading(false);
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
  }, [checkAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser: checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
