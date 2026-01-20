import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";

/* ===================== DESIGN SYSTEM ===================== */
const COLORS = {
  primary: "#1e3a8a", // Dark Blue
  secondary: "#10b981", // Green
  headerText: "#ffffff",
  textDark: "#111827",
  textLight: "#6b7280",
  border: "#d1d5db",
  bgGray: "#f3f4f6",
};

const LAYOUT = {
  marginX: 14,
  width: 182,
  rowH: 10,
  pageBreakThreshold: 270,
};

/* ------------------------------------------------------
   Utility helpers
------------------------------------------------------ */
const safe = (v: any) =>
  v === null || v === undefined || v === "" ? "—" : String(v);

const formatDate = (d?: string) => {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const formatNumber = (num: number) => {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
};

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
  doc.setFontSize(7);
  doc.setTextColor(COLORS.textLight);
  doc.setFont("helvetica", "bold");
  doc.text(label.toUpperCase(), x + 2, y + 4);

  // Draw Value (Larger, bottom left)
  doc.setFontSize(10);
  doc.setTextColor(COLORS.textDark);
  doc.setFont("helvetica", "normal");

  const splitValue = doc.splitTextToSize(cleanValue, w - 4);
  doc.text(splitValue.length > 0 ? splitValue[0] : "", x + 2, y + 9);
}

/** Helper to convert hex to RGB */
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

/** Helper to draw a section title */
function drawSectionHeader(
  doc: jsPDF,
  title: string,
  y: number,
  color: string = COLORS.primary
) {
  y += 5;
  doc.setFontSize(12);
  const [r, g, b] = hexToRgb(color);
  doc.setTextColor(r, g, b);
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), LAYOUT.marginX, y);

  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.4);
  doc.line(LAYOUT.marginX, y + 1.5, LAYOUT.marginX + LAYOUT.width, y + 1.5);

  return y + 5;
}

/* ------------------------------------------------------
   Export List Logic
------------------------------------------------------ */

