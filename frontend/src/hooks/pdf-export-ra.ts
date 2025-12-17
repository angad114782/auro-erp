import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportInventoryReportToPDF = (
  transactions: any[],
  statistics: any,
  dateRange: { from: Date; to: Date },
  reportType: string,
  searchTerm?: string,
  getItemDetails?: (itemRef: any) => any,
  getVendor?: (vendorRef: any) => any
) => {
  // Changed to Portrait 'p'
  const doc = new jsPDF("p", "mm", "a4");
  const timestamp = new Date().toLocaleString();
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- 1. CORPORATE BRANDING HEADER ---
  doc.setFillColor(12, 157, 203);
  doc.rect(0, 0, pageWidth, 20, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("AURA INTERNATIONAL", 14, 13);

  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text("Inventory Transactions Report", 14, 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`Official Document | Generated: ${timestamp}`, 14, 35);
  doc.text(
    `Period: ${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`,
    14,
    39
  );

  // --- 2. SUMMARY STATISTICS (Grid Layout for Portrait) ---
  const summaryY = 45;
  const boxWidth = (pageWidth - 28 - 10) / 3; // 3 columns for portrait
  const boxHeight = 16;
  const gap = 5;

  const summaryData = [
    {
      title: "Transactions",
      value: statistics.totalTransactions || 0,
      color: [59, 130, 246],
    },
    {
      title: "Stock In",
      value: (statistics.totalStockIn || 0).toLocaleString(),
      color: [34, 197, 94],
    },
    {
      title: "Stock Out",
      value: (statistics.totalStockOut || 0).toLocaleString(),
      color: [239, 68, 68],
    },
    {
      title: "Order Value",
      value: `₹${(statistics.totalOrderValue || 0).toLocaleString()}`,
      color: [147, 51, 234],
    },
    {
      title: "Current Stock",
      value: (statistics.currentTotalStock || 0).toLocaleString(),
      color: [6, 182, 212],
    },
    {
      title: "Low Stock",
      value: statistics.lowStockItems || 0,
      color: [239, 68, 68],
    },
  ];

  summaryData.forEach((item, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = 14 + col * (boxWidth + gap);
    const y = summaryY + row * (boxHeight + gap);

    doc.setDrawColor(...item.color);
    doc.setFillColor(252, 252, 252);
    doc.roundedRect(x, y, boxWidth, boxHeight, 1, 1, "FD");
    doc.setFillColor(...item.color);
    doc.rect(x, y, 2, boxHeight, "F");

    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(item.title, x + 4, y + 6);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(item.value.toString(), x + 4, y + 12);
  });

  // --- 3. DATA TABLE (Optimized for Portrait) ---
  const tableColumn = [
    "Item & Vendor Details",
    "Stock Status",
    "Change",
    "Transaction Info",
  ];

  // Helper logic remains same, but we combine outputs for narrow space
  const extractItemInfo = (transaction: any) => {
    if (transaction.item && typeof transaction.item === "object") {
      return {
        name: transaction.item.itemName || "Unknown",
        code: transaction.item.code || "N/A",
        unit: transaction.item.quantityUnit || "units",
      };
    }
    if (getItemDetails && transaction.itemId) {
      const d = getItemDetails(transaction.itemId);
      return {
        name: d?.itemName || "Unknown",
        code: d?.code || "N/A",
        unit: d?.quantityUnit || "units",
      };
    }
    return { name: "Unknown Item", code: "N/A", unit: "units" };
  };

  const tableRows = transactions.map((transaction) => {
    const item = extractItemInfo(transaction);
    const qSign = transaction.transactionType === "Stock In" ? "+" : "-";

    return [
      // Col 1: Combined Item & Vendor
      {
        content: `${item.name}\nID: ${item.code}\nBill: ${
          transaction.billNumber || "N/A"
        }`,
        styles: { fontStyle: "bold" },
      },

      // Col 2: Stock levels
      `Now: ${transaction.newStock || 0} ${item.unit}\nWas: ${
        transaction.previousStock || 0
      }`,

      // Col 3: The Update
      {
        content: `${qSign}${transaction.quantity || 0}\n${
          transaction.transactionType
        }`,
        styles: { fontStyle: "bold" },
      },

      // Col 4: Value and Date
      `Value: ₹${(transaction.orderValue || 0).toLocaleString()}\nDate: ${
        transaction.date
          ? new Date(transaction.date).toLocaleDateString()
          : "N/A"
      }`,
    ];
  });

  autoTable(doc, {
    startY: summaryY + boxHeight * 2 + gap + 10,
    head: [tableColumn],
    body: tableRows,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
    headStyles: {
      fillColor: [12, 157, 203],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 60 }, // Details
      1: { cellWidth: 40 }, // Stock
      2: { cellWidth: 40 }, // Change
      3: { cellWidth: 42 }, // Info
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        const text = data.cell.text.join("");
        if (text.includes("Stock In") || text.includes("+"))
          data.cell.styles.textColor = [34, 197, 94];
        if (text.includes("Stock Out") || text.includes("-"))
          data.cell.styles.textColor = [239, 68, 68];
      }
    },
  });

  // --- 4. FOOTER ---
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Aura International - Confidential Inventory Report", 14, 287);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, 287, {
      align: "right",
    });
  }

  doc.save(`Aura_Inventory_Report_${new Date().getTime()}.pdf`);
};
