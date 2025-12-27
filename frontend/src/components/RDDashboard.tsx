import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  FileText,
  LayoutDashboard,
  Lightbulb,
  MapPin,
  Package,
  Plus,
  ShoppingCart,
  Target,
  Users,
  Zap,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import html2canvas from "html2canvas";

// import html2canvas from "html2canvas";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner@2.0.3";
import { useRedirect } from "../hooks/useRedirect";
import api from "../lib/api";
import { dashboardService } from "../services/dashboard.service";

interface RDDashboardProps {
  onNavigate?: (subModule: string) => void;
}

export function RDDashboard({ onNavigate }: RDDashboardProps) {
  // const { rdProjects: rdProjectsFromStore } = useERPStore();

  const [rdProjects, setRdProjects] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [assignPersonData, setAssignPersonData] = useState<any[]>([]);
  const [countryData, setCountryData] = useState<any[]>([]);

 const [selectedBrandId, setSelectedBrandId] = useState<string>("all");


useEffect(() => {
  const controller = new AbortController();

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/dashboard", {
        params: selectedBrandId !== "all" ? { brandId: selectedBrandId } : {},
        signal: controller.signal,
      });

      const data = res.data;

      setRdProjects(Array.isArray(data.projects) ? data.projects : []);
      setBrands(Array.isArray(data.brands) ? data.brands : []);
      setCategories(Array.isArray(data.categories) ? data.categories : []);
      setUsers(Array.isArray(data.users) ? data.users : []);

      // ✅ analytics from same API
      setAssignPersonData(
        Array.isArray(data?.analytics?.assignPersons)
          ? data.analytics.assignPersons
          : []
      );

      setCountryData(
        Array.isArray(data?.analytics?.countries)
          ? data.analytics.countries
          : []
      );
    } catch (err: any) {
      if (err?.name !== "CanceledError") {
        console.error("Dashboard load error:", err);
        toast.error("Failed to load dashboard data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  load();
  return () => controller.abort();
}, [selectedBrandId]);



 

  const assignPersonChartData = useMemo(() => {
    return assignPersonData.map((p) => ({
      name: p.name,
      approved: p.poApprovedProjects,
      pending: p.totalProjects - p.poApprovedProjects,
      total: p.totalProjects,
    }));
  }, [assignPersonData]);

  // Convert backend snake_case → Title Case for UI
  const mapStatusToUI = (status) => {
    if (!status) return "Unknown";

    const map = {
      costing_received: "Costing Received",
      prototype: "Prototype",
      red_seal: "Red Seal",
      green_seal: "Green Seal",
      final_approved: "Final Approved",
      po_pending: "PO Pending",
      po_approved: "PO Approved",
      other: "Other",
    };

    return (
      map[status] ||
      status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    );
  };
  const countryPieData = useMemo(() => {
    const total = countryData.reduce((sum, c) => sum + c.totalProjects, 0);

    return countryData.map((c) => ({
      name: c.countryName,
      value: c.totalProjects,
      percent: total > 0 ? Math.round((c.totalProjects / total) * 100) : 0,
    }));
  }, [countryData]);

  const CountryPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const { name, value, percent } = payload[0].payload;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-semibold text-gray-900 mb-2">{name}</p>

        <div className="flex justify-between gap-6">
          <span className="text-gray-600">Projects</span>
          <span className="font-semibold">{value}</span>
        </div>

        <div className="flex justify-between gap-6">
          <span className="text-blue-600">Share</span>
          <span className="font-semibold">{percent}%</span>
        </div>
      </div>
    );
  };
  const COUNTRY_COLORS = ["#0c9dcb", "#22c55e", "#f97316", "#a855f7"];

  // Convert backend status to stage groups
  const isStatus = (p, status) => p.status === status;

  // Calculate real-time analytics from actual data
  const analytics = useMemo(() => {
    const CLOSED_STATUSES = ["final_approved", "po_approved"];
const live = rdProjects.filter((p) => !CLOSED_STATUSES.includes(p.status));
const closed = rdProjects.filter((p) => CLOSED_STATUSES.includes(p.status));

    const redSealOK = rdProjects.filter(
      (p) => p.status === "red_seal" && p.clientApproval === "ok"
    );

    const redSealPending = rdProjects.filter(
      (p) => p.status === "red_seal" && p.clientApproval !== "ok"
    );

    const greenSealOK = rdProjects.filter(
      (p) => p.status === "green_seal" && p.clientApproval === "ok"
    );

    const greenSealPending = rdProjects.filter(
      (p) => p.status === "green_seal" && p.clientApproval !== "ok"
    );

    const poApproved = rdProjects.filter((p) => p.status === "po_approved");
    const poPending = rdProjects.filter((p) => p.status === "po_pending");
const KNOWN_STATUSES = [
  "costing_pending",
  "costing_received",
  "prototype",
  "red_seal",
  "green_seal",
  "final_approved",
  "po_approved",
];
const isOtherStatus = (status?: string) =>
  status && !KNOWN_STATUSES.includes(status);

    // Stage breakdown
   const stages = [
  {
    stage: "Prototype",
    count: rdProjects.filter((p) => p.status === "prototype").length,
    color: "#26b4e0",
  },
  {
    stage: "Red Seal",
    count: rdProjects.filter((p) => p.status === "red_seal").length,
    color: "#dc3545",
  },
  {
    stage: "Green Seal",
    count: rdProjects.filter((p) => p.status === "green_seal").length,
    color: "#28a745",
  },
  {
    stage: "PO",
    count: rdProjects.filter((p) =>
      ["final_approved", "po_approved"].includes(p.status)
    ).length,
    color: "#20c997",
  },
  {
    stage: "Others",
    count: rdProjects.filter((p) => isOtherStatus(p.status)).length,
    color: "#f97316", 
  },
];


    // Priority breakdown
    const priorities = [
      {
        name: "High",
        value: rdProjects.filter((p) => p.priority === "high").length,
        color: "#dc3545",
      },
      {
        name: "Medium",
        value: rdProjects.filter((p) => p.priority === "medium").length,
        color: "#ffc107",
      },
      {
        name: "Low",
        value: rdProjects.filter((p) => p.priority === "low").length,
        color: "#28a745",
      },
    ];

    // Monthly timeline data
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const monthKey = date.toLocaleDateString("en-US", { month: "short" });

      return {
        month: monthKey,
        submitted: Math.floor(Math.random() * 8) + 3,
        completed: Math.floor(Math.random() * 6) + 2,
      };
    });

    // Pending actions
    const pendingActions = [
      {
        type: "Costing Pending",
        count: rdProjects.filter((p) => p.status === "costing_pending").length,
        icon: Clock,
      },
      {
        type: "Client Feedback Pending",
        count: rdProjects.filter((p) => p.clientFeedback === "Pending").length,
        icon: AlertTriangle,
      },
      {
        type: "Red Seal Approval",
        count: redSealPending.length,
        icon: AlertTriangle,
      },
      {
        type: "Green Seal Approval",
        count: greenSealPending.length,
        icon: CheckCircle,
      },
      { type: "PO Pending", count: poPending.length, icon: ShoppingCart },
    ];

    // Recent projects (last 5)
    const recent = [...rdProjects]
      .sort(
        (a, b) =>
          new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime()
      )
      .slice(0, 5);
    console.log("feefefefefef", recent);
    return {
      live: live.length,
      closed: closed.length,
      redSealOK: redSealOK.length,
      redSealPending: redSealPending.length,
      greenSealOK: greenSealOK.length,
      greenSealPending: greenSealPending.length,
      poApproved: poApproved.length,
      poPending: poPending.length,
      total: rdProjects.length,
      stages,
      priorities,
      monthlyData,
      pendingActions: pendingActions.filter((a) => a.count > 0),
      recentProjects: recent,
      successRate:
        closed.length > 0
          ? Math.round((closed.length / rdProjects.length) * 100)
          : 0,
      avgDuration:
        rdProjects.length > 0
          ? Math.round(
              rdProjects.reduce((sum, p) => sum + (p.duration || 0), 0) /
                rdProjects.length
            )
          : 0,
    };
  }, [rdProjects]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "Idea Submitted": "bg-blue-100 text-blue-800 border-blue-200",
      "Costing Pending": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Costing Received": "bg-orange-100 text-orange-800 border-orange-200",
      Prototype: "bg-purple-100 text-purple-800 border-purple-200",
      "Red Seal": "bg-red-100 text-red-800 border-red-200",
      "Green Seal": "bg-green-100 text-green-800 border-green-200",
      "Final Approved": "bg-emerald-100 text-emerald-800 border-emerald-200",
      "PO Issued": "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getBrandName = (brandId: string) => {
    const brand = brands.find(
      (b) => b.id === brandId || b._id === brandId || b.brandId === brandId
    );
    return brand?.brandName || brand?.name || "Unknown";
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(
      (c) =>
        c.id === categoryId ||
        c._id === categoryId ||
        c.categoryId === categoryId
    );
    return category?.categoryName || category?.name || "Unknown";
  };

  const handleNavigate = (subModule: string) => {
    if (onNavigate) {
      onNavigate(subModule);
    } else {
      toast.info(`Navigating to ${subModule}`);
    }
  };

  // const handleExportPDF = () => {
  //   const doc = new jsPDF({
  //     orientation: "portrait",
  //     unit: "mm",
  //     format: "a4",
  //   });

  //   // TITLE
  //   doc.setFontSize(18);
  //   doc.text("R&D Dashboard Report", 14, 15);

  //   doc.setFontSize(11);
  //   doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

  //   // SUMMARY BLOCK
  //   doc.setFontSize(14);
  //   doc.text("Summary", 14, 32);

  //   autoTable(doc, {
  //     startY: 36,
  //     theme: "grid",
  //     head: [["Metric", "Value"]],
  //     body: [
  //       ["Total Projects", analytics.total],
  //       ["Live Projects", analytics.live],
  //       ["Closed Projects", analytics.closed],
  //       [
  //         "Red Seal (OK / Pending)",
  //         `${analytics.redSealOK} / ${analytics.redSealPending}`,
  //       ],
  //       [
  //         "Green Seal (OK / Pending)",
  //         `${analytics.greenSealOK} / ${analytics.greenSealPending}`,
  //       ],
  //       [
  //         "PO (Approved / Pending)",
  //         `${analytics.poApproved} / ${analytics.poPending}`,
  //       ],
  //     ],
  //   });

  //   // STAGE DISTRIBUTION
  //   doc.setFontSize(14);
  //   doc.text("Stage Distribution", 14, doc.lastAutoTable.finalY + 10);

  //   autoTable(doc, {
  //     startY: doc.lastAutoTable.finalY + 14,
  //     theme: "grid",
  //     head: [["Stage", "Count"]],
  //     body: analytics.stages.map((s) => [s.stage, s.count]),
  //   });

  //   // RECENT PROJECTS
  //   doc.setFontSize(14);
  //   doc.text("Recent Projects", 14, doc.lastAutoTable.finalY + 12);

  //   autoTable(doc, {
  //     startY: doc.lastAutoTable.finalY + 16,
  //     theme: "grid",
  //     head: [["Code", "Brand", "Category", "Status"]],
  //     body: analytics.recentProjects.map((p) => [
  //       p.autoCode,
  //       getBrandName(p.brandId),
  //       getCategoryName(p.categoryId),
  //       mapStatusToUI(p.status),
  //     ]),
  //   });

  //   // SAVE PDF
  //   doc.save("RD_Dashboard_Report.pdf");

  //   toast.success("PDF exported successfully!");
  // };

  const handleExportPDF = async () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // TITLE
      doc.setFontSize(18);
      doc.text("R&D Dashboard Report", 14, 15);
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
      doc.text(`Total Projects: ${analytics.total}`, 14, 28);

      // SUMMARY BLOCK
      doc.setFontSize(14);
      doc.text("Summary", 14, 38);

      autoTable(doc, {
        startY: 42,
        theme: "grid",
        head: [["Metric", "Value"]],
        body: [
          ["Total Projects", analytics.total],
          ["Live Projects", analytics.live],
          ["Closed Projects", analytics.closed],
          [
            "Red Seal (OK / Pending)",
            `${analytics.redSealOK} / ${analytics.redSealPending}`,
          ],
          [
            "Green Seal (OK / Pending)",
            `${analytics.greenSealOK} / ${analytics.greenSealPending}`,
          ],
          [
            "PO (Approved / Pending)",
            `${analytics.poApproved} / ${analytics.poPending}`,
          ],
          ["Success Rate", `${analytics.successRate}%`],
          ["Avg Duration", `${analytics.avgDuration} days`],
        ],
      });

      // STAGE DISTRIBUTION
      doc.setFontSize(14);
      doc.text("Stage Distribution", 14, doc.lastAutoTable.finalY + 10);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 14,
        theme: "grid",
        head: [["Stage", "Count"]],
        body: analytics.stages.map((s) => [s.stage, s.count]),
      });

      // PRIORITY BREAKDOWN
      doc.setFontSize(14);
      doc.text("Priority Breakdown", 14, doc.lastAutoTable.finalY + 10);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 14,
        theme: "grid",
        head: [["Priority", "Count"]],
        body: analytics.priorities.map((p) => [p.name, p.value]),
      });

      // ASSIGNED PERSON DATA
      doc.setFontSize(14);
      doc.text(
        "Assigned Person - PO Status",
        14,
        doc.lastAutoTable.finalY + 10
      );

      const assignPersonTableData = assignPersonChartData.map((p) => [
        p.name,
        p.approved,
        p.pending,
        p.total,
        `${Math.round((p.approved / p.total) * 100)}%`,
      ]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 14,
        theme: "grid",
        head: [["Name", "PO Approved", "PO Pending", "Total", "Approval Rate"]],
        body: assignPersonTableData,
      });

      // COUNTRY DATA
      doc.setFontSize(14);
      doc.text("Country-wise Projects", 14, doc.lastAutoTable.finalY + 10);

      const countryTableData = countryPieData.map((c) => [
        c.name,
        c.value,
        `${c.percent}%`,
      ]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 14,
        theme: "grid",
        head: [["Country", "Projects", "Share"]],
        body: countryTableData,
      });

      // RECENT PROJECTS
      doc.setFontSize(14);
      doc.text("Recent Projects", 14, doc.lastAutoTable.finalY + 10);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 14,
        theme: "grid",
        head: [["Code", "Brand", "Category", "Status"]],
        body: analytics.recentProjects.map((p) => [
          p.autoCode,
          getBrandName(p.brandId),
          getCategoryName(p.categoryId),
          mapStatusToUI(p.status),
        ]),
      });

      // PENDING ACTIONS
      doc.setFontSize(14);
      doc.text("Pending Actions", 14, doc.lastAutoTable.finalY + 10);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 14,
        theme: "grid",
        head: [["Action Type", "Count"]],
        body: analytics.pendingActions.map((a) => [a.type, a.count]),
      });

      // FOOTER
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        "Report generated from R&D Dashboard",
        14,
        doc.internal.pageSize.height - 10
      );

      // SAVE PDF
      doc.save("RD_Dashboard_Report.pdf");

      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    }
  };
  const dashboardRef = useRef(null);

  // Redirect helper
  const { goTo } = useRedirect();

  const getRedirectForProject = (
    project: any
  ): { module: string; subModule: string; extra?: any } => {
    const status = project?.status;

    const map: Record<
      string,
      { module: string; subModule: string; extra?: any }
    > = {
      red_seal: { module: "rd-management", subModule: "red-seal" },
      prototype: { module: "rd-management", subModule: "project" },
      green_seal: { module: "rd-management", subModule: "green-seal" },
      po_pending: {
        module: "rd-management",
        subModule: "po-target-date",
        extra: { tab: "po-pending" },
      },
      po_approved: {
        module: "rd-management",
        subModule: "po-target-date",
        extra: { tab: "po-approved" },
      },
      production_planning: {
        module: "production",
        subModule: "production-planning",
      },
    };

    return map[status] || { module: "rd-management", subModule: "project" };
  };

  const AssignPersonTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const approved = payload.find((p) => p.dataKey === "approved")?.value || 0;
    const pending = payload.find((p) => p.dataKey === "pending")?.value || 0;
    const total = approved + pending;
    const percent = total > 0 ? Math.round((approved / total) * 100) : 0;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>

        <div className="space-y-1">
          <div className="flex justify-between gap-6">
            <span className="text-green-600">PO Approved</span>
            <span className="font-semibold">{approved}</span>
          </div>

          <div className="flex justify-between gap-6">
            <span className="text-orange-600">PO Pending</span>
            <span className="font-semibold">{pending}</span>
          </div>

          <div className="border-t my-1" />

          <div className="flex justify-between gap-6">
            <span className="text-gray-600">Total</span>
            <span className="font-semibold">{total}</span>
          </div>

          <div className="flex justify-between gap-6">
            <span className="text-blue-600">Approval %</span>
            <span className="font-semibold">{percent}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={dashboardRef}>
      <div className="space-y-6">
        {/* Header */}
        <div className=" bg-linear-to-br from-gray-50 to-gray-100 pb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#0c9dcb] to-[#26b4e0] flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl text-gray-900">R&D Dashboard</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Complete overview and analytics • {analytics.total} Total
                  Projects
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
        <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
  <SelectTrigger className="w-60">
    <SelectValue placeholder="Filter by Brand" />
  </SelectTrigger>

 <SelectContent>
  <SelectItem value="all">All Brands</SelectItem>
  {brands
    .filter((b) => b?._id) // ✅ avoid null/undefined
    .map((b) => (
      <SelectItem key={String(b._id)} value={String(b._id)}>
        {b.name || b.brandName || "Unnamed"}
      </SelectItem>
    ))}
