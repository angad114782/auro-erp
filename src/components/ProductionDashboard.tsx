import React, { useState } from 'react';
import {
  Factory,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Package,
  IndianRupee,
  ArrowUp,
  ArrowDown,
  Play,
  Pause,
  BarChart3,
  PieChart,
  Calendar,
  Target,
  Scissors,
  Printer,
  ShirtIcon,
  X,
  Wrench
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { useERPStore } from '../lib/data-store';

interface ProductionDashboardProps {
  onSubModuleChange?: (subModule: string) => void;
  currentSubModule?: string;
}

export function ProductionDashboard({ onSubModuleChange, currentSubModule }: ProductionDashboardProps) {
  const { productionOrders } = useERPStore();
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  // Updated production stages data according to the new 7-stage process
  const productionStagesData = [
    { 
      stage: 'Cutting', 
      planned: 500, 
      completed: 485, 
      efficiency: 97.0,
      icon: <Scissors className="w-5 h-5" />,
      color: '#10b981'
    },
    { 
      stage: 'Printing', 
      planned: 485, 
      completed: 450, 
      efficiency: 92.8,
      icon: <Printer className="w-5 h-5" />,
      color: '#8b5cf6'
    },
    { 
      stage: 'Upper', 
      planned: 450, 
      completed: 420, 
      efficiency: 93.3,
      icon: <ShirtIcon className="w-5 h-5" />,
      color: '#3b82f6'
    },
    { 
      stage: 'Upper REJ', 
      planned: 420, 
      completed: 385, 
      efficiency: 91.7,
      icon: <X className="w-5 h-5" />,
      color: '#f59e0b'
    },
    { 
      stage: 'Assembly', 
      planned: 385, 
      completed: 340, 
      efficiency: 88.3,
      icon: <Wrench className="w-5 h-5" />,
      color: '#06b6d4'
    },
    { 
      stage: 'Packing', 
      planned: 340, 
      completed: 320, 
      efficiency: 94.1,
      icon: <Package className="w-5 h-5" />,
      color: '#84cc16'
    },
    { 
      stage: 'RFD', 
      planned: 320, 
      completed: 290, 
      efficiency: 90.6,
      icon: <CheckCircle className="w-5 h-5" />,
      color: '#ec4899'
    }
  ];

  // Mock data for charts
  const productionTrends = [
    { name: 'Mon', cutting: 450, printing: 420, upper: 390, assembly: 350, packing: 320, rfd: 290 },
    { name: 'Tue', cutting: 520, printing: 480, upper: 450, assembly: 400, packing: 380, rfd: 350 },
    { name: 'Wed', cutting: 480, printing: 460, upper: 430, assembly: 380, packing: 360, rfd: 330 },
    { name: 'Thu', cutting: 600, printing: 570, upper: 540, assembly: 490, packing: 470, rfd: 440 },
    { name: 'Fri', cutting: 580, printing: 550, upper: 520, assembly: 480, packing: 450, rfd: 420 },
    { name: 'Sat', cutting: 420, printing: 400, upper: 380, assembly: 340, packing: 320, rfd: 290 },
    { name: 'Sun', cutting: 380, printing: 360, upper: 340, assembly: 310, packing: 290, rfd: 270 }
  ];

  const stageEfficiencyData = productionStagesData.map(stage => ({
    name: stage.stage,
    efficiency: stage.efficiency,
    planned: stage.planned,
    completed: stage.completed,
    color: stage.color
  }));

  const orderStatusData = [
    { name: 'RFD Ready', value: 45, color: '#10b981' },
    { name: 'In Assembly', value: 28, color: '#3b82f6' },
    { name: 'Upper Stage', value: 15, color: '#f59e0b' },
    { name: 'Cutting/Printing', value: 12, color: '#8b5cf6' }
  ];

  // Calculate key metrics
  const totalProduction = productionStagesData[6].completed; // RFD completed
  const totalPlanned = productionStagesData[0].planned; // Initial cutting planned
  const overallEfficiency = ((totalProduction / totalPlanned) * 100).toFixed(1);
  
  const activeOrders = productionOrders?.length || 0;
  const completedOrders = productionStagesData[6].completed;
  const pendingUpperREJ = productionStagesData[3].planned - productionStagesData[3].completed;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">Production Dashboard</h1>
        <p className="text-sm text-gray-600">
          Real-time monitoring of manufacturing process: Cutting → Printing → Upper → Upper REJ → Assembly → Packing → RFD
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Today's RFD</p>
                <p className="text-2xl font-bold text-blue-900">{totalProduction}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+8.5%</span>
                  <span className="text-xs text-gray-500 ml-1">vs yesterday</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Overall Efficiency</p>
                <p className="text-2xl font-bold text-green-900">{overallEfficiency}%</p>
                <div className="flex items-center mt-2">
                  <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+2.1%</span>
                  <span className="text-xs text-gray-500 ml-1">this week</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">Active Production</p>
                <p className="text-2xl font-bold text-orange-900">{activeOrders}</p>
                <div className="flex items-center mt-2">
                  <Clock className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600">{pendingUpperREJ} pending REJ</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <Factory className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Revenue Impact</p>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(2850000)}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+12.4%</span>
                  <span className="text-xs text-gray-500 ml-1">this month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production Process Flow */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-[#0c9dcb]" />
            Production Process Flow - Live Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {productionStagesData.map((stage, index) => (
              <div key={stage.stage} className="relative">
                <div className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: stage.color }}>
                      <div className="text-white">
                        {stage.icon}
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                      style={{ 
                        backgroundColor: `${stage.color}20`, 
                        color: stage.color 
                      }}
                    >
                      {stage.efficiency}%
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-2">{stage.stage}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Planned</span>
                      <span className="font-medium">{stage.planned}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Completed</span>
                      <span className="font-medium">{stage.completed}</span>
                    </div>
                    <Progress value={stage.efficiency} className="h-2 mt-2" />
                  </div>
                </div>
                {index < productionStagesData.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 bg-gray-300 transform -translate-y-1/2"></div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stages">Process Stages</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Production Trends */}
            <Card className="lg:col-span-2 shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#0c9dcb]" />
                  7-Day Production Trends by Stage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={productionTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cutting" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="printing" stroke="#8b5cf6" strokeWidth={2} />
                    <Line type="monotone" dataKey="upper" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="assembly" stroke="#06b6d4" strokeWidth={2} />
                    <Line type="monotone" dataKey="packing" stroke="#84cc16" strokeWidth={2} />
                    <Line type="monotone" dataKey="rfd" stroke="#ec4899" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-[#0c9dcb]" />
                  Current Orders by Stage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {orderStatusData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-gray-600">{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stages" className="space-y-6">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Stage-wise Efficiency Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stageEfficiencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="efficiency" fill="#0c9dcb" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Planned vs Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stageEfficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="planned" fill="#e2e8f0" />
                    <Bar dataKey="completed" fill="#0c9dcb" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Efficiency Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stageEfficiencyData.map((stage, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium" style={{ color: stage.color }}>
                          {stage.name}
                        </span>
                        <span className="text-xl font-bold">{stage.efficiency}%</span>
                      </div>
                      <Progress 
                        value={stage.efficiency} 
                        className="h-2"
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {stage.completed}/{stage.planned} units
                        </span>
                        <Badge variant={stage.efficiency >= 90 ? "default" : "destructive"}>
                          {stage.efficiency >= 90 ? "Excellent" : "Needs Improvement"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Production Flow Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={productionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="cutting" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="printing" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="upper" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="assembly" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="packing" stackId="1" stroke="#84cc16" fill="#84cc16" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="rfd" stackId="1" stroke="#ec4899" fill="#ec4899" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Production Control Center</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => onSubModuleChange?.('production-tracking')}
              className="p-4 border rounded-lg hover:shadow-md transition-all hover:border-[#0c9dcb] group"
            >
              <Play className="w-6 h-6 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium">View Tracking</p>
              <p className="text-xs text-gray-500">Monitor all stages</p>
            </button>
            <button 
              onClick={() => onSubModuleChange?.('production-planning')}
              className="p-4 border rounded-lg hover:shadow-md transition-all hover:border-[#0c9dcb] group"
            >
              <Calendar className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium">Production Planning</p>
              <p className="text-xs text-gray-500">Schedule operations</p>
            </button>
            <button 
              onClick={() => onSubModuleChange?.('production-analytics')}
              className="p-4 border rounded-lg hover:shadow-md transition-all hover:border-[#0c9dcb] group"
            >
              <BarChart3 className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium">Analytics</p>
              <p className="text-xs text-gray-500">Detailed reports</p>
            </button>
            <button className="p-4 border rounded-lg hover:shadow-md transition-all hover:border-[#0c9dcb] group">
              <AlertTriangle className="w-6 h-6 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium">Quality Alerts</p>
              <p className="text-xs text-gray-500">Monitor issues</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}