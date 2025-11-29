// Export Dashboard as PDF
export const exportDashboardPDF = (dashboardData: any) => {
  // Create a simple HTML table and print it
  const content = `
    <html>
      <head>
        <title>Dashboard Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #0c9dcb; text-align: center; }
          .date { text-align: center; color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #0c9dcb; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>Executive Dashboard Report</h1>
        <p class="date">Generated on: ${new Date().toLocaleDateString(
          "en-IN"
        )}</p>
        
        <h2>Key Metrics</h2>
        <table>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
          <tr>
            <td>Total Projects</td>
            <td>${dashboardData.totalProjects || 0}</td>
          </tr>
          <tr>
            <td>Total Inventory Items</td>
            <td>${dashboardData.totalInventory || 0}</td>
          </tr>
          <tr>
            <td>Active Vendors</td>
            <td>${dashboardData.totalVendors || 0}</td>
          </tr>
          <tr>
            <td>Total Users</td>
            <td>${dashboardData.totalUsers || 0}</td>
          </tr>
          <tr>
            <td>Active Production Projects</td>
            <td>${dashboardData.activeProduction || 0}</td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const printWindow = window.open(
    "",
    "Dashboard Report",
    "height=600,width=800"
  );
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  }
};

// Export Dashboard Data as Excel
export const exportDashboardExcel = async (dashboardData: any) => {
  // Using xlsx library
  try {
    const XLSX = await import("xlsx");

    const worksheetData = [
      ["Executive Dashboard Report"],
      [`Generated on: ${new Date().toLocaleDateString("en-IN")}`],
      [],
      ["Key Metrics"],
      ["Metric", "Value"],
      ["Total Projects", dashboardData.totalProjects || 0],
      ["Total Inventory Items", dashboardData.totalInventory || 0],
      ["Active Vendors", dashboardData.totalVendors || 0],
      ["Total Users", dashboardData.totalUsers || 0],
      ["Active Production Projects", dashboardData.activeProduction || 0],
      [],
      ["Recent Activities"],
      ["Activity", "Time"],
      ...(dashboardData.recentActivities || [])
        .slice(0, 10)
        .map((activity: any) => [
          activity.message || "N/A",
          activity.time || "N/A",
        ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 20 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dashboard");
    XLSX.writeFile(workbook, `dashboard-${new Date().getTime()}.xlsx`);
  } catch (error) {
    console.error("Error exporting Excel:", error);
  }
};

// Export Dashboard Data as CSV
export const exportDashboardCSV = (dashboardData: any) => {
  const csvContent = [
    ["Executive Dashboard Report"],
    [`Generated on: ${new Date().toLocaleDateString("en-IN")}`],
    [],
    ["Key Metrics"],
    ["Metric", "Value"],
    ["Total Projects", dashboardData.totalProjects || 0],
    ["Total Inventory Items", dashboardData.totalInventory || 0],
    ["Active Vendors", dashboardData.totalVendors || 0],
    ["Total Users", dashboardData.totalUsers || 0],
    ["Active Production Projects", dashboardData.activeProduction || 0],
    [],
    ["Recent Activities"],
    ["Activity", "Time"],
    ...(dashboardData.recentActivities || [])
      .slice(0, 10)
      .map((activity: any) => [
        activity.message || "N/A",
        activity.time || "N/A",
      ]),
  ]
    .map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `dashboard-${new Date().getTime()}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
