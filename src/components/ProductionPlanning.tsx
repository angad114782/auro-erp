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
  ArrowRight,
  IndianRupee,
  Eye,
  Building,
  Award,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ImageIcon
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Calendar as CalendarUI } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useERPStore } from '../lib/data-store';
import { CreateProductionCardDialog } from './CreateProductionCardDialog';
import { AddProductionCardDialog } from './AddProductionCardDialog';
import { ViewProductionCardDialog } from './ViewProductionCardDialog';
import { ProductionPlanDetailsDialog } from './ProductionPlanDetailsDialog';
import { toast } from 'sonner@2.0.3';

// Production Plan interface based on R&D project data
interface ProductionPlan {
  id: string;
  rdProjectId: string;
  projectCode: string;
  poNumber: string;
  planName: string;
  productName: string;
  brand: string;
  brandCode: string;
  category: string;
  type: string;
  gender: string;
  artColour: string;
  color: string;
  country: string;
  quantity: number;
  startDate: string;
  endDate: string;
  deliveryDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Planning' | 'Capacity Allocated' | 'Manufacturing Assigned' | 'Process Defined' | 'Ready for Production' | 'In Production';
  assignedPlant: string;
  assignedTeam: string;
  taskInc: string;
  
  // Cost Information from R&D
  targetCost: number;
  finalCost: number;
  poValue: number;
  estimatedCost: number;
  costVariance: {
    amount: number;
    isOverBudget: boolean;
    percentage: string;
  };
  
  // Materials from R&D (simplified for display)
  materials: Array<{ name: string; required: number; available: number }>;
  
  // Production progress
  progress: number;
  
  remarks: string;
  createdDate: string;
  updatedDate: string;
}

