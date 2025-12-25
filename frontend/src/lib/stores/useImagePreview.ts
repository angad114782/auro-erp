import { create } from "zustand";

interface ImagePreviewState {
  isOpen: boolean;
  src: string | null;
  alt: string;
  openPreview: (src: string, alt?: string) => void;
  closePreview: () => void;
}

export const useImagePreview = create<ImagePreviewState>((set) => ({
  isOpen: false,
  src: null,
  alt: "",
  openPreview: (src, alt = "Image Preview") => set({ isOpen: true, src, alt }),
  closePreview: () => set({ isOpen: false, src: null, alt: "" }),
}));