export const exportDeliveryListToExcel = (data: any[], subModule: string) => {
  const fileName = `Delivery_${subModule.replace("-", "_")}_${new Date().getTime()}.xlsx`;
  
  const excelData = data.map((item, index) => ({
    "S.No": index + 1,
    "Project Code": item.projectCode,
    "Product Name": item.productName,
    "Brand": item.brandName,
    "Category": item.categoryName,
    "PO Number": item.poNumber,
    "PO Received": formatDate(item.poReceivedDate),
    "Expected Delivery": formatDate(item.expectedDeliveryDate),
    "Order Qty": item.quantity,
    "Send Qty": item.sendQuantity || 0,
    "Status": item.deliveryStatus,
    "Bill No": item.billNumber || "—",
    "LR No": item.lrNumber || "—",
    "Aging (Days)": item.aging,
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Deliveries");
  XLSX.writeFile(workbook, fileName);
};

export const exportDeliveryListToPDF = (data: any[], subModule: string) => {
  const doc = new jsPDF({ orientation: "landscape" });
  const title = subModule.replace("-", " ").toUpperCase() + " REPORT";
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text(title, LAYOUT.marginX, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(COLORS.textLight);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`, LAYOUT.marginX, 28);
  doc.text(`Total Records: ${data.length}`, LAYOUT.marginX, 33);

  const tableColumn = [
    "S.No",
    "Project",
    "Product",
    "Brand",
    "Category",
    "PO Number",
    "PO Received",
    "Expected Delivery",
    "Order Qty",
    "Send Qty",
    "Status",
    "Aging",
  ];

  const tableRows = data.map((item, index) => [
    index + 1,
    item.projectCode,
    item.productName,
    item.brandName,
    item.categoryName,
    item.poNumber,
    formatDate(item.poReceivedDate),
    formatDate(item.expectedDeliveryDate),
    formatNumber(item.quantity),
    formatNumber(item.sendQuantity || 0),
    item.deliveryStatus,
    `${item.aging}d`,
  ]);

  autoTable(doc, {
    startY: 40,
    head: [tableColumn],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: 255,
      fontSize: 8,
      halign: "center",
      valign: "middle",
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      8: { halign: "right" },
      9: { halign: "right" },
      11: { halign: "center" },
    },
    margin: { left: LAYOUT.marginX, right: LAYOUT.marginX },
  });

  doc.save(`Deliveries_${subModule.replace("-", "_")}_${new Date().getTime()}.pdf`);
};

/* ------------------------------------------------------
   Export Details Logic
------------------------------------------------------ */

export const exportDeliveryDetailsToExcel = (item: any) => {
  const fileName = `Delivery_Details_${item.projectCode}_${new Date().getTime()}.xlsx`;
  
  const detailData = [
    ["Delivery Details Report"],
    ["Generated on", format(new Date(), "dd MMM yyyy, hh:mm a")],
    [],
    ["Project Information"],
    ["Project Code", item.projectCode || "—"],
    ["PO Number", item.poNumber || "—"],
    ["Product Name", item.productName || "—"],
    ["Brand", item.brandName || "—"],
    ["Category", item.categoryName || "—"],
    ["Order Quantity", item.quantity || 0],
    [],
    ["Dates & Timeline"],
    ["PO Received Date", formatDate(item.poReceivedDate)],
    ["Expected Delivery", formatDate(item.expectedDeliveryDate)],
    ["Actual Delivery", formatDate(item.actualDeliveryDate)],
    ["Aging (Days)", item.aging || 0],
    [],
    ["Shipping Information"],
    ["Bill Number", item.billNumber || "—"],
    ["LR Number", item.lrNumber || "—"],
    ["Send Quantity", item.sendQuantity || 0],
    ["Delivery Status", item.deliveryStatus || "—"],
    [],
    ["Remarks"],
    [item.remarks || "No remarks"]
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(detailData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Details");
  XLSX.writeFile(workbook, fileName);
};

export const exportDeliveryDetailsToPDF = (item: any) => {
  const doc = new jsPDF();
  let y = 20;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("DELIVERY DETAILS", LAYOUT.marginX, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(COLORS.textLight);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`, LAYOUT.marginX, y);
  y += 10;

  // Project Info Section
  y = drawSectionHeader(doc, "Project Information", y);
  drawInfoCell(doc, "Project Code", item.projectCode, LAYOUT.marginX, y, 60, LAYOUT.rowH + 2);
  drawInfoCell(doc, "PO Number", item.poNumber, LAYOUT.marginX + 60, y, 60, LAYOUT.rowH + 2);
  drawInfoCell(doc, "Product Name", item.productName, LAYOUT.marginX + 120, y, 62, LAYOUT.rowH + 2);
  y += LAYOUT.rowH + 2;
  
  drawInfoCell(doc, "Brand", item.brandName, LAYOUT.marginX, y, 60, LAYOUT.rowH + 2);
  drawInfoCell(doc, "Category", item.categoryName, LAYOUT.marginX + 60, y, 60, LAYOUT.rowH + 2);
  drawInfoCell(doc, "Order Quantity", formatNumber(item.quantity), LAYOUT.marginX + 120, y, 62, LAYOUT.rowH + 2);
  y += LAYOUT.rowH + 10;

  // Dates & Timeline
  if (y > LAYOUT.pageBreakThreshold) { doc.addPage(); y = 20; }
  y = drawSectionHeader(doc, "Dates & Timeline", y);
  drawInfoCell(doc, "PO Received", formatDate(item.poReceivedDate), LAYOUT.marginX, y, 60, LAYOUT.rowH + 2);
  drawInfoCell(doc, "Expected Delivery", formatDate(item.expectedDeliveryDate), LAYOUT.marginX + 60, y, 60, LAYOUT.rowH + 2);
  drawInfoCell(doc, "Actual Delivery", formatDate(item.actualDeliveryDate), LAYOUT.marginX + 120, y, 62, LAYOUT.rowH + 2);
  y += LAYOUT.rowH + 2;
  drawInfoCell(doc, "Aging", `${item.aging} Days`, LAYOUT.marginX, y, 60, LAYOUT.rowH + 2);
  y += LAYOUT.rowH + 10;

  // Shipping Info
  if (y > LAYOUT.pageBreakThreshold) { doc.addPage(); y = 20; }
  y = drawSectionHeader(doc, "Shipping & Status", y);
  drawInfoCell(doc, "Bill Number", item.billNumber, LAYOUT.marginX, y, 60, LAYOUT.rowH + 2);
  drawInfoCell(doc, "LR Number", item.lrNumber, LAYOUT.marginX + 60, y, 60, LAYOUT.rowH + 2);
  drawInfoCell(doc, "Send Quantity", formatNumber(item.sendQuantity || 0), LAYOUT.marginX + 120, y, 62, LAYOUT.rowH + 2);
  y += LAYOUT.rowH + 2;
  drawInfoCell(doc, "Delivery Status", item.deliveryStatus, LAYOUT.marginX, y, 60, LAYOUT.rowH + 2);
  y += LAYOUT.rowH + 10;

  // Remarks
  if (y > LAYOUT.pageBreakThreshold) { doc.addPage(); y = 20; }
  y = drawSectionHeader(doc, "Remarks", y);
  doc.setFontSize(10);
  doc.setTextColor(COLORS.textDark);
  doc.setFont("helvetica", "normal");
  const splitRemarks = doc.splitTextToSize(item.remarks || "No remarks provided.", LAYOUT.width);
  doc.text(splitRemarks, LAYOUT.marginX, y + 5);

  doc.save(`Delivery_Details_${item.projectCode}_${new Date().getTime()}.pdf`);
};
