import React from "react";
import {
  Search,
  Bell,
  User,
  ChevronDown,
  LayoutDashboard,
  Tags,
  Lightbulb,
  ImageIcon,
  Workflow,
  Factory,
  Package,
  Users,
  BellIcon,
  BarChart3,
  Grid,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  Eye,
  MoreHorizontal,
  Truck,
  LogOut,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";
import { useAuth } from "../lib/AuthContext";

interface HeaderBarProps {
  currentModule: string;
}

interface Notification {
  id: number;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  time: string;
  user: string;
  unread: boolean;
}

interface ModuleInfo {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

export function HeaderBar({
  currentModule,
}: HeaderBarProps): React.JSX.Element {
  const { user, logout } = useAuth();

  // Sample notifications data
  const notifications: Notification[] = [
    {
      id: 1,
      type: "success",
      title: "Project RND0128 Approved",
      message: "Green seal approved for Bacca Bucci Sports Collection",
      time: "2 minutes ago",
      user: "QC Manager",
      unread: true,
    },
    {
      id: 2,
      type: "warning",
      title: "Cost Variance Alert",
      message: "Project RND0125 exceeded budget by 12%",
      time: "15 minutes ago",
      user: "Finance Manager",
      unread: true,
    },
    {
      id: 3,
      type: "info",
      title: "New Prototype Uploaded",
      message: "Lifestyle Brand Summer Collection - 5 new designs",
      time: "1 hour ago",
      user: "Designer A",
      unread: false,
    },
    {
      id: 4,
      type: "success",
      title: "Production Order Completed",
      message: "PO-2024-001 finished production (2,500 units)",
      time: "2 hours ago",
      user: "Plant Manager",
      unread: false,
    },
    {
      id: 5,
      type: "error",
      title: "System Alert",
      message: "Database backup failed - requires immediate attention",
      time: "3 hours ago",
      user: "System Admin",
      unread: true,
    },
    {
      id: 6,
      type: "info",
      title: "Vendor Registration",
      message: 'New supplier "Premium Materials Ltd" approved',
      time: "4 hours ago",
      user: "Procurement Head",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  const getNotificationIcon = (type: string): React.ReactNode => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "info":
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getNotificationBg = (type: string, unread: boolean): string => {
    if (!unread) return "bg-gray-50";

    switch (type) {
      case "success":
        return "bg-green-50 border-l-4 border-l-green-500";
      case "warning":
        return "bg-yellow-50 border-l-4 border-l-yellow-500";
      case "error":
        return "bg-red-50 border-l-4 border-l-red-500";
      case "info":
      default:
        return "bg-blue-50 border-l-4 border-l-blue-500";
    }
  };

  const markAllAsRead = (): void => {
    toast.success("All notifications marked as read");
  };

  const getModuleInfo = (module: string): ModuleInfo => {
    switch (module) {
      case "dashboard":
        return {
          title: "Dashboard",
          description: "Overview and analytics",
          icon: <LayoutDashboard className="w-5 h-5 text-white" />,
          gradient: "from-[#0c9dcb] to-[#26b4e0]",
        };
      case "master-data":
        return {
          title: "Master Data",
          description: "Reference data management",
          icon: <Tags className="w-5 h-5 text-white" />,
          gradient: "from-[#20c997] to-[#17a2b8]",
        };
      case "rd-management":
        return {
          title: "R&D Management",
          description: "Design lifecycle",
          icon: <Lightbulb className="w-5 h-5 text-white" />,
          gradient: "from-[#0c9dcb] to-[#26b4e0]",
        };
      case "image-document":
        return {
          title: "Document Management",
          description: "Digital asset control",
          icon: <ImageIcon className="w-5 h-5 text-white" />,
          gradient: "from-[#fd7e14] to-[#ffc107]",
        };
      case "workflow-automation":
        return {
          title: "Workflow",
          description: "Process automation",
          icon: <Workflow className="w-5 h-5 text-white" />,
          gradient: "from-[#e83e8c] to-[#dc3545]",
        };
      case "production":
        return {
          title: "Production",
          description: "Manufacturing tracking",
          icon: <Factory className="w-5 h-5 text-white" />,
          gradient: "from-[#6f42c1] to-[#7c3aed]",
        };
      case "inventory":
        return {
          title: "Inventory",
          description: "Storage management",
          icon: <Package className="w-5 h-5 text-white" />,
          gradient: "from-[#198754] to-[#20c997]",
        };
      case "delivery":
        return {
          title: "Delivery",
          description: "Shipments tracking",
          icon: <Truck className="w-5 h-5 text-white" />,
          gradient: "from-[#0d6efd] to-[#6610f2]",
        };
      case "users":
        return {
          title: "User Management",
          description: "Access control",
          icon: <Users className="w-5 h-5 text-white" />,
          gradient: "from-[#6610f2] to-[#6f42c1]",
        };
      case "notifications":
        return {
          title: "Alerts",
          description: "System notifications",
          icon: <BellIcon className="w-5 h-5 text-white" />,
          gradient: "from-[#dc3545] to-[#e83e8c]",
        };
      case "reports":
        return {
          title: "Analytics",
          description: "Business intelligence",
          icon: <BarChart3 className="w-5 h-5 text-white" />,
          gradient: "from-[#0d6efd] to-[#6610f2]",
        };
      case "wireframe":
        return {
          title: "Documentation",
          description: "System overview",
          icon: <Grid className="w-5 h-5 text-white" />,
          gradient: "from-[#495057] to-[#6c757d]",
        };
      default:
        return {
          title: "Dashboard",
          description: "Overview and analytics",
          icon: <LayoutDashboard className="w-5 h-5 text-white" />,
          gradient: "from-[#0c9dcb] to-[#26b4e0]",
        };
    }
  };

  const handleNotificationClick = (): void => {
    toast.success("Opening notifications panel");
  };

  const moduleInfo = getModuleInfo(currentModule);

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-3 md:px-6 py-3 md:py-6">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          {/* Enhanced Module Header - More compact on mobile */}
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            <div
              className={`w-8 h-8 ml-14 sm:ml-0 md:w-12 md:h-12 bg-linear-to-br ${moduleInfo.gradient} rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shrink-0`}
            >
              {moduleInfo.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm md:text-2xl font-bold text-gray-900 mb-0.5 md:mb-1 truncate">
                {moduleInfo.title}
              </h1>
              <p className="text-gray-600 text-xs md:text-sm line-clamp-1">
                {moduleInfo.description}
              </p>
            </div>
          </div>

          {/* Right Side - Search, Notifications and User */}
          <div className="flex items-center gap-2 md:gap-6">
            {/* Mobile Search Toggle */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                className="relative p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Search className="w-4 h-4 text-gray-600" />
              </Button>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:block relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search across all modules..."
                className="pl-10 pr-4 py-2 w-64 lg:w-80 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0c9dcb] focus:border-transparent focus:bg-white transition-all"
              />
            </div>

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative p-1.5 md:p-3 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 h-4 w-4 md:h-5 md:w-5 flex items-center justify-center p-0 text-[10px] md:text-xs font-semibold bg-red-500 hover:bg-red-500"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[calc(100vw-2rem)] md:w-96 p-0 mr-0 md:mr-4"
                align="end"
              >
                <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                  {/* Header */}
                  <div className="px-4 md:px-6 py-3 md:py-4 bg-linear-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="bg-red-100 text-red-700 hover:bg-red-100 text-xs"
                          >
                            {unreadCount} new
                          </Badge>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={markAllAsRead}
                          className="text-xs text-[#0c9dcb] hover:text-[#0c9dcb] hover:bg-blue-50 px-2 py-1 h-auto"
                        >
                          Mark all read
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Notifications List */}
                  <ScrollArea className="h-64 md:h-80">
                    <div className="p-1 md:p-2">
                      {notifications.map((notification, index) => (
                        <div key={notification.id}>
                          <div
                            className={`group p-3 md:p-4 rounded-lg transition-all cursor-pointer hover:shadow-md ${getNotificationBg(
                              notification.type,
                              notification.unread
                            )}`}
                            onClick={() =>
                              toast.info(`Opening ${notification.title}`)
                            }
                          >
                            <div className="flex items-start gap-2 md:gap-3">
                              <div className="shrink-0 mt-0.5">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4
                                    className={`font-medium text-xs md:text-sm ${
                                      notification.unread
                                        ? "text-gray-900"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {notification.title}
                                  </h4>
                                  {notification.unread && (
                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#0c9dcb] rounded-full shrink-0 ml-1 md:ml-2"></div>
                                  )}
                                </div>
                                <p
                                  className={`text-xs md:text-sm mt-0.5 md:mt-1 line-clamp-2 ${
                                    notification.unread
                                      ? "text-gray-700"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-2 md:gap-3 mt-1 md:mt-2">
                                  <div className="flex items-center gap-0.5 md:gap-1 text-[10px] md:text-xs text-gray-500">
                                    <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                    {notification.time}
                                  </div>
                                  <div className="flex items-center gap-0.5 md:gap-1 text-[10px] md:text-xs text-gray-500">
                                    <User className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                    {notification.user}
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 md:h-8 md:w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-white/50"
                                    >
                                      <MoreHorizontal className="w-3 h-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="text-xs md:text-sm"
                                  >
                                    <DropdownMenuItem
                                      onClick={() =>
                                        toast.info("Viewing details")
                                      }
                                    >
                                      <Eye className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        toast.info("Marking as read")
                                      }
                                    >
                                      <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                                      Mark as Read
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                          {index < notifications.length - 1 && (
                            <Separator className="my-0.5 md:my-1 mx-1 md:mx-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Footer */}
                  <div className="px-4 md:px-6 py-2 md:py-3 bg-gray-50 border-t border-gray-200">
                    <Button
                      variant="ghost"
                      className="w-full text-[#0c9dcb] hover:text-[#0c9dcb] hover:bg-blue-50 justify-center text-sm"
                      onClick={() => toast.info("Opening all notifications")}
                    >
                      View All Notifications
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-1 md:gap-3 hover:bg-gray-100 rounded-lg px-1.5 md:px-3 py-1.5 md:py-2 transition-colors"
                >
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-[#0c9dcb] rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="font-semibold text-gray-900 text-sm">
                      {user?.name?.split(" ")[0] || "User"}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {user?.role?.charAt(0).toUpperCase() +
                        user?.role?.slice(1) || "User"}
                    </div>
                  </div>
                  <ChevronDown className="hidden lg:block w-4 h-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => toast.info("Opening profile")}>
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => toast.info("Opening preferences")}
                >
                  Account Preferences
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info("Opening help")}>
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
