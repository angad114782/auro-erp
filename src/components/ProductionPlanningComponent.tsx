import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Clock,
  Users,
  Package,
  CheckCircle,
  AlertTriangle,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Target,
  Factory,
  ArrowRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useERPStore } from '../lib/data-store';

interface ProductionPlan {
  id: string;
  planName: string;
  productCode: string;
  quantity: number;
  startDate: string;
  endDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Draft' | 'Approved' | 'In Progress' | 'Completed' | 'On Hold';
  plantId: string;
  assignedTeam: string;
  materials: Array<{ name: string; required: number; available: number }>;
  progress: number;
  estimatedCost: number;
}

export function ProductionPlanningComponent() {
  const { productionOrders, plants } = useERPStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedView, setSelectedView] = useState('list');

  // Mock production plans data
  const [productionPlans] = useState<ProductionPlan[]>([
    {
      id: 'PP001',
      planName: 'Winter Collection Batch 1',
      productCode: 'RND0001',
      quantity: 500,
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      priority: 'High',
      status: 'In Progress',
      plantId: 'Plant A',
      assignedTeam: 'Team Alpha',
      materials: [
        { name: 'Leather', required: 100, available: 85 },
        { name: 'Rubber Sole', required: 500, available: 520 },
        { name: 'Laces', required: 1000, available: 800 }
      ],
      progress: 65,
      estimatedCost: 125000
    },
    {
      id: 'PP002',
      planName: 'Summer Sneakers Series',
      productCode: 'RND0002',
      quantity: 300,
      startDate: '2024-01-20',
      endDate: '2024-02-28',
      priority: 'Medium',
      status: 'Approved',
      plantId: 'Plant B',
      assignedTeam: 'Team Beta',
      materials: [
        { name: 'Canvas', required: 80, available: 90 },
        { name: 'EVA Foam', required: 300, available: 280 },
        { name: 'Metal Eyelets', required: 1200, available: 1500 }
      ],
      progress: 0,
      estimatedCost: 95000
    },
    {
      id: 'PP003',
      planName: 'Premium Boots Collection',
      productCode: 'RND0003',
      quantity: 200,
      startDate: '2024-02-01',
      endDate: '2024-03-15',
      priority: 'High',
      status: 'Draft',
      plantId: 'Plant A',
      assignedTeam: 'Team Gamma',
      materials: [
        { name: 'Premium Leather', required: 150, available: 120 },
        { name: 'Leather Sole', required: 200, available: 180 },
        { name: 'Zippers', required: 200, available: 250 }
      ],
      progress: 0,
      estimatedCost: 180000
    }
  ]);

  const getStatusColor = (status: string) => {
    const colors = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Approved': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-green-100 text-green-800',
      'Completed': 'bg-emerald-100 text-emerald-800',
      'On Hold': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'High': 'bg-red-500 text-white',
      'Medium': 'bg-orange-500 text-white',
      'Low': 'bg-green-500 text-white'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const filteredPlans = productionPlans.filter(plan => {
    const matchesSearch = plan.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.productCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || plan.status.toLowerCase() === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getResourceAvailability = (materials: Array<{ name: string; required: number; available: number }>) => {
    const total = materials.reduce((sum, mat) => sum + mat.required, 0);
    const available = materials.reduce((sum, mat) => sum + Math.min(mat.available, mat.required), 0);
    return (available / total) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Production Planning</h1>
            <p className="text-gray-600">Schedule and manage manufacturing operations</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#0c9dcb] hover:bg-[#0c9dcb]/90">
                <Plus className="w-4 h-4 mr-2" />
                New Production Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Production Plan</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="planName">Plan Name</Label>
                    <Input id="planName" placeholder="Enter plan name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productCode">Product Code</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RND0001">RND0001</SelectItem>
                        <SelectItem value="RND0002">RND0002</SelectItem>
                        <SelectItem value="RND0003">RND0003</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input id="quantity" type="number" placeholder="Enter quantity" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plantId">Assigned Plant</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plant-a">Plant A</SelectItem>
                      <SelectItem value="plant-b">Plant B</SelectItem>
                      <SelectItem value="plant-c">Plant C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea id="notes" placeholder="Enter any additional requirements or notes" />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreateDialogOpen(false)}>
                    Create Plan
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Total Plans</p>
                <p className="text-2xl font-bold text-blue-900">{productionPlans.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">In Progress</p>
                <p className="text-2xl font-bold text-green-900">
                  {productionPlans.filter(p => p.status === 'In Progress').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Play className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">Pending Approval</p>
                <p className="text-2xl font-bold text-orange-900">
                  {productionPlans.filter(p => p.status === 'Draft').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Total Value</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(productionPlans.reduce((sum, plan) => sum + plan.estimatedCost, 0))}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search production plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="in progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={selectedView === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedView('list')}
              >
                List View
              </Button>
              <Button
                variant={selectedView === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedView('calendar')}
              >
                Calendar View
              </Button>
            </div>
          </div>

          {/* Production Plans List */}
          <div className="space-y-4">
            {filteredPlans.map((plan) => (
              <Card key={plan.id} className="border hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#0c9dcb] to-[#26b4e0] rounded-xl flex items-center justify-center shadow-sm">
                        <Factory className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">{plan.planName}</h3>
                          <Badge className={getStatusColor(plan.status)}>
                            {plan.status}
                          </Badge>
                          <Badge className={getPriorityColor(plan.priority)} variant="secondary">
                            {plan.priority}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Product Code</p>
                            <p className="font-medium">{plan.productCode}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Quantity</p>
                            <p className="font-medium">{plan.quantity} units</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Timeline</p>
                            <p className="font-medium">
                              {new Date(plan.startDate).toLocaleDateString('en-IN')} - {new Date(plan.endDate).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Estimated Cost</p>
                            <p className="font-medium">{formatCurrency(plan.estimatedCost)}</p>
                          </div>
                        </div>
                        
                        {/* Progress and Resource Availability */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600">Resource Availability</span>
                              <span className="text-sm font-medium">
                                {getResourceAvailability(plan.materials).toFixed(0)}%
                              </span>
                            </div>
                            <Progress value={getResourceAvailability(plan.materials)} className="h-2" />
                          </div>
                        </div>

                        {/* Material Status */}
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Material Status:</p>
                          <div className="flex flex-wrap gap-2">
                            {plan.materials.map((material, index) => (
                              <Badge
                                key={index}
                                variant={material.available >= material.required ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {material.name}: {material.available}/{material.required}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {plan.status === 'Draft' && (
                        <Button size="sm" className="bg-green-500 hover:bg-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      {plan.status === 'Approved' && (
                        <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {plan.status === 'In Progress' && (
                        <Button size="sm" variant="outline">
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}