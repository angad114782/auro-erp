import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import api from "./api";

/* ================= TYPES ================= */

export interface User {
  id: string;
  name: string;
  role: string;
  loginTime: string;
  permissions: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: User }
  | { type: "LOGIN_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" };

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  hasPermission: (module: string) => boolean;
  getDefaultModule: () => string;
}

/* ================= ROLE PERMISSIONS ================= */

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SuperAdmin: [
    // "dashboard",
    "all-projects",
    "master-data",
    "rd-management",
    "production",
    "inventory",
    "delivery",
    "users",
    "reports",
    "notifications",
    "wireframe",
  ],
  Admin: [
    // "dashboard",
    "all-projects",
    "master-data",
    "rd-management",
    "production",
    "inventory",
    "delivery",
    "users",
    "reports",
  ],
  Manager: [
    // "dashboard",
    "rd-management",
    "production",
    "inventory",
    "delivery",
    "reports",
  ],

  // 👇 Supervisor DOES NOT get production parent
  Supervisor: ["production-tracking"],
};

const defaultModuleByRole = (role: string): string => {
  if (role === "Supervisor") return "production-tracking";
  return ROLE_PERMISSIONS[role]?.[0] || "all-projects";
};

/* ================= REDUCER ================= */

const reducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, loading: true, error: null };

    case "LOGIN_SUCCESS":
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload,
      };

    case "LOGIN_FAILURE":
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        error: action.payload,
        user: null,
      };

    case "LOGOUT":
      return { ...state, isAuthenticated: false, user: null };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
};

const initialState: AuthState = {
  isAuthenticated: false,
  loading: false,
  user: null,
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ================= PROVIDER ================= */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem("erp_token");
    const userJson = localStorage.getItem("erp_user");

    if (token && userJson) {
      dispatch({ type: "LOGIN_SUCCESS", payload: JSON.parse(userJson) });
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: "LOGIN_START" });

    try {
      const res = await api.post("/auth/login", { email, password });
      const { user, token } = res.data.data;

      const formattedUser: User = {
        id: user._id,
        name: user.name,
        role: user.role,
        loginTime: new Date().toISOString(),
        permissions: ROLE_PERMISSIONS[user.role] || [],
      };

      localStorage.setItem("erp_token", token);
      localStorage.setItem("erp_user", JSON.stringify(formattedUser));

      dispatch({ type: "LOGIN_SUCCESS", payload: formattedUser });
      return true;
    } catch (err: any) {
      dispatch({
        type: "LOGIN_FAILURE",
        payload: err.response?.data?.message || "Invalid credentials",
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.clear();
    dispatch({ type: "LOGOUT" });
  };

  const clearError = () => dispatch({ type: "CLEAR_ERROR" });

  const hasPermission = (module: string) => {
    if (!state.user) return false;
    return state.user.permissions.includes(module);
  };

  const getDefaultModule = () => {
    if (!state.user) return "dashboard";
    return defaultModuleByRole(state.user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        clearError,
        hasPermission,
        getDefaultModule,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext)!;
