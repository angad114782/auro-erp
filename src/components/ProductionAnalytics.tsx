import React, { useState } from 'react';
import {
  PieChart,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Factory,
  Package,
  Clock,
  IndianRupee,
  Target,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Building
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
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
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';

export function ProductionAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [selectedMetric, setSelectedMetric] = useState('efficiency');

  // Mock data for analytics
  const efficiencyData = [
    { date: '2024-01-01', efficiency: 85, target: 90, output: 450, quality: 95 },
    { date: '2024-01-02', efficiency: 88, target: 90, output: 480, quality: 94 },
    { date: '2024-01-03', efficiency: 92, target: 90, output: 520, quality: 96 },
    { date: '2024-01-04', efficiency: 87, target: 90, output: 470, quality: 93 },
    { date: '2024-01-05', efficiency: 94, target: 90, output: 540, quality: 97 },
    { date: '2024-01-06', efficiency: 89, target: 90, output: 495, quality: 95 },
    { date: '2024-01-07', efficiency: 91, target: 90, output: 510, quality: 96 }
  ];

  const plantPerformance = [
    { plant: 'Plant A', efficiency: 95, output: 1200, utilization: 88, quality: 97 },
    { plant: 'Plant B', efficiency: 87, output: 980, utilization: 92, quality: 94 },
    { plant: 'Plant C', efficiency: 92, output: 1100, utilization: 85, quality: 96 },
    { plant: 'Plant D', efficiency: 83, output: 850, utilization: 78, quality: 92 }
  ];

  const productionByCategory = [
    { name: 'Sneakers', value: 45, cost: 2250000, color: '#0c9dcb' },
    { name: 'Boots', value: 30, cost: 1800000, color: '#26b4e0' },
    { name: 'Sandals', value: 15, cost: 750000, color: '#4cc9f0' },
    { name: 'Formal', value: 10, cost: 600000, color: '#20c997' }
  ];

  const qualityTrends = [
    { month: 'Jan', passRate: 94, reworkRate: 4, rejectRate: 2 },
    { month: 'Feb', passRate: 96, reworkRate: 3, rejectRate: 1 },
    { month: 'Mar', passRate: 93, reworkRate: 5, rejectRate: 2 },
    { month: 'Apr', passRate: 97, reworkRate: 2, rejectRate: 1 },
    { month: 'May', passRate: 95, reworkRate: 3, rejectRate: 2 },
    { month: 'Jun', passRate: 98, reworkRate: 1.5, rejectRate: 0.5 }
  ];

  const downtimeAnalysis = [
    { reason: 'Scheduled Maintenance', hours: 45, percentage: 35 },
    { reason: 'Equipment Breakdown', hours: 32, percentage: 25 },
    { reason: 'Material Shortage', hours: 28, percentage: 22 },
    { reason: 'Quality Issues', hours: 15, percentage: 12 },
    { reason: 'Other', hours: 8, percentage: 6 }
  ];

  const costAnalysis = [
    { category: 'Materials', current: 2500000, previous: 2300000, change: 8.7 },
    { category: 'Labor', current: 1800000, previous: 1750000, change: 2.9 },
    { category: 'Energy', current: 450000, previous: 420000, change: 7.1 },
    { category: 'Maintenance', current: 320000, previous: 380000, change: -15.8 },
    { category: 'Other', current: 230000, previous: 210000, change: 9.5 }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Production Analytics</h1>
            <p className="text-gray-600">Comprehensive manufacturing performance insights</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Overall Efficiency</p>
                <p className="text-2xl font-bold text-blue-900">89.3%</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+2.1%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Quality Rate</p>
                <p className="text-2xl font-bold text-green-900">95.8%</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+1.5%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">Production Output</p>
                <p className="text-2xl font-bold text-orange-900">3,455</p>
                <div className="flex items-center mt-2">
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-600">-0.8%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Cost Efficiency</p>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(1450)}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">-5.2%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="efficiency" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-[800px]">
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          <TabsTrigger value="plants">Plants</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="downtime">Downtime</TabsTrigger>
        </TabsList>

        <TabsContent value="efficiency" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Efficiency Trends */}
            <Card className="lg:col-span-2 shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#0c9dcb]" />
                  Efficiency & Output Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={efficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value, name) => [
                        name === 'output' ? `${value} units` : `${value}%`,
                        name.charAt(0).toUpperCase() + name.slice(1)
                      ]}
                    />
                    <Bar yAxisId="right" dataKey="output" fill="#e2e8f0" />
                    <Line yAxisId="left" type="monotone" dataKey="efficiency" stroke="#0c9dcb" strokeWidth={3} />
                    <Line yAxisId="left" type="monotone" dataKey="target" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Production Distribution */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-[#0c9dcb]" />
                  Production by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={productionByCategory}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={(entry) => `${entry.value}%`}
                    >
                      {productionByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {productionByCategory.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-gray-600">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{item.value}%</div>
                        <div className="text-xs text-gray-500">{formatCurrency(item.cost)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plants" className="space-y-6">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="w-5 h-5 text-[#0c9dcb]" />
                Plant Performance Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={plantPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="plant" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="efficiency" fill="#0c9dcb" name="Efficiency %" />
                  </BarChart>
                </ResponsiveContainer>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={plantPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="plant" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="output" fill="#26b4e0" name="Output (units)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Plant Details Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">Plant</th>
                      <th className="text-right py-3">Efficiency</th>
                      <th className="text-right py-3">Output</th>
                      <th className="text-right py-3">Utilization</th>
                      <th className="text-right py-3">Quality Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plantPerformance.map((plant, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-medium">{plant.plant}</td>
                        <td className="py-3 text-right">
                          <Badge variant={plant.efficiency >= 90 ? "default" : "secondary"}>
                            {plant.efficiency}%
                          </Badge>
                        </td>
                        <td className="py-3 text-right">{plant.output.toLocaleString()}</td>
                        <td className="py-3 text-right">{plant.utilization}%</td>
                        <td className="py-3 text-right">
                          <Badge variant={plant.quality >= 95 ? "default" : "secondary"}>
                            {plant.quality}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#0c9dcb]" />
                Quality Trends Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={qualityTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="passRate" stackId="1" stroke="#10b981" fill="#10b981" />
                  <Area type="monotone" dataKey="reworkRate" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
                  <Area type="monotone" dataKey="rejectRate" stackId="1" stroke="#ef4444" fill="#ef4444" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-[#0c9dcb]" />
                Cost Analysis Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {costAnalysis.map((cost, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <IndianRupee className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{cost.category}</h3>
                        <p className="text-sm text-gray-500">Current Period</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(cost.current)}</p>
                      <div className="flex items-center justify-end gap-1">
                        {getChangeIcon(cost.change)}
                        <span className={`text-sm ${getChangeColor(cost.change)}`}>
                          {Math.abs(cost.change).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="downtime" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#0c9dcb]" />
                  Downtime Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={downtimeAnalysis}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="percentage"
                      label={(entry) => `${entry.percentage}%`}
                    >
                      {downtimeAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 70}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Downtime Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {downtimeAnalysis.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: `hsl(${index * 70}, 70%, 50%)` }}
                        />
                        <span className="font-medium">{item.reason}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{item.hours}h</div>
                        <div className="text-sm text-gray-500">{item.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}