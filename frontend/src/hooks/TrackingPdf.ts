// // AdvancedPDFExport.tsx - Complete and fixed version
// import React from "react";
// import { jsPDF } from "jspdf";
// import "jspdf-autotable";
// import { FileText } from "lucide-react";

// interface ProductionRecord {
//   id: string;
//   productionId: string;
//   brand: string;
//   category: string;
//   type: string;
//   gender: string;
//   articleName: string;
//   poNumber: string;
//   poItems: number;
//   monthPlan: number;
//   manufacturingCompany: string;
//   country: string;
//   color: string;
//   size: string;
//   unitPstId: string;
//   cutting: { status: string; quantity: number; planned: number };
//   printing: { status: string; quantity: number; planned: number };
//   upper: { status: string; quantity: number; planned: number };
//   upperREJ: { status: string; quantity: number; planned: number };
//   assembly: { status: string; quantity: number; planned: number };
//   packing: { status: string; quantity: number; planned: number };
//   rfd: { status: string; quantity: number; planned: number };
//   rfdRemarks: string;
//   projectId: string;
//   cards: any[];
//   summary: {
//     daily: Record<string, number>;
//     weekly: Record<string, number>;
//     monthTotal: number;
//   };
// }

// interface AdvancedPDFExportProps {
//   data: ProductionRecord[];
//   selectedDepartment: string;
//   selectedMonth: string;
//   selectedYear: string;
//   departmentName: string;
//   monthName: string;
//   dailyTotals: Record<string, number>;
//   weekData: Array<{
//     weekNumber: number;
//     weekStart: number;
//     weekEnd: number;
//     days: number[];
//     label: string;
//     shortLabel: string;
//     monthName: string;
//     totalDays: number;
//   }>;
// }

// export function AdvancedPDFExport({
//   data,
//   selectedDepartment,
//   selectedMonth,
//   selectedYear,
//   departmentName,
//   monthName,
//   dailyTotals,
//   weekData,
// }: AdvancedPDFExportProps) {
//   // Helper function 1: Calculate totals
//   const calculateTotals = (data: ProductionRecord[], department: string) => {
//     const totalPlanned = data.reduce((sum, item) => {
//       const stageData = item[department as keyof ProductionRecord] as {
//         planned: number;
//         quantity: number;
//       };
//       return sum + (stageData?.planned || 0);
//     }, 0);

//     const totalCompleted = data.reduce((sum, item) => {
//       const stageData = item[department as keyof ProductionRecord] as {
//         planned: number;
//         quantity: number;
//       };
//       return sum + (stageData?.quantity || 0);
//     }, 0);

//     const completionRate =
//       totalPlanned > 0 ? (totalCompleted / totalPlanned) * 100 : 0;

//     return {
//       totalPlanned,
//       totalCompleted,
//       completionRate: completionRate.toFixed(1),
//       remaining: totalPlanned - totalCompleted,
//     };
//   };

//   // Helper function 2: Calculate status breakdown
//   const calculateStatusBreakdown = (
//     data: ProductionRecord[],
//     department: string
//   ) => {
//     const statusMap = new Map<string, number>();

//     data.forEach((item) => {
//       const stageData = item[department as keyof ProductionRecord] as {
//         status: string;
//       };
//       const status = stageData?.status || "Pending";
//       statusMap.set(status, (statusMap.get(status) || 0) + 1);
//     });

//     return Array.from(statusMap.entries()).map(([status, count]) => ({
//       status,
//       count,
//       percentage: ((count / data.length) * 100).toFixed(1),
//     }));
//   };

//   // Helper function 3: Get status color
//   const getStatusColor = (status: string): [number, number, number] => {
//     switch (status) {
//       case "Completed":
//         return [0, 128, 0];
//       case "In Progress":
//         return [30, 144, 255];
//       case "Pending":
//         return [255, 165, 0];
//       case "Approved":
//         return [0, 100, 0];
//       case "Rejected":
//         return [220, 20, 60];
//       case "Ready":
//         return [65, 105, 225];
//       case "Dispatched":
//         return [34, 139, 34];
//       default:
//         return [128, 128, 128];
//     }
//   };

//   // Helper function 4: Get top performers
//   const getTopPerformers = (
//     data: ProductionRecord[],
//     department: string,
//     count: number
//   ) => {
//     return [...data]
//       .map((item) => {
//         const stageData = item[department as keyof ProductionRecord] as {
//           quantity: number;
//           planned: number;
//         };
//         const completion =
//           ((stageData?.quantity || 0) / (stageData?.planned || 1)) * 100;
//         return { ...item, completion };
//       })
//       .sort((a, b) => b.completion - a.completion)
//       .slice(0, count)
//       .map((item) => ({
//         articleName: item.articleName,
//         completion: item.completion.toFixed(1),
//       }));
//   };

