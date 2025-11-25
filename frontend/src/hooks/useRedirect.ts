import { redirectToModule } from "../lib/stores/erpContext";

export function useRedirect() {
  const goTo = (module: string, subModule?: string) => {
    redirectToModule(module, subModule || "");
  };

  return { goTo };
}
