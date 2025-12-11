// utils/projectUtils.ts

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/** ---------------------------------------------------
 *  Convert DataURL → File (for image upload)
 * --------------------------------------------------*/
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";

  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) u8arr[n] = bstr.charCodeAt(n);

  return new File([u8arr], filename, { type: mime });
}

/** ---------------------------------------------------
 *  Build full image URL (backend or data URL)
 * --------------------------------------------------*/
// export function getFullImageUrl(img?: string | null): string {
//   if (!img) return "";
//   if (img.startsWith("data:")) return img;
//   if (img.startsWith("http")) return img;
//   return `${BACKEND_URL}/${img}`;
// }

// /** ---------------------------------------------------
//  *  Format date as dd/MM/yyyy
//  * --------------------------------------------------*/
// export function formatDateDisplay(date?: string | null): string {
//   if (!date) return "N/A";
//   const d = new Date(date);
//   if (isNaN(d.getTime())) return "Invalid Date";
//   return d.toLocaleDateString("en-GB");
// }

/** ---------------------------------------------------
 *  Stage Object → progress, color, label
 * --------------------------------------------------*/
export function getStage(stageId?: string) {
  const stages: Record<
    string,
    {
      id: string;
      name: string;
      progress: number;
      color: string;
    }
  > = {
    idea: {
      id: "idea",
      name: "Idea Submitted",
      progress: 12,
      color: "bg-blue-100 text-blue-800",
    },
    prototype: {
      id: "prototype",
      name: "Prototype",
      progress: 30,
      color: "bg-purple-100 text-purple-800",
    },
    red_seal: {
      id: "red_seal",
      name: "Red Seal",
      progress: 50,
      color: "bg-red-100 text-red-800",
    },
    green_seal: {
      id: "green_seal",
      name: "Green Seal",
      progress: 70,
      color: "bg-green-100 text-green-800",
    },
    po_pending: {
      id: "po_pending",
      name: "PO Pending",
      progress: 86,
      color: "bg-orange-100 text-orange-800",
    },
    po_approved: {
      id: "po_approved",
      name: "PO Approved",
      progress: 100,
      color: "bg-emerald-100 text-emerald-800",
    },
  };

  return (
    stages[stageId || ""] || {
      id: stageId || "",
      name: stageId || "",
      progress: 0,
      color: "bg-gray-100 text-gray-800",
    }
  );
}

export const getFullImageUrl = (img?: string | null) => {
  if (!img) return "";
  if (img.startsWith("http") || img.startsWith("data:")) return img;
  return `${import.meta.env.VITE_BACKEND_URL}/${img}`;
};

export const formatDateDisplay = (d?: string | null) => {
  if (!d) return "TBD";
  try {
    return new Date(d).toLocaleDateString("en-GB");
  } catch {
    return d;
  }
};
