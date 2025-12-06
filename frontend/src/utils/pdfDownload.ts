// src/utils/pdfGenerator.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ------------------------------------------------------
   Utility helpers
------------------------------------------------------ */
const safe = (v: any) =>
  v === null || v === undefined || v === "" ? "—" : String(v);

const formatINR = (v: number | string) => {
  const num = Number(v || 0);

  // For very large numbers (over 1 crore), show full number
  if (num >= 10000000) {
    return (
      "₹ " +
      num.toLocaleString("en-IN", {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      })
    );
  }

  // For regular numbers
  return (
    "₹ " +
    num.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    })
  );
};
const formatDate = (d?: string) => {
  if (!d) return "N/A";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* ------------------------------------------------------
   Convert image → base64 (required for jsPDF)
------------------------------------------------------ */
const toBase64 = (url: string): Promise<string> =>
  new Promise((resolve) => {
    if (!url) return resolve("");
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      let w = img.width;
      let h = img.height;

      // Scale down if too large
      const max = 1000;
      if (w > max || h > max) {
        const r = Math.min(max / w, max / h);
        w *= r;
        h *= r;
      }

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };

    img.onerror = () => resolve("");
  });

/* ------------------------------------------------------
   Section: Product Details
------------------------------------------------------ */
const renderProductDetails = (doc: jsPDF, p: any, y: number) => {
  autoTable(doc, {
    startY: y,
    head: [["Field", "Value"]],
    body: [
      ["Project Code", safe(p.autoCode)],
      ["Company", safe(p.company?.name)],
      ["Brand", safe(p.brand?.name)],
      ["Category", safe(p.category?.name)],
      ["Type", safe(p.type?.name)],
      ["Gender", safe(p.gender)],
      ["Art Name", safe(p.artName)],
      ["Color", safe(p.color)],
      ["Priority", safe(p.priority)],
      ["Target Date", formatDate(p.redSealTargetDate)],
      ["Assigned Person", safe(p.assignPerson?.name)],
      ["Status", safe(p.status || "PO PENDING")],
      ["Client Approval", safe(p.clientApproval)],
    ],
    theme: "grid",
    headStyles: { fillColor: [40, 90, 160], textColor: 255 },
    styles: { fontSize: 10 },
    showFoot: "never",
  });

  return (doc as any).lastAutoTable.finalY + 10;
};

/* ------------------------------------------------------
   Section: Images
------------------------------------------------------ */
const renderImages = async (doc: jsPDF, p: any, y: number) => {
  doc.setFontSize(13);
  doc.setTextColor(40, 90, 160);
  doc.text("PRODUCT IMAGES", 14, y);
  y += 8;

  const allImgs = [
    ...(p.coverImage ? [p.coverImage] : []),
    ...(p.sampleImages || []),
  ];

  if (allImgs.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("No images available", 14, y);
    return y + 15;
  }

  let x = 14;
  for (const img of allImgs) {
    const b64 = await toBase64(img);
    if (!b64) continue;

    doc.addImage(b64, "JPEG", x, y, 40, 40);
    x += 45;

    if (x + 40 > doc.internal.pageSize.width - 14) {
      x = 14;
      y += 45;
    }
  }

  return y + 50;
};

