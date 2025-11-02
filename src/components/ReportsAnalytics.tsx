import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Calculator, PieChart, Download, Filter, Calendar, IndianRupee, Target, Clock, Award } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useERPStore } from '../lib/data-store';

interface ReportsAnalyticsProps {
  currentSubModule?: string;
}

export function ReportsAnalytics({ currentSubModule }: ReportsAnalyticsProps) {
  const { rdProjects, users, brands } = useERPStore();
  const [selectedSubModule, setSelectedSubModule] = useState(currentSubModule || 'prototype-reports');
  const [dateRange, setDateRange] = useState('last-30-days');

  const subModules = [
    {
      id: 'prototype-reports',
      name: 'Prototype Reports',
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Design and prototype performance analytics',
      color: 'bg-blue-500'
    },
    {
      id: 'designer-productivity',
      name: 'Designer Productivity',
      icon: <Users className="w-5 h-5" />,
      description: 'Team performance and productivity metrics',
      color: 'bg-green-500'
    },
    {
      id: 'brand-costing',
      name: 'Brand Costing',
      icon: <Calculator className="w-5 h-5" />,
      description: 'Financial analysis and cost breakdowns',
      color: 'bg-purple-500'
    },
    {
      id: 'plant-utilization',
      name: 'Plant Utilization',
      icon: <PieChart className="w-5 h-5" />,
      description: 'Manufacturing capacity and efficiency reports',
      color: 'bg-orange-500'
    }
  ];

  React.useEffect(() => {
    if (currentSubModule) {
      setSelectedSubModule(currentSubModule);
    }
  }, [currentSubModule]);

  const getProjectsByStage = () => {
    const stages = ['Idea Submitted', 'Costing Pending', 'Costing Received', 'Prototype', 'Red Seal', 'Green Seal', 'Final Approved', 'PO Issued'];
    return stages.map(stage => ({
      stage,
      count: rdProjects.filter(p => p.stage === stage).length,
      percentage: (rdProjects.filter(p => p.stage === stage).length / rdProjects.length) * 100
    }));
  };

  const getDesignerStats = () => {
    const designers = users.filter(u => u.role === 'Designer');
    return designers.map(designer => {
      const designerName = designer.name || 'Unknown';
      const assignedProjects = rdProjects.filter(p => p.assignedTo === designerName);
      const completedProjects = assignedProjects.filter(p => p.stage === 'Final Approved');
      return {
        ...designer,
        name: designerName,
        assignedProjects: assignedProjects.length,
        completedProjects: completedProjects.length,
        efficiency: assignedProjects.length > 0 ? (completedProjects.length / assignedProjects.length) * 100 : 0
      };
    });
  };

  const getBrandCostAnalysis = () => {
    return brands.map(brand => {
      const brandName = brand.name || 'Unknown';
      const brandProjects = rdProjects.filter(p => p.brand === brandName);
      const totalCost = brandProjects.reduce((sum, p) => sum + p.estimatedCost, 0);
      const avgCost = brandProjects.length > 0 ? totalCost / brandProjects.length : 0;
      return {
        ...brand,
        name: brandName,
        projectCount: brandProjects.length,
        totalCost,
        avgCost
      };
    });
  };

  const renderPrototypeReports = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="font-semibold text-gray-900">{rdProjects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="font-semibold text-gray-900">{rdProjects.filter(p => p.stage === 'Final Approved').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="font-semibold text-gray-900">{rdProjects.filter(p => !['Final Approved', 'PO Issued'].includes(p.stage)).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Investment</p>
                <p className="font-semibold text-gray-900">₹{rdProjects.reduce((sum, p) => sum + p.estimatedCost, 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Project Distribution by Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getProjectsByStage().map((stage, index) => (
              <div key={stage.stage} className="flex items-center gap-4">
                <div className="w-32 text-sm text-gray-600">{stage.stage}</div>
                <div className="flex-1">
                  <Progress value={stage.percentage} className="h-3" />
                </div>
                <div className="w-16 text-sm font-medium text-gray-900">{stage.count}</div>
                <div className="w-16 text-sm text-gray-500">{stage.percentage.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDesignerProductivity = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Designer Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 rounded-lg">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Designer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Projects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Efficiency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getDesignerStats().map((designer, index) => (
                  <tr key={designer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#0c9dcb] to-[#26b4e0] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {designer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{designer.name}</p>
                          <p className="text-sm text-gray-500">{designer.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{designer.assignedProjects}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{designer.completedProjects}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16">
                          <Progress value={designer.efficiency} className="h-2" />
                        </div>
                        <span className="text-sm text-gray-600">{designer.efficiency.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={designer.efficiency >= 80 ? "default" : designer.efficiency >= 60 ? "secondary" : "destructive"}>
                        {designer.efficiency >= 80 ? 'Excellent' : designer.efficiency >= 60 ? 'Good' : 'Needs Improvement'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderBrandCosting = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Brand-wise Cost Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 rounded-lg">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Investment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost Distribution
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getBrandCostAnalysis().map((brand, index) => {
                  const totalBudget = getBrandCostAnalysis().reduce((sum, b) => sum + b.totalCost, 0);
                  const percentage = totalBudget > 0 ? (brand.totalCost / totalBudget) * 100 : 0;
                  return (
                    <tr key={brand.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                            {brand.name.charAt(0)}
                          </div>
                          <p className="font-medium text-gray-900">{brand.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{brand.projectCount}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                          <IndianRupee className="w-4 h-4" />
                          <span>{brand.totalCost.toLocaleString('en-IN')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <IndianRupee className="w-4 h-4" />
                          <span>{brand.avgCost.toLocaleString('en-IN')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16">
                            <Progress value={percentage} className="h-2" />
                          </div>
                          <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPlantUtilization = () => (
    <div className="space-y-6">
      <div className="text-center py-20">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <PieChart className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Plant Utilization Reports</h3>
        <p className="text-gray-500 max-w-md mx-auto">Detailed plant utilization and efficiency reports will be available once production data is integrated.</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (selectedSubModule) {
      case 'prototype-reports':
        return renderPrototypeReports();
      case 'designer-productivity':
        return renderDesignerProductivity();
      case 'brand-costing':
        return renderBrandCosting();
      case 'plant-utilization':
        return renderPlantUtilization();
      default:
        return renderPrototypeReports();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-[#0c9dcb] to-[#26b4e0] rounded-xl flex items-center justify-center shadow-lg">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reporting & Analytics</h1>
          <p className="text-gray-600">Business intelligence and performance insights</p>
        </div>
      </div>

      {/* Sub-module Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {subModules.map((module) => (
          <Card 
            key={module.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              selectedSubModule === module.id 
                ? 'border-[#0c9dcb] bg-[#0c9dcb]/5' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedSubModule(module.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${module.color} rounded-lg flex items-center justify-center text-white`}>
                  {module.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{module.name}</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600">{module.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 ${subModules.find(m => m.id === selectedSubModule)?.color} rounded-lg flex items-center justify-center text-white`}>
                {subModules.find(m => m.id === selectedSubModule)?.icon}
              </div>
              <div>
                <CardTitle className="text-xl">
                  {subModules.find(m => m.id === selectedSubModule)?.name}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {subModules.find(m => m.id === selectedSubModule)?.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-7-days">Last 7 days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 days</SelectItem>
                  <SelectItem value="last-90-days">Last 90 days</SelectItem>
                  <SelectItem value="last-year">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button className="bg-[#0c9dcb] hover:bg-[#0c9dcb]/90">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}