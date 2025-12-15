import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

/* ===================== TYPES ===================== */
interface ProductionCardPDFData {
  cardNumber: string;
  productName: string;
  projectId: string;
  cardQuantity: number;
  startDate: string;
  assignedPlant: string;
  description: string;
  specialInstructions: string;
  status: string;
  createdBy?: string;
  createdAt: string;
  workShift?: string;
  supervisor?: string;
  priority?: string;
  materialSections: {
    upper: any[];
    materials: any[];
    components: any[];
    packaging: any[];
    misc: any[];
  };
  allocationSummary: {
    totalOrder: number;
    alreadyAllocated: number;
    thisCardAllocated: number;
    available: number;
  };
}

/* ===================== THEME & CONFIG ===================== */
const COLORS = {
  primary: "#1e3a8a", // Dark Blue
  headerText: "#ffffff",
  textDark: "#111827",
  textLight: "#6b7280", // Gray for labels
  border: "#d1d5db", // Light gray border
  bgGray: "#f3f4f6", // Very light gray for label backgrounds
};

const LAYOUT = {
  marginX: 14,
  width: 182, // A4 width (210) - margins (28)
  rowHeight: 12, // Tighter height for rows
};

/* ===================== HELPERS ===================== */

// Helper to draw a single cell in a grid
function drawGridCell(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
  h: number,
  isLast: boolean = false
) {
  // Draw Box
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.1);
  doc.rect(x, y, w, h); // Draw Label (Small, top left)

  doc.setFontSize(6);
  doc.setTextColor(COLORS.textLight);
  doc.setFont("helvetica", "bold");
  doc.text(label.toUpperCase(), x + 2, y + 4); // Draw Value (Larger, bottom left)

  doc.setFontSize(9);
  doc.setTextColor(COLORS.textDark);
  doc.setFont("helvetica", "normal"); // Truncate text if too long to prevent overlapping

  const cleanValue = value ? String(value) : "-"; // Special handling for long product names

  if (cleanValue.length > 30 && w < 60) {
    doc.setFontSize(7); // Shrink font for long text
  }

  doc.text(cleanValue, x + 2, y + 9);
}

// Special helper for Status/Priority Badges inside the grid
function drawBadgeCell(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
  h: number,
  bgColor: string = COLORS.primary
) {
  doc.setDrawColor(COLORS.border);
  doc.rect(x, y, w, h); // Label

  doc.setFontSize(6);
  doc.setTextColor(COLORS.textLight);
  doc.setFont("helvetica", "bold");
  doc.text(label.toUpperCase(), x + 2, y + 4); // Badge Pill

  doc.setFillColor(bgColor);
  doc.roundedRect(x + 2, y + 6, w - 4, 4, 1, 1, "F"); // Badge Text

  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(value.toUpperCase(), x + w / 2, y + 9, { align: "center" });
}

/** Renders the company logo and name in the header */
function renderHeaderBranding(
  doc: jsPDF,
  pageWidth: number,
  companyName: string,
  logoBase64: string | null
) {
  const headerHeight = 24;
  const logoSize = 18; // 18mm x 18mm
  const logoX = pageWidth - LAYOUT.marginX - logoSize;
  const logoY = (headerHeight - logoSize) / 2 + 3; // Center vertically within the header bar

  // --- Company Name (Primary Title) ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLORS.headerText);
  doc.text(companyName.toUpperCase(), LAYOUT.marginX, 10);

  // --- Document Title ---
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("PRODUCTION CARD", LAYOUT.marginX, 20);

  // --- Logo ---
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", logoX, 3, logoSize, logoSize);
    } catch (e) {
      // Fallback if image data is invalid
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text("Logo Missing", logoX + logoSize / 2, 10, { align: "center" });
    }
  } else {
    // Dummy logo/placeholder
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.text("Aura International Logo", logoX + logoSize / 2, 10, {
      align: "center",
    });
  }
}

/* ===================== MAIN PDF GENERATOR ===================== */

