// contexts/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
// types/auth.ts
export interface User {
  userId: string;
  role: "superadmin" | "admin" | "manager" | "supervisor" | "user";
  name: string;
  loginTime: string;
  permissions: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: User }
  | { type: "LOGIN_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" };

export interface AuthContextType extends AuthState {
  login: (userId: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  hasPermission: (module: string) => boolean;
  getDefaultModule: () => string;
}
// contexts/AuthContext.tsx

// Mock user database
const users: Record<
  string,
  { password: string; role: User["role"]; name: string }
> = {
  superadmin: {
    password: "superadmin123",
    role: "superadmin",
    name: "Super Admin",
  },
  admin: { password: "admin123", role: "admin", name: "Administrator" },
  manager: { password: "manager123", role: "manager", name: "Project Manager" },
  supervisor: {
    password: "supervisor123",
    role: "supervisor",
    name: "Supervisor",
  },
  user: { password: "user123", role: "user", name: "Regular User" },
};

// Role-based access control
const rolePermissions: Record<User["role"], string[]> = {
  superadmin: [
    "dashboard",
    "master-data",
    "rd-management",
    "production",
    "inventory",
    "delivery",
    "users",
    "notifications",
    "reports",
    "wireframe",
  ],
  admin: [
    "dashboard",
    "master-data",
    "rd-management",
    "production",
    "inventory",
    "delivery",
    "notifications",
    "reports",
  ],
  manager: [
    "dashboard",
    "rd-management",
    "production",
    "inventory",
    "delivery",
    "reports",
  ],
  supervisor: ["dashboard", "production", "inventory", "delivery"],
  user: ["dashboard", "reports"],
};

// Default modules for each role
const getDefaultModuleByRole = (role: User["role"]): string => {
  const modules = rolePermissions[role] || ["dashboard"];
  return modules[0];
};

// Auth state reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, loading: true, error: null };

    case "LOGIN_SUCCESS":
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload,
        error: null,
      };

    case "LOGIN_FAILURE":
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload,
      };

    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        error: null,
      };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
};

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem("erp_auth");
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth) as {
          user: User;
          isAuthenticated: boolean;
        };
        if (authData.user && authData.isAuthenticated) {
          dispatch({ type: "LOGIN_SUCCESS", payload: authData.user });
        }
      } catch (error) {
        localStorage.removeItem("erp_auth");
      }
    }
  }, []);

  const login = async (userId: string, password: string): Promise<boolean> => {
    dispatch({ type: "LOGIN_START" });

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const user = users[userId.toLowerCase()];

      if (!user) {
        dispatch({ type: "LOGIN_FAILURE", payload: "User ID not found" });
        return false;
      }

      if (user.password !== password) {
        dispatch({ type: "LOGIN_FAILURE", payload: "Invalid password" });
        return false;
      }

      const userData: User = {
        userId: userId.toLowerCase(),
        role: user.role,
        name: user.name,
        loginTime: new Date().toISOString(),
        permissions: rolePermissions[user.role] || [],
      };

      dispatch({ type: "LOGIN_SUCCESS", payload: userData });

      // Save to localStorage
      localStorage.setItem(
        "erp_auth",
        JSON.stringify({
          user: userData,
          isAuthenticated: true,
        })
      );

      return true;
    } catch (error) {
      dispatch({
        type: "LOGIN_FAILURE",
        payload: "Login failed. Please try again.",
      });
      return false;
    }
  };

  const logout = (): void => {
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("erp_auth");
  };

  const clearError = (): void => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const hasPermission = (module: string): boolean => {
    if (!state.user) return false;
    return state.user.permissions.includes(module);
  };

  const getDefaultModule = (): string => {
    if (!state.user) return "dashboard";
    return getDefaultModuleByRole(state.user.role);
  };

  const value: AuthContextType = {
    // State
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    loading: state.loading,
    error: state.error,

    // Actions
    login,
    logout,
    clearError,
    hasPermission,
    getDefaultModule,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
