import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateProjectsListPDF = async (data: { projects: any[] }) => {
  const { projects } = data;
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;

  // --- 1. Minimalist Branding Header ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text("AURA INTERNATIONAL", margin, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text("PROJECT STATUS REPORT", margin, 25);

  // Right-aligned Date
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.text(dateStr, pageWidth - margin, 25, { align: "right" });

  // Thin separator line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, 28, pageWidth - margin, 28);

  // --- 2. Data Transformation ---
  const tableData = projects.map((item) => {
    const p = item.project || item;

    // Format the project cell with Code and Name
    const projectCode = String(p.autoCode || "");
    const artName = String(p.artName || "");

    return [
      {
        content: `${projectCode}${artName ? "\n" + artName : ""}`,
        styles: { fontStyle: artName ? "normal" : "bold" },
      },
      p.company?.name || p.company || "-",
      (p.status || "PENDING").toUpperCase(),
      p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN") : "-",
    ];
  });

  // --- 3. Professional Table Generation ---
  autoTable(doc, {
    startY: 35,
    head: [["PROJECT IDENTIFIER", "CLIENT", "STATUS", "DATE"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59], // Dark Slate for a high-end look
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: 4,
      halign: "left",
    },
    styles: {
      fontSize: 8,
      cellPadding: 4,
      valign: "middle",
      font: "helvetica",
      textColor: [51, 65, 85],
      lineColor: [241, 245, 249],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 75 }, // Project Info
      1: { cellWidth: 55 }, // Client
      2: { cellWidth: 25, halign: "center" }, // Status
      3: { cellWidth: 25, halign: "right" }, // Date
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
    // Status color coding for visual cues
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        const status = String(data.cell.raw).toUpperCase();
        if (status === "COMPLETED" || status === "ACTIVE") {
          data.cell.styles.textColor = [22, 163, 74]; // Success Green
        }
      }
    },
  });

  // --- 4. Total Count & Simple Footer ---
  const finalY = (doc as any).lastAutoTable.finalY || 35;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Total Records: ${projects.length}`, margin, finalY + 10);

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.text(
      `Aura International | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      287,
      { align: "center" }
    );
  }

  doc.save(
    `Aura_International_Projects_${new Date().toISOString().slice(0, 10)}.pdf`
  );
};
