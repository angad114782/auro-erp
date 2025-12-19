import {
  AlertTriangle,
  ArrowUpDown,
  Building,
  Calendar as CalendarIcon,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Edit,
  Eye,
  FileCheck,
  MessageSquare,
  Package,
  Printer,
  RefreshCw,
  Save,
  Scissors,
  Search,
  ShirtIcon,
  Target,
  Workflow,
  Wrench,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../lib/api";
import { ItemCuttingDialog } from "./ItemCuttingDialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

// Types for API response
interface APITrackingData {
  projectId: string;
  autoCode: string;
  artName: string;
  size: string;
  color: string;
  gender: string;
  assignPerson: {
    _id: string;
    name: string;
  };
  brand: {
    _id: string;
    name: string;
  };
  country: {
    _id: string;
    name: string;
  };
  poDetails: {
    _id: string;
    project: string;
    orderQuantity: number;
    unitPrice: number;
    totalAmount: number;
    poNumber: string;
    status: string;
    deliveryDate: string;
    paymentTerms: string;
    urgencyLevel: string;
    qualityRequirements: string;
    clientFeedback: string;
    specialInstructions: string;
    targetAt: string;
    issuedAt: string;
    updatedBy: string | null;
    updatedAt: string;
    createdAt: string;
    __v: number;
  };
  cards: Array<{
    _id: string;
    cardNumber: string;
    projectId: string;
    productName: string;
    cardQuantity: number;
    assignedPlant: {
      _id: string;
      name: string;
    };
    description: string;
    specialInstructions: string;
    status: string;
    stage: string;
    materialRequestStatus: string;
    upper: Array<any>;
    materials: Array<any>;
    components: Array<any>;
    packaging: Array<any>;
    misc: Array<any>;
    materialRequests: Array<any>;
    isActive: boolean;
    createdBy: string;
    stageHistory: Array<any>;
    materialsSnapshot: Array<any>;
    componentsSnapshot: Array<any>;
    createdAt: string;
    updatedAt: string;
    __v: number;
    startDate?: string;
  }>;
  department: string;
  summary: {
    daily: Record<string, number>;
    weekly: {
      W1: number;
      W2: number;
      W3: number;
      W4: number;
      W5: number;
    };
    monthTotal: number;
  };
}

interface ProductionRecord {
  id: string;
  productionId: string;
  brand: string;
  category: string;
  type: string;
  gender: string;
  articleName: string;
  poNumber: string;
  poItems: number;
  monthPlan: number;
  manufacturingCompany: string;
  country: string;
  color: string;
  size: string;
  unitPstId: string;
  cutting: {
    status: "Pending" | "In Progress" | "Completed";
    quantity: number;
    planned: number;
  };
  printing: {
    status: "Pending" | "In Progress" | "Completed";
    quantity: number;
    planned: number;
  };
  upper: {
    status: "Pending" | "In Progress" | "Completed";
    quantity: number;
    planned: number;
  };
  upperREJ: {
    status: "Pending" | "Rejected" | "Approved";
    quantity: number;
    planned: number;
  };
  assembly: {
    status: "Pending" | "In Progress" | "Completed";
    quantity: number;
    planned: number;
  };
  packing: {
    status: "Pending" | "In Progress" | "Completed";
    quantity: number;
    planned: number;
  };
  rfd: {
    status: "Pending" | "Ready" | "Dispatched";
    quantity: number;
    planned: number;
  };
  rfdRemarks: string;
  projectId: string;
  cards: any[];
  summary: {
    daily: Record<string, number>;
    weekly: Record<string, number>;
    monthTotal: number;
  };
}

interface DailyProduction {
  [key: string]: number;
}

interface ProductionData {
  record: ProductionRecord;
  dailyProduction: DailyProduction;
}

type ProductionStage =
  | "cutting"
  | "printing"
  | "upper"
  | "upperREJ"
  | "assembly"
  | "packing"
  | "rfd";

type Department =
  | "cutting"
  | "printing"
  | "upper"
  | "upperREJ"
  | "assembly"
  | "packing"
  | "rfd";

export function ProductionTrackingTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().getMonth() + 1 < 10
      ? `0${new Date().getMonth() + 1}`
      : `${new Date().getMonth() + 1}`
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    `${new Date().getFullYear()}`
  );
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department>("cutting");
  const [selectedProductionRecord, setSelectedProductionRecord] =
    useState<ProductionRecord | null>(null);
  const [stageUpdateDialogOpen, setStageUpdateDialogOpen] = useState(false);
  const [stageUpdateSearchTerm, setStageUpdateSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [updateEntries, setUpdateEntries] = useState<{
    [key: string]: { quantity: number; remarks: string; advanceTo?: string };
  }>({});
  const [itemCuttingDialogOpen, setItemCuttingDialogOpen] = useState(false);
  const [selectedProductForCutting, setSelectedProductForCutting] =
    useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [showDailyBreakdown, setShowDailyBreakdown] = useState(false);
  const [trackingData, setTrackingData] = useState<APITrackingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
const [trackingCards, setTrackingCards] = useState<any[]>([]);
const [selectedCardId, setSelectedCardId] = useState<string>("");
const [loadingCards, setLoadingCards] = useState(false);
const [departmentRows, setDepartmentRows] = useState<any[]>([]);
const [loadingDeptRows, setLoadingDeptRows] = useState(false);
const [deptRowsDialogOpen, setDeptRowsDialogOpen] = useState(false);

const selectedCard = trackingCards.find(
  (card) => card._id === selectedCardId
);
const ensureSelectedCard = () => {
  if (!selectedCard) {
    toast.error("Please select a tracking card first");
    return false;
  }
  return true;
};

const fetchTrackingCards = async (projectId: string) => {
  try {
    setLoadingCards(true);

    const res = await api.get(`/projects/${projectId}/cards`);

    if (res.data?.success) {
      const items = res.data.items || [];
      setTrackingCards(items);

      // ✅ DEFAULT: first card auto select
      if (items.length > 0) {
        setSelectedCardId(items[0]._id);
      } else {
        setSelectedCardId("");
      }
    } else {
      setTrackingCards([]);
      setSelectedCardId("");
    }
  } catch (err) {
    console.error("Failed to load tracking cards", err);
    toast.error("Failed to load tracking cards");
    setSelectedCardId("");
  } finally {
    setLoadingCards(false);
  }
};

const fetchDepartmentRows = async (
  projectId: string,
  department: string
) => {
  try {
    setLoadingDeptRows(true);

    const res = await api.get(
      `/micro-tracking/department/${projectId}/${department}`
    );

    if (res.data?.success) {
      setDepartmentRows(res.data.data || []);
      setDeptRowsDialogOpen(true);
    } else {
      toast.error("No tracking rows found");
      setDepartmentRows([]);
    }
  } catch (err) {
    console.error("Failed to fetch department rows", err);
    toast.error("Failed to load tracking rows");
  } finally {
    setLoadingDeptRows(false);
  }
};


useEffect(() => {
  if (selectedProductionRecord?.projectId) {
    fetchTrackingCards(selectedProductionRecord.projectId);
  }
}, [selectedProductionRecord]);

  // Check for mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch tracking data based on department, month, and year
  const fetchTrackingData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(
        `/tracking/dashboard/department?dept=${selectedDepartment}&month=${parseInt(
          selectedMonth
        )}&year=${selectedYear}`
      );
      console.log(res.data.data, "tracking data");
      if (res.data?.success) {
        setTrackingData(res.data.data || []);
      } else {
        setError("Failed to load tracking data");
        toast.error("Failed to load tracking data");
      }
    } catch (err: any) {
      console.error("Error fetching tracking data:", err);
      setError(err.message || "Failed to fetch data");
      toast.error("Failed to fetch tracking data");
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment, selectedMonth, selectedYear]);

  // const fetchTrackingCard=async ()=>{
  //   await api.get("micro-tracking/project/693eb8f85f188cf0b8cf8e86/:cardId");
  // }

  useEffect(() => {
    fetchTrackingData();
  }, [fetchTrackingData]);

  // Map API data to ProductionRecord format
  const transformAPIDataToProductionRecords = (
    apiData: APITrackingData[]
  ): any[] => {
    return apiData.map((item, index) => {
      // Get department-specific data from summary
      const departmentTotal = item.summary.monthTotal || 0;
      const dailyData = item.summary.daily || {};
      const weeklyData = item.summary.weekly || {
        W1: 0,
        W2: 0,
        W3: 0,
        W4: 0,
        W5: 0,
      };

      // Calculate current production quantity based on selected department
      const currentQuantity = departmentTotal;
      const plannedQuantity = item.poDetails?.orderQuantity || 0;
const stageCardQuantity =
  item.cards?.reduce(
    (sum, card) => sum + (card.cardQuantity || 0),
    0
  ) || 0;


      // Determine status based on progress
      let status:
        | "Pending"
        | "In Progress"
        | "Completed"
        | "Ready"
        | "Dispatched"
        | "Rejected"
        | "Approved" = "Pending";
      if (currentQuantity === 0) {
        status = "Pending";
      } else if (currentQuantity < plannedQuantity) {
        status = "In Progress";
      } else {
        if (selectedDepartment === "upperREJ") {
          status = "Approved"; // Default for upperREJ when completed
        } else if (selectedDepartment === "rfd") {
          status = "Ready"; // Default for RFD when completed
        } else {
          status = "Completed";
        }
      }

      // Special handling for upperREJ and rfd statuses
      if (selectedDepartment === "upperREJ") {
        status =
          currentQuantity === 0
            ? "Pending"
            : currentQuantity < plannedQuantity * 0.1
            ? "Rejected"
            : "Approved";
      } else if (selectedDepartment === "rfd") {
        status =
          currentQuantity === 0
            ? "Pending"
            : currentQuantity < plannedQuantity
            ? "Ready"
            : "Dispatched";
      }

      const baseRecord = {
        id: item.projectId || `api-${index}`,
        productionId: item.autoCode || `PRJ-${index}`,
        brand: item.brand?.name || "Unknown Brand",
        category: "Shoes", // Default category
        type: "Standard", // Default type
        gender: item.gender || "Unisex",
        articleName: item.artName || "Unnamed Article",
        poNumber: item.poDetails?.poNumber || "N/A",
         poItems: stageCardQuantity,  // 👈 NOW THIS IS CARD QTY
  poQuantity: item.poDetails?.orderQuantity || 0, 
        monthPlan: Math.floor((item.poDetails?.orderQuantity || 0) * 0.8),
        manufacturingCompany:
          item.cards?.[0]?.assignedPlant?.name || "Unknown Plant",
        country: item.country?.name || "Unknown Country",
        color: item.color || "N/A",
        size: item.size || "N/A",
        unitPstId: item.projectId || "N/A",
        projectId: item.projectId,
        cards: item.cards || [],
        summary: item.summary,
        rfdRemarks: "",
      };

      // Create production stages based on selected department
      const stageData = {
        status,
        quantity: currentQuantity,
        planned: plannedQuantity,
      };

      // Return complete record with all stages
      return {
        ...baseRecord,
        cutting:
          selectedDepartment === "cutting"
            ? stageData
            : { status: "Pending", quantity: 0, planned: plannedQuantity },
        printing:
          selectedDepartment === "printing"
            ? stageData
            : { status: "Pending", quantity: 0, planned: plannedQuantity },
        upper:
          selectedDepartment === "upper"
            ? stageData
            : { status: "Pending", quantity: 0, planned: plannedQuantity },
        upperREJ:
          selectedDepartment === "upperREJ"
            ? (stageData as any)
            : { status: "Pending", quantity: 0, planned: plannedQuantity },
        assembly:
          selectedDepartment === "assembly"
            ? stageData
            : { status: "Pending", quantity: 0, planned: plannedQuantity },
        packing:
          selectedDepartment === "packing"
            ? stageData
            : { status: "Pending", quantity: 0, planned: plannedQuantity },
        rfd:
          selectedDepartment === "rfd"
            ? (stageData as any)
            : { status: "Pending", quantity: 0, planned: plannedQuantity },
      };
    });
  };

  // Get base production data from API
  const baseProductionData: ProductionRecord[] =
    transformAPIDataToProductionRecords(trackingData);

  // Define stages with proper department mapping
  const stages = [
    {
      key: "cutting" as ProductionStage,
      name: "Cutting",
      color: "text-red-600",
      shortName: "Cut",
      icon: <Scissors className="w-4 h-4" />,
      department: "cutting" as Department,
    },
    {
      key: "printing" as ProductionStage,
      name: "Printing",
      color: "text-purple-600",
      shortName: "Print",
      icon: <Printer className="w-4 h-4" />,
      department: "printing" as Department,
    },
    {
      key: "upper" as ProductionStage,
      name: "Upper",
      color: "text-blue-600",
      shortName: "Upper",
      icon: <ShirtIcon className="w-4 h-4" />,
      department: "upper" as Department,
    },
    {
      key: "upperREJ" as ProductionStage,
      name: "Upper REJ",
      color: "text-orange-600",
      shortName: "REJ",
      icon: <X className="w-4 h-4" />,
      department: "upperREJ" as Department,
    },
    {
      key: "assembly" as ProductionStage,
      name: "Assembly",
      color: "text-green-600",
      shortName: "Assem",
      icon: <Wrench className="w-4 h-4" />,
      department: "assembly" as Department,
    },
    {
      key: "packing" as ProductionStage,
      name: "Packing",
      color: "text-indigo-600",
      shortName: "Pack",
      icon: <Package className="w-4 h-4" />,
      department: "packing" as Department,
    },
    {
      key: "rfd" as ProductionStage,
      name: "RFD",
      color: "text-teal-600",
      shortName: "RFD",
      icon: <FileCheck className="w-4 h-4" />,
      department: "rfd" as Department,
    },
  ];

  // Function to get number of days in a month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  // Function to get month name
  const getMonthName = (monthNum: string) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthIndex = parseInt(monthNum) - 1;
    return months[monthIndex] || "Unknown";
  };

  // Function to generate stage-specific daily production data from API summary
  const generateStageProductionData = (
    record: ProductionRecord,
    stage: ProductionStage,
    year: number,
    month: number
  ): DailyProduction => {
    const daysInMonth = getDaysInMonth(year, month);
    const dailyData: DailyProduction = {};

    // Get daily data from API summary
    const apiDailyData = record.summary?.daily || {};

    // If API has daily data, use it
    if (Object.keys(apiDailyData).length > 0) {
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        const dateKey = `${year}-${month.toString().padStart(2, "0")}-${day
          .toString()
          .padStart(2, "0")}`;

        // Use API data if available, otherwise 0
        dailyData[dateKey] = apiDailyData[dateKey] || 0;

        // Set weekend days to 0 if no production
        if ((dayOfWeek === 0 || dayOfWeek === 6) && !apiDailyData[dateKey]) {
          dailyData[dateKey] = 0;
        }
      }
    } else {
      // Generate fallback data if no API data
      const stageData = record[stage];
      const stagePlanned = stageData.planned;
      const stageCompleted = stageData.quantity;

      const baseDailyRate = Math.floor(stagePlanned / 25);
      const variance = Math.floor(baseDailyRate * 0.4);

      let cumulativeProduction = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        const dateKey = `${year}-${month.toString().padStart(2, "0")}-${day
          .toString()
          .padStart(2, "0")}`;

        if (dayOfWeek === 0 || dayOfWeek === 6) {
          dailyData[dateKey] = 0;
        } else {
          const seed =
            parseInt(record.id.slice(-3)) *
            day *
            month *
            (stages.findIndex((s) => s.key === stage) + 1);
          const randomFactor = (seed % 100) / 100;

          let dailyProduction = 0;

          if (stageData.status === "Completed") {
            const targetDaily = Math.floor(stageCompleted / 20);
            dailyProduction = Math.floor(targetDaily + variance * randomFactor);
          } else if (stageData.status === "In Progress") {
            const targetDaily = Math.floor(stageCompleted / 15);
            dailyProduction = Math.floor(
              targetDaily + variance * randomFactor * 0.7
            );
          } else {
            dailyProduction = Math.floor(baseDailyRate * 0.1 * randomFactor);
          }

          if (cumulativeProduction + dailyProduction > stageCompleted) {
            dailyProduction = Math.max(
              0,
              stageCompleted - cumulativeProduction
            );
          }

          dailyData[dateKey] = Math.max(0, dailyProduction);
          cumulativeProduction += dailyProduction;
        }
      }
    }

    return dailyData;
  };

  // Function to generate week data for selected month/year
  const generateWeekData = () => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    const daysInMonth = getDaysInMonth(year, month);
    const monthName = getMonthName(selectedMonth);

    const weeks = [];
    let currentDay = 1;
    let weekNumber = 1;

    while (currentDay <= daysInMonth) {
      const weekStart = currentDay;
      const weekEnd = Math.min(currentDay + 6, daysInMonth);
      const weekDays = [];

      for (let day = weekStart; day <= weekEnd; day++) {
        weekDays.push(day);
      }

      weeks.push({
        weekNumber,
        weekStart,
        weekEnd,
        days: weekDays,
        label: `Week ${weekNumber} (${weekStart}-${weekEnd} ${monthName})`,
        shortLabel: `W${weekNumber}`,
        monthName,
        totalDays: weekDays.length,
      });

      currentDay = weekEnd + 1;
      weekNumber++;
    }

    return weeks;
  };

  const weekData = generateWeekData();

  // Generate production data with stage-specific daily details
  const productionData: ProductionData[] = baseProductionData.map((record) => ({
    record,
    dailyProduction: generateStageProductionData(
      record,
      selectedDepartment as ProductionStage,
      parseInt(selectedYear),
      parseInt(selectedMonth)
    ),
  }));

  // Calculate weekly totals from API summary
  const getWeeklyTotalsFromAPI = (record: ProductionRecord) => {
    const apiWeeklyData = record.summary?.weekly || {
      W1: 0,
      W2: 0,
      W3: 0,
      W4: 0,
      W5: 0,
    };
    return weekData.map((week, index) => {
      const weekKey = `W${week.weekNumber}`;
      return apiWeeklyData[weekKey as keyof typeof apiWeeklyData] || 0;
    });
  };

  const getStatusBadge = (
    status: string,
    type: "production" | "upperREJ" | "rfd"
  ) => {
    if (type === "upperREJ") {
      switch (status) {
        case "Approved":
          return (
            <Badge className="bg-green-100 text-green-800 text-xs px-2 py-0.5">
              <CheckCircle className="w-3 h-3 mr-1" />
              Approved
            </Badge>
          );
        case "Rejected":
          return (
            <Badge className="bg-red-100 text-red-800 text-xs px-2 py-0.5">
              <X className="w-3 h-3 mr-1" />
              Rejected
            </Badge>
          );
        case "Pending":
          return (
            <Badge className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </Badge>
          );
        default:
          return (
            <Badge className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5">
              {status}
            </Badge>
          );
      }
    }

    if (type === "rfd") {
      switch (status) {
        case "Dispatched":
          return (
            <Badge className="bg-green-100 text-green-800 text-xs px-2 py-0.5">
              <CheckCircle className="w-3 h-3 mr-1" />
              Dispatched
            </Badge>
          );
        case "Ready":
          return (
            <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5">
              <FileCheck className="w-3 h-3 mr-1" />
              Ready
            </Badge>
          );
        case "Pending":
          return (
            <Badge className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </Badge>
          );
        default:
          return (
            <Badge className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5">
              {status}
            </Badge>
          );
      }
    }

    switch (status) {
      case "Completed":
        return (
          <Badge className="bg-green-100 text-green-800 text-xs px-2 py-0.5">
            <CheckCircle className="w-3 h-3 mr-1" />
            Done
          </Badge>
        );
      case "In Progress":
        return (
          <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5">
            <Clock className="w-3 h-3 mr-1" />
            In Prog
          </Badge>
        );
      case "Pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5">
            {status}
          </Badge>
        );
    }
  };

  // Calculate production cards
  const calculateProductionCards = (productionId: string): number => {
    const record = baseProductionData.find((p) => p.id === productionId);
    return record?.cards?.length || 0;
  };

  // Filter data based on search term
  const filteredData = productionData.filter(({ record }) => {
    const matchesSearch =
      record.articleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.productionId.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Get current stage name for display
  const getCurrentStageName = () => {
    return (
      stages.find((s) => s.department === selectedDepartment)?.name ||
      "Production"
    );
  };

  // Calculate totals from API data
  const calculateDailyTotals = () => {
    const dailyTotals: { [key: string]: number } = {};

    // Aggregate daily totals from all records
    filteredData.forEach(({ record }) => {
      const apiDailyData = record.summary?.daily || {};
      Object.entries(apiDailyData).forEach(([date, production]) => {
        dailyTotals[date] = (dailyTotals[date] || 0) + production;
      });
    });

    return dailyTotals;
  };

  const dailyTotals = calculateDailyTotals();

  // Handle department change
  const handleDepartmentChange = (department: Department) => {
    setSelectedDepartment(department);
    // Reset week and other states
    setCurrentWeek(1);
    setExpandedRow(null);
    setShowDailyBreakdown(false);
  };

  // Function to update production data
  const updateProductionData = async (
    productId: string,
    stage: ProductionStage,
    quantity: number,
    remarks: string
  ) => {
    try {
      // Find the record
      const record = baseProductionData.find((p) => p.id === productId);
      if (!record) {
        toast.error("Product not found");
        return;
      }

      // Make API call to update production data
      const updateData = {
        projectId: record.projectId,
        department: stage,
        quantity,
        remarks,
        date: selectedDate,
      };

      // You'll need to implement this API endpoint
      // const response = await api.post('/tracking/update-production', updateData);

      // For now, simulate success
      toast.success(
        `Updated ${getCurrentStageName()} for ${
          record.articleName
        }: +${quantity} units`
      );

      // Refresh data
      fetchTrackingData();

      // Clear update entries
      setUpdateEntries((prev) => ({
        ...prev,
        [productId]: { quantity: 0, remarks: "" },
      }));
    } catch (error) {
      console.error("Error updating production data:", error);
      toast.error("Failed to update production data");
    }
  };

  // Function to handle batch update
  const handleBatchUpdate = async () => {
    let updatesCount = 0;

    try {
      for (const [productId, entry] of Object.entries(updateEntries)) {
        if (entry.quantity > 0) {
          await updateProductionData(
            productId,
            selectedDepartment as ProductionStage,
            entry.quantity,
            entry.remarks
          );
          updatesCount++;
        }
      }

      if (updatesCount > 0) {
        toast.success(
          `Successfully updated ${updatesCount} product(s) for ${getCurrentStageName()}`
        );
        setStageUpdateDialogOpen(false);
      } else {
        toast.error("Please enter quantities to update");
      }
    } catch (error) {
      console.error("Error in batch update:", error);
      toast.error("Failed to update production data");
    }
  };

  // Filtered products for stage update dialog
  const filteredProductsForUpdate = baseProductionData.filter(
    (record) =>
      record.articleName
        .toLowerCase()
        .includes(stageUpdateSearchTerm.toLowerCase()) ||
      record.productionId
        .toLowerCase()
        .includes(stageUpdateSearchTerm.toLowerCase()) ||
      record.brand.toLowerCase().includes(stageUpdateSearchTerm.toLowerCase())
  );

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Package className="h-16 w-16 text-gray-300 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No Production Data
      </h3>
      <p className="text-sm text-gray-600 text-center mb-4">
        No production data found for {getCurrentStageName()} department in{" "}
        {getMonthName(selectedMonth)} {selectedYear}
      </p>
      {/* <div className="flex gap-2">
        <Button
          onClick={fetchTrackingData}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-2" />
          Refresh Data
        </Button>
        <Button
          onClick={() => setStageUpdateDialogOpen(true)}
          size="sm"
          className="bg-[#0c9dcb] hover:bg-[#0a87a5] text-xs"
        >
          <Edit className="w-3 h-3 mr-2" />
          Add Production Data
        </Button>
      </div> */}
    </div>
  );

  // Mobile Card View with ALL Information
  const MobileProductionCard = ({
    record,
    dailyProduction,
    index,
  }: {
    record: ProductionRecord;
    dailyProduction: DailyProduction;
    index: number;
  }) => {
    const stageData = record[selectedDepartment as ProductionStage];
    const isExpanded = expandedRow === record.id;
    const currentWeekData = weekData[currentWeek - 1];

    // Get weekly totals from API summary
    const apiWeeklyTotals = getWeeklyTotalsFromAPI(record);
    const weeklyTotal = apiWeeklyTotals[currentWeek - 1] || 0;

    // Calculate monthly total from API
    const monthlyTotal = record.summary?.monthTotal || 0;

    // Calculate stage progress
    const stageProgress = Math.min(
      100,
      (stageData.quantity / stageData.planned) * 100
    );

    return (
      <Card className="mb-4 overflow-hidden border border-gray-200 shadow-sm">
        <CardContent className="p-4">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className="bg-blue-50 text-blue-700 text-xs font-medium">
                  {record.productionId}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs bg-green-50 text-green-700"
                >
                  {calculateProductionCards(record.id)} cards
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs bg-purple-50 text-purple-700"
                >
                  {record.poNumber}
                </Badge>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">
                {record.articleName}
              </h3>
              <div className="flex flex-wrap gap-1 text-xs text-gray-600">
                <span>{record.brand}</span>
                <span>•</span>
                <span>{record.category}</span>
                <span>•</span>
                <span>{record.type}</span>
                <span>•</span>
                <span>{record.gender}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setExpandedRow(isExpanded ? null : record.id)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Quick Stats Grid - Shows ALL key metrics */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* <div className="bg-gray-50 rounded p-2 text-center">
              <div className="text-sm font-semibold text-gray-900">
                {record.poItems}
              </div>
              <div className="text-xs text-gray-500">Qty.</div>
            </div> */}
            <div className="bg-gray-50 rounded p-2 text-center">
              <div className="text-sm font-semibold text-gray-900">
                {stageData.quantity}/{record.poItems}
              </div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div className="bg-gray-50 rounded p-2 text-center">
              <div className="text-sm font-semibold text-gray-900">
               {record.manufacturingCompany.length > 9
  ? `${record.manufacturingCompany.substring(0, 9)}...`
  : record.manufacturingCompany}
              </div>
              <div className="text-xs text-gray-500">MFG</div>
            </div>
          </div>

          {/* Status Section with Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">
                  {getCurrentStageName()}
                </span>
                {getStatusBadge(
                  stageData.status,
                  selectedDepartment === "upperREJ"
                    ? "upperREJ"
                    : selectedDepartment === "rfd"
                    ? "rfd"
                    : "production"
                )}
              </div>
              <span className="text-xs font-medium text-[#0c9dcb]">
                {Math.round(stageProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#0c9dcb] h-2 rounded-full transition-all duration-300"
                style={{ width: `${stageProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Expandable Content - Shows ALL information */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
              {/* Manufacturing Details */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Building className="w-3 h-3" />
                  Manufacturing Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-gray-500">Company</div>
                    <div className="font-medium truncate">
                      {record.manufacturingCompany}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-gray-500">Country</div>
                    <div className="font-medium">{record.country}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-gray-500">Color</div>
                    <div className="font-medium">{record.color}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-gray-500">Size</div>
                    <div className="font-medium">{record.size}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded col-span-2">
                    <div className="text-gray-500">Unit PST ID</div>
                    <div className="font-medium truncate">
                      {record.unitPstId}
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Week Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                    <CalendarIcon className="w-3 h-3" />
                    Weekly Production
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() =>
                        setCurrentWeek(Math.max(1, currentWeek - 1))
                      }
                      disabled={currentWeek === 1}
                    >
                      ←
                    </Button>
                    <span className="text-xs font-medium">
                      Week {currentWeek} ({currentWeekData?.weekStart}-
                      {currentWeekData?.weekEnd})
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() =>
                        setCurrentWeek(
                          Math.min(weekData.length, currentWeek + 1)
                        )
                      }
                      disabled={currentWeek === weekData.length}
                    >
                      →
                    </Button>
                  </div>
                </div>

                {/* Daily Breakdown for Selected Week */}
                <div className="space-y-2">
                  {showDailyBreakdown ? (
                    <div className="space-y-1">
                      {currentWeekData?.days.map((day) => {
                        const year = parseInt(selectedYear);
                        const month = parseInt(selectedMonth);
                        const dateKey = `${year}-${month
                          .toString()
                          .padStart(2, "0")}-${day
                          .toString()
                          .padStart(2, "0")}`;
                        const quantity = dailyProduction[dateKey] || 0;
                        const isWeekend =
                          new Date(year, month - 1, day).getDay() % 6 === 0;

                        return (
                          <div
                            key={`day-${day}`}
                            className={`flex justify-between items-center p-2 rounded ${
                              isWeekend ? "bg-gray-50" : "bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">
                                Day {day}
                              </span>
                              {isWeekend && (
                                <Badge variant="outline" className="text-xs">
                                  Weekend
                                </Badge>
                              )}
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                quantity > 0 ? "text-gray-900" : "text-gray-400"
                              }`}
                            >
                              {quantity > 0 ? quantity : "-"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold text-blue-700">
                        {weeklyTotal}
                      </div>
                      <div className="text-xs text-blue-600">
                        Units this week
                      </div>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setShowDailyBreakdown(!showDailyBreakdown)}
                  >
                    {showDailyBreakdown
                      ? "Hide Daily Breakdown"
                      : "Show Daily Breakdown"}
                  </Button>
                </div>
              </div>

              {/* Weekly Totals Summary */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-2">
                  Weekly Totals
                </h4>
                <div className="overflow-x-auto">
                  <div className="flex space-x-2 pb-2">
                    {weekData.map((week, index) => {
                      const weekTotal = apiWeeklyTotals[index] || 0;

                      return (
                        <div
                          key={week.weekNumber}
                          className={`min-w-[70px] p-2 rounded-lg text-center cursor-pointer transition-all ${
                            currentWeek === week.weekNumber
                              ? "bg-[#0c9dcb] text-white shadow-md"
                              : "bg-gray-100 hover:bg-gray-200"
                          }`}
                          onClick={() => setCurrentWeek(week.weekNumber)}
                        >
                          <div className="text-xs font-medium">
                            {week.shortLabel}
                          </div>
                          <div className="text-sm font-bold mt-1">
                            {weekTotal}
                          </div>
                          <div className="text-xs opacity-75">
                            {week.weekStart}-{week.weekEnd}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Monthly Total */}
              <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs font-semibold text-blue-900">
                      Monthly Total
                    </div>
                    <div className="text-xs text-blue-700">
                      {getMonthName(selectedMonth)} {selectedYear}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-blue-700">
                    {monthlyTotal}
                  </div>
                </div>
              </div>

              {/* All Stage Status Summary - Balanced Compact Version */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-2">
                  All Production Stages
                </h4>
                <div className="overflow-x-auto pb-2 -mx-4 px-4">
                  <div className="flex space-x-1.5 min-w-max">
                    {stages.map((stage) => {
                      const stageInfo = record[stage.key];
                      const progress = Math.min(
                        100,
                        (stageInfo.quantity / stageInfo.planned) * 100
                      );

                      return (
                        <div
                          key={stage.key}
                          className="shrink-0 w-20 bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm"
                        >
                          {/* Stage Icon and Name */}
                          <div className="flex items-center gap-1 mb-1">
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center ${stage.color}`}
                            >
                              {React.cloneElement(stage.icon, {
                                className: "w-3 h-3",
                              })}
                            </div>
                            <div className="text-xs font-semibold text-gray-900 truncate flex-1">
                              {stage.shortName}
                            </div>
                          </div>

                          {/* Progress Bar - Compact */}
                          <div className="mb-1">
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div
                                className={`h-1 rounded-full ${
                                  stageInfo.status === "Completed"
                                    ? "bg-green-500"
                                    : stageInfo.status === "In Progress"
                                    ? "bg-blue-500"
                                    : "bg-gray-300"
                                }`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between items-center mt-0.5">
                              <span className="text-[9px] text-gray-600">
                                {Math.round(progress)}%
                              </span>
                              <span className="text-[9px] font-medium text-gray-900">
                                {stageInfo.quantity}
                              </span>
                            </div>
                          </div>

                          {/* Status Indicator */}
                          <div
                            className={`text-[9px] text-center px-1 py-0.5 rounded ${
                              stageInfo.status === "Completed"
                                ? "bg-green-100 text-green-800"
                                : stageInfo.status === "In Progress"
                                ? "bg-blue-100 text-blue-800"
                                : stageInfo.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : stageInfo.status === "Approved"
                                ? "bg-green-100 text-green-800"
                                : stageInfo.status === "Rejected"
                                ? "bg-red-100 text-red-800"
                                : stageInfo.status === "Ready"
                                ? "bg-blue-100 text-blue-800"
                                : stageInfo.status === "Dispatched"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {stageInfo.status === "Completed"
                              ? "✓"
                              : stageInfo.status === "In Progress"
                              ? "⟳"
                              : stageInfo.status === "Pending"
                              ? "⋯"
                              : stageInfo.status === "Approved"
                              ? "✓"
                              : stageInfo.status === "Rejected"
                              ? "✗"
                              : stageInfo.status === "Ready"
                              ? "✓"
                              : stageInfo.status === "Dispatched"
                              ? "✓"
                              : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setSelectedProductionRecord(record)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Button>
                <Button
                  size="sm"
                  className="w-full text-xs bg-[#0c9dcb] hover:bg-[#0a87a5]"
                  onClick={() => {
                    setSelectedProductForCutting({
                      id: record.id,
                      productName: record.articleName,
                      productionId: record.productionId,
                      targetQuantity: stageData.planned,
                      brand: record.brand,
                      category: record.category,
                    });
                    setItemCuttingDialogOpen(true);
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Update {getCurrentStageName()}
                </Button>
              </div>
            </div>
          )}

          {/* Footer - Always visible quick actions */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {isExpanded ? "Click to collapse ↑" : "Click to expand ↓"}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setSelectedProductionRecord(record)}
                  title="View Details"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    setSelectedProductForCutting({
                      id: record.id,
                      productName: record.articleName,
                      productionId: record.productionId,
                      targetQuantity: stageData.planned,
                      brand: record.brand,
                      category: record.category,
                    });
                    setItemCuttingDialogOpen(true);
                  }}
                  title="Update Production"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
            {getCurrentStageName()} Production Tracking
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Monitor {getCurrentStageName().toLowerCase()} production progress
            across all manufacturing orders
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#0c9dcb]"></div>
                <span>Loading...</span>
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-3 h-3" />
                <span>Error: {error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={fetchTrackingData}
                  title="Retry"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <span>
                Showing {filteredData.length} of {baseProductionData.length}{" "}
                records
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={fetchTrackingData}
              title="Refresh data"
            >
              <RefreshCw
                className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* <PDFExportButton
            data={baseProductionData}
            selectedDepartment={selectedDepartment}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            departmentName={getCurrentStageName()}
            monthName={getMonthName(selectedMonth)}
          />

          <AdvancedPDFExport
            data={baseProductionData}
            selectedDepartment={selectedDepartment}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            departmentName={getCurrentStageName()}
            monthName={getMonthName(selectedMonth)}
            dailyTotals={dailyTotals}
            weekData={weekData}
          /> */}
          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            {isMobile ? "Export" : "Export PDF"}
          </Button>
        </div>
      </div>

      {/* Process Flow Tabs - Always show these even if no data */}
      <Card className="border-0 shadow-lg bg-linear-to-r from-gray-50 to-gray-100">
        <CardContent className="p-3 sm:p-6">
          <div className="flex items-center justify-center overflow-x-auto pb-2">
            <div className="flex items-center min-w-max">
              {stages.map((stage, index) => (
                <div key={stage.key} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleDepartmentChange(stage.department)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border-2 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 hover:scale-105 ${
                        selectedDepartment === stage.department
                          ? "bg-[#0c9dcb] border-[#0c9dcb] text-white shadow-lg"
                          : `bg-white border-gray-300 ${stage.color} hover:border-[#0c9dcb]`
                      }`}
                    >
                      {stage.icon}
                    </button>
                    <span
                      className={`text-xs font-medium mt-1 sm:mt-2 text-center transition-colors duration-200 ${
                        selectedDepartment === stage.department
                          ? "text-[#0c9dcb] font-semibold"
                          : "text-gray-700"
                      }`}
                    >
                      {isMobile ? stage.shortName : stage.name}
                    </span>
                  </div>
                  {index < stages.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 sm:mx-2 md:mx-3 w-4 sm:w-6 md:w-8 transition-colors duration-200 ${
                        selectedDepartment === stage.department ||
                        index <
                          stages.findIndex(
                            (s) => s.department === selectedDepartment
                          )
                          ? "bg-[#0c9dcb]"
                          : "bg-gray-300"
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters - Always show these even if no data */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search articles, PO, brand, color..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
            <div className="grid grid-cols-2 sm:flex gap-3">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-[140px] text-sm">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem
                      key={i + 1}
                      value={(i + 1).toString().padStart(2, "0")}
                    >
                      {getMonthName((i + 1).toString().padStart(2, "0"))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full sm:w-[120px] text-sm">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!isMobile && (
              <div className="text-sm text-gray-600">
                {loading
                  ? "Loading..."
                  : filteredData.length === 0
                  ? "No data found"
                  : `Showing ${filteredData.length} of ${baseProductionData.length} results`}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area - Shows empty state only in content area */}
      {!isMobile ? (
        <Card className="shadow-sm border border-gray-200">
          {loading ? (
            <div className="py-12">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0c9dcb] mb-4"></div>
                <p className="text-gray-600">Loading production data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="py-12">
              <div className="flex flex-col items-center justify-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Error Loading Data
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button
                  onClick={fetchTrackingData}
                  className="bg-[#0c9dcb] hover:bg-[#0a87a5]"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="py-12">
              <EmptyState />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left font-medium text-gray-900 sticky left-0 bg-gray-50 z-20 border-r border-gray-200 shadow-sm min-w-[260px]">
                        <button
                          onClick={() => handleSort("articleName")}
                          className="flex items-center gap-1 hover:text-gray-700 text-sm"
                        >
                          Product Details
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900 text-sm min-w-[140px]">
                        PO Info
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900 text-sm min-w-[120px]">
                        MNFC
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900 text-sm min-w-[110px]">
                        {getCurrentStageName()} Status
                      </th>
                      {/* Dynamic Week Headers */}
                      {weekData.map((week, index) => (
                        <React.Fragment key={`week-${week.weekNumber}`}>
                          <th
                            className="px-2 py-3 text-center font-medium text-gray-900 border-l border-gray-200 text-xs"
                            colSpan={week.days.length}
                          >
                            {week.label}
                          </th>
                          <th className="px-3 py-3 text-center font-medium text-gray-900 bg-green-50 border border-green-200 text-xs min-w-[45px]">
                            W{week.weekNumber} Total
                          </th>
                        </React.Fragment>
                      ))}
                      <th className="px-3 py-3 text-center font-medium text-gray-900 bg-blue-50 border border-blue-200 sticky right-0 z-20 shadow-lg text-xs min-w-[45px]">
                        Monthly Total
                      </th>
                    </tr>
                    <tr className="border-b border-gray-200 bg-gray-100">
                      <th className="px-4 py-2 text-xs font-medium text-gray-600 sticky left-0 bg-gray-100 z-20 border-r border-gray-200 shadow-sm"></th>
                      <th className="px-4 py-2 text-xs font-medium text-gray-600"></th>
                      <th className="px-4 py-2 text-xs font-medium text-gray-600"></th>
                      <th className="px-4 py-2 text-xs font-medium text-gray-600"></th>
                      {/* Dynamic Day Headers */}
                      {weekData.map((week) => (
                        <React.Fragment key={`week-days-${week.weekNumber}`}>
                          {week.days.map((day) => (
                            <th
                              key={`w${week.weekNumber}-${day}`}
                              className="px-1.5 py-2 text-xs font-medium text-gray-600 text-center min-w-[30px] border-r border-gray-100"
                            >
                              {day}
                            </th>
                          ))}
                          <th className="px-2 py-2 text-xs font-medium text-green-700 text-center min-w-[45px] bg-green-50 border border-green-200">
                            W{week.weekNumber}
                          </th>
                        </React.Fragment>
                      ))}
                      <th className="px-2 py-2 text-xs font-medium text-blue-700 text-center min-w-[45px] bg-blue-50 border border-blue-200 sticky right-0 z-20 shadow-lg">
                        Month
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Daily Totals Row - At Top */}
                    <tr className="bg-orange-50 border-t-2 border-orange-200">
                      <td className="px-4 py-2.5 sticky left-0 bg-orange-50 z-10 border-r border-gray-200 font-semibold text-orange-800 shadow-sm text-sm">
                        Daily Totals
                      </td>
                      <td className="px-4 py-2.5"></td>
                      <td className="px-4 py-2.5"></td>
                      <td className="px-4 py-2.5 border-r border-gray-200"></td>

                      {/* Dynamic Daily Totals */}
                      {weekData.map((week) => (
                        <React.Fragment key={`totals-week-${week.weekNumber}`}>
                          {week.days.map((day) => {
                            const year = parseInt(selectedYear);
                            const month = parseInt(selectedMonth);
                            const dateKey = `${year}-${month
                              .toString()
                              .padStart(2, "0")}-${day
                              .toString()
                              .padStart(2, "0")}`;
                            const dailyTotal = dailyTotals[dateKey] || 0;

                            return (
                              <td
                                key={`total-w${week.weekNumber}-${day}`}
                                className="px-1.5 py-2.5 text-center border-r border-gray-100 bg-orange-50"
                              >
                                {dailyTotal > 0 ? (
                                  <span className="text-orange-800 font-semibold text-xs">
                                    {dailyTotal}
                                  </span>
                                ) : (
                                  <span className="text-orange-400 text-xs">
                                    -
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          {/* Week Total */}
                          <td className="px-2 py-2.5 text-center bg-green-50 border border-green-200">
                            <span className="text-green-800 font-semibold text-xs">
                              {week.days.reduce((sum, day) => {
                                const year = parseInt(selectedYear);
                                const month = parseInt(selectedMonth);
                                const dateKey = `${year}-${month
                                  .toString()
                                  .padStart(2, "0")}-${day
                                  .toString()
                                  .padStart(2, "0")}`;
                                return sum + (dailyTotals[dateKey] || 0);
                              }, 0)}
                            </span>
                          </td>
                        </React.Fragment>
                      ))}
                      {/* Monthly Total */}
                      <td className="px-2 py-2.5 text-center bg-blue-50 border border-blue-200 sticky right-0 z-10 shadow-lg">
                        <span className="text-blue-800 font-bold text-xs">
                          {Object.values(dailyTotals).reduce(
                            (sum, total) => sum + total,
                            0
                          )}
                        </span>
                      </td>
                    </tr>

                    {filteredData.map(({ record, dailyProduction }) => {
                      const weekTotals = getWeeklyTotalsFromAPI(record);
                      const monthlyTotal = record.summary?.monthTotal || 0;
                      const stageData =
                        record[selectedDepartment as ProductionStage];

                      return (
                        <tr key={record.id} className="hover:bg-gray-50 group">
                          {/* Product Details - Sticky Column */}
                          <td
                            className="px-4 py-2.5 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-200 shadow-sm cursor-pointer hover:bg-blue-50 transition-colors duration-200"
                            onClick={() => setSelectedProductionRecord(record)}
                          >
                            <div className="min-w-[260px]">
                              <div className="font-medium text-gray-900 text-sm">
                                {record.articleName}
                              </div>
                              <div className="text-xs text-gray-600 mt-0.5">
                                {record.brand} • {record.category}
                              </div>
                              <div className="text-xs text-gray-500">
                                {record.type} • {record.gender}
                              </div>
                              <div className="text-xs text-[#0c9dcb] font-medium mt-1 bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                                {record.productionId}
                              </div>
                            </div>
                          </td>

                          {/* PO Info */}
                          <td className="px-4 py-2.5">
                            <div className="min-w-[140px]">
                              <div className="font-medium text-gray-900 text-sm">
                                {record.poNumber}
                              </div>
                              <div className="text-xs text-gray-600 mt-0.5">
                                {record.poItems} Qty.
                              </div>
                              <div className="text-xs text-blue-600 font-semibold mt-0.5">
                                {calculateProductionCards(record.id)} cards
                              </div>
                              <div className="text-xs text-gray-500">
                                {getMonthName(selectedMonth)} {selectedYear}
                              </div>
                            </div>
                          </td>

                          {/* MNFC (Manufacturing Company) */}
                          <td className="px-4 py-2.5">
                            <div className="min-w-[120px]">
                              <div className="font-medium text-gray-900 text-sm">
                                {record.manufacturingCompany}
                              </div>
                              <div className="text-xs text-gray-600 mt-0.5">
                                Manufacturing
                              </div>
                              <div className="text-xs text-gray-500">
                                {record.country}
                              </div>
                            </div>
                          </td>

                          {/* Stage Status */}
                          <td className="px-4 py-2.5 border-r border-gray-200">
                            <div className="min-w-[110px]">
                              <div className="mb-1">
                                {getStatusBadge(
                                  stageData.status,
                                  selectedDepartment === "upperREJ"
                                    ? "upperREJ"
                                    : selectedDepartment === "rfd"
                                    ? "rfd"
                                    : "production"
                                )}
                              </div>
                              <div className="text-xs text-gray-600">
                                {stageData.quantity}/{record.poItems} Qty
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div
                                  className="bg-[#0c9dcb] h-1.5 rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (stageData.quantity / record.poItems) *
                                        100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </td>

                          {/* Dynamic Daily Data */}
                          {weekData.map((week, weekIndex) => (
                            <React.Fragment
                              key={`week-data-${week.weekNumber}`}
                            >
                              {week.days.map((day) => {
                                const year = parseInt(selectedYear);
                                const month = parseInt(selectedMonth);
                                const dateKey = `${year}-${month
                                  .toString()
                                  .padStart(2, "0")}-${day
                                  .toString()
                                  .padStart(2, "0")}`;
                                const quantity = dailyProduction[dateKey] || 0;

                                return (
                                  <td
                                    key={`w${week.weekNumber}-${day}`}
                                    className="px-1.5 py-2.5 text-center border-r border-gray-100"
                                  >
                                    <div className="min-w-[25px]">
                                      {quantity > 0 ? (
                                        <span className="text-gray-900 font-medium text-xs">
                                          {quantity}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 text-xs">
                                          -
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                              {/* Week Total */}
                              <td className="px-2 py-2.5 text-center bg-green-50 border border-green-200">
                                <span className="text-green-800 font-semibold text-xs">
                                  {weekTotals[weekIndex]}
                                </span>
                              </td>
                            </React.Fragment>
                          ))}

                          {/* Monthly Total */}
                          <td className="px-2 py-2.5 text-center bg-blue-50 border border-blue-200 sticky right-0 z-10 shadow-lg">
                            <span className="text-blue-800 font-bold text-xs">
                              {monthlyTotal}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-white">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">{filteredData.length}</span>{" "}
                    of{" "}
                    <span className="font-medium">{filteredData.length}</span>{" "}
                    results for {getCurrentStageName()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="text-gray-400"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        className="bg-[#0c9dcb] text-white hover:bg-[#0a87a5]"
                      >
                        1
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="text-gray-400"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      ) : (
        /* Mobile View */
        <>
          {loading ? (
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0c9dcb] mb-4"></div>
                  <p className="text-gray-600">Loading production data...</p>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center">
                  <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Error Loading Data
                  </h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button
                    onClick={fetchTrackingData}
                    className="bg-[#0c9dcb] hover:bg-[#0a87a5]"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : filteredData.length === 0 ? (
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="py-12">
                <EmptyState />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Mobile Header Summary */}
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-700">
                  {filteredData.length} Products
                </div>
                <div className="text-xs text-gray-500">
                  {getCurrentStageName()} • {getMonthName(selectedMonth)}{" "}
                  {selectedYear}
                </div>
              </div>

              {/* Mobile Cards */}
              {filteredData.map(({ record, dailyProduction }, index) => (
                <MobileProductionCard
                  key={record.id}
                  record={record}
                  dailyProduction={dailyProduction}
                  index={index}
                />
              ))}

              {/* Mobile Pagination */}
              <div className="flex justify-center items-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="text-gray-400"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  className="bg-[#0c9dcb] text-white hover:bg-[#0a87a5]"
                >
                  1
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="text-gray-400"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Stage Update Dialog */}
      <Dialog
        open={stageUpdateDialogOpen}
        onOpenChange={setStageUpdateDialogOpen}
      >
        <DialogContent className="max-w-[95vw]! w-[95vw]! sm:max-w-[85vw]! sm:w-[85vw]! max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col">
          <div className="sticky top-0 z-50 px-4 sm:px-8 py-4 sm:py-6 bg-linear-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 sm:gap-6">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-linear-to-br from-[#0c9dcb] to-[#26b4e0] rounded-lg sm:rounded-xl flex items-center justify-center shadow-md sm:shadow-lg shrink-0">
                  {stages.find((s) => s.department === selectedDepartment)
                    ?.icon || <Edit className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-1 sm:mb-2">
                    Update {getCurrentStageName()} Production
                  </DialogTitle>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <span className="text-sm sm:text-lg text-gray-600">
                      Date: {new Date(selectedDate).toLocaleDateString("en-GB")}
                    </span>
                    <Badge className="bg-[#0c9dcb] text-white text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1">
                      {getCurrentStageName()} Stage
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                <Button
                  onClick={handleBatchUpdate}
                  className="bg-green-500 hover:bg-green-600 text-xs sm:text-sm px-3 sm:px-4"
                  size={isMobile ? "sm" : "default"}
                >
                  <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  {isMobile ? "Save" : "Save Updates"}
                </Button>
                <Button
                  onClick={() => setStageUpdateDialogOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 sm:h-10 sm:w-10 p-0 hover:bg-gray-100 rounded-full cursor-pointer flex items-center justify-center"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 hover:text-gray-700" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="px-4 sm:px-8 py-4 sm:py-8 space-y-4 sm:space-y-8">
              {/* Search and Date Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search products..."
                    value={stageUpdateSearchTerm}
                    onChange={(e) => setStageUpdateSearchTerm(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Products List for Update */}
              <div className="space-y-4 sm:space-y-6">
                <Tabs defaultValue="item-details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                    <TabsTrigger
                      value="item-details"
                      className="text-xs sm:text-sm"
                    >
                      Update Items
                    </TabsTrigger>
                    <TabsTrigger value="history" className="text-xs sm:text-sm">
                      History
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="item-details" className="mt-4 sm:mt-6">
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {filteredProductsForUpdate.map((record) => {
                        const stageData =
                          record[selectedDepartment as ProductionStage];
                        const currentEntry = updateEntries[record.id] || {
                          quantity: 0,
                          remarks: "",
                        };

                        return (
                          <div
                            key={record.id}
                            onClick={() => {
                              setSelectedProductForCutting({
                                id: record.id,
                                productName: record.articleName,
                                productionId: record.productionId,
                                targetQuantity: stageData.planned,
                                brand: record.brand,
                                category: record.category,
                              });
                              setItemCuttingDialogOpen(true);
                            }}
                            className="bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-gray-300 transition-all"
                          >
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                              {/* Product Info */}
                              <div className="lg:col-span-4">
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden shrink-0">
                                    <img
                                      src="https://images.unsplash.com/photo-1648501570189-0359dab185e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzbmVha2VyJTIwc2hvZSUyMHByb2R1Y3R8ZW58MXx8fHwxNzU2NzM1OTMwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                                      alt={record.articleName}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                      {record.articleName}
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-500 truncate">
                                      {record.brand} • {record.category}
                                    </div>
                                    <div className="text-xs text-[#0c9dcb] font-mono truncate">
                                      {record.productionId}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Current Stage Status */}
                              <div className="lg:col-span-3">
                                <div className="text-xs sm:text-sm text-gray-600 mb-1">
                                  Current Status
                                </div>
                                <div className="space-y-1">
                                  {getStatusBadge(
                                    stageData.status,
                                    selectedDepartment === "upperREJ"
                                      ? "upperREJ"
                                      : selectedDepartment === "rfd"
                                      ? "rfd"
                                      : "production"
                                  )}
                                  <div className="text-xs text-gray-500">
                                    {stageData.quantity} / {stageData.planned}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Remaining:{" "}
                                    {stageData.planned - stageData.quantity}
                                  </div>
                                </div>
                              </div>

                              {/* Actions Column */}
                              <div className="lg:col-span-3 space-y-2 sm:space-y-3"></div>
                            </div>

                            {/* Advancement Confirmation */}
                            {currentEntry.advanceTo && (
                              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-linear-to-r from-emerald-50 to-teal-50 rounded-lg border-2 border-emerald-300">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                                      <Workflow className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-xs sm:text-sm font-semibold text-emerald-900">
                                        Advance to:{" "}
                                        <span className="capitalize">
                                          {currentEntry.advanceTo}
                                        </span>
                                      </div>
                                      <div className="text-xs text-emerald-700">
                                        Move to next production stage
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 sm:h-8 px-3 sm:px-4 shadow-sm text-xs"
                                    onClick={() => {
                                      toast.success(
                                        `${record.articleName} will advance to ${currentEntry.advanceTo}!`
                                      );
                                    }}
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1.5" />
                                    Confirm
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Progress Indicator */}
                            {currentEntry.quantity > 0 && (
                              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-linear-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 text-xs sm:text-sm">
                                  <span className="text-green-700 font-medium">
                                    +{currentEntry.quantity} units
                                  </span>
                                  <span className="text-green-600 font-semibold">
                                    New:{" "}
                                    {stageData.quantity + currentEntry.quantity}{" "}
                                    / {stageData.planned}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* No Products Found */}
                      {filteredProductsForUpdate.length === 0 && (
                        <div className="text-center py-8 sm:py-12">
                          <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4" />
                          <div className="text-base sm:text-lg font-medium text-gray-500 mb-1 sm:mb-2">
                            No Products Found
                          </div>
                          <div className="text-xs sm:text-sm text-gray-400">
                            Adjust your search terms to find products
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="mt-4 sm:mt-6">
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                              Product Name
                            </th>
                            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                              Product Code
                            </th>
                            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {/* Mock history data */}
                          {[
                            {
                              productName: "Premium Running Shoe - Blue",
                              productCode: "PROD-001",
                              quantity: 150,
                              date: "2025-10-11",
                            },
                            {
                              productName: "Classic Leather Boot - Brown",
                              productCode: "PROD-002",
                              quantity: 200,
                              date: "2025-10-11",
                            },
                            {
                              productName: "Sports Sneaker - White",
                              productCode: "PROD-003",
                              quantity: 175,
                              date: "2025-10-10",
                            },
                          ].map((historyItem, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                                  {historyItem.productName}
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                <div className="text-gray-900">
                                  {historyItem.productCode}
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {historyItem.quantity} units
                                  </div>
                                  <div className="text-gray-500 text-xs">
                                    {new Date(
                                      historyItem.date
                                    ).toLocaleDateString("en-GB")}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Summary Card */}
              {Object.values(updateEntries).some(
                (entry) => entry.quantity > 0
              ) && (
                <div className="bg-white border-2 border-green-200 rounded-xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                        Update Summary
                      </div>
                      <div className="text-sm text-gray-600">
                        {
                          Object.values(updateEntries).filter(
                            (entry) => entry.quantity > 0
                          ).length
                        }{" "}
                        product(s) to update
                      </div>
                      <div className="text-sm text-gray-600">
                        Total:{" "}
                        {Object.values(updateEntries).reduce(
                          (sum, entry) => sum + entry.quantity,
                          0
                        )}{" "}
                        units
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setUpdateEntries({})}
                        variant="outline"
                        size={isMobile ? "sm" : "default"}
                        className="text-xs sm:text-sm"
                      >
                        <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Clear
                      </Button>
                      <Button
                        onClick={handleBatchUpdate}
                        className="bg-green-500 hover:bg-green-600 text-xs sm:text-sm"
                        size={isMobile ? "sm" : "default"}
                      >
                        <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Confirm
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Production Detail Dialog */}
      <Dialog
        open={!!selectedProductionRecord}
        onOpenChange={() => setSelectedProductionRecord(null)}
      >
        <DialogContent className="!max-w-[95vw] !w-[95vw] sm:!max-w-[90vw] sm:!w-[90vw] max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col">
          {selectedProductionRecord && (
            <>
              {/* Sticky Header Section */}
              <div className="sticky top-0 z-50 px-4 sm:px-8 py-4 sm:py-6 bg-linear-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 sm:gap-6">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-linear-to-br from-[#0c9dcb] to-[#26b4e0] rounded-lg sm:rounded-xl flex items-center justify-center shadow-md sm:shadow-lg shrink-0">
                      <Package className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-1 sm:mb-2">
                        Production Details
                      </DialogTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm sm:text-lg text-gray-600 truncate">
                          {selectedProductionRecord.productionId}
                        </span>
                        <Badge className="bg-[#0c9dcb] text-white text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 truncate">
                          {selectedProductionRecord.articleName}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                    <Button
                      className="bg-blue-500 hover:bg-blue-600 text-xs sm:text-sm px-2 sm:px-4"
                      size={isMobile ? "sm" : "default"}
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      {isMobile ? "Edit" : "Edit Production"}
                    </Button>
                    <Button
                      variant="outline"
                      size={isMobile ? "sm" : "default"}
                      className="text-xs sm:text-sm"
                    >
                      <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      {isMobile ? "Comments" : "Comments"}
                    </Button>
                    <Button
                      onClick={() => setSelectedProductionRecord(null)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 sm:h-10 sm:w-10 p-0 hover:bg-gray-100 rounded-full cursor-pointer flex items-center justify-center"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 hover:text-gray-700" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Scrollable Main Content */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="px-4 sm:px-8 py-4 sm:py-8 space-y-6 sm:space-y-10">
                  {/* Production Progress Overview */}
                  <div className="space-y-3 sm:space-y-5">
                    <div className="flex items-center gap-3 sm:gap-5">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md shrink-0">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Production Progress Overview
                      </h3>
                    </div>

                    <div className="bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                        {/* Overall Progress */}
                        <div>
                          <div className="mb-4 sm:mb-6">
                            <div className="flex justify-between items-center mb-1 sm:mb-2">
                              <span className="text-xs sm:text-sm font-medium text-gray-600">
                                Overall Progress
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-gray-900">
                                {Math.round(
                                  (stages.filter(
                                    (stage) =>
                                      selectedProductionRecord[stage.key]
                                        .status === "Completed"
                                  ).length /
                                    7) *
                                    100
                                )}
                                %
                              </span>
                            </div>
                            <Progress
                              value={Math.round(
                                (stages.filter(
                                  (stage) =>
                                    selectedProductionRecord[stage.key]
                                      .status === "Completed"
                                ).length /
                                  7) *
                                  100
                              )}
                              className="h-2 sm:h-3"
                            />
                          </div>

                          {/* Monthly Plan Analysis */}
                          <div className="grid grid-cols-2 gap-2 sm:gap-4">
                            <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                              <div className="text-lg sm:text-2xl font-bold text-green-600">
                                {selectedProductionRecord.poItems}
                              </div>
                              <div className="text-xs sm:text-sm text-green-700">
                                Total Cards Items
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Stage Progress Grid */}
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 sm:gap-2">
                          {stages.map((stage, index) => {
                            const stageData =
                              selectedProductionRecord[stage.key];
                            const progress =
                              (stageData.quantity / stageData.planned) * 100;
                            const isCompleted =
                              stageData.status === "Completed";
                            const inProgress =
                              stageData.status === "In Progress";

                            return (
                              <div
                                key={stage.key}
                                className={`text-center p-2 sm:p-3 rounded-lg border-2 transition-all ${
                                  isCompleted
                                    ? "bg-green-50 border-green-200"
                                    : inProgress
                                    ? "bg-blue-50 border-blue-200"
                                    : "bg-gray-50 border-gray-200"
                                }`}
                              >
                                <div
                                  className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 rounded-full flex items-center justify-center text-xs ${
                                    isCompleted
                                      ? "bg-green-500 text-white"
                                      : inProgress
                                      ? "bg-blue-500 text-white"
                                      : "bg-gray-300 text-gray-600"
                                  }`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                  ) : (
                                    stage.icon
                                  )}
                                </div>
                                <div className="text-xs font-medium text-gray-700 mb-0.5 sm:mb-1">
                                  {isMobile ? stage.shortName : stage.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {Math.round(progress)}%
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Information and Manufacturing Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                    {/* Product & R&D Information */}
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex items-center gap-3 sm:gap-5">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md shrink-0">
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                          Product Information
                        </h3>
                      </div>

                      <div className="bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
                        {/* Product Image Preview */}
                        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm shrink-0">
                              <img
                                src="https://images.unsplash.com/photo-1648501570189-0359dab185e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzbmVha2VyJTIwc2hvZSUyMHByb2R1Y3R8ZW58MXx8fHwxNzU2NzM1OTMwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                                alt={selectedProductionRecord.articleName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm sm:text-base font-medium text-gray-900 truncate">
                                {selectedProductionRecord.articleName}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500 mt-1">
                                Production Sample
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gray-400 shrink-0"></div>
                                <span className="text-xs text-gray-400 truncate">
                                  {selectedProductionRecord.color}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                          <div>
                            <div className="text-xs sm:text-sm font-medium text-gray-600">
                              Production ID
                            </div>
                            <div className="mt-0.5 sm:mt-1 text-sm sm:text-base font-mono font-bold text-gray-900 truncate">
                              {selectedProductionRecord.productionId}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs sm:text-sm font-medium text-gray-600">
                              Brand & Category
                            </div>
                            <div className="mt-0.5 sm:mt-1">
                              <div className="text-sm sm:text-base font-medium text-gray-900">
                                {selectedProductionRecord.brand}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500">
                                {selectedProductionRecord.category} •{" "}
                                {selectedProductionRecord.type}
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="text-xs sm:text-sm font-medium text-gray-600">
                              Specifications
                            </div>
                            <div className="mt-0.5 sm:mt-1">
                              <div className="text-sm sm:text-base font-medium text-gray-900">
                                {selectedProductionRecord.gender} •{" "}
                                {selectedProductionRecord.size}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500">
                                {selectedProductionRecord.color}
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="text-xs sm:text-sm font-medium text-gray-600">
                              Manufacturing Location
                            </div>
                            <div className="mt-0.5 sm:mt-1 text-sm sm:text-base text-gray-900">
                              {selectedProductionRecord.country}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Manufacturing & PO Details */}
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex items-center gap-3 sm:gap-5">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md shrink-0">
                          <Building className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                          Manufacturing Details
                        </h3>
                      </div>

                      <div className="bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-gray-600">
                            Manufacturing Company
                          </div>
                          <div className="mt-0.5 sm:mt-1">
                            <div className="text-base sm:text-lg font-semibold text-gray-900">
                              {selectedProductionRecord.manufacturingCompany}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">
                              Primary Manufacturing Partner
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <div className="text-xs sm:text-sm font-medium text-gray-600">
                            Purchase Order Information
                          </div>
                          <div className="mt-0.5 sm:mt-1">
                            <div className="text-sm sm:text-base font-medium text-gray-900">
                              {selectedProductionRecord.poNumber}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">
                              {selectedProductionRecord.poQuantity} units ordered
                            </div>
                          </div>
                        </div>

                      </div>
                      <div className="bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
  <div>
    <div className="text-xs sm:text-sm font-medium text-gray-600">
      Select Tracking Card
    </div>

    <Select
      value={selectedCardId}
      onValueChange={setSelectedCardId}
      disabled={loadingCards}
    >
      <SelectTrigger className="mt-1">
        <SelectValue
          placeholder={loadingCards ? "Loading cards..." : "Select card"}
        />
      </SelectTrigger>

      <SelectContent>
        {trackingCards.length === 0 && (
          <SelectItem value="no-card" disabled>
            No tracking cards found
          </SelectItem>
        )}

        {trackingCards.map((card) => (
          <SelectItem key={card._id} value={card._id}>
            {card.cardNumber}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    {selectedCardId && (
      <div className="text-xs text-gray-500 mt-2">
        Selected Card ID: {selectedCardId}
      </div>
    )}
  </div>
</div>

                    </div>
                  </div>

                  {/* Stage-by-Stage Production Progress */}
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-3 sm:gap-5">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md shrink-0">
                        <Workflow className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Stage Progress (Click to Update)
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                      {stages.map((stage) => {
                        const stageData = selectedProductionRecord[stage.key];
                        
const plannedQty = selectedCard
  ? selectedCard.cardQuantity
  : stageData.planned;
const progress =
  plannedQty > 0
    ? (stageData.quantity / plannedQty) * 100
    : 0;

const remaining = plannedQty - stageData.quantity;

                        return (
                          <div
                            key={stage.key}
                            className="bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-5 hover:border-[#0c9dcb] hover:shadow-md transition-all duration-200 cursor-pointer group"
                            onClick={() => {
  if (!ensureSelectedCard()) return;

  setSelectedDepartment(stage.department);

  setSelectedProductForCutting({
    // 🔥 CARD DATA
    cardId: selectedCard._id,
    cardNumber: selectedCard.cardNumber,
    cardQuantity: selectedCard.cardQuantity,
    assignedPlant: selectedCard.assignedPlant,

    // PROJECT INFO
    projectId: selectedProductionRecord.projectId,
    productName: selectedProductionRecord.articleName,
    productionId: selectedProductionRecord.productionId,
    brand: selectedProductionRecord.brand,
    category: selectedProductionRecord.category,
    color: selectedProductionRecord.color,
    size: selectedProductionRecord.size,
    poNumber: selectedProductionRecord.poNumber,
    manufacturingCompany:
      selectedProductionRecord.manufacturingCompany,
    country: selectedProductionRecord.country,

    // STAGE INFO
    stage: stage.key,
    stageName: stage.name,
    stageStatus: stageData.status,

    // CARD QUANTITY
    targetQuantity: selectedCard.cardQuantity,
    currentQuantity: stageData.quantity || 0,
    remainingQuantity:
      selectedCard.cardQuantity - (stageData.quantity || 0),
  });

  setSelectedProductionRecord(null);
  setItemCuttingDialogOpen(true);

  toast.success(
    `Opening ${stage.name} update for card ${selectedCard.cardNumber}`
  );
}}

                          >
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div
                                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center group-hover:bg-[#0c9dcb] group-hover:text-white transition-colors ${
                                    stageData.status === "Completed"
                                      ? "bg-green-100 text-green-600"
                                      : stageData.status === "In Progress"
                                      ? "bg-blue-100 text-blue-600"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {stage.icon}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 text-sm sm:text-base group-hover:text-[#0c9dcb]">
                                    {isMobile ? stage.shortName : stage.name}
                                  </div>
                                  <div className="text-xs text-gray-500 group-hover:text-[#0a87a5]">
                                    {stageData.status}
                                  </div>
                                </div>
                              </div>
                              {getStatusBadge(
                                stageData.status,
                                stage.key === "upperREJ"
                                  ? "upperREJ"
                                  : stage.key === "rfd"
                                  ? "rfd"
                                  : "production"
                              )}
                            </div>

                            <div className="space-y-2 sm:space-y-3">
                              <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-gray-600 group-hover:text-gray-800">
                                  Progress
                                </span>
                                <span className="font-medium group-hover:text-[#0c9dcb]">
                                  {Math.round(progress)}%
                                </span>
                              </div>
                              <Progress
                                value={progress}
                                className="h-1.5 sm:h-2 group-hover:h-2.5 transition-all"
                              />

                              <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                                <div>
                                  <div className="text-gray-600 group-hover:text-gray-800">
                                    Completed
                                  </div>
                                  <div className="font-medium text-green-600 group-hover:text-green-700">
                                    {stageData.quantity}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-600 group-hover:text-gray-800">
                                    Planned
                                  </div>
                                  <div className="font-medium group-hover:text-[#0c9dcb]">
  {plannedQty}
</div>

                                </div>
                                <div>
                                  <div className="text-gray-600 group-hover:text-gray-800">
                                    Remaining
                                  </div>
                                  <div className="font-medium text-orange-600 group-hover:text-orange-700">
                                    {remaining}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-600 group-hover:text-gray-800">
                                    Rate
                                  </div>
                                  <div className="font-medium group-hover:text-[#0c9dcb]">
                                    {Math.round(progress)}%
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Click hint */}
                            <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100 group-hover:border-[#0c9dcb]/30">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 group-hover:text-[#0c9dcb]">
                                  Click to update {stage.name.toLowerCase()}
                                </span>
                                <Edit className="w-3 h-3 text-gray-400 group-hover:text-[#0c9dcb]" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Actions Footer */}
                    <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-200">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                            Quick Update Actions
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Click any stage card above to update directly
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              setSelectedProductionRecord(null);
                              setStageUpdateDialogOpen(true);
                            }}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Bulk Update
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Item Cutting Dialog */}
      <ItemCuttingDialog
        open={itemCuttingDialogOpen}
        onOpenChange={setItemCuttingDialogOpen}
        productData={selectedProductForCutting}
        stage={selectedDepartment as ProductionStage}
      />
    </div>
  );
}