//   // Helper function 5: Get weekly totals
//   const getWeeklyTotals = (
//     item: ProductionRecord,
//     weeks: any[],
//     dailyTotals: Record<string, number>
//   ) => {
//     return weeks.map((week) => {
//       let total = 0;
//       week.days.forEach((day: number) => {
//         const year = parseInt(selectedYear);
//         const month = parseInt(selectedMonth);
//         const dateKey = `${year}-${month.toString().padStart(2, "0")}-${day
//           .toString()
//           .padStart(2, "0")}`;
//         total += dailyTotals[dateKey] || 0;
//       });
//       return total;
//     });
//   };

//   // Helper function 6: Generate analysis
//   const generateAnalysis = (
//     data: ProductionRecord[],
//     department: string,
//     totals: any
//   ) => {
//     const analysis = [];

//     analysis.push(`Overall completion rate: ${totals.completionRate}%`);
//     analysis.push(`Total items in production: ${data.length}`);
//     analysis.push(
//       `Total planned units: ${totals.totalPlanned.toLocaleString()}`
//     );
//     analysis.push(
//       `Total completed units: ${totals.totalCompleted.toLocaleString()}`
//     );
//     analysis.push(`Remaining units: ${totals.remaining.toLocaleString()}`);

//     const avgPerItem = totals.totalCompleted / data.length;
//     analysis.push(
//       `Average completion per item: ${Math.round(avgPerItem)} units`
//     );

//     const itemsBehind = data.filter((item) => {
//       const stageData = item[department as keyof ProductionRecord] as {
//         quantity: number;
//         planned: number;
//       };
//       const completion = (stageData?.quantity || 0) / (stageData?.planned || 1);
//       return completion < 0.5;
//     }).length;

//     analysis.push(
//       `Items below 50% completion: ${itemsBehind} (${(
//         (itemsBehind / data.length) *
//         100
//       ).toFixed(1)}%)`
//     );

//     return analysis;
//   };

//   // Helper function 7: Generate recommendations
//   const generateRecommendations = (
//     data: ProductionRecord[],
//     department: string,
//     totals: any
//   ) => {
//     const recommendations = [];

//     if (parseFloat(totals.completionRate) < 50) {
//       recommendations.push(
//         "Focus on items with lowest completion rates to improve overall performance"
//       );
//     }

//     if (totals.remaining > totals.totalCompleted * 2) {
//       recommendations.push(
//         "Consider increasing production capacity to meet remaining targets"
//       );
//     }

//     const pendingItems = data.filter((item) => {
//       const stageData = item[department as keyof ProductionRecord] as {
//         status: string;
//       };
//       return stageData?.status === "Pending";
//     }).length;

//     if (pendingItems > data.length * 0.3) {
//       recommendations.push(
//         `Address ${pendingItems} pending items to prevent bottlenecks`
//       );
//     }

//     recommendations.push(
//       "Review weekly production patterns to identify optimal scheduling"
//     );
//     recommendations.push(
//       "Consider cross-training staff to handle production peaks"
//     );
//     recommendations.push("Implement daily progress reviews for critical items");

//     return recommendations;
//   };

//   // Main PDF generation function
//   const generateComprehensiveReport = () => {
//     const doc = new jsPDF("landscape");
//     const pageWidth = doc.internal.pageSize.getWidth();
//     const pageHeight = doc.internal.pageSize.getHeight();

//     // Function to add header
//     const addHeader = (title: string, pageNum: number, totalPages: number) => {
//       // Company header
//       doc.setFillColor(12, 157, 203);
//       doc.rect(0, 0, pageWidth, 25, "F");
//       doc.setTextColor(255, 255, 255);
//       doc.setFontSize(16);
//       doc.setFont("helvetica", "bold");
//       doc.text(title, pageWidth / 2, 15, { align: "center" });

//       // Report details
//       doc.setFontSize(9);
//       doc.text(`Department: ${departmentName}`, 15, 32);
//       doc.text(`Period: ${monthName} ${selectedYear}`, pageWidth - 15, 32, {
//         align: "right",
//       });
//       doc.text(
//         `Generated: ${new Date().toLocaleDateString()}`,
//         pageWidth - 15,
//         37,
//         {
//           align: "right",
//         }
//       );