export function ProductionPlanning() {
  const { rdProjects, brands, categories, types, colors, countries } = useERPStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedView, setSelectedView] = useState('list');
  const [currentDate, setCurrentDate] = useState(new Date(2025, 8, 1)); // September 2025

  // Production cards management state
  const [isProductionDialogOpen, setIsProductionDialogOpen] = useState(false);
  const [isCreateCardDialogOpen, setIsCreateCardDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [isViewCardDialogOpen, setIsViewCardDialogOpen] = useState(false);
  const [selectedProductionForView, setSelectedProductionForView] = useState<ProductionPlan | null>(null);
  const [isPlanDetailsDialogOpen, setIsPlanDetailsDialogOpen] = useState(false);
  const [selectedPlanForDetails, setSelectedPlanForDetails] = useState<ProductionPlan | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Date change dialog state
  const [isDateChangeDialogOpen, setIsDateChangeDialogOpen] = useState(false);
  const [selectedProductionForDateChange, setSelectedProductionForDateChange] = useState<ProductionPlan | null>(null);
  const [newProductionDate, setNewProductionDate] = useState('');
  const [productionCards, setProductionCards] = useState<Array<{
    id: string;
    cardName: string;
    description: string;
    assignedTo: string;
    priority: 'High' | 'Medium' | 'Low';
    startDate: string;
    endDate: string;
    status: 'Not Started' | 'In Progress' | 'Completed';
    createdDate: string;
  }>>([]);

  // Production plans data based on R&D approved projects
  const [productionPlans, setProductionPlans] = useState<ProductionPlan[]>([
    {
      id: 'PP001',
      rdProjectId: 'rd-001',
      projectCode: 'RND/25-26/09/103',
      poNumber: 'PO-2024-001',
      planName: 'Milange Black Production',
      productName: 'Milange-Black',
      brand: 'UA Sports',
      brandCode: 'UAS01',
      category: 'Formal',
      type: 'Leather',
      gender: 'Men',
      artColour: 'Milange Black',
      color: 'Black',
      country: 'China',
      quantity: 1200,
      startDate: '2025-09-01',
      endDate: '2025-09-30',
      deliveryDate: '2025-10-15',
      priority: 'High',
      status: 'Planning',
      assignedPlant: 'Plant A - China',
      assignedTeam: 'Team Alpha',
      taskInc: 'Priyanka',
      targetCost: 1200,
      finalCost: 1250,
      poValue: 1875000,
      estimatedCost: 1875000,
      costVariance: {
        amount: 50,
        isOverBudget: true,
        percentage: '4.2'
      },
      materials: [
        { name: 'Upper (Rexine)', required: 60, available: 55 },
        { name: 'Lining (Skinfit)', required: 65, available: 70 },
        { name: 'Out Sole', required: 1500, available: 1520 },
        { name: 'Velcro & Buckles', required: 3000, available: 2800 }
      ],
      progress: 15,
      remarks: 'All Ok',
      createdDate: '2025-01-11',
      updatedDate: '2025-01-11'
    },
    {
      id: 'PP002',
      rdProjectId: 'rd-002',
      projectCode: 'RND/25-26/09/104',
      poNumber: 'PO-2024-002',
      planName: 'Cityfit Camo Production',
      productName: 'Cityfit-camo',
      brand: 'CityFit',
      brandCode: 'CIF02',
      category: 'Casual',
      type: 'CKD',
      gender: 'Men',
      artColour: 'Camo',
      color: 'Tan',
      country: 'India',
      quantity: 350,
      startDate: '2025-09-02',
      endDate: '2025-09-30',
      deliveryDate: '2025-10-10',
      priority: 'Medium',
      status: 'Capacity Allocated',
      assignedPlant: 'Plant B - India',
      assignedTeam: 'Team Beta',
      taskInc: 'Priyanka',
      targetCost: 850,
      finalCost: 890,
      poValue: 1780000,
      estimatedCost: 1780000,
      costVariance: {
        amount: 40,
        isOverBudget: true,
        percentage: '4.7'
      },
      materials: [
        { name: 'Upper (Synthetic)', required: 75, available: 80 },
        { name: 'Lining (Mesh)', required: 70, available: 65 },
        { name: 'Out Sole (Rubber)', required: 2000, available: 2100 },
        { name: 'Thread & Labels', required: 4000, available: 4500 }
      ],
      progress: 35,
      remarks: 'All ok',
      createdDate: '2025-01-08',
      updatedDate: '2025-01-11'
    },
    {
      id: 'PP003',
      rdProjectId: 'rd-003',
      projectCode: 'RND/25-26/09/105',
      poNumber: 'PO-2024-003',
      planName: 'KAPPA Black Production',
      productName: 'KAPPA-Black',
      brand: 'KAPPA',
      brandCode: 'KAP03',
      category: 'Sports',
      type: 'Running',
      gender: 'Men',
      artColour: 'KAPPA Black',
      color: 'Black',
      country: 'India',
      quantity: 1200,
      startDate: '2025-09-08',
      endDate: '2025-09-30',
      deliveryDate: '2025-10-05',
      priority: 'Medium',
      status: 'Manufacturing Assigned',
      assignedPlant: 'Plant C - India',
      assignedTeam: 'Team Gamma',
      taskInc: 'Priyanka',
      targetCost: 1050,
      finalCost: 1100,
      poValue: 1320000,
      estimatedCost: 1320000,
      costVariance: {
        amount: 50,
        isOverBudget: true,
        percentage: '4.8'
      },
      materials: [
        { name: 'Upper (Leather)', required: 55, available: 50 },
        { name: 'Lining (Fabric)', required: 60, available: 65 },
        { name: 'Zip & Hardware', required: 1200, available: 1100 },
        { name: 'Thread (Cotton)', required: 2400, available: 2600 }
      ],
      progress: 60,
      remarks: 'Size 11-upper issue',
      createdDate: '2025-01-05',
      updatedDate: '2025-01-10'
    },
    {
      id: 'PP004',
      rdProjectId: 'rd-004',
      projectCode: 'RND/25-26/09/106',
      poNumber: 'PO-2024-004',
      planName: 'Floral Baby P Production',
      productName: 'Floral-Baby-P',
      brand: 'FlexiWalk',
      brandCode: 'FLW01',
      category: 'Kids',
      type: 'Casual',
      gender: 'Kids',
      artColour: 'Floral Baby',
      color: 'Pink',
      country: 'Vietnam',
      quantity: 1200,
      startDate: '2025-09-05',
      endDate: '2025-09-30',
      deliveryDate: '2025-10-20',
      priority: 'High',
      status: 'Process Defined',
      assignedPlant: 'Plant D - Vietnam',
      assignedTeam: 'Team Delta',
      taskInc: 'Rajesh',
      targetCost: 1400,
      finalCost: 1450,
      poValue: 4350000,
      estimatedCost: 4350000,
      costVariance: {
        amount: 50,
        isOverBudget: true,
        percentage: '3.6'
      },
      materials: [
        { name: 'Upper (Mesh)', required: 105, available: 110 },
        { name: 'Out Sole (EVA)', required: 3000, available: 3200 },
        { name: 'Laces & Eyelets', required: 6000, available: 6500 },
        { name: 'Thread (Nylon)', required: 9000, available: 8800 }
      ],
      progress: 80,
      remarks: 'All ok',
      createdDate: '2025-01-03',
      updatedDate: '2025-01-11'
    },
    // Additional products to match the calendar image
    {
      id: 'PP005',
      rdProjectId: 'rd-005',
      projectCode: 'RND/25-26/09/107',
      poNumber: 'PO-2024-005',
      planName: 'Drift Grey Production',
      productName: 'Drift-Grey',
      brand: 'UrbanStep',
      brandCode: 'UST04',
      category: 'Casual',
      type: 'Sneakers',
      gender: 'Unisex',
      artColour: 'Drift Grey',
      color: 'Grey',
      country: 'Bangladesh',
      quantity: 936,
      startDate: '2025-09-07',
      endDate: '2025-09-30',
      deliveryDate: '2025-10-25',
      priority: 'Low',
      status: 'Ready for Production',
      assignedPlant: 'Plant E - Bangladesh',
      assignedTeam: 'Team Echo',
      taskInc: 'Sneha',
      targetCost: 1280,
      finalCost: 1320,
      poValue: 2376000,
      estimatedCost: 2376000,
      costVariance: {
        amount: 40,
        isOverBudget: true,
        percentage: '3.1'
      },
      materials: [
        { name: 'Upper (Synthetic Leather)', required: 80, available: 85 },
        { name: 'Sole (Rubber)', required: 1800, available: 1900 },
        { name: 'Metallic Paint', required: 270, available: 300 },
        { name: 'Thread (Polyester)', required: 3600, available: 3800 }
      ],
      progress: 95,
      remarks: 'Sole-180 Balance Sole -74',
      createdDate: '2025-01-01',
      updatedDate: '2025-01-11'
    }
  ]);

  const getStatusColor = (status: string) => {
    const colors = {
      'Planning': 'bg-blue-100 text-blue-800',
      'Capacity Allocated': 'bg-yellow-100 text-yellow-800',
      'Manufacturing Assigned': 'bg-purple-100 text-purple-800',
      'Process Defined': 'bg-orange-100 text-orange-800',
      'Ready for Production': 'bg-green-100 text-green-800',
      'In Production': 'bg-teal-100 text-teal-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'High': 'bg-red-500 text-white',
      'Medium': 'bg-purple-500 text-white',
      'Low': 'bg-green-600 text-white'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const filteredPlans = productionPlans.filter(plan => {
    const matchesSearch = plan.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || plan.status.toLowerCase().replace(' ', '-') === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  // Pagination helper functions
  const getPaginatedPlans = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPlans.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredPlans.length / itemsPerPage);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getResourceAvailability = (materials: Array<{ name: string; required: number; available: number }>) => {
    const total = materials.reduce((sum, mat) => sum + mat.required, 0);
    const available = materials.reduce((sum, mat) => sum + Math.min(mat.available, mat.required), 0);
    return (available / total) * 100;
  };

  // Status-based filtering counts
  const statusCounts = {
    planning: productionPlans.filter(p => p.status === 'Planning').length,
    capacityAllocated: productionPlans.filter(p => p.status === 'Capacity Allocated').length,
    manufacturingAssigned: productionPlans.filter(p => p.status === 'Manufacturing Assigned').length,
    processDefinied: productionPlans.filter(p => p.status === 'Process Defined').length,
    readyForProduction: productionPlans.filter(p => p.status === 'Ready for Production').length,
    inProgress: productionPlans.filter(p => p.status === 'In Production').length
  };

  // Calendar helper functions
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Start week on Monday
    return new Date(d.setDate(diff));
  };

  const getWeekDays = (weekStart: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getWeeksInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstWeekStart = getWeekStart(firstDay);
    const weeks = [];
    
    let currentWeek = new Date(firstWeekStart);
    while (currentWeek <= lastDay) {
      weeks.push(new Date(currentWeek));
      currentWeek.setDate(currentWeek.getDate() + 7);
    }
    
    return weeks;
  };

  const getProductionsForDate = (date: Date) => {
    return filteredPlans.filter(plan => {
      // Normalize dates to compare only date parts (ignore time)
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const startDate = new Date(plan.startDate);
      const planStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDate = new Date(plan.endDate);
      const planEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      return checkDate >= planStartDate && checkDate <= planEndDate;
    });
  };

  const getWeekTotal = (weekStart: Date) => {
    const weekDays = getWeekDays(weekStart);
    const weekProductions = weekDays.flatMap(day => getProductionsForDate(day));
    return weekProductions.reduce((total, plan) => total + plan.quantity, 0);
  };

  const getOrdinalSuffix = (num: number) => {
    if (num > 3 && num < 21) return 'th';
    switch (num % 10) {
      case 1: return 'st';
      case 2: return 'nd'; 
      case 3: return 'rd';
      default: return 'th';
    }
  };

  // Production card management functions
  const handleStartProduction = (plan: ProductionPlan) => {
    setSelectedPlan(plan);
    setIsCreateCardDialogOpen(true);
  };
  
  // Convert production plan to RD Project format for the dialog
  const convertPlanToRDProject = (plan: ProductionPlan | null) => {
    if (!plan) return null;
    
    // Find matching brand, category, type, color, country by name
    const brand = brands.find(b => b.brandName === plan.brand);
    const category = categories.find(c => c.categoryName === plan.category);
    const type = types.find(t => t.typeName === plan.type);
    const color = colors.find(c => c.colorName === plan.color);
    const country = countries.find(c => c.countryName === plan.country);
    
    return {
      id: plan.rdProjectId,
      autoCode: plan.projectCode,
      brandId: brand?.id || '1',
      categoryId: category?.id || '1',
      typeId: type?.id || '1',
      colorId: color?.id || '1',
      countryId: country?.id || '1',
      designerId: '3',
      status: 'Final Approved' as const,
      tentativeCost: plan.targetCost,
      targetCost: plan.targetCost,
      finalCost: plan.finalCost,
      difference: plan.finalCost - plan.targetCost,
      startDate: plan.startDate,
      endDate: plan.endDate,
      duration: Math.ceil((new Date(plan.endDate).getTime() - new Date(plan.startDate).getTime()) / (1000 * 60 * 60 * 24)),
      poTarget: plan.deliveryDate,
      poReceived: plan.deliveryDate,
      poNumber: plan.poNumber,
      poStatus: 'Approved' as const,
      poDelay: 0,
      nextUpdateDate: plan.updatedDate,
      remarks: plan.remarks,
      clientFeedback: 'OK' as const,
      priority: plan.priority,
      taskInc: plan.taskInc,
      updateNotes: '',
      createdDate: plan.createdDate,
      updatedDate: plan.updatedDate
    };
  };

  // Handle saving new production card from calendar
  const handleSaveProductionCard = (cardData: any) => {
    // Generate unique ID
    const newId = `PP${String(productionPlans.length + 1).padStart(3, '0')}`;
    
    // Create new production plan
    const newPlan: ProductionPlan = {
      id: newId,
      rdProjectId: `rd-${newId}`,
      projectCode: `RND/25-26/09/${100 + productionPlans.length + 1}`,
      poNumber: '-',
      planName: `${cardData.productName} Production`,
      productName: cardData.productName,
      brand: cardData.brand || '-',
      brandCode: '-',
      category: cardData.category || '-',
      type: cardData.type || '-',
      gender: cardData.gender || '-',
      artColour: cardData.artColour || '-',
      color: cardData.artColour || '-',
      country: cardData.country || '-',
      quantity: cardData.quantity,
      startDate: cardData.startDate,
      endDate: cardData.endDate,
      deliveryDate: cardData.endDate,
      priority: 'Medium',
      status: 'Planning',
      assignedPlant: cardData.assignedPlant || '-',
      assignedTeam: '-',
      taskInc: '-',
      targetCost: 0,
      finalCost: 0,
      poValue: 0,
      estimatedCost: 0,
      costVariance: {
        amount: 0,
        isOverBudget: false,
        percentage: '0%',
      },
      materials: [],
      progress: cardData.progress || 0,
      remarks: cardData.remarks || '',
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
    };

    // Add to production plans
    setProductionPlans([...productionPlans, newPlan]);
  };

  // Handle updating existing production card
  const handleUpdateProductionCard = (updatedData: any) => {
    // Find and update the production plan
    const updatedPlans = productionPlans.map(plan => 
      plan.id === updatedData.id ? updatedData : plan
    );
    
    // Update state
    setProductionPlans(updatedPlans);
  };

  // Handle production date change
  const handleProductionDateChange = () => {
    if (!selectedProductionForDateChange || !newProductionDate) {
      return;
    }

    // Update the production plan with new date
    const updatedPlans = productionPlans.map(plan => {
      if (plan.id === selectedProductionForDateChange.id) {
        return {
          ...plan,
          startDate: newProductionDate,
          endDate: newProductionDate,
          updatedDate: new Date().toISOString().split('T')[0]
        };
      }
      return plan;
    });

    setProductionPlans(updatedPlans);
    
    // Close dialog and reset state
    setIsDateChangeDialogOpen(false);
    setSelectedProductionForDateChange(null);
    setNewProductionDate('');
    
    // Show success toast
    toast.success('Production date updated successfully', {
      description: `Card moved to ${new Date(newProductionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Production Planning</h1>
            <p className="text-gray-600">Schedule and manage manufacturing operations from approved R&D projects</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>

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
                    <Label htmlFor="productCode">R&D Project Code</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select R&D project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RND/25-26/09/103">RND/25-26/09/103</SelectItem>
                        <SelectItem value="RND/25-26/09/104">RND/25-26/09/104</SelectItem>
                        <SelectItem value="RND/25-26/09/105">RND/25-26/09/105</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Production Quantity</Label>
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
                    <Label htmlFor="startDate">Production Start Date</Label>
                    <Input id="startDate" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Target Completion Date</Label>
                    <Input id="endDate" type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plantId">Assigned Manufacturing Plant</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plant-a-china">Plant A - China</SelectItem>
                      <SelectItem value="plant-b-india">Plant B - India</SelectItem>
                      <SelectItem value="plant-c-india">Plant C - India</SelectItem>
                      <SelectItem value="plant-d-vietnam">Plant D - Vietnam</SelectItem>
                      <SelectItem value="plant-e-bangladesh">Plant E - Bangladesh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Production Requirements & Notes</Label>
                  <Textarea id="notes" placeholder="Enter any production requirements, material specifications, or additional notes" />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreateDialogOpen(false)}>
                    Create Production Plan
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
                <div className="flex items-center mt-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600">From R&D Projects</span>
                </div>
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
                <p className="text-sm font-medium text-green-600 mb-1">Ready for Production</p>
                <p className="text-2xl font-bold text-green-900">
                  {statusCounts.readyForProduction + statusCounts.processDefinied}
                </p>
                <div className="flex items-center mt-2">
                  <Play className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">Ready to Start</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Factory className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">In Planning</p>
                <p className="text-2xl font-bold text-orange-900">
                  {statusCounts.planning + statusCounts.capacityAllocated + statusCounts.manufacturingAssigned}
                </p>
                <div className="flex items-center mt-2">
                  <Clock className="w-4 h-4 text-orange-500 mr-1" />
                  <span className="text-sm text-orange-600">Being Planned</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Total PO Value</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(productionPlans.reduce((sum, plan) => sum + plan.poValue, 0))}
                </p>
                <div className="flex items-center mt-2">
                  <IndianRupee className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-sm text-purple-600">Total Order Value</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
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
                  placeholder="Search production plans, PO numbers, products..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Select value={selectedFilter} onValueChange={(value) => {
                setSelectedFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[220px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="capacity-allocated">Capacity Allocated</SelectItem>
                  <SelectItem value="manufacturing-assigned">Manufacturing Assigned</SelectItem>
                  <SelectItem value="process-defined">Process Defined</SelectItem>
                  <SelectItem value="ready-for-production">Ready for Production</SelectItem>
                  <SelectItem value="in-production">In Production</SelectItem>
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

          {/* Production Plans List - Card Based */}
          {selectedView === 'list' ? (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image & Profile</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Art & Colour</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getPaginatedPlans().map((plan) => (
                      <tr 
                        key={plan.id} 
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedPlanForDetails(plan);
                          setIsPlanDetailsDialogOpen(true);
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono font-medium text-blue-600">{plan.projectCode}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            {plan.profileImage ? (
                              <img 
                                src={plan.profileImage} 
                                alt="Product" 
                                className="w-12 h-12 rounded-lg object-cover border border-gray-200 shadow-sm"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{plan.artColour}</span>
                            <span className="text-xs text-gray-500 mt-0.5">{plan.color}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono font-medium text-green-600">{plan.poNumber}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={`${getPriorityColor(plan.priority)} text-xs px-2 py-1`}>
                            {plan.priority}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredPlans.length === 0 && (
                  <div className="text-center py-12">
                    <Factory className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No production plans found</h3>
                    <p className="text-gray-600 mb-4">No production plans match your current search and filter criteria.</p>
                    <Button onClick={() => { setSearchTerm(''); setSelectedFilter('all'); setCurrentPage(1); }}>
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {filteredPlans.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {getPaginatedPlans().length} of {filteredPlans.length} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        size="sm"
                        variant={currentPage === page ? "default" : "outline"}
                        className={currentPage === page ? "bg-blue-500 hover:bg-blue-600" : ""}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={currentPage === getTotalPages()}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Calendar View */}
          {selectedView === 'calendar' && (
            <div className="space-y-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                    className="hover:bg-white/80 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Production Schedule
                  </h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                    className="hover:bg-white/80 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  {/* Month Total */}
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/50 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold text-blue-900">
                        {(() => {
                          // Calculate month total by summing daily quantities (similar to week totals)
                          const year = currentDate.getFullYear();
                          const month = currentDate.getMonth();
                          const firstDay = new Date(year, month, 1);
                          const lastDay = new Date(year, month + 1, 0);
                          let monthTotal = 0;
                          
                          for (let day = 1; day <= lastDay.getDate(); day++) {
                            const currentDay = new Date(year, month, day);
                            const dayProductions = getProductionsForDate(currentDay);
                            monthTotal += dayProductions.reduce((total, plan) => total + plan.quantity, 0);
                          }
                          
                          return monthTotal.toLocaleString();
                        })()}
                      </div>
                      <div className="text-xs text-blue-800 font-medium">Month Total</div>
                    </div>
                  </div>
                  
                  {/* Add Production Card Button */}
                  <Button
                    onClick={() => {
                      // Default to current viewing month's first day
                      const defaultDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
                      setSelectedCalendarDate(defaultDate);
                      setIsAddCardDialogOpen(true);
                    }}
                    className="bg-gradient-to-r from-[#0c9dcb] to-[#26b4e0] hover:from-[#0a8bb5] hover:to-[#1ea3c9] text-white shadow-lg hover:shadow-xl transition-all duration-200 h-10 px-6"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule New
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                    className="hover:bg-white/80 transition-colors"
                  >
                    Today
                  </Button>
                </div>
              </div>

              {/* Weekly Production Schedule - Responsive Grid Layout */}
              <div className="space-y-6">
                {getWeeksInMonth(currentDate).map((weekStart, weekIndex) => {
                  const weekDays = getWeekDays(weekStart);
                  const weekTotal = getWeekTotal(weekStart);
                  
                  return (
                    <div key={weekIndex} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                      {/* Week Header */}
                      <div className="bg-gradient-to-r from-violet-50 to-violet-100 p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">{weekIndex + 1}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-violet-900">Week {weekIndex + 1}</h3>
                              <p className="text-sm text-violet-600">
                                {weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {getWeekDays(weekStart)[6].toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-violet-800">{weekTotal.toLocaleString()}</div>
                            <div className="text-sm text-violet-600">Total Units</div>
                          </div>
                        </div>
                      </div>

                      {/* Days Grid */}
                      <div className="grid grid-cols-7 divide-x divide-gray-200">
                        {weekDays.map((day, dayIndex) => {
                          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                          const dayProductions = getProductionsForDate(day);
                          const isToday = day.toDateString() === new Date().toDateString();
                          const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                          const dayAbbrevs = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                          
                          // Get theme colors based on day
                          let headerBg = 'bg-gray-50';
                          let headerText = 'text-gray-700';
                          let cellBg = 'bg-white';
                          
                          if (dayIndex === 0 || dayIndex === 2 || dayIndex === 4) { // Mon, Wed, Fri
                            headerBg = 'bg-emerald-50';
                            headerText = 'text-emerald-700';
                            cellBg = 'bg-emerald-25';
                          } else if (dayIndex === 1 || dayIndex === 3) { // Tue, Thu
                            headerBg = 'bg-sky-50';
                            headerText = 'text-sky-700';
                            cellBg = 'bg-sky-25';
                          } else if (dayIndex === 5) { // Sat
                            headerBg = 'bg-slate-50';
                            headerText = 'text-slate-700';
                            cellBg = 'bg-slate-25';
                          } else if (dayIndex === 6) { // Sun
                            headerBg = 'bg-orange-50';
                            headerText = 'text-orange-700';
                            cellBg = 'bg-orange-25';
                          }

                          if (!isCurrentMonth) {
                            headerBg = 'bg-gray-50';
                            headerText = 'text-gray-400';
                            cellBg = 'bg-gray-50';
                          }

                          return (
                            <div key={dayIndex} className={`min-h-[200px] ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}>
                              {/* Day Header */}
                              <div className={`${headerBg} p-3 border-b border-gray-200`}>
                                <div className="text-center">
                                  <div className={`text-lg font-bold mb-2 ${headerText} ${isToday ? 'text-blue-600' : ''}`}>
                                    {String(day.getDate()).padStart(2, '0')} {dayAbbrevs[dayIndex]}
                                  </div>
                                  {dayProductions.length > 0 && (
                                    <div className="space-y-1 flex flex-col items-center">
                                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        {dayProductions.length} product{dayProductions.length !== 1 ? 's' : ''}
                                      </div>
                                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                        Total: {dayProductions.reduce((sum, prod) => sum + (prod.quantity || 0), 0)} units
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Day Content */}
                              <div className={`${cellBg} p-3 min-h-[160px]`}>
                                {isCurrentMonth ? (
                                  <div className="space-y-2">
                                    {dayProductions.map((production, idx) => (
                                      <div 
                                        key={idx} 
                                        onClick={() => {
                                          setSelectedProductionForView(production);
                                          setIsViewCardDialogOpen(true);
                                        }}
                                        className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer relative pb-8"
                                      >
                                        {/* Product Name and Quantity */}
                                        <div className="flex items-center justify-between mb-2">
                                          <h4 className="font-semibold text-gray-900 text-sm leading-tight truncate flex-1 mr-2">
                                            {production.productName}
                                          </h4>
                                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                                            {production.quantity.toLocaleString()}
                                          </span>
                                        </div>
                                        
                                        {/* Assigned Plant */}
                                        {production.assignedPlant && (
                                          <div className="flex items-center gap-1.5 mb-2">
                                            <Building className="w-3.5 h-3.5 text-emerald-600" />
                                            <span className="text-xs font-medium text-emerald-700">
                                              {production.assignedPlant}
                                            </span>
                                          </div>
                                        )}
                                        
                                        {/* Remarks */}
                                        {production.remarks && (
                                          <p className="text-xs text-gray-600 leading-relaxed">
                                            {production.remarks}
                                          </p>
                                        )}
                                        
                                        {/* Calendar Icon - Bottom Right */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedProductionForDateChange(production);
                                            setNewProductionDate(production.startDate);
                                            setIsDateChangeDialogOpen(true);
                                          }}
                                          className="absolute bottom-2 right-2 w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded-md flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 group"
                                          title="Change production date"
                                        >
                                          <Calendar className="w-3.5 h-3.5 text-white" />
                                        </button>
                                      </div>
                                    ))}
                                    
                                    {dayProductions.length === 0 && (
                                      <div className="flex items-center justify-center h-32 text-gray-400">
                                        <div className="text-center">
                                          <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                          <p className="text-xs">No production scheduled</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center h-32">
                                    <span className="text-gray-400 text-sm">{day.getDate()}</span>
                                  </div>
                                )}
                                
                                {/* Today indicator */}
                                {isToday && (
                                  <div className="absolute top-2 right-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Production Management Dialog */}
      <Dialog open={isProductionDialogOpen} onOpenChange={setIsProductionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Factory className="w-5 h-5 text-green-600" />
              Production Management - {selectedPlan?.planName}
            </DialogTitle>
            <DialogDescription>
              Manage production cards and track progress for this production plan.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="space-y-6">
              {/* Project Details */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Project Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-blue-600 mb-1">Project Code</p>
                    <p className="font-medium text-blue-900">{selectedPlan.projectCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 mb-1">Product Name</p>
                    <p className="font-medium text-blue-900">{selectedPlan.productName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 mb-1">Brand</p>
                    <p className="font-medium text-blue-900">{selectedPlan.brand}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 mb-1">Quantity</p>
                    <p className="font-medium text-blue-900">{selectedPlan.quantity.toLocaleString()} units</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 mb-1">Priority</p>
                    <Badge className={`${getPriorityColor(selectedPlan.priority)} text-xs`}>
                      {selectedPlan.priority}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 mb-1">Status</p>
                    <Badge className={`${getStatusColor(selectedPlan.status)} text-xs`}>
                      {selectedPlan.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 mb-1">Start Date</p>
                    <p className="font-medium text-blue-900">{formatDate(selectedPlan.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 mb-1">End Date</p>
                    <p className="font-medium text-blue-900">{formatDate(selectedPlan.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 mb-1">Assigned Plant</p>
                    <p className="font-medium text-blue-900">{selectedPlan.assignedPlant}</p>
                  </div>
                </div>
              </div>

              {/* Production Cards Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Production Cards</h3>
                  <Button onClick={() => setIsCreateCardDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Create Production Card
                  </Button>
                </div>

                {productionCards.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-900 mb-2">No Production Cards</h4>
                    <p className="text-gray-600 mb-4">Create production cards to organize and track different aspects of production.</p>
                    <Button onClick={() => setIsCreateCardDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Create Your First Card
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {productionCards.map((card) => (
                      <Card key={card.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">{card.cardName}</h4>
                            <Badge className={`${getPriorityColor(card.priority)} text-xs`}>
                              {card.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{card.description}</p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Assigned to:</span>
                              <span className="font-medium">{card.assignedTo}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Start Date:</span>
                              <span className="font-medium">{formatDate(card.startDate)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">End Date:</span>
                              <span className="font-medium">{formatDate(card.endDate)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Status:</span>
                              <Badge variant="outline" className="text-xs">
                                {card.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Production Card Dialog */}
      <CreateProductionCardDialog
        open={isCreateCardDialogOpen}
        onClose={() => setIsCreateCardDialogOpen(false)}
        selectedProject={convertPlanToRDProject(selectedPlan)}
      />

      {/* Add Production Card Dialog (from calendar) */}
      <AddProductionCardDialog
        open={isAddCardDialogOpen}
        onOpenChange={setIsAddCardDialogOpen}
        selectedDate={selectedCalendarDate}
        onSave={handleSaveProductionCard}
      />

      {/* View Production Card Dialog */}
      <ViewProductionCardDialog
        open={isViewCardDialogOpen}
        onOpenChange={setIsViewCardDialogOpen}
        productionData={selectedProductionForView}
        onSave={handleUpdateProductionCard}
      />

      {/* Production Plan Details Dialog */}
      <ProductionPlanDetailsDialog
        open={isPlanDetailsDialogOpen}
        onOpenChange={setIsPlanDetailsDialogOpen}
        plan={selectedPlanForDetails}
        onStartProduction={handleStartProduction}
      />

      {/* Change Production Date Dialog */}
      <Dialog open={isDateChangeDialogOpen} onOpenChange={setIsDateChangeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Change Production Date
            </DialogTitle>
            <DialogDescription>
              Select a new date for this production schedule
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedProductionForDateChange && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{selectedProductionForDateChange.productName}</h4>
                    <p className="text-sm text-gray-600">
                      Current: {new Date(selectedProductionForDateChange.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <Label>Select New Production Date *</Label>
              <div className="flex items-center justify-center border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CalendarUI
                  mode="single"
                  selected={newProductionDate ? new Date(newProductionDate) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setNewProductionDate(date.toISOString().split('T')[0]);
                    }
                  }}
                  className="rounded-md border-0"
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0) - 86400000)}
                />
              </div>
              <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5"></div>
                <p className="text-xs text-blue-700 leading-relaxed">
                  The production card will automatically move to the selected date in the calendar view
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDateChangeDialogOpen(false);
                setSelectedProductionForDateChange(null);
                setNewProductionDate('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProductionDateChange}
              disabled={!newProductionDate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Update Date
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProductionPlanning;