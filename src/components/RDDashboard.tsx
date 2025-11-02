import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Bell, 
  User, 
  Plus, 
  Lightbulb, 
  Beaker, 
  Target, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Edit, 
  Trash2, 
  MoreVertical, 
  IndianRupee, 
  Upload, 
  Download,
  Calendar, 
  MapPin, 
  Users, 
  Activity, 
  Pause, 
  ShoppingCart, 
  CircleCheckBig, 
  CircleX, 
  Package,
  ArrowRight,
  FileText,
  BarChart3,
  Zap,
  TrendingDown,
  Eye,
  ChevronRight,
  LayoutDashboard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useERPStore } from '../lib/data-store';
import { toast } from 'sonner@2.0.3';
import { Progress } from './ui/progress';

interface RDDashboardProps {
  onNavigate?: (subModule: string) => void;
}

export function RDDashboard({ onNavigate }: RDDashboardProps) {
  const { rdProjects, brands, categories, types, colors, users } = useERPStore();

  // Calculate real-time analytics from actual data
  const analytics = useMemo(() => {
    const live = rdProjects.filter(p => !['Final Approved', 'PO Issued'].includes(p.status));
    const closed = rdProjects.filter(p => ['Final Approved', 'PO Issued'].includes(p.status));
    const redSealOK = rdProjects.filter(p => p.status === 'Red Seal' && p.clientFeedback === 'OK');
    const redSealPending = rdProjects.filter(p => p.status === 'Red Seal' && p.clientFeedback !== 'OK');
    const greenSealOK = rdProjects.filter(p => p.status === 'Green Seal' && p.clientFeedback === 'OK');
    const greenSealPending = rdProjects.filter(p => p.status === 'Green Seal' && p.clientFeedback !== 'OK');
    const poApproved = rdProjects.filter(p => p.status === 'Final Approved' && p.poReceived);
    const poPending = rdProjects.filter(p => p.status === 'Final Approved' && !p.poReceived);

    // Stage breakdown
    const stages = [
      { stage: 'Idea Submitted', count: rdProjects.filter(p => p.status === 'Idea Submitted').length, color: '#0c9dcb' },
      { stage: 'Costing', count: rdProjects.filter(p => ['Costing Pending', 'Costing Received'].includes(p.status)).length, color: '#ffc107' },
      { stage: 'Prototype', count: rdProjects.filter(p => p.status === 'Prototype').length, color: '#26b4e0' },
      { stage: 'Red Seal', count: rdProjects.filter(p => p.status === 'Red Seal').length, color: '#dc3545' },
      { stage: 'Green Seal', count: rdProjects.filter(p => p.status === 'Green Seal').length, color: '#28a745' },
      { stage: 'Approved', count: rdProjects.filter(p => ['Final Approved', 'PO Issued'].includes(p.status)).length, color: '#20c997' },
    ];

    // Priority breakdown
    const priorities = [
      { name: 'High', value: rdProjects.filter(p => p.priority === 'High').length, color: '#dc3545' },
      { name: 'Medium', value: rdProjects.filter(p => p.priority === 'Medium').length, color: '#ffc107' },
      { name: 'Low', value: rdProjects.filter(p => p.priority === 'Low').length, color: '#28a745' },
    ];

    // Monthly timeline data
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      
      return {
        month: monthKey,
        submitted: Math.floor(Math.random() * 8) + 3,
        completed: Math.floor(Math.random() * 6) + 2,
      };
    });

    // Pending actions
    const pendingActions = [
      { type: 'Costing Pending', count: rdProjects.filter(p => p.status === 'Costing Pending').length, icon: Clock },
      { type: 'Client Feedback Pending', count: rdProjects.filter(p => p.clientFeedback === 'Pending').length, icon: AlertTriangle },
      { type: 'Red Seal Approval', count: redSealPending.length, icon: AlertTriangle },
      { type: 'Green Seal Approval', count: greenSealPending.length, icon: CheckCircle },
      { type: 'PO Pending', count: poPending.length, icon: ShoppingCart },
    ];

    // Recent projects (last 5)
    const recent = [...rdProjects]
      .sort((a, b) => new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime())
      .slice(0, 5);

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
      pendingActions: pendingActions.filter(a => a.count > 0),
      recentProjects: recent,
      successRate: closed.length > 0 ? Math.round((closed.length / rdProjects.length) * 100) : 0,
      avgDuration: rdProjects.length > 0 ? Math.round(rdProjects.reduce((sum, p) => sum + (p.duration || 0), 0) / rdProjects.length) : 0,
    };
  }, [rdProjects]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Idea Submitted': 'bg-blue-100 text-blue-800 border-blue-200',
      'Costing Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Costing Received': 'bg-orange-100 text-orange-800 border-orange-200',
      'Prototype': 'bg-purple-100 text-purple-800 border-purple-200',
      'Red Seal': 'bg-red-100 text-red-800 border-red-200',
      'Green Seal': 'bg-green-100 text-green-800 border-green-200',
      'Final Approved': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'PO Issued': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getBrandName = (brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    return brand?.brandName || 'Unknown';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.categoryName || 'Unknown';
  };

  const handleNavigate = (subModule: string) => {
    if (onNavigate) {
      onNavigate(subModule);
    } else {
      toast.info(`Navigating to ${subModule}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-gray-50 to-gray-100 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0c9dcb] to-[#26b4e0] flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl text-gray-900">R&D Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Complete overview and analytics • {analytics.total} Total Projects
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button 
            className="bg-[#0c9dcb] hover:bg-[#0a8bb5] text-white"
            onClick={() => handleNavigate('project')}
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
              onClick={() => handleNavigate('project')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0c9dcb]/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-[#0c9dcb]" />
                  </div>
                  <span className="text-sm text-gray-600">Projects</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl text-gray-900">{analytics.live}</span>
                  <span className="text-sm text-gray-500">/ {analytics.closed}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Live / Closed</p>
              </CardContent>
            </Card>

            {/* Red Seal Status */}
            <Card 
              className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer bg-white"
              onClick={() => handleNavigate('red-seal')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-sm text-gray-600">Red Seal</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl text-gray-900">{analytics.redSealOK}</span>
                  <span className="text-sm text-gray-500">/ {analytics.redSealPending}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">OK / Pending</p>
              </CardContent>
            </Card>

            {/* Green Seal Status */}
            <Card 
              className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer bg-white"
              onClick={() => handleNavigate('green-seal')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-600">Green Seal</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl text-gray-900">{analytics.greenSealOK}</span>
                  <span className="text-sm text-gray-500">/ {analytics.greenSealPending}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">OK / Pending</p>
              </CardContent>
            </Card>

            {/* PO Status */}
            <Card 
              className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer bg-white"
              onClick={() => handleNavigate('po-target-date')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-sm text-gray-600">PO Status</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl text-gray-900">{analytics.poApproved}</span>
                  <span className="text-sm text-gray-500">/ {analytics.poPending}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Approved / Pending</p>
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
                    onClick={() => handleNavigate('project')}
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
                      tick={{ fontSize: 11, fill: '#6c757d' }}
                      angle={-15}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#6c757d' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        fontSize: '12px'
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
                        backgroundColor: 'white', 
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        fontSize: '12px'
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
                        <span className="text-sm text-gray-900">{item.name}</span>
                        <p className="text-xs text-gray-500">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Timeline */}
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
                      <Button size="sm" variant="ghost" className="text-gray-600 hover:bg-gray-100">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => toast.success('Exporting Assembly Plan data...', { description: 'Chart data will be downloaded as Excel file' })}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        if (onNavigate) onNavigate('tracking');
                        toast.info('Viewing production tracking details...');
                      }}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toast.success('Generating assembly report...')}>
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
                <LineChart data={[
                  { day: '1st', plan: 2069, actual: 770 },
                  { day: '2nd', plan: 4138, actual: 1296 },
                  { day: '3rd', plan: 6207, actual: 2256 },
                  { day: '4th', plan: 8276, actual: 3616 },
                  { day: '5th', plan: 10345, actual: 3967 },
                  { day: '6th', plan: 12414, actual: 5348 },
                  { day: '8th', plan: 14483, actual: 6928 },
                  { day: '9th', plan: 16552, actual: 7678 },
                  { day: '10th', plan: 18621, actual: 7758 },
                  { day: '11th', plan: 20650, actual: 8720 },
                  { day: '12th', plan: 22759, actual: 8720 },
                  { day: '13th', plan: 24828, actual: 9296 },
                  { day: '14th', plan: 26897, actual: 10368 },
                  { day: '15th', plan: 28966, actual: 11627 },
                  { day: '16th', plan: 31035, actual: 10921 },
                  { day: '17th', plan: 33104, actual: 11747 },
                  { day: '18th', plan: 35173, actual: 13617 },
                  { day: '19th', plan: 37242, actual: 13617 },
                  { day: '20th', plan: 39311, actual: 14387 },
                  { day: '22nd', plan: 41380, actual: 15357 },
                  { day: '23rd', plan: 43449, actual: 16127 },
                  { day: '24th', plan: 45518, actual: 16431 },
                  { day: '25th', plan: 47587, actual: 16431 },
                  { day: '26th', plan: 49656, actual: 16431 },
                  { day: '27th', plan: 51725, actual: 17091 },
                  { day: '28th', plan: 53794, actual: 19313 },
                  { day: '29th', plan: 53794, actual: 19313 },
                  { day: '30th', plan: 53794, actual: 19313 },
                ]} margin={{ top: 30, right: 20, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 11, fill: '#6c757d' }}
                    axisLine={{ stroke: '#e9ecef' }}
                    tickLine={false}
                    interval={1}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6c757d' }}
                    axisLine={{ stroke: '#e9ecef' }}
                    tickLine={false}
                    tickFormatter={(value) => `${(value/1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [value.toLocaleString('en-IN'), name]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e9ecef',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                      padding: '10px 14px'
                    }}
                    labelStyle={{ color: '#495057', marginBottom: '4px' }}
                    cursor={{ stroke: '#0c9dcb', strokeWidth: 1, strokeDasharray: '5 5' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="plan" 
                    stroke="#0c9dcb" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#0c9dcb', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                    name="Plan"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#ed7d31" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#ed7d31', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                    name="Actual"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

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
                  onClick={() => handleNavigate('project')}
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
                    key={project.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:shadow-md hover:border-[#0c9dcb] transition-all cursor-pointer"
                    onClick={() => handleNavigate('project')}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm">{project.autoCode}</h4>
                        <Badge className={`${getStatusColor(project.status)} border text-xs`}>
                          {project.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span>{getBrandName(project.brandId)}</span>
                        <span>•</span>
                        <span>{getCategoryName(project.categoryId)}</span>
                        <span>•</span>
                        <span>{formatCurrency(project.targetCost)}</span>
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
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="pb-3 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Zap className="w-5 h-5 text-[#0c9dcb]" />
                  Quick Access
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <button
                    onClick={() => handleNavigate('project')}
                    className="w-full group flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-[#0c9dcb] hover:bg-[#0c9dcb]/5 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-[#0c9dcb] transition-colors flex-shrink-0">
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
                    onClick={() => handleNavigate('red-seal')}
                    className="w-full group flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50/50 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-500 transition-colors flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                        Red Seal
                      </p>
                      <p className="text-xs text-gray-500">{analytics.redSealOK + analytics.redSealPending} items</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                  </button>

                  <button
                    onClick={() => handleNavigate('green-seal')}
                    className="w-full group flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50/50 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-500 transition-colors flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                        Green Seal
                      </p>
                      <p className="text-xs text-gray-500">{analytics.greenSealOK + analytics.greenSealPending} items</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" />
                  </button>

                  <button
                    onClick={() => handleNavigate('po-target-date')}
                    className="w-full group flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50/50 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-500 transition-colors flex-shrink-0">
                      <ShoppingCart className="w-5 h-5 text-orange-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                        PO Target Date
                      </p>
                      <p className="text-xs text-gray-500">{analytics.poApproved + analytics.poPending} PO items</p>
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
                          if (action.type.includes('Red Seal')) handleNavigate('red-seal');
                          else if (action.type.includes('Green Seal')) handleNavigate('green-seal');
                          else if (action.type.includes('PO')) handleNavigate('po-target-date');
                          else handleNavigate('project');
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-orange-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-orange-700">{action.count}</span>
                          </div>
                          <p className="text-xs font-medium text-gray-900">{action.type}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-orange-600" />
                      </div>
                    );
                  })}
                  {analytics.pendingActions.length === 0 && (
                    <div className="text-center py-6">
                      <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
                      <p className="text-xs text-gray-600">All caught up!</p>
                      <p className="text-xs text-gray-500">No pending actions</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
