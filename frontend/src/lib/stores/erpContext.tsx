import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "../AuthContext";

// ➤ ★ GLOBAL REDIRECT HANDLER (new)
let globalRedirect: ((module: string, subModule?: string) => void) | null =
  null;

export const redirectToModule = (module: string, subModule = "") => {
  if (globalRedirect) {
    globalRedirect(module, subModule);
  }
};

// TYPES
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
  setCurrentSubModule: (sub: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  handleModuleChange: (module: string, subModule?: string) => void;
}

// REDUCER
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

// INITIAL STATE
const initialState: ERPState = {
  currentModule: "dashboard",
  currentSubModule: "",
  sidebarCollapsed: false,
};

const ERPContext = createContext<ERPContextType | undefined>(undefined);

// PROVIDER
export function ERPProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(erpReducer, initialState);
  const { user, getDefaultModule } = useAuth();

  // Reset when logged out
  useEffect(() => {
    if (!user) dispatch({ type: "RESET_STATE" });
  }, [user]);

  // Apply default module on login
  useEffect(() => {
    if (user) {
      dispatch({
        type: "SET_CURRENT_MODULE",
        payload: getDefaultModule(),
      });
    }
  }, [user]);

  // ACTIONS
  const setCurrentModule = (module: string) => {
    dispatch({ type: "SET_CURRENT_MODULE", payload: module });
  };

  const setCurrentSubModule = (subModule: string) => {
    dispatch({ type: "SET_CURRENT_SUB_MODULE", payload: subModule });
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    dispatch({ type: "SET_SIDEBAR_COLLAPSED", payload: collapsed });
  };

  const handleModuleChange = (module: string, subModule: string = "") => {
    setCurrentModule(module);
    setCurrentSubModule(subModule);
  };

  // ➤ ★ GLOBAL REDIRECT REGISTRATION
  useEffect(() => {
    globalRedirect = handleModuleChange;
    return () => {
      globalRedirect = null;
    };
  }, [handleModuleChange]);

  const value: ERPContextType = {
    currentModule: state.currentModule,
    currentSubModule: state.currentSubModule,
    sidebarCollapsed: state.sidebarCollapsed,
    setCurrentModule,
    setCurrentSubModule,
    setSidebarCollapsed,
    handleModuleChange,
  };

  return <ERPContext.Provider value={value}>{children}</ERPContext.Provider>;
}

// HOOK
export const useERP = (): ERPContextType => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error("useERP must be used within an ERPProvider");
  }
  return context;
};