export async function generateProductionCardPDF(
  cardData: ProductionCardPDFData,
  companyName: string = "Aura International",
  logoBase64: string | null = null
) {
  const doc = new jsPDF();
  let yPos = 15;
  const pageWidth =
    doc.internal.pageSize.width; /* ---------------- HEADER ---------------- */ // Top Bar Background

  doc.setFillColor(COLORS.primary);
  doc.rect(0, 0, pageWidth, 24, "F"); // Render Company Name and Logo

  renderHeaderBranding(doc, pageWidth, companyName, logoBase64); // Sub-details in Header (Moved to a safer y-position not conflicting with logo)

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.headerText);
  doc.text(
    `Created: ${format(new Date(cardData.createdAt), "dd MMM yyyy")}`,
    pageWidth - LAYOUT.marginX,
    20,
    { align: "right" }
  );
  doc.text(`Card #: ${cardData.cardNumber}`, pageWidth - LAYOUT.marginX, 15, {
    align: "right",
  });

  yPos = 30; /* ---------------- INFO GRID ---------------- */

  const startX = LAYOUT.marginX;
  const rowH = 11; // Row 1: Product (Wide) | Project ID | Quantity

  drawGridCell(
    doc,
    "Product Name",
    cardData.productName,
    startX,
    yPos,
    100,
    rowH
  );
  drawGridCell(
    doc,
    "Project ID",
    cardData.projectId,
    startX + 100,
    yPos,
    50,
    rowH
  );
  drawGridCell(
    doc,
    "Quantity",
    String(cardData.cardQuantity),
    startX + 150,
    yPos,
    32,
    rowH
  );

  yPos += rowH; // Row 2: Plant | Shift | Start Date | Supervisor

  drawGridCell(
    doc,
    "Assigned Plant",
    cardData.assignedPlant,
    startX,
    yPos,
    45,
    rowH
  );
  drawGridCell(
    doc,
    "Work Shift",
    cardData.workShift || "General",
    startX + 45,
    yPos,
    35,
    rowH
  );
  drawGridCell(
    doc,
    "Start Date",
    format(new Date(cardData.startDate), "dd MMM yyyy"),
    startX + 80,
    yPos,
    40,
    rowH
  );
  drawGridCell(
    doc,
    "Supervisor",
    cardData.supervisor || "-",
    startX + 120,
    yPos,
    62,
    rowH
  );

  yPos += rowH; // Row 3: Status | Priority | Created By // Determine badge colors

  const statusColor = cardData.status === "Completed" ? "#059669" : "#2563eb"; // Green or Blue
  const priorityColor = cardData.priority === "High" ? "#dc2626" : "#4b5563"; // Red or Gray

  drawBadgeCell(
    doc,
    "Current Status",
    cardData.status,
    startX,
    yPos,
    45,
    rowH,
    statusColor
  );
  drawBadgeCell(
    doc,
    "Priority Level",
    cardData.priority || "Normal",
    startX + 45,
    yPos,
    35,
    rowH,
    priorityColor
  );
  drawGridCell(
    doc,
    "Created By",
    cardData.createdBy || "System",
    startX + 80,
    yPos,
    102,
    rowH
  );

  yPos +=
    rowH + 8; /* ---------------- KPI SUMMARY (Compact) ---------------- */ // Added space

  doc.setFontSize(10);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("Allocation Summary", startX, yPos);

  yPos += 2; // Simple clean table for summary numbers

  autoTable(doc, {
    startY: yPos,
    head: [
      ["Total Order", "Already Allocated", "This Card", "Remaining Available"],
    ],
    body: [
      [
        cardData.allocationSummary.totalOrder,
        cardData.allocationSummary.alreadyAllocated,
        cardData.allocationSummary.thisCardAllocated,
        cardData.allocationSummary.available,
      ],
    ],
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 3,
      lineColor: COLORS.border,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: COLORS.bgGray,
      textColor: COLORS.textDark,
      fontStyle: "bold",
      lineColor: COLORS.border,
      lineWidth: 0.1,
      halign: "center", // CENTERED HEADER
    },
    bodyStyles: {
      halign: "center", // CENTERED BODY DATA
    },
    margin: { left: LAYOUT.marginX, right: LAYOUT.marginX },
    tableWidth: "auto",
  });

  yPos =
    (doc as any).lastAutoTable.finalY +
    8; /* ---------------- MATERIAL TABLES ---------------- */

  const sections = [
    { title: "Upper Material", data: cardData.materialSections.upper },
    { title: "Materials", data: cardData.materialSections.materials },
    { title: "Components", data: cardData.materialSections.components },
    { title: "Packaging", data: cardData.materialSections.packaging },
    { title: "Miscellaneous", data: cardData.materialSections.misc },
  ];

  for (const section of sections) {
    if (!section.data || section.data.length === 0) continue; // Check for page break

    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(10);
    doc.setTextColor(COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(section.title.toUpperCase(), startX, yPos); // Underline title

    doc.setDrawColor(COLORS.border);
    doc.line(startX, yPos + 1, startX + LAYOUT.width, yPos + 1);

    yPos += 3;

    autoTable(doc, {
      startY: yPos,
      head: [["Item", "Spec", "Dept", "Req", "Avail", "Issued", "Bal"]],
      body: section.data.map((i: any) => [
        i.name,
        i.specification || "-",
        i.department || "-",
        i.requirement?.toFixed(2),
        i.available?.toFixed(2),
        i.issued?.toFixed(2),
        i.balance?.toFixed(2),
      ]),
      theme: "plain",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        valign: "middle",
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: 255,
        fontSize: 8,
        halign: "center", // CENTERED HEADER
      },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: "bold" },
        3: { halign: "right" }, // Align Required right
        4: { halign: "right" }, // Align Available right
        5: { halign: "right" }, // Align Issued right
        6: { halign: "right", fontStyle: "bold" }, // Align Balance right
      },
      margin: { left: LAYOUT.marginX, right: LAYOUT.marginX },
    });

    yPos = (doc as any).lastAutoTable.finalY + 6;
  } /* ---------------- DESCRIPTION & INSTRUCTIONS ---------------- */

  const drawTextBox = (title: string, text: string) => {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(9);
    doc.setTextColor(COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(title, startX, yPos);
    yPos += 2;

    const splitText = doc.splitTextToSize(text || "N/A", LAYOUT.width - 4);
    const boxHeight = splitText.length * 4 + 6;

    doc.setDrawColor(COLORS.border);
    doc.setFillColor(255, 255, 255);
    doc.rect(startX, yPos, LAYOUT.width, boxHeight, "FD");

    doc.setFontSize(8);
    doc.setTextColor(COLORS.textDark);
    doc.setFont("helvetica", "normal");
    doc.text(splitText, startX + 2, yPos + 4);

    yPos += boxHeight + 5;
  };

  if (cardData.description) drawTextBox("Description", cardData.description);
  if (cardData.specialInstructions)
    drawTextBox(
      "Special Instructions",
      cardData.specialInstructions
    ); /* ---------------- SAVE ---------------- */

  doc.save(`Production_Card_${cardData.cardNumber}.pdf`);
}