</SelectContent>

</Select>


            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>

            <Button
              className="bg-[#0c9dcb] hover:bg-[#0a8bb5] text-white"
              onClick={() => handleNavigate("project")}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Main Layout - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Main Content (75%) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Status Cards - Minimalistic Design */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Live & Closed Projects */}
              <Card
                className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer bg-white"
                onClick={() => handleNavigate("project")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0c9dcb]/10 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-[#0c9dcb]" />
                    </div>
                    <span className="text-sm text-gray-600">Projects</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl text-gray-900">
                      {analytics.live}
                    </span>
                    <span className="text-sm text-gray-500">
                      / {analytics.closed}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Live / Closed</p>
                </CardContent>
              </Card>

              {/* Red Seal Status */}
              <Card
                className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer bg-white"
                onClick={() => handleNavigate("red-seal")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <span className="text-sm text-gray-600">Red Seal</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl text-gray-900">
                      {analytics.redSealOK}
                    </span>
                    <span className="text-sm text-gray-500">
                      / {analytics.redSealPending}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">OK / Pending</p>
                </CardContent>
              </Card>

              {/* Green Seal Status */}
              <Card
                className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer bg-white"
                onClick={() => handleNavigate("green-seal")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-600">Green Seal</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl text-gray-900">
                      {analytics.greenSealOK}
                    </span>
                    <span className="text-sm text-gray-500">
                      / {analytics.greenSealPending}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">OK / Pending</p>
                </CardContent>
              </Card>

              {/* PO Status */}
              <Card
                className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer bg-white"
                onClick={() => handleNavigate("po-target-date")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="text-sm text-gray-600">PO Status</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl text-gray-900">
                      {analytics.poApproved}
                    </span>
                    <span className="text-sm text-gray-500">
                      / {analytics.poPending}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Approved / Pending
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Stage Distribution */}
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-900">
                      <div className="p-2 bg-[#0c9dcb]/10 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-[#0c9dcb]" />
                      </div>
                      Stage Distribution
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleNavigate("project")}
                    >
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={analytics.stages}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="stage"
                        tick={{ fontSize: 11, fill: "#6c757d" }}
                        angle={-15}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#6c757d" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e9ecef",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {analytics.stages.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Priority Breakdown */}
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="p-2 bg-[#0c9dcb]/10 rounded-lg">
                      <Target className="w-5 h-5 text-[#0c9dcb]" />
                    </div>
                    Priority Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={analytics.priorities}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label
                      >
                        {analytics.priorities.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value} projects`, name]}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e9ecef",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {analytics.priorities.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <span className="text-sm text-gray-900">
                            {item.name}
                          </span>
                          <p className="text-xs text-gray-500">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="p-2 bg-[#0c9dcb]/10 rounded-lg">
                      <Users className="w-5 h-5 text-[#0c9dcb]" />
                    </div>
                    Assigned Person → PO Approval Status
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {assignPersonChartData.length === 0 ? (
                    <div className="h-[280px] flex items-center justify-center text-gray-500">
                      No assignment data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={340}>
                      <BarChart
                        data={assignPersonChartData}
                        margin={{ top: 30, right: 30, left: 10, bottom: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                        <XAxis
                          dataKey="name"
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                          height={80}
                          tick={{ fontSize: 12 }}
                        />

                        <YAxis allowDecimals={false} />

                        <Tooltip
                          content={<AssignPersonTooltip />}
                          cursor={{ fill: "rgba(0,0,0,0.05)" }}
                          wrapperStyle={{ pointerEvents: "auto" }}
                        />

                        {/* Approved */}
                        <Bar
                          dataKey="approved"
                          stackId="a"
                          fill="#22c55e"
                          radius={[6, 6, 0, 0]}
                          isAnimationActive={false}
                        />

                        {/* Pending */}
                        <Bar
                          dataKey="pending"
                          stackId="a"
                          fill="#f97316"
                          radius={[6, 6, 0, 0]}
                          isAnimationActive={false}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {/* Legend */}
                  <div className="flex justify-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-[#22c55e]" />
                      PO Approved
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-[#f97316]" />
                      PO Pending
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="p-2 bg-[#0c9dcb]/10 rounded-lg">
                      <MapPin className="w-5 h-5 text-[#0c9dcb]" />
                    </div>
                    Country-wise Projects
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {countryPieData.length === 0 ? (
                    <div className="h-[280px] flex items-center justify-center text-gray-500">
                      No country data available
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={countryPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={95}
                            paddingAngle={4}
                            dataKey="value"
                            isAnimationActive={false}
                          >
                            {countryPieData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  COUNTRY_COLORS[index % COUNTRY_COLORS.length]
                                }
                              />
                            ))}
                          </Pie>

                          <Tooltip
                            content={<CountryPieTooltip />}
                            wrapperStyle={{ pointerEvents: "auto" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Legend */}
                      <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
                        {countryPieData.map((item, index) => (
                          <div
                            key={item.name}
                            className="flex items-center gap-2"
                          >
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor:
                                  COUNTRY_COLORS[index % COUNTRY_COLORS.length],
                              }}
                            />
                            <span className="text-gray-900">{item.name}</span>
                            <span className="text-gray-500">
                              ({item.value})
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            {/* Recent Projects */}
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="p-2 bg-[#0c9dcb]/10 rounded-lg">
                      <FileText className="w-5 h-5 text-[#0c9dcb]" />
                    </div>
                    Recent Projects
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleNavigate("project")}
                  >
                    View All
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.recentProjects.map((project) => (
                    <div
                      key={project.id || project._id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:shadow-md hover:border-[#0c9dcb] transition-all cursor-pointer"
                      onClick={() => {
                        const { module, subModule, extra } =
                          getRedirectForProject(project);
                        const projectId =
                          project.id || project._id || project.projectId;
                        const payload = extra
                          ? { projectId, ...extra }
                          : { projectId };
                        goTo(module, subModule, payload);
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {project.autoCode}
                          </h4>
                          <Badge
                            className={`${getStatusColor(
                              project.status
                            )} border text-xs`}
                          >
                            {mapStatusToUI(project.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span>{getBrandName(project.brandId)}</span>
                          <span>•</span>
                          <span>{getCategoryName(project.categoryId)}</span>
                          <span>•</span>
                          <span>{project.company.name}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                  {analytics.recentProjects.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No recent projects</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Access Sidebar (25%) */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Quick Access Panel */}
              <Card className="shadow-lg border-0 bg-linear-to-br from-white to-gray-50">
                <CardHeader className="pb-3 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Zap className="w-5 h-5 text-[#0c9dcb]" />
                    Quick Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <button
                      onClick={() => handleNavigate("project")}
                      className="w-full group flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-[#0c9dcb] hover:bg-[#0c9dcb]/5 transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-[#0c9dcb] transition-colors shrink-0">
                        <Lightbulb className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-[#0c9dcb] transition-colors">
                          Project Development
                        </p>
                        <p className="text-xs text-gray-500">Manage projects</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#0c9dcb] transition-colors" />
                    </button>

                    <button
                      onClick={() => handleNavigate("red-seal")}
                      className="w-full group flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50/50 transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-500 transition-colors shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-600 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                          Red Seal
                        </p>
                        <p className="text-xs text-gray-500">
                          {analytics.redSealOK + analytics.redSealPending} items
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                    </button>

                    <button
                      onClick={() => handleNavigate("green-seal")}
                      className="w-full group flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50/50 transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-500 transition-colors shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-600 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                          Green Seal
                        </p>
                        <p className="text-xs text-gray-500">
                          {analytics.greenSealOK + analytics.greenSealPending}{" "}
                          items
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" />
                    </button>

                    <button
                      onClick={() => handleNavigate("po-target-date")}
                      className="w-full group flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50/50 transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-500 transition-colors shrink-0">
                        <ShoppingCart className="w-5 h-5 text-orange-600 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                          PO Target Date
                        </p>
                        <p className="text-xs text-gray-500">
                          {analytics.poApproved + analytics.poPending} PO items
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Actions */}
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-3 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="text-sm">Action Items</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {analytics.pendingActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2.5 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
                          onClick={() => {
                            if (action.type.includes("Red Seal"))
                              handleNavigate("red-seal");
                            else if (action.type.includes("Green Seal"))
                              handleNavigate("green-seal");
                            else if (action.type.includes("PO"))
                              handleNavigate("po-target-date");
                            else handleNavigate("project");
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-orange-200 flex items-center justify-center shrink-0">
                              <span className="text-xs font-semibold text-orange-700">
                                {action.count}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-gray-900">
                              {action.type}
                            </p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-orange-600" />
                        </div>
                      );
                    })}
                    {analytics.pendingActions.length === 0 && (
                      <div className="text-center py-6">
                        <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
                        <p className="text-xs text-gray-600">All caught up!</p>
                        <p className="text-xs text-gray-500">
                          No pending actions
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
