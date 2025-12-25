import { useImagePreview } from "../lib/stores/useImagePreview";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

export function ImagePreviewDialog() {
  const { isOpen, src, alt, closePreview } = useImagePreview();

  if (!src) return null;

  return (
    <Dialog open={isOpen} onOpenChange={closePreview}>
      <DialogContent
        // Use !max-w-none to break out of default shadcn width
        className="
          max-w-11/12
          max-h-11/12 
          w-screen 
          h-screen 
          p-2
          text-white
          // bg-black/95 
          border-none 
          flex 
          items-center 
          justify-center
          z-100
          overflow-hidden
        "
      >
        <VisuallyHidden.Root>
          <DialogTitle>{alt || "Image Preview"}</DialogTitle>
        </VisuallyHidden.Root>

        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={src}
            alt={alt}
            className="
              /* This ensures it fills the screen height or width */
              w-full 
              h-full 
              /* This ensures the image isn't cropped or stretched weirdly */
              object-contain 
              /* This ensures smooth scaling for lower-res images */
              antialiased
            "
            style={{
              // Standard way to ensure the best possible scaling quality
              imageRendering: "auto",
              // Extra safety for Webkit browsers (Safari/Chrome)
              WebkitBackfaceVisibility: "hidden",
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
