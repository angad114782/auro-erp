// src/utils/pdfGenerator.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ===================== DESIGN SYSTEM ===================== */
const COLORS = {
  primary: "#1e3a8a", // Dark Blue (for Headers and Titles)
  secondary: "#10b981", // Green (for approved/profit)
  headerText: "#ffffff",
  textDark: "#111827",
  textLight: "#6b7280", // Gray for labels
  border: "#d1d5db", // Light gray border
  bgGray: "#f3f4f6", // Very light gray for label backgrounds/muted columns
  statusPOPending: "#f59e0b", // Amber/Orange
  statusRedSeal: "#ef4444", // Red
  statusGreenSeal: "#059669", // Dark Green
  statusAllProjects: "#a855f7", // Purple
};

const LAYOUT = {
  marginX: 14,
  width: 182, // A4 width (210) - margins (28)
  rowH: 11, // Tighter height for info rows
  pageBreakThreshold: 255, // Y position to trigger a new page
};

/* ------------------------------------------------------
   Utility helpers
------------------------------------------------------ */
const safe = (v: any) =>
  v === null || v === undefined || v === "" ? "—" : String(v);

/** Formats currency preserving exact decimal places (3 decimal places) */
const formatINR = (v: number | string): string => {
  if (v === null || v === undefined || v === "") return "—";

  const str = String(v);
  const num = Number(v);

  if (isNaN(num)) return str;

  // Check if it has decimal part
  if (!str.includes(".")) {
    return num.toLocaleString("en-IN") + ".000";
  }

  // Split integer and decimal parts from the original string
  const [integerPart, decimalPart] = str.split(".");
  const integerNum = Number(integerPart);
  const formattedInteger = integerNum.toLocaleString("en-IN");

  // Ensure exactly 3 decimal places, pad with zeros if needed
  const paddedDecimal = decimalPart.padEnd(3, "0").substring(0, 3);

  return `${formattedInteger}.${paddedDecimal}`;
};

/** Formats quantity preserving exact decimal places */
const formatQuantity = (v: number | string): string => {
  return formatINR(v); // Reuse same logic
};

const money = (v: number) => (v > 0 ? `INR ${formatINR(v)}` : "—");

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
   PDF Helpers (The core UI components)
------------------------------------------------------ */

/** Helper to draw a structured grid cell */
function drawInfoCell(
  doc: jsPDF,
  label: string,
  value: string | number,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const cleanValue = safe(value);

  // Draw Box
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.1);
  doc.rect(x, y, w, h);

  // Draw Label (Small, top left)
  doc.setFontSize(6);
  doc.setTextColor(COLORS.textLight);
  doc.setFont("helvetica", "bold");
  doc.text(label.toUpperCase(), x + 2, y + 4);

  // Draw Value (Larger, bottom left)
  doc.setFontSize(9);
  doc.setTextColor(COLORS.textDark);
  doc.setFont("helvetica", "normal");

  // Use splitTextToSize to handle potential overflow
  const splitValue = doc.splitTextToSize(cleanValue, w - 4);
  doc.text(splitValue.length > 0 ? splitValue[0] : "", x + 2, y + 9);
}

/** Helper to draw a section title with thicker underline and generous spacing (Clutter Fix) */
function drawSectionHeader(
  doc: jsPDF,
  title: string,
  y: number,
  color: string = COLORS.primary
) {
  // Add generous vertical spacing *before* the header (UI/UX fix)
  y += 8;

  doc.setFontSize(12);
  // Need to convert HEX to RGB for setTextColor
  const [r, g, b] = (doc as any).hexToRgb(color);
  doc.setTextColor(r, g, b);
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), LAYOUT.marginX, y);

  // Thicker Underline
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.4);
  doc.line(LAYOUT.marginX, y + 1.5, LAYOUT.marginX + LAYOUT.width, y + 1.5);

  return y + 5; // Extra space after underline before content starts
}

/** Helper to check and force a page break */
function checkPageBreak(doc: jsPDF, y: number, requiredSpace: number = 30) {
  if (y + requiredSpace > LAYOUT.pageBreakThreshold) {
    doc.addPage();
    return 20;
  }
  return y;
}

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
  y = drawSectionHeader(doc, "Project Details", y, COLORS.primary);

  const startX = LAYOUT.marginX;
  const rowH = LAYOUT.rowH;

  // Row 1
  drawInfoCell(doc, "Project Code", p.autoCode, startX, y, 45, rowH);
  drawInfoCell(doc, "Company", safe(p.company?.name), startX + 45, y, 45, rowH);
  drawInfoCell(doc, "Brand", safe(p.brand?.name), startX + 90, y, 45, rowH);
  drawInfoCell(
    doc,
    "Category",
    safe(p.category?.name),
    startX + 135,
    y,
    47,
    rowH
  );
  y += rowH;

  // Row 2
  drawInfoCell(
    doc,
    "Type / Gender",
    `${safe(p.type?.name)} / ${safe(p.gender)}`,
    startX,
    y,
    90,
    rowH
  );
  drawInfoCell(doc, "Art Name", safe(p.artName), startX + 90, y, 45, rowH);
  drawInfoCell(doc, "Color", safe(p.color), startX + 135, y, 47, rowH);
  y += rowH;

  // Row 3
  drawInfoCell(doc, "Priority", safe(p.priority), startX, y, 45, rowH);
  drawInfoCell(
    doc,
    "Target Date (Red Seal)",
    formatDate(p.redSealTargetDate),
    startX + 45,
    y,
    45,
    rowH
  );
  drawInfoCell(
    doc,
    "Assigned Person",
    safe(p.assignPerson?.name),
    startX + 90,
    y,
    92,
    rowH
  );
  y += rowH;

  // Row 4
  drawInfoCell(
    doc,
    "Status",
    safe(p.status || "PO PENDING"),
    startX,
    y,
    90,
    rowH
  );
  drawInfoCell(
    doc,
    "Client Approval",
    safe(p.clientApproval),
    startX + 90,
    y,
    92,
    rowH
  );
  y += rowH;

  return y + 10; // Generous space after the grid (Clutter Fix)
};

/* ------------------------------------------------------
   Section: Images
------------------------------------------------------ */
const renderImages = async (doc: jsPDF, p: any, y: number) => {
  y = checkPageBreak(doc, y, 70);
  y = drawSectionHeader(doc, "Product Visuals", y, COLORS.primary);

  const allImgs = [
    ...(p.coverImage ? [p.coverImage] : []),
    ...(p.sampleImages || []),
  ];

  if (allImgs.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(COLORS.textLight);
    doc.text("No images available", LAYOUT.marginX, y);
    return y + 15;
  }

  let x = LAYOUT.marginX;
  const imgSize = 40;
  const padding = 5;

  for (const img of allImgs.slice(0, 8)) {
    const b64 = await toBase64(img);
    if (!b64) continue;

    doc.addImage(b64, "JPEG", x, y, imgSize, imgSize);

    // Add subtle border
    doc.setDrawColor(COLORS.border);
    doc.rect(x, y, imgSize, imgSize);

    x += imgSize + padding;

    if (x + imgSize > LAYOUT.marginX + LAYOUT.width) {
      x = LAYOUT.marginX;
      y += imgSize + padding;
      y = checkPageBreak(doc, y, imgSize + 5);
    }
  }

  return y + imgSize + 10; // Generous space after image block (Clutter Fix)
};

/* ------------------------------------------------------
   Section: PO Details
------------------------------------------------------ */
const renderPODetails = (doc: jsPDF, p: any, y: number) => {
  y = checkPageBreak(doc, y);
  y = drawSectionHeader(
    doc,
    "Purchase Order & Finance",
    y,
    COLORS.statusPOPending
  );

  const startX = LAYOUT.marginX;
  const rowH = LAYOUT.rowH;
  const po = p.po;

  // Row 1: PO Number | Status | Target Delivery
  drawInfoCell(
    doc,
    "PO Number",
    safe(po?.poNumber || p.poNumber || "N/A"),
    startX,
    y,
    60,
    rowH
  );
  drawInfoCell(
    doc,
    "PO Status",
    p.status === "po_pending" ? "PENDING" : "APPROVED",
    startX + 60,
    y,
    60,
    rowH
  );
  drawInfoCell(
    doc,
    "Target Delivery Date",
    formatDate(po?.deliveryDate || p.redSealTargetDate),
    startX + 120,
    y,
    62,
    rowH
  );
  y += rowH;

  // Row 2: Quantity | Unit Price | Total Value
  drawInfoCell(
    doc,
    "Order Quantity",
    formatQuantity(po?.orderQuantity || p.orderQuantity || 0),
    startX,
    y,
    60,
    rowH
  );
  drawInfoCell(
    doc,
    "Unit Price (INR)",
    formatINR(po?.unitPrice || p.unitPrice || 0),
    startX + 60,
    y,
    60,
    rowH
  );
  drawInfoCell(
    doc,
    "Total PO Value (INR)",
    formatINR(po?.totalAmount || p.poValue || 0),
    startX + 120,
    y,
    62,
    rowH
  );

  y += rowH + 5;

  // Cost Summary with Client Final Cost
  const costData = p.costData;
  const summary = costData?.summary;

  // Get EXACT values from summary (not recalculated)
  const materialTotal = summary?.materialTotal || 0;
  const componentTotal = summary?.componentTotal || 0;
  const upperTotal = summary?.upperTotal || 0;
  const packagingTotal = summary?.packagingTotal || 0;
  const miscTotal = summary?.miscTotal || 0;
  const labourTotal = summary?.labourTotal || 0;
  const additionalCosts = summary?.additionalCosts || 0;
  const profitMargin = summary?.profitMargin || 0;
  const profitAmount = summary?.profitAmount || 0;
  const totalCost = summary?.totalAllCosts || 0;
  const tentativeCost = summary?.tentativeCost || 0;

  const poValue = po?.totalAmount || p.poValue || 0;
  const clientFinalCost = Number(
    p.clientFinalCost ?? p.po?.clientFinalCost ?? 0
  );

  // Enhanced cost analysis table
  y = checkPageBreak(doc, y, 50);

  doc.setFontSize(10);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("Detailed Cost & Profit Analysis", startX, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    head: [["Cost Head", "Amount (INR)"]],
    body: [
      ["Total Production Cost", formatINR(totalCost)],
      ["Additional / Overhead Costs", formatINR(additionalCosts)],
      ["Subtotal (Cost + Overhead)", formatINR(totalCost + additionalCosts)],
      [`Profit @ ${formatINR(profitMargin)}%`, formatINR(profitAmount)],
      ["Tentative Cost", formatINR(tentativeCost)],
      ["PO Value (Sale Price)", formatINR(poValue)],
      ["Brand Final Cost", formatINR(clientFinalCost)],
    ],

    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: COLORS.textDark,
      valign: "middle",
      font: "helvetica",
    },
    headStyles: {
      fillColor: COLORS.bgGray,
      textColor: COLORS.textDark,
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: {
        cellWidth: 120,
        fontStyle: "bold",
      },
      1: {
        cellWidth: 62,
        halign: "right",
        fontStyle: "normal",
      },
    },
    didParseCell(data) {
      const label = data.row.raw?.[0];

      if (
        label === "Subtotal (Cost + Overhead)" ||
        label === "Brand Final Cost" ||
        label === "Final Margin"
      ) {
        data.cell.styles.fontStyle = "bold";
      }

      if (label === "Brand Final Cost") {
        data.cell.styles.textColor = COLORS.secondary;
      }
    },
    margin: { left: LAYOUT.marginX, right: LAYOUT.marginX },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  return y;
};

/* ------------------------------------------------------
   Section: Materials & Components
------------------------------------------------------ */
const renderMaterialsComponents = (doc: jsPDF, p: any, y: number) => {
  y = checkPageBreak(doc, y);
  y = drawSectionHeader(doc, "Detailed Cost Breakdown", y, COLORS.primary);

  const costData = p.costData;

  const dataSections = [
    { title: "Upper Materials", data: costData?.upper || [], color: "#8B4513" }, // Saddle Brown
    {
      title: "Raw Materials",
      data: costData?.material || p.materials || [],
      color: "#006400",
    }, // Dark Green
    {
      title: "Components",
      data: costData?.component || p.components || [],
      color: "#4B0082",
    }, // Indigo
    { title: "Packaging", data: costData?.packaging || [], color: "#1F4E79" }, // Dark Steel Blue
    {
      title: "Miscellaneous",
      data: costData?.miscellaneous || [],
      color: "#800080",
    }, // Purple
    {
      title: "Labour Costs",
      data: costData?.labour?.items || [],
      color: "#A52A2A",
    }, // Brown
  ];

  for (const section of dataSections) {
    if (section.data.length === 0) continue;

    y = checkPageBreak(doc, y, 30);

    // Section Title
    const [r, g, b] = (doc as any).hexToRgb(section.color);
    doc.setFontSize(10);
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.text(section.title.toUpperCase(), LAYOUT.marginX, y);
    y += 3;

    const isLabour = section.title.includes("Labour");

    const head = isLabour
      ? [["Activity", "Description", "Rate (INR)", "Hours", "Cost (INR)"]]
      : [["Item/Material", "Description", "Consumption", "Cost (INR)"]];

    const body = isLabour
      ? section.data.map((l: any) => [
          safe(l.name),
          safe(l.description || ""),
          formatINR(l.rate || 0),
          safe(l.hours || 0),
          formatINR(l.cost || 0),
        ])
      : section.data.map((m: any) => [
          safe(m.item || m.name),
          safe(m.description || m.desc),
          formatQuantity(m.consumption || m.quantity || 0),
          formatINR(m.cost || 0),
        ]);

    autoTable(doc, {
      startY: y,
      head: head,
      body: body,
      theme: "grid",
      headStyles: {
        fillColor: [r, g, b],
        textColor: 255,
        fontSize: 8,
        cellPadding: 2,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: COLORS.textDark,
        font: "helvetica",
      },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: "bold" },
        1: { cellWidth: 55, fontStyle: "normal" },
        [head[0].length - 2]: {
          halign: "right",
          cellWidth: 30,
        },
        [head[0].length - 1]: {
          halign: "right",
          fontStyle: "bold",
          cellWidth: 32,
        },
      },
      margin: { left: LAYOUT.marginX, right: LAYOUT.marginX },
    });

    y = (doc as any).lastAutoTable.finalY + 6; // Space between sub-tables
  }

  // Add Overall Cost Summary Table
  const summary = costData?.summary;
  if (summary) {
    y = checkPageBreak(doc, y);

    y = drawSectionHeader(doc, "Overall Cost Summary", y, COLORS.primary);

    const clientFinalCost = Number(
      p.clientFinalCost ?? p.po?.clientFinalCost ?? 0
    );

    // Use EXACT values from summary
    const summaryRows = [
      // ===== MATERIAL BREAKDOWN =====
      ["Upper Cost", formatINR(summary.upperTotal || 0)],
      ["Materials Cost", formatINR(summary.materialTotal || 0)],
      ["Components Cost", formatINR(summary.componentTotal || 0)],
      ["Packaging Cost", formatINR(summary.packagingTotal || 0)],
      ["Miscellaneous Cost", formatINR(summary.miscTotal || 0)],
      ["Labour Cost", formatINR(summary.labourTotal || 0)],
      ["Additional / Overhead Costs", formatINR(summary.additionalCosts || 0)],
      ["Profit", formatINR(summary.profitAmount || 0)],
      // ===== GRAND TOTAL =====
      ["TOTAL PRODUCTION COST", formatINR(summary.totalAllCosts || 0)],
      // ===== CLIENT / BRAND =====
      ["Brand Final Cost (Approved)", formatINR(clientFinalCost)],
    ];

    autoTable(doc, {
      startY: y,
      body: summaryRows,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: COLORS.textDark,
        valign: "middle",
        font: "helvetica",
      },
      columnStyles: {
        0: {
          cellWidth: 120,
          fontStyle: "bold",
          fillColor: COLORS.bgGray,
        },
        1: {
          cellWidth: 62,
          halign: "right",
        },
      },
      didParseCell(data) {
        const label = data.row.raw?.[0];

        if (
          label === "TOTAL PRODUCTION COST" ||
          label === "Brand Final Cost (Approved)"
        ) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = COLORS.primary;
        }

        if (label === "Brand Final Cost (Approved)") {
          data.cell.styles.textColor = COLORS.secondary;
        }
      },
      margin: { left: LAYOUT.marginX, right: LAYOUT.marginX },
    });

    y = (doc as any).lastAutoTable.finalY + 12;
  }

  return y;
};