//       // Page number
//       doc.setFontSize(8);
//       doc.text(
//         `Page ${pageNum} of ${totalPages}`,
//         pageWidth / 2,
//         pageHeight - 10,
//         {
//           align: "center",
//         }
//       );
//     };

//     // Page 1: Executive Summary
//     addHeader("Production Executive Summary", 1, 4);

//     // Summary statistics
//     const totals = calculateTotals(data, selectedDepartment);

//     doc.setFontSize(12);
//     doc.setFont("helvetica", "bold");
//     doc.setTextColor(0, 0, 0);
//     doc.text("Key Performance Indicators", 15, 50);

//     // KPI boxes
//     const kpis = [
//       {
//         label: "Total Planned",
//         value: totals.totalPlanned,
//         color: [12, 157, 203],
//       },
//       {
//         label: "Total Completed",
//         value: totals.totalCompleted,
//         color: [0, 128, 0],
//       },
//       {
//         label: "Completion %",
//         value: `${totals.completionRate}%`,
//         color: [75, 0, 130],
//       },
//       {
//         label: "Avg per Item",
//         value: Math.round(totals.totalCompleted / data.length),
//         color: [255, 140, 0],
//       },
//     ];

//     let xPos = 15;
//     kpis.forEach((kpi, index) => {
//       doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
//       doc.roundedRect(xPos, 60, 40, 25, 3, 3, "F");
//       doc.setTextColor(255, 255, 255);
//       doc.setFontSize(14);
//       doc.setFont("helvetica", "bold");
//       doc.text(kpi.value.toString(), xPos + 20, 72, { align: "center" });
//       doc.setFontSize(8);
//       doc.text(kpi.label, xPos + 20, 78, { align: "center" });
//       xPos += 45;
//     });

//     // Status breakdown chart
//     doc.setFontSize(12);
//     doc.setFont("helvetica", "bold");
//     doc.setTextColor(0, 0, 0);
//     doc.text("Status Distribution", 15, 95);

//     const statusData = calculateStatusBreakdown(data, selectedDepartment);
//     let yPos = 100;

//     statusData.forEach((status) => {
//       const barWidth = (status.count / data.length) * 100;
//       const color = getStatusColor(status.status);
//       doc.setFillColor(color[0], color[1], color[2]);
//       doc.rect(15, yPos, barWidth, 6, "F");

//       doc.setFontSize(9);
//       doc.setFont("helvetica", "normal");
//       doc.setTextColor(0, 0, 0);
//       doc.text(
//         `${status.status}: ${status.count} (${status.percentage}%)`,
//         120,
//         yPos + 4
//       );

//       yPos += 8;
//     });

//     // Top performers
//     doc.setFontSize(12);
//     doc.setFont("helvetica", "bold");
//     doc.text("Top Performers", 15, yPos + 10);

//     const topPerformers = getTopPerformers(data, selectedDepartment, 3);
//     topPerformers.forEach((item, index) => {
//       yPos += 15;
//       doc.setFontSize(9);
//       doc.setFont("helvetica", "normal");
//       doc.text(`${index + 1}. ${item.articleName}`, 15, yPos);
//       doc.text(`${item.completion}% completion`, pageWidth - 15, yPos, {
//         align: "right",
//       });
//     });

//     // Page 2: Detailed Production Table
//     doc.addPage("landscape");
//     addHeader("Detailed Production Report", 2, 4);

//     const tableData = data.map((item) => {
//       const stageData = item[selectedDepartment as keyof ProductionRecord] as {
//         status: string;
//         quantity: number;
//         planned: number;
//       };
//       const completion = (
//         ((stageData?.quantity || 0) / (stageData?.planned || 1)) *
//         100
//       ).toFixed(1);

//       return [
//         item.productionId,
//         item.articleName.substring(0, 20),
//         item.brand,
//         item.poNumber,
//         item.manufacturingCompany.substring(0, 15),
//         stageData?.quantity || 0,
//         stageData?.planned || 0,
//         stageData?.status || "Pending",
//         `${completion}%`,
//         item.summary?.monthTotal || 0,
//       ];
//     });

