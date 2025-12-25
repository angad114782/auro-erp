import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateProjectsListPDF = async (data: { projects: any[] }) => {
  const { projects } = data;
  console.log(projects, "projects");
  const doc = new jsPDF({
    orientation: "p", // portrait
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;

  /* =========================================================
     HEADER
  ========================================================= */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text("AURA INTERNATIONAL", margin, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("PROJECT STATUS REPORT", margin, 24);

  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.text(dateStr, pageWidth - margin, 24, { align: "right" });

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, 28, pageWidth - margin, 28);

  /* =========================================================
     TABLE DATA
  ========================================================= */
  const tableData = projects.map((item) => {
    const p = item.project || item;

    return [
      `${p.autoCode || ""}\n${p.artName || ""}`, // Project
      p.company?.name || "-", // Company
      p.brand?.name || "-", // Brand
      (p.priority || "-").toUpperCase(), // Priority
      (p.status || "-").toUpperCase(), // Status
      p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN") : "-", // Date
    ];
  });

  /* =========================================================
     TABLE
  ========================================================= */
  autoTable(doc, {
    startY: 34,
    head: [["PROJECT", "COMPANY", "BRAND", "PRIORITY", "STATUS", "DATE"]],
    body: tableData,

    theme: "striped",

    styles: {
      fontSize: 8,
      cellPadding: 4,
      valign: "middle",
      overflow: "linebreak", // ✅ FIX: allows wrapping
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      font: "helvetica",
    },

    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },

    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },

    columnStyles: {
      0: { cellWidth: 55 }, // Project
      1: { cellWidth: 32 }, // Company
      2: { cellWidth: 30 }, // Brand
      3: { cellWidth: 20, halign: "center" }, // Priority
      4: { cellWidth: 23, halign: "center" }, // Status
      5: { cellWidth: 25, halign: "right" }, // Date
    },

    margin: {
      left: margin,
      right: margin,
    },

    pageBreak: "auto",
    rowPageBreak: "avoid",

    /* =========================================================
       STATUS COLOR CODING
    ========================================================= */
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === 4) {
        const status = String(hookData.cell.raw).toUpperCase();

        if (status.includes("APPROVED") || status.includes("DELIVERED")) {
          hookData.cell.styles.textColor = [22, 163, 74]; // green
        } else if (status.includes("PENDING")) {
          hookData.cell.styles.textColor = [234, 88, 12]; // orange
        } else if (status.includes("PROTOTYPE")) {
          hookData.cell.styles.textColor = [124, 58, 237]; // purple
        }
      }
    },
  });

  /* =========================================================
     FOOTER
  ========================================================= */
  const lastY = (doc as any).lastAutoTable.finalY || 34;

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Total Projects: ${projects.length}`,
    margin,
    Math.min(lastY + 10, pageHeight - 20)
  );

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Aura International | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  /* =========================================================
     SAVE
  ========================================================= */
  doc.save(
    `Aura_International_Projects_${new Date().toISOString().slice(0, 10)}.pdf`
  );
};