/* ------------------------------------------------------
   Section: PO Details
------------------------------------------------------ */
const renderPODetails = (doc: jsPDF, p: any, y: number) => {
  doc.setFontSize(16);
  doc.setTextColor(255, 140, 0); // Orange for PO
  doc.text("PURCHASE ORDER DETAILS", 14, y);
  y += 12;

  // Main PO Information
  autoTable(doc, {
    startY: y,
    head: [["PO FIELD", "VALUE"]],
    body: [
      ["PO Status", p.status === "po_pending" ? "PENDING" : "APPROVED"],
      ["PO Number", safe(p.po?.poNumber || p.poNumber || "Not Assigned")],
      ["Order Quantity", safe(p.po?.orderQuantity || p.orderQuantity || 0)],
      ["Unit Price", formatINR(p.po?.unitPrice || p.unitPrice || 0)],
      ["Total PO Value", formatINR(p.po?.totalAmount || p.poValue || 0)],
      ["Target Delivery Date", formatDate(p.redSealTargetDate)],
      ["Client Approval", safe(p.clientApproval)],
    ],
    theme: "grid",
    headStyles: { fillColor: [255, 140, 0] },
    styles: { fontSize: 10 },
    showFoot: "never",
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Cost Summary if available
  if (
    p.costData?.summary ||
    (p.materials?.length > 0 && p.components?.length > 0)
  ) {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 139);
    doc.text("COST ANALYSIS SUMMARY", 14, y);
    y += 8;

    const materialTotal =
      p.costData?.summary?.materialTotal ||
      (p.costData?.material || []).reduce(
        (sum: number, m: any) => sum + (m.cost || 0),
        0
      ) ||
      0;

    const componentTotal =
      p.costData?.summary?.componentTotal ||
      (p.costData?.component || []).reduce(
        (sum: number, c: any) => sum + (c.cost || 0),
        0
      ) ||
      0;

    const totalCost = materialTotal + componentTotal;
    const poValue = p.po?.totalAmount || p.poValue || 0;
    const profit = poValue > 0 ? poValue - totalCost : 0;
    const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    autoTable(doc, {
      startY: y,
      head: [["Item", "Amount"]],
      body: [
        ["Materials Cost", formatINR(materialTotal)],
        ["Components Cost", formatINR(componentTotal)],
        ["Total Production Cost", formatINR(totalCost)],
        ["PO Value", formatINR(poValue)],
        ["Estimated Profit", formatINR(profit)],
        ["Profit Margin", `${profitMargin.toFixed(2)}%`],
      ],
      theme: "grid",
      headStyles: { fillColor: [0, 0, 139] },
      styles: { fontSize: 10 },
      showFoot: "never",
    });

    y = (doc as any).lastAutoTable.finalY + 15;
  }

  return y;
};

/* ------------------------------------------------------
   Section: Materials & Components
------------------------------------------------------ */
const renderMaterialsComponents = (doc: jsPDF, p: any, y: number) => {
  // Materials Section
  const materials = p.costData?.material || p.materials || [];
  const components = p.costData?.component || p.components || [];

  if (materials.length > 0) {
    doc.setFontSize(13);
    doc.setTextColor(0, 100, 0);
    doc.text("MATERIALS USED", 14, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["Material", "Description", "Consumption"]],
      body: materials.map((m: any) => [
        safe(m.name),
        safe(m.desc || m.description),
        safe(m.consumption),
      ]),
      theme: "grid",
      headStyles: { fillColor: [0, 100, 0] },
      styles: { fontSize: 9 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Components Section
  if (components.length > 0) {
    doc.setFontSize(13);
    doc.setTextColor(75, 0, 130);
    doc.text("COMPONENTS USED", 14, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["Component", "Description", "Consumption"]],
      body: components.map((c: any) => [
        safe(c.name),
        safe(c.desc || c.description),
        safe(c.consumption),
      ]),
      theme: "grid",
      headStyles: { fillColor: [75, 0, 130] },
      styles: { fontSize: 9 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  return y;
};

/* ------------------------------------------------------
   Section: Client Feedback
------------------------------------------------------ */
const renderClientFeedback = (doc: jsPDF, p: any, y: number) => {
  if (!p.productDesc && !p.nextUpdate?.note && !p.clientApproval) return y;

  doc.setFontSize(13);
  doc.setTextColor(255, 140, 0);
  doc.text("CLIENT FEEDBACK & UPDATES", 14, y);
  y += 8;

  const feedbackRows = [];
  if (p.productDesc) feedbackRows.push(["Remarks", safe(p.productDesc)]);
  if (p.nextUpdate?.date)
    feedbackRows.push(["Next Update Date", formatDate(p.nextUpdate.date)]);
  if (p.nextUpdate?.note)
    feedbackRows.push(["Update Notes", safe(p.nextUpdate.note)]);
  if (p.clientApproval)
    feedbackRows.push(["Approval Status", safe(p.clientApproval)]);

  if (feedbackRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Field", "Details"]],
      body: feedbackRows,
      theme: "grid",
      headStyles: { fillColor: [255, 140, 0] },
      styles: { fontSize: 10 },
      showFoot: "never",
    });

    y = (doc as any).lastAutoTable.finalY + 12;
  }

  return y;
};

/* ------------------------------------------------------
   TAB CONFIGURATION
------------------------------------------------------ */
const TAB_LAYOUT = {
  prototype: ["product_details", "images", "client_feedback"],

  red_seal: ["product_details", "images", "client_feedback"],

  green_seal: [
    "product_details",
    "images",
    "client_feedback",
    "materials_components",
  ],

  po_pending: [
    "product_details",
    "images",
    "materials_components",
    "po_details",
    "client_feedback",
  ],

  po_approved: [
    "product_details",
    "images",
    "materials_components",
    "po_details",
    "client_feedback",
  ],
};

/* ------------------------------------------------------
   SECTION MAP
------------------------------------------------------ */
const SECTION_MAP: Record<
  string,
  (doc: jsPDF, p: any, y: number) => Promise<number> | number
> = {
  product_details: renderProductDetails,
  images: async (doc, p, y) => await renderImages(doc, p, y),
  client_feedback: renderClientFeedback,
  materials_components: renderMaterialsComponents,
  po_details: renderPODetails,
};

/* ------------------------------------------------------
   MAIN FUNCTION
------------------------------------------------------ */
export const generateProjectPDF = async ({
  project,
  costData,
  activeTab,
  colorVariants = {},
}: {
  project: any;
  costData?: any;
  activeTab: string;
  colorVariants?: any;
}) => {
  // Prepare the project data
  const p = {
    ...project,
    costData: costData || {
      material: project.materials || [],
      component: project.components || [],
      summary: null,
    },
    po: project.po || {
      poNumber: project.poNumber,
      orderQuantity: project.orderQuantity,
      unitPrice: project.unitPrice,
      totalAmount: project.poValue,
      deliveryDate: project.redSealTargetDate,
    },
  };

  const doc = new jsPDF("p", "mm", "a4");

  // Set document properties
  doc.setProperties({
    title: `Project Report - ${p.autoCode} (${activeTab.toUpperCase()})`,
    subject: "Project Details",
    creator: "Project Management System",
    author: "System",
  });

  // HEADER with status-specific color
  let headerColor = [40, 90, 160]; // Default blue

  if (activeTab === "po_pending") {
    headerColor = [255, 140, 0]; // Orange
  } else if (activeTab === "po_approved") {
    headerColor = [0, 150, 0]; // Green
  } else if (activeTab === "green_seal") {
    headerColor = [0, 128, 0]; // Green
  } else if (activeTab === "red_seal") {
    headerColor = [200, 50, 50]; // Red
  }

  doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.rect(0, 0, doc.internal.pageSize.width, 20, "F");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `${activeTab.toUpperCase().replace("_", " ")} REPORT`,
    doc.internal.pageSize.width / 2,
    12,
    {
      align: "center",
    }
  );

  let y = 28;

  const sections = TAB_LAYOUT[activeTab] || TAB_LAYOUT["po_pending"];

  for (const key of sections) {
    const fn = SECTION_MAP[key];
    if (fn) {
      if (key === "images") {
        y = await fn(doc, p, y);
      } else {
        y = fn(doc, p, y);
      }
    }

    // Add page break if near bottom
    if (y > doc.internal.pageSize.height - 50) {
      doc.addPage();
      y = 20;
    }
  }

  // Footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  // Save PDF with appropriate filename
  const statusMap: Record<string, string> = {
    po_pending: "PO_Pending",
    po_approved: "PO_Approved",
    green_seal: "Green_Seal",
    red_seal: "Red_Seal",
    prototype: "Prototype",
  };

  const statusLabel = statusMap[activeTab] || "Report";
  const filename = `${statusLabel}_${p.autoCode}_${
    new Date().toISOString().split("T")[0]
  }.pdf`;

  doc.save(filename);
};

// Helper export for PO Pending specific generation
export const generatePOPendingPDF = async (project: any) => {
  await generateProjectPDF({
    project,
    activeTab: "po_pending",
    colorVariants: {},
  });
};
