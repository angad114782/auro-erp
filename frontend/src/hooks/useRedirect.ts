import { redirectToModule } from "../lib/stores/erpContext";

export function useRedirect() {
  const goTo = (module: string, subModule?: string, extra?: any) => {
    redirectToModule(module, subModule || "", extra);
  };

  return { goTo };
}
