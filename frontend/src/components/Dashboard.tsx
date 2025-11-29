import React, { useEffect, useState } from "react";
import {
  Package,
  TrendingUp,
  Users,
  Factory,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  IndianRupee,
  MoreVertical,
  User,
  RefreshCw,
  Download,
  FileText,
  Settings,
  FileSpreadsheet,
  FileDown,
  Plus,
  Eye,
  Bell,
  BarChart3,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { toast } from "sonner@2.0.3";
import { useERPStore } from "../lib/data-store";
import { useERP } from "../lib/stores/erpContext";
import { dashboardService } from "../services/dashboard.service";
import {
  exportDashboardPDF,
  exportDashboardExcel,
  exportDashboardCSV,
} from "../utils/exportUtils";

interface DashboardProps {
  onNavigate?: (module: string, subModule?: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { setCurrentModule } = useERP();

  // State for real data
  const [dashboardData, setDashboardData] = useState({
    totalProjects: 0,
    totalInventory: 0,
    totalVendors: 0,
    totalUsers: 0,
    activeProduction: 0,
    recentActivities: [] as any[],
  });

  const [loading, setLoading] = useState(true);

  // Fetch data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [projects, inventory, vendors, users, productions] =
          await Promise.all([
            dashboardService.getProjects(),
            dashboardService.getInventoryItems(),
            dashboardService.getVendors(),
            dashboardService.getUsers(),
            dashboardService.getProductionProjects(),
          ]);

        const projectsArray = Array.isArray(projects)
          ? projects
          : projects.data || [];
        const inventoryArray = Array.isArray(inventory)
          ? inventory
          : inventory.data || [];
        const vendorsArray = Array.isArray(vendors)
          ? vendors
          : vendors.data || [];
        const usersArray = Array.isArray(users) ? users : users.data || [];
        const productionsArray = Array.isArray(productions)
          ? productions
          : productions.data || [];

        // Create recent activities from real data
        const activities: any[] = [];

        // Add project activities
        projectsArray.slice(0, 2).forEach((project: any) => {
          activities.push({
            id: project._id,
            type: "project",
            message: `Project ${project.autoCode || "unknown"} - Status: ${
              project.status || "pending"
            }`,
            time: "Recently",
            icon: Target,
            color: "text-blue-600",
          });
        });

        // Add inventory alerts
        inventoryArray
          .filter((item: any) => item.quantity < 10)
          .slice(0, 2)
          .forEach((item: any) => {
            activities.push({
              id: item._id,
              type: "alert",
              message: `Stock low for ${item.itemName} - Only ${item.quantity} ${item.quantityUnit}`,
              time: "Recently",
              icon: AlertTriangle,
              color: "text-orange-600",
            });
          });

        // Add user activity
        usersArray.slice(0, 1).forEach((user: any) => {
          activities.push({
            id: user._id,
            type: "user",
            message: `User ${user.name || user.email} registered`,
            time: "Recently",
            icon: Users,
            color: "text-indigo-600",
          });
        });

        setDashboardData({
          totalProjects: projectsArray.length,
          totalInventory: inventoryArray.length,
          totalVendors: vendorsArray.length,
          totalUsers: usersArray.length,
          activeProduction: productionsArray.length,
          recentActivities:
            activities.length > 0
              ? activities
              : [
                  {
                    id: 1,
                    type: "info",
                    message: "No recent activities",
                    time: "Just now",
                    icon: CheckCircle,
                    color: "text-gray-600",
                  },
                ],
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Sample data for charts
  const projectStatusData = [
    { name: "Jan", poQuantity: 1200, poDispatch: 950, poRFD: 180 },
    { name: "Feb", poQuantity: 1450, poDispatch: 1100, poRFD: 220 },
    { name: "Mar", poQuantity: 1320, poDispatch: 1020, poRFD: 195 },
    { name: "Apr", poQuantity: 1580, poDispatch: 1250, poRFD: 240 },
    { name: "May", poQuantity: 1690, poDispatch: 1380, poRFD: 210 },
    { name: "Jun", poQuantity: 1520, poDispatch: 1200, poRFD: 260 },
  ];

  const plantUtilizationData = [
    { name: "Plant A", value: 145, color: "#0c9dcb" },
    { name: "Plant B", value: 98, color: "#26b4e0" },
    { name: "Plant C", value: 182, color: "#4cc9f0" },
    { name: "Plant D", value: 76, color: "#20c997" },
  ];

  const assemblyData = [
    { day: "1st", plan: 1152, actual: 1152 },
    { day: "2nd", plan: 3393, actual: 2358 },
    { day: "3rd", plan: 6207, actual: 3468 },
    { day: "4th", plan: 8576, actual: 4468 },
    { day: "5th", plan: 10345, actual: 5458 },
    { day: "6th", plan: 12414, actual: 5896 },
    { day: "8th", plan: 14483, actual: 6928 },
    { day: "9th", plan: 16552, actual: 7678 },
    { day: "10th", plan: 18621, actual: 7758 },
    { day: "11th", plan: 20650, actual: 8720 },
    { day: "12th", plan: 22759, actual: 8720 },
    { day: "13th", plan: 24828, actual: 9296 },
    { day: "14th", plan: 26897, actual: 10368 },
    { day: "15th", plan: 28966, actual: 11627 },
    { day: "16th", plan: 31035, actual: 10921 },
    { day: "17th", plan: 33104, actual: 11747 },
    { day: "18th", plan: 35173, actual: 13617 },
    { day: "19th", plan: 37242, actual: 13617 },
    { day: "20th", plan: 39311, actual: 14387 },
    { day: "22nd", plan: 41380, actual: 15357 },
    { day: "23rd", plan: 43449, actual: 16127 },
    { day: "24th", plan: 45518, actual: 16431 },
    { day: "25th", plan: 47587, actual: 16431 },
    { day: "26th", plan: 49656, actual: 16431 },
    { day: "27th", plan: 51725, actual: 17091 },
    { day: "28th", plan: 53794, actual: 19313 },
    { day: "29th", plan: 53794, actual: 19313 },
    { day: "30th", plan: 53794, actual: 19313 },
  ];

  const productionAvgData = [
    { stage: "CUTTING", requiredAvg: 29881, currentAvg: 1796 },
    { stage: "PRINTING", requiredAvg: 54797, currentAvg: 0 },
    { stage: "UPPER", requiredAvg: 54797, currentAvg: 0 },
    { stage: "ASSEMBLY", requiredAvg: 35479, currentAvg: 0 },
    { stage: "PACKING", requiredAvg: 35832, currentAvg: 0 },
    { stage: "RFD", requiredAvg: 34384, currentAvg: 0 },
  ];

  // Navigation handlers
  const handleNavigateToModule = (module: string, subModule?: string) => {
    if (onNavigate) {
      onNavigate(module, subModule);
    } else {
      setCurrentModule(module);
    }
    toast.success(
      `Navigating to ${module}${subModule ? ` - ${subModule}` : ""}`
    );
  };

  // Export handlers
  const handleExportPDF = () => {
    try {
      exportDashboardPDF(dashboardData);
      toast.success("Dashboard exported as PDF", {
        description: "Your dashboard report has been generated",
      });
    } catch (error) {
      toast.error("Failed to export PDF");
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportDashboardExcel(dashboardData);
      toast.success("Dashboard exported as Excel", {
        description: "Excel file has been downloaded",
      });
    } catch (error) {
      toast.error("Failed to export Excel");
    }
  };

  const handleExportCSV = () => {
    try {
      exportDashboardCSV(dashboardData);
      toast.success("Dashboard exported as CSV", {
        description: "CSV file has been downloaded",
      });
    } catch (error) {
      toast.error("Failed to export CSV");
    }
  };

  const handleRefreshDashboard = async () => {
    try {
      setLoading(true);
      const [projects, inventory, vendors, users, productions] =
        await Promise.all([
          dashboardService.getProjects(),
          dashboardService.getInventoryItems(),
          dashboardService.getVendors(),
          dashboardService.getUsers(),
          dashboardService.getProductionProjects(),
        ]);

      const projectsArray = Array.isArray(projects)
        ? projects
        : projects.data || [];
      const inventoryArray = Array.isArray(inventory)
        ? inventory
        : inventory.data || [];
      const vendorsArray = Array.isArray(vendors)
        ? vendors
        : vendors.data || [];
      const usersArray = Array.isArray(users) ? users : users.data || [];
      const productionsArray = Array.isArray(productions)
        ? productions
        : productions.data || [];

      setDashboardData({
        totalProjects: projectsArray.length,
        totalInventory: inventoryArray.length,
        totalVendors: vendorsArray.length,
        totalUsers: usersArray.length,
        activeProduction: productionsArray.length,
        recentActivities: dashboardData.recentActivities,
      });

      toast.success("Dashboard refreshed successfully", {
        description: "All data has been updated",
      });
    } catch (error) {
      toast.error("Failed to refresh dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Chart export handlers
  const handleExportChartData = (chartName: string) => {
    toast.success(`Exporting ${chartName} data...`, {
      description: "Chart data will be downloaded as Excel file",
    });
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Filters and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-1">
            Executive Dashboard
          </h2>
          <p className="text-sm text-gray-600">
            Comprehensive business intelligence and real-time analytics overview
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-[#0c9dcb] text-[#0c9dcb] hover:bg-[#0c9dcb] hover:text-white"
            onClick={handleRefreshDashboard}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-[#0c9dcb] text-[#0c9dcb] hover:bg-[#0c9dcb] hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Dashboard
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileDown className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-600 hover:bg-gray-100"
            onClick={() => toast.info("Opening dashboard settings...")}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Enhanced Key Metrics Cards with Active Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card
          className="bg-linear-to-br from-[#0c9dcb] to-[#26b4e0] text-white border-0 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 cursor-pointer group"
          onClick={() => handleNavigateToModule("rd-management", "project")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                  <Target className="w-5 h-5" />
                </div>
                <span>Total Projects</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 p-1 h-auto"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToModule("rd-management", "project");
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View All Projects
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToModule("rd-management", "rd-dashboard");
                    }}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    R&D Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportChartData("Projects");
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-4xl mb-1.5">{dashboardData.totalProjects}</div>
            <p className="text-sm opacity-90">Current active projects</p>
          </CardContent>
        </Card>

        <Card
          className="bg-linear-to-br from-[#c41e3a] to-[#dc143c] text-white border-0 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 cursor-pointer group"
          onClick={() => handleNavigateToModule("rd-management", "red-seal")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span>Red Seal Approved</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 p-1 h-auto"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToModule("rd-management", "red-seal");
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Red Seal Projects
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportChartData("Red Seal Projects");
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToModule("rd-management", "project");
                    }}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    All Projects
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-4xl mb-1.5">
              {Math.floor(dashboardData.totalProjects * 0.4)}
            </div>
            <p className="text-sm opacity-90">Initial approval complete</p>
          </CardContent>
        </Card>

        <Card
          className="bg-linear-to-br from-[#28a745] to-[#20c997] text-white border-0 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 cursor-pointer group"
          onClick={() => handleNavigateToModule("rd-management", "green-seal")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span>Green Seal Approved</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 p-1 h-auto"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToModule("rd-management", "green-seal");
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Green Seal Projects
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToModule("rd-management", "po-target-date");
                    }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    PO Target Dates
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportChartData("Green Seal Projects");
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-4xl mb-1.5">
              {dashboardData.activeProduction}
            </div>
            <p className="text-sm opacity-90">Ready for production</p>
          </CardContent>
        </Card>

        <Card
          className="bg-linear-to-br from-[#ffc107] to-[#fd7e14] text-white border-0 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 cursor-pointer group"
          onClick={() =>
            handleNavigateToModule("rd-management", "rd-dashboard")
          }
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                  <Clock className="w-5 h-5" />
                </div>
                <span>Pending Approvals</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 p-1 h-auto"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToModule("rd-management", "rd-dashboard");
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View R&D Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToModule("rd-management", "project");
                    }}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    All Projects
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.success("Reminders sent to approvers");
                    }}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Send Reminders
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-4xl mb-1.5">
              {dashboardData.totalInventory}
            </div>
            <p className="text-sm opacity-90">Awaiting review</p>
          </CardContent>
        </Card>

        <Card
          className="bg-linear-to-br from-[#dc3545] to-[#e83e8c] text-white border-0 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 cursor-pointer group"
          onClick={() => handleNavigateToModule("notifications")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span>Critical Issues</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 p-1 h-auto"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToModule("notifications");
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View All Issues
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.info("Creating action plan...");
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Create Action Plan
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToModule("reports");
                    }}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Issue Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-4xl mb-1.5">{dashboardData.totalVendors}</div>
            <p className="text-sm opacity-90">Require immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Charts Section with Interactive Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purchase Order Status Overview */}
        <Card className="shadow-xl border-0 bg-white hover:shadow-2xl transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
                <div className="p-2 bg-[#0c9dcb]/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-[#0c9dcb]" />
                </div>
                Purchase Order Status Overview
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-600 hover:bg-gray-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() =>
                      handleExportChartData("Purchase Order Status")
                    }
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleNavigateToModule("delivery")}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View PO Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      handleNavigateToModule("reports", "po-reports")
                    }
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectStatusData} barGap={8}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#6c757d" }}
                  axisLine={{ stroke: "#e9ecef" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6c757d" }}
                  axisLine={{ stroke: "#e9ecef" }}
                  label={{
                    value: "Quantity",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 12, fill: "#6c757d" },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e9ecef",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                    padding: "12px",
                  }}
                  cursor={{ fill: "rgba(12, 157, 203, 0.05)" }}
                />
                <Bar
                  dataKey="poQuantity"
                  fill="#0c9dcb"
                  radius={[6, 6, 0, 0]}
                  name="PO Quantity"
                  maxBarSize={60}
                />
                <Bar
                  dataKey="poDispatch"
                  fill="#20c997"
                  radius={[6, 6, 0, 0]}
                  name="PO Dispatch"
                  maxBarSize={60}
                />
                <Bar
                  dataKey="poRFD"
                  fill="#ffc107"
                  radius={[6, 6, 0, 0]}
                  name="PO RFD"
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-[#0c9dcb]" />
                <span className="text-sm text-gray-700">PO Quantity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-[#20c997]" />
                <span className="text-sm text-gray-700">PO Dispatch</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-[#ffc107]" />
                <span className="text-sm text-gray-700">PO RFD</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plant Utilization */}
        <Card className="shadow-xl border-0 bg-white hover:shadow-2xl transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
                <div className="p-2 bg-[#0c9dcb]/10 rounded-lg">
                  <Factory className="w-5 h-5 text-[#0c9dcb]" />
                </div>
                Items by Plant
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-600 hover:bg-gray-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => handleNavigateToModule("production")}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Plant Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExportChartData("Plant Distribution")}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      handleNavigateToModule("reports", "plant-reports")
                    }
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={plantUtilizationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {plantUtilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} items`, "Total"]}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e9ecef",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {plantUtilizationData.map((plant, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  onClick={() => {
                    toast.info(`Viewing ${plant.name} details`);
                    handleNavigateToModule("production");
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: plant.color }}
                  />
                  <span className="text-sm text-gray-700">
                    {plant.name}: {plant.value} items
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assembly Plan VS Actual and AVG Production Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-xl border-0 bg-white hover:shadow-2xl transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
                <div className="p-2 bg-[#0c9dcb]/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-[#0c9dcb]" />
                </div>
                Assembly Plan VS Actual
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 mr-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-1 rounded-full bg-[#0c9dcb]" />
                    <span className="text-sm text-gray-700">Plan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-1 rounded-full bg-[#ed7d31]" />
                    <span className="text-sm text-gray-700">Actual</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-600 hover:bg-gray-100"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => handleExportChartData("Assembly Plan")}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleNavigateToModule("production", "tracking")
                      }
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        handleNavigateToModule("reports", "assembly-reports")
                      }
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Generate Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart
                data={assemblyData}
                margin={{ top: 30, right: 20, left: 20, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e9ecef"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#6c757d" }}
                  axisLine={{ stroke: "#e9ecef" }}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6c757d" }}
                  axisLine={{ stroke: "#e9ecef" }}
                  tickLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    value.toLocaleString("en-IN"),
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e9ecef",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                    padding: "10px 14px",
                  }}
                  labelStyle={{ color: "#495057", marginBottom: "4px" }}
                  cursor={{
                    stroke: "#0c9dcb",
                    strokeWidth: 1,
                    strokeDasharray: "5 5",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="plan"
                  stroke="#0c9dcb"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#0c9dcb",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name="Plan"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#ed7d31"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#ed7d31",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name="Actual"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-white hover:shadow-2xl transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
                <div className="p-2 bg-[#0c9dcb]/10 rounded-lg">
                  <Target className="w-5 h-5 text-[#0c9dcb]" />
                </div>
                AVG Current VS Required
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 mr-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#ed7d31]" />
                    <span className="text-sm text-gray-700">Required Avg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#5b9bd5]" />
                    <span className="text-sm text-gray-700">Current Avg</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-600 hover:bg-gray-100"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() =>
                        handleNavigateToModule("production", "tracking")
                      }
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Stage Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleExportChartData("Production Average")
                      }
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        handleNavigateToModule(
                          "reports",
                          "production-analytics"
                        )
                      }
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Performance Analysis
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={productionAvgData}
                layout="vertical"
                margin={{ top: 5, right: 80, left: 5, bottom: 5 }}
                barGap={4}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e9ecef"
                  horizontal={true}
                  vertical={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#6c757d" }}
                  axisLine={{ stroke: "#e9ecef" }}
                  tickLine={false}
                  domain={[0, 60000]}
                  ticks={[0, 10000, 20000, 30000, 40000, 50000, 60000]}
                />
                <YAxis
                  type="category"
                  dataKey="stage"
                  tick={{ fontSize: 12, fill: "#495057" }}
                  axisLine={{ stroke: "#e9ecef" }}
                  tickLine={false}
                  width={90}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    value.toLocaleString("en-IN"),
                    name === "requiredAvg" ? "Required Avg" : "Current Avg",
                  ]}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e9ecef",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                    padding: "10px 14px",
                  }}
                  labelStyle={{ color: "#495057", marginBottom: "4px" }}
                  cursor={{ fill: "rgba(12, 157, 203, 0.05)" }}
                />
                <Bar
                  dataKey="requiredAvg"
                  fill="#ed7d31"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={28}
                  label={{
                    position: "right",
                    fill: "#495057",
                    fontSize: 11,
                    formatter: (value: number) => value.toLocaleString("en-IN"),
                  }}
                />
                <Bar
                  dataKey="currentAvg"
                  fill="#5b9bd5"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={28}
                  label={{
                    position: "right",
                    fill: "#495057",
                    fontSize: 11,
                    formatter: (value: number) =>
                      value === 0 ? "" : value.toLocaleString("en-IN"),
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-xl border-0 bg-white hover:shadow-2xl transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-gray-900">
                Recent System Activities
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-600 hover:bg-gray-100"
                  onClick={handleRefreshDashboard}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#0c9dcb] text-[#0c9dcb] hover:bg-[#0c9dcb] hover:text-white"
                  onClick={() => handleNavigateToModule("notifications")}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.recentActivities.map((activity: any) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100"
                    onClick={() =>
                      toast.info(`Viewing activity: ${activity.message}`)
                    }
                  >
                    <div
                      className={`p-2 rounded-lg bg-gray-50 ${activity.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Vertical Layout */}
        <Card className="shadow-xl border-0 bg-white hover:shadow-2xl transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-gray-900">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3 px-4 border-[#0c9dcb]/30 hover:bg-[#0c9dcb] hover:text-white hover:border-[#0c9dcb] transition-all group"
                onClick={() => handleNavigateToModule("rd-management")}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-[#0c9dcb]/10 rounded-lg group-hover:bg-white/20 transition-colors">
                    <Plus className="w-5 h-5 text-[#0c9dcb] group-hover:text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-sm text-gray-900 group-hover:text-white">
                      New Project
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-white/80">
                      Create R&D project
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3 px-4 border-[#0c9dcb]/30 hover:bg-[#0c9dcb] hover:text-white hover:border-[#0c9dcb] transition-all group"
                onClick={() => handleNavigateToModule("production", "planning")}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-[#0c9dcb]/10 rounded-lg group-hover:bg-white/20 transition-colors">
                    <Calendar className="w-5 h-5 text-[#0c9dcb] group-hover:text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-sm text-gray-900 group-hover:text-white">
                      Production Plan
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-white/80">
                      Schedule production
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3 px-4 border-[#0c9dcb]/30 hover:bg-[#0c9dcb] hover:text-white hover:border-[#0c9dcb] transition-all group"
                onClick={() => handleNavigateToModule("inventory")}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-[#0c9dcb]/10 rounded-lg group-hover:bg-white/20 transition-colors">
                    <Package className="w-5 h-5 text-[#0c9dcb] group-hover:text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-sm text-gray-900 group-hover:text-white">
                      Inventory
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-white/80">
                      Manage stock items
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3 px-4 border-[#0c9dcb]/30 hover:bg-[#0c9dcb] hover:text-white hover:border-[#0c9dcb] transition-all group"
                onClick={() => handleNavigateToModule("delivery")}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-[#0c9dcb]/10 rounded-lg group-hover:bg-white/20 transition-colors">
                    <TrendingUp className="w-5 h-5 text-[#0c9dcb] group-hover:text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-sm text-gray-900 group-hover:text-white">
                      Delivery
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-white/80">
                      Track shipments
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3 px-4 border-[#0c9dcb]/30 hover:bg-[#0c9dcb] hover:text-white hover:border-[#0c9dcb] transition-all group"
                onClick={() => handleNavigateToModule("reports")}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-[#0c9dcb]/10 rounded-lg group-hover:bg-white/20 transition-colors">
                    <BarChart3 className="w-5 h-5 text-[#0c9dcb] group-hover:text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-sm text-gray-900 group-hover:text-white">
                      Reports
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-white/80">
                      Analytics & insights
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3 px-4 border-[#0c9dcb]/30 hover:bg-[#0c9dcb] hover:text-white hover:border-[#0c9dcb] transition-all group"
                onClick={() => handleNavigateToModule("master-data")}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-[#0c9dcb]/10 rounded-lg group-hover:bg-white/20 transition-colors">
                    <Settings className="w-5 h-5 text-[#0c9dcb] group-hover:text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-sm text-gray-900 group-hover:text-white">
                      Master Data
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-white/80">
                      Configure settings
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
