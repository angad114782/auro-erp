import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportVendorsToPDF = (vendors: any[], searchTerm: string) => {
  const doc = new jsPDF("p", "mm", "a4");
  const timestamp = new Date().toLocaleString();
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- 1. CORPORATE BRANDING HEADER ---
  // Top Accent Bar
  doc.setFillColor(12, 157, 203); // Your brand blue #0c9dcb
  doc.rect(0, 0, pageWidth, 20, "F");

  // Company Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("AURA INTERNATIONAL", 14, 13);

  // Report Title
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text("Vendor Directory Report", 14, 32);

  // Metadata Sub-header
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Official Document | Generated: ${timestamp}`, 14, 38);

  if (searchTerm) {
    doc.text(`Filter Active: "${searchTerm}"`, 14, 43);
  }

  // Right-aligned Summary Box
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(pageWidth - 60, 25, 46, 18, 1, 1, "FD");

  doc.setTextColor(100);
  doc.setFontSize(8);
  doc.text("TOTAL VENDORS", pageWidth - 37, 31, { align: "center" });
  doc.setTextColor(12, 157, 203);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${vendors.length}`, pageWidth - 37, 39, { align: "center" });

  // --- 2. DATA TABLE ---
  const tableColumn = [
    "Vendor Details",
    "Contact Info",
    "Items & Brand",
    "Country",
    "Status",
  ];

  const tableRows = vendors.map((vendor) => [
    // Column 1: ID and Name
    {
      content: `${vendor.vendorName || "No Name"}\nID: ${
        vendor.vendorId || "N/A"
      }`,
      styles: { fontStyle: "bold", fontSize: 9 },
    },
    // Column 2: Stacked Contacts
    `${vendor.contactPerson || "N/A"}\n${vendor.phone || ""}\n${
      vendor.email || ""
    }`,
    // Column 3: Product Info
    `${vendor.itemName || "N/A"}\nCode: ${vendor.itemCode || "N/A"}\n"${
      vendor.brand || "No Brand"
    }"`,
    // Column 4: Location
    getCountryName(vendor.countryId),
    // Column 5: Status
    vendor.status || "Active",
  ]);

  autoTable(doc, {
    startY: 48,
    head: [tableColumn],
    body: tableRows,
    theme: "striped",
    styles: {
      fontSize: 8,
      cellPadding: 4,
      valign: "middle",
      lineColor: [230, 230, 230],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [12, 157, 203],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [250, 252, 253],
    },
    columnStyles: {
      0: { cellWidth: 48 },
      1: { cellWidth: 50 },
      2: { cellWidth: 42 },
      3: { cellWidth: 22, halign: "center" },
      4: { cellWidth: 20, halign: "center" },
    },
    didParseCell: (data) => {
      // Color-coding Status
      if (data.section === "body" && data.column.index === 4) {
        const status = data.cell.raw as string;
        if (status === "Active") {
          data.cell.styles.textColor = [22, 163, 74]; // Green
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = [150, 150, 150]; // Gray
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // --- 3. FOOTER ---
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    // Footer Left
    doc.text("Aura International - Confidential Vendor Report", 14, 287);
    // Footer Right
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, 287, {
      align: "right",
    });
  }

  doc.save(`Aura_Vendors_${new Date().toISOString().split("T")[0]}.pdf`);
};

const getCountryName = (id: string) => {
  const countries: Record<string, string> = {
    "1": "India",
    "2": "China",
    "3": "Vietnam",
    "4": "Indonesia",
  };
  return countries[id] || "Unknown";
};
