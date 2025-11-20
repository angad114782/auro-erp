// contexts/ERPContext.jsx
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "../AuthContext";

// types/erp.ts
export interface ERPState {
  currentModule: string;
  currentSubModule: string;
  sidebarCollapsed: boolean;
}

export type ERPAction =
  | { type: "SET_CURRENT_MODULE"; payload: string }
  | { type: "SET_CURRENT_SUB_MODULE"; payload: string }
  | { type: "SET_SIDEBAR_COLLAPSED"; payload: boolean }
  | { type: "RESET_STATE" };

export interface ERPContextType {
  currentModule: string;
  currentSubModule: string;
  sidebarCollapsed: boolean;
  setCurrentModule: (module: string) => void;
  setCurrentSubModule: (subModule: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  handleModuleChange: (module: string, subModule?: string) => void;
}

// ERP state reducer
const erpReducer = (state: ERPState, action: ERPAction): ERPState => {
  switch (action.type) {
    case "SET_CURRENT_MODULE":
      return { ...state, currentModule: action.payload };

    case "SET_CURRENT_SUB_MODULE":
      return { ...state, currentSubModule: action.payload };

    case "SET_SIDEBAR_COLLAPSED":
      return { ...state, sidebarCollapsed: action.payload };

    case "RESET_STATE":
      return {
        currentModule: "dashboard",
        currentSubModule: "",
        sidebarCollapsed: false,
      };

    default:
      return state;
  }
};

const initialState: ERPState = {
  currentModule: "dashboard",
  currentSubModule: "",
  sidebarCollapsed: false,
};

const ERPContext = createContext<ERPContextType | undefined>(undefined);

interface ERPProviderProps {
  children: ReactNode;
}

export function ERPProvider({ children }: ERPProviderProps) {
  const [state, dispatch] = useReducer(erpReducer, initialState);
  const { user, getDefaultModule } = useAuth();

  // Reset ERP state when user logs out
  useEffect(() => {
    if (!user) {
      dispatch({ type: "RESET_STATE" });
    }
  }, [user]);

  // Set default module based on user role when authenticated
  useEffect(() => {
    if (user) {
      const defaultModule = getDefaultModule();
      dispatch({ type: "SET_CURRENT_MODULE", payload: defaultModule });
    }
  }, [user, getDefaultModule]);

  const setCurrentModule = (module: string): void => {
    dispatch({ type: "SET_CURRENT_MODULE", payload: module });
  };

  const setCurrentSubModule = (subModule: string): void => {
    dispatch({ type: "SET_CURRENT_SUB_MODULE", payload: subModule });
  };

  const setSidebarCollapsed = (collapsed: boolean): void => {
    dispatch({ type: "SET_SIDEBAR_COLLAPSED", payload: collapsed });
  };

  const handleModuleChange = (module: string, subModule: string = ""): void => {
    setCurrentModule(module);
    setCurrentSubModule(subModule);
  };

  const value: ERPContextType = {
    // State
    currentModule: state.currentModule,
    currentSubModule: state.currentSubModule,
    sidebarCollapsed: state.sidebarCollapsed,

    // Actions
    setCurrentModule,
    setCurrentSubModule,
    setSidebarCollapsed,
    handleModuleChange,
  };

  return <ERPContext.Provider value={value}>{children}</ERPContext.Provider>;
}

export const useERP = (): ERPContextType => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error("useERP must be used within an ERPProvider");
  }
  return context;
};