//     (doc as any).autoTable({
//       startY: 45,
//       head: [
//         [
//           "ID",
//           "Article",
//           "Brand",
//           "PO",
//           "Manufacturer",
//           "Done",
//           "Target",
//           "Status",
//           "Progress",
//           "Monthly",
//         ],
//       ],
//       body: tableData,
//       theme: "grid",
//       headStyles: {
//         fillColor: [12, 157, 203],
//         textColor: 255,
//         fontStyle: "bold",
//         fontSize: 8,
//       },
//       bodyStyles: {
//         fontSize: 7,
//       },
//       alternateRowStyles: {
//         fillColor: [245, 245, 245],
//       },
//       columnStyles: {
//         0: { cellWidth: 25 },
//         1: { cellWidth: 40 },
//         2: { cellWidth: 25 },
//         3: { cellWidth: 25 },
//         4: { cellWidth: 35 },
//         5: { cellWidth: 20 },
//         6: { cellWidth: 20 },
//         7: { cellWidth: 25 },
//         8: { cellWidth: 20 },
//         9: { cellWidth: 25 },
//       },
//     });

//     // Page 3: Weekly Breakdown
//     doc.addPage("landscape");
//     addHeader("Weekly Production Analysis", 3, 4);

//     // Weekly totals table
//     const weeklyTableData = data.slice(0, 10).map((item) => {
//       const weekTotals = getWeeklyTotals(item, weekData, dailyTotals);
//       const row = [item.productionId, item.articleName.substring(0, 15)];

//       weekData.forEach((week, index) => {
//         row.push(weekTotals[index]?.toString() || "0");
//       });

//       row.push(item.summary?.monthTotal?.toString() || "0");
//       return row;
//     });

//     const weekHeaders = [
//       "ID",
//       "Article",
//       ...weekData.map((w) => `W${w.weekNumber}`),
//       "Total",
//     ];

//     (doc as any).autoTable({
//       startY: 45,
//       head: [weekHeaders],
//       body: weeklyTableData,
//       theme: "grid",
//       headStyles: {
//         fillColor: [0, 100, 0],
//         textColor: 255,
//         fontStyle: "bold",
//         fontSize: 8,
//       },
//       bodyStyles: {
//         fontSize: 7,
//       },
//     });

//     // Page 4: Recommendations and Notes
//     doc.addPage("portrait");
//     addHeader("Analysis & Recommendations", 4, 4);

//     doc.setFontSize(11);
//     doc.setFont("helvetica", "bold");
//     doc.text("Performance Analysis", 15, 50);

//     doc.setFontSize(9);
//     doc.setFont("helvetica", "normal");

//     const analysis = generateAnalysis(data, selectedDepartment, totals);

//     let analysisY = 60;
//     analysis.forEach((point) => {
//       if (analysisY > pageHeight - 40) {
//         doc.addPage("portrait");
//         addHeader("Analysis & Recommendations", 4, 4);
//         analysisY = 50;
//       }
//       doc.text(`• ${point}`, 20, analysisY);
//       analysisY += 8;
//     });

//     // Recommendations
//     doc.setFontSize(11);
//     doc.setFont("helvetica", "bold");
//     doc.text("Recommendations", 15, analysisY + 10);

//     doc.setFontSize(9);
//     doc.setFont("helvetica", "normal");

//     const recommendations = generateRecommendations(
//       data,
//       selectedDepartment,
//       totals
//     );

//     let recY = analysisY + 20;
//     recommendations.forEach((rec, index) => {
//       if (recY > pageHeight - 40) {
//         doc.addPage("portrait");
//         addHeader("Analysis & Recommendations", 4, 4);
//         recY = 50;
//       }
//       doc.text(`${index + 1}. ${rec}`, 20, recY);
//       recY += 8;
//     });

//     // Footer for last page
//     doc.setFontSize(8);
//     doc.setTextColor(128, 128, 128);
//     doc.text(
//       `Confidential - Manufacturing Production Report - ${departmentName}`,
//       pageWidth / 2,
//       pageHeight - 10,
//       { align: "center" }
//     );
//     doc.text(`Report ID: ${Date.now()}`, pageWidth / 2, pageHeight - 5, {
//       align: "center",
//     });

//     // Save PDF
//     doc.save(
//       `Comprehensive_Production_Report_${departmentName}_${monthName}_${selectedYear}.pdf`
//     );
//   };

//   // Return statement - MUST BE THE LAST THING IN THE COMPONENT
//   return (
//     <Button
//       onClick={generateComprehensiveReport}
//       variant="outline"
//       size="sm"
//       className="text-xs sm:text-sm bg-green-50 hover:bg-green-100 border-green-200"
//     >
//       <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
//       Detailed Report
//     </Button>
//   );
// }