/* ------------------------------------------------------
   Section: Client Feedback
------------------------------------------------------ */
const renderClientFeedback = (doc: jsPDF, p: any, y: number) => {
  if (!p.productDesc && !p.nextUpdate?.note && !p.clientApproval) return y;

  y = checkPageBreak(doc, y);
  y = drawSectionHeader(
    doc,
    "Client Feedback & Notes",
    y,
    COLORS.statusPOPending
  );

  const startX = LAYOUT.marginX;
  const drawTextBox = (title: string, text: string) => {
    if (!text) return;

    y = checkPageBreak(doc, y, 20);

    doc.setFontSize(9);
    doc.setTextColor(COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(title, startX, y);
    y += 2;

    const splitText = doc.splitTextToSize(text || "N/A", LAYOUT.width - 4);
    const boxHeight = splitText.length * 4 + 6;

    doc.setDrawColor(COLORS.border);
    doc.setFillColor(255, 255, 255);
    doc.rect(startX, y, LAYOUT.width, boxHeight, "FD");

    doc.setFontSize(8);
    doc.setTextColor(COLORS.textDark);
    doc.setFont("helvetica", "normal");
    doc.text(splitText, startX + 2, y + 4);

    y += boxHeight + 10; // Generous space after text box (Clutter Fix)
  };

  drawTextBox("Product Remarks / Description", p.productDesc);

  // Approval Status & Next Update Date in a tight grid
  const rowH = LAYOUT.rowH;

  if (p.clientApproval || p.nextUpdate?.date) {
    y = checkPageBreak(doc, y, rowH + 5);

    if (p.clientApproval) {
      drawInfoCell(
        doc,
        "Approval Status",
        safe(p.clientApproval),
        startX,
        y,
        90,
        rowH
      );
    }
    if (p.nextUpdate?.date) {
      drawInfoCell(
        doc,
        "Next Update Date",
        formatDate(p.nextUpdate.date),
        startX + 90,
        y,
        92,
        rowH
      );
    }
    y += rowH + 5;
  }

  if (p.nextUpdate?.note) {
    drawTextBox("Next Update Notes", p.nextUpdate.note);
  }

  return y;
};

/* ------------------------------------------------------
   Section: Color Variants
------------------------------------------------------ */
const renderColorVariants = (doc: jsPDF, p: any, y: number) => {
  const colorVariants = p.colorVariants || {};
  const colorKeys = Object.keys(colorVariants);

  if (colorKeys.length === 0) return y;

  y = checkPageBreak(doc, y);
  y = drawSectionHeader(
    doc,
    "Color Variants Costing Analysis",
    y,
    COLORS.statusAllProjects
  );

  const dataSectionsConfig = [
    { title: "Upper Materials", key: "upper", color: "#8B4513" },
    { title: "Raw Materials", key: "material", color: "#006400" },
    { title: "Components", key: "component", color: "#4B0082" },
    { title: "Labour Costs", key: "labour", color: "#A52A2A" },
  ];

  colorKeys.forEach((colorName, index) => {
    const variant = colorVariants[colorName];

    y = checkPageBreak(doc, y, 40);

    // Variant Sub-Header (Boxed - UX Improvement)
    doc.setDrawColor(COLORS.border);
    doc.setFillColor(COLORS.bgGray);
    doc.rect(LAYOUT.marginX, y, LAYOUT.width, 7, "FD");
    doc.setFontSize(10);
    doc.setTextColor(COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(`Variant: ${colorName}`, LAYOUT.marginX + 2, y + 5);
    y += 10;

    // --- Variant Cost Breakdown ---
    if (variant.costing) {
      const costing = variant.costing;

      dataSectionsConfig.forEach((sectionConfig) => {
        const data =
          (sectionConfig.key === "labour"
            ? costing.labour?.items
            : costing[sectionConfig.key]) || [];
        if (data.length === 0) return;

        y = checkPageBreak(doc, y, 30);

        // Section Title
        const [r, g, b] = (doc as any).hexToRgb(sectionConfig.color);
        doc.setFontSize(9);
        doc.setTextColor(r, g, b);
        doc.setFont("helvetica", "bold");
        doc.text(sectionConfig.title.toUpperCase(), LAYOUT.marginX, y);
        y += 3;

        const isLabour = sectionConfig.key === "labour";

        const head = isLabour
          ? [["Activity", "Description", "Rate (INR)", "Cost (INR)"]]
          : [["Item/Material", "Description", "Consumption", "Cost (INR)"]];

        const body = isLabour
          ? data.map((l: any) => [
              safe(l.name),
              safe(l.description || ""),
              formatINR(l.rate || 0),
              formatINR(l.cost || 0),
            ])
          : data.map((m: any) => [
              safe(m.item || m.name),
              safe(m.description || m.desc),
              formatQuantity(m.consumption || m.quantity || 0),
              formatINR(m.cost || 0),
            ]);

        autoTable(doc, {
          startY: y,
          head: head,
          body: body,
          theme: "grid",
          headStyles: {
            fillColor: [r, g, b],
            textColor: 255,
            fontSize: 7,
            cellPadding: 2,
          },
          styles: {
            fontSize: 7,
            cellPadding: 2,
            textColor: COLORS.textDark,
            font: "helvetica",
          },
          columnStyles: {
            0: { cellWidth: 40, fontStyle: "bold" },
            1: { cellWidth: 60, fontStyle: "normal" },
            [head[0].length - 1]: {
              halign: "right",
              fontStyle: "bold",
              cellWidth: 30,
            },
          },
          margin: { left: LAYOUT.marginX, right: LAYOUT.marginX },
        });
        y = (doc as any).lastAutoTable.finalY + 5;
      });
    }

    // Separator between variants (Clutter Fix)
    if (index < colorKeys.length - 1) {
      y += 8;
      doc.setDrawColor(COLORS.border);
      doc.line(LAYOUT.marginX, y, LAYOUT.marginX + LAYOUT.width, y);
      y += 8;
    }
  });

  return y;
};

/* ------------------------------------------------------
   TAB CONFIGURATION
------------------------------------------------------ */
const TAB_LAYOUT: Record<string, string[]> = {
  prototype: [
    "product_details",
    "images",
    "client_feedback",
    "materials_components",
  ],
  red_seal: [
    "product_details",
    "images",
    "client_feedback",
    "materials_components",
  ],
  green_seal: [
    "product_details",
    "images",
    "client_feedback",
    "materials_components",
    "color_variants",
  ],
  po_pending: [
    "product_details",
    "images",
    "materials_components",
    "po_details",
    "color_variants",
    "client_feedback",
  ],
  po_approved: [
    "product_details",
    "images",
    "materials_components",
    "po_details",
    "client_feedback",
  ],
  all_projects: [
    "product_details",
    "images",
    "materials_components",
    "po_details",
    "color_variants",
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
  color_variants: renderColorVariants,
};

const loadLogoAsBase64 = async (url?: string) => {
  if (!url) return null;
  try {
    return await toBase64(url);
  } catch {
    return null;
  }
};

/* ------------------------------------------------------
   MAIN FUNCTION
------------------------------------------------------ */
export const generateProjectPDF = async ({
  project,
  costData,
  activeTab,
  companyName = "AURA INTERNATIONAL",
  logoUrl,
  colorVariants = {},
}: {
  project: any;
  costData?: any;
  activeTab: string;
  companyName?: string;
  logoUrl?: string;
  colorVariants?: any;
}) => {
  const colorVariantsObj =
    colorVariants instanceof Map
      ? Object.fromEntries(colorVariants)
      : colorVariants;

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
    colorVariants: colorVariantsObj || {},
  };

  const doc = new jsPDF("p", "mm", "a4");

  /* ---------------- HEX → RGB HELPER ---------------- */
  (doc as any).hexToRgb = (hex: string): [number, number, number] => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [0, 0, 0];
  };

  /* ---------------- DOC META ---------------- */
  doc.setProperties({
    title: `Project Report - ${p.autoCode} (${activeTab.toUpperCase()})`,
    subject: "Project Details",
    creator: "Project Management System",
    author: "System",
  });

  /* ---------------- HEADER COLOR ---------------- */
  const statusColorMap: Record<string, string> = {
    po_approved: COLORS.secondary,
    po_pending: COLORS.statusPOPending,
    green_seal: COLORS.statusGreenSeal,
    red_seal: COLORS.statusRedSeal,
    prototype: COLORS.primary,
    all_projects: COLORS.statusAllProjects,
  };

  const headerColorHex = statusColorMap[activeTab] || COLORS.primary;
  const headerColorRgb = (doc as any).hexToRgb(headerColorHex);

  /* ================= HEADER ================= */
  doc.setFillColor(...headerColorRgb);
  doc.rect(0, 0, doc.internal.pageSize.width, 34, "F");

  /* -------- LOGO (OPTIONAL) -------- */
  let logoBase64: string | null = null;
  if (logoUrl) {
    try {
      logoBase64 = await loadLogoAsBase64(logoUrl);
    } catch {
      logoBase64 = null;
    }
  }

  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", LAYOUT.marginX, 6, 18, 18);
  }

  const headerTextX = logoBase64 ? LAYOUT.marginX + 24 : LAYOUT.marginX;

  /* -------- REPORT TITLE -------- */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(COLORS.headerText);
  doc.text(
    `${activeTab.toUpperCase().replace(/_/g, " ")} REPORT`,
    headerTextX,
    14
  );

  /* -------- COMPANY NAME -------- */
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(companyName.toUpperCase(), headerTextX, 20);

  /* -------- PROJECT META -------- */
  doc.setFontSize(10);
  doc.text(
    `Project Code: ${safe(p.autoCode).toUpperCase()} | Status: ${safe(
      p.status || "N/A"
    ).toUpperCase()}`,
    headerTextX,
    26
  );

  /* ================= CONTENT START ================= */
  let y = 40;

  const sections = TAB_LAYOUT[activeTab] || TAB_LAYOUT["po_pending"];

  for (const key of sections) {
    const fn = SECTION_MAP[key];
    if (!fn) continue;

    y = checkPageBreak(doc, y, 10);

    if (key === "images") {
      y = await renderImages(doc, p, y);
    } else {
      y = fn(doc, p, y) as number;
    }

    y = checkPageBreak(doc, y);
  }

  /* ================= FOOTER ================= */
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    const [r, g, b] = (doc as any).hexToRgb(COLORS.textLight);
    doc.setTextColor(r, g, b);

    doc.text(
      `Confidential | ${companyName}`,
      LAYOUT.marginX,
      doc.internal.pageSize.height - 10
    );

    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - LAYOUT.marginX,
      doc.internal.pageSize.height - 10,
      { align: "right" }
    );
  }

  /* ================= SAVE ================= */
  const statusMap: Record<string, string> = {
    po_pending: "PO_Pending",
    po_approved: "PO_Approved",
    green_seal: "Green_Seal",
    red_seal: "Red_Seal",
    prototype: "Prototype",
    all_projects: "All_Projects",
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

// Helper export for Tentative Cost PDF generation
export const generateTentativeCostPDF = async ({
  project,
  costData,
  companyName = "AURA INTERNATIONAL",
  logoUrl,
}: {
  project: any;
  costData: {
    upper: any[];
    component: any[];
    material: any[];
    packaging: any[];
    miscellaneous: any[];
    labour: any;
    summary: any;
  };
  companyName?: string;
  logoUrl?: string;
}) => {
  await generateProjectPDF({
    project: {
      ...project,
      costData,
      po: {
        poNumber: project.poNumber,
        orderQuantity: project.orderQuantity,
        unitPrice: project.unitPrice,
        totalAmount: project.poValue,
        deliveryDate: project.redSealTargetDate,
      },
    },
    costData,
    activeTab: "po_pending",
    companyName,
    logoUrl,
    colorVariants: {},
  });
};
