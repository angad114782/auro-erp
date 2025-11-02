import React, { useState } from 'react';
import { 
  Database, Search, Filter, Download, RefreshCw, Eye, Edit, ChevronDown,
  Package, Calendar, IndianRupee, Users, MapPin, Clock, CheckCircle, 
  AlertTriangle, Target, TrendingUp, FileText, MoreHorizontal, Building,
  Palette, Tag, User, Factory, ClipboardList
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useERPStore } from '../lib/data-store';
import { ProjectDetailsDialog } from './ProjectDetailsDialog';

interface MasterDataManagementProps {
  currentSubModule?: string;
}

export function MasterDataManagement({ currentSubModule }: MasterDataManagementProps) {
  const { rdProjects, brands, categories, types, colors, countries, users } = useERPStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Helper functions to get names from IDs
  const getBrandName = (brandId: string) => brands.find(b => b.id === brandId)?.brandName || 'Unknown';
  const getCategoryName = (categoryId: string) => categories.find(c => c.id === categoryId)?.categoryName || 'Unknown';
  const getTypeName = (typeId: string) => types.find(t => t.id === typeId)?.typeName || 'Unknown';
  const getColorName = (colorId: string) => colors.find(c => c.id === colorId)?.colorName || 'Unknown';
  const getCountryName = (countryId: string) => countries.find(c => c.id === countryId)?.countryName || 'Unknown';
  const getDesignerName = (designerId: string) => users.find(u => u.id === designerId)?.userName || 'Unknown';

  // Filter projects based on search term
  const filteredProjects = rdProjects.filter(project => 
    project.autoCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getBrandName(project.brandId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCategoryName(project.categoryId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getDesignerName(project.designerId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Idea Submitted': { color: 'bg-blue-100 text-blue-800', icon: <AlertTriangle className="w-3 h-3" /> },
      'Costing Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" /> },
      'Costing Received': { color: 'bg-orange-100 text-orange-800', icon: <IndianRupee className="w-3 h-3" /> },
      'Prototype': { color: 'bg-purple-100 text-purple-800', icon: <Package className="w-3 h-3" /> },
      'Red Seal': { color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="w-3 h-3" /> },
      'Green Seal': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      'Final Approved': { color: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="w-3 h-3" /> },
      'PO Issued': { color: 'bg-cyan-100 text-cyan-800', icon: <FileText className="w-3 h-3" /> }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Idea Submitted'];
    
    return (
      <Badge className={`${config.color} flex items-center gap-1 px-2 py-1`}>
        {config.icon}
        <span className="text-xs font-medium">{status}</span>
      </Badge>
    );
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleViewProject = (project: any) => {
    setSelectedProject(project);
    setShowProjectDialog(true);
  };

  // Statistics cards
  const totalProjects = filteredProjects.length;
  const activeProjects = filteredProjects.filter(p => !['Final Approved', 'PO Issued'].includes(p.status)).length;
  const completedProjects = filteredProjects.filter(p => ['Final Approved', 'PO Issued'].includes(p.status)).length;
  const avgProjectDuration = totalProjects > 0 ? Math.round(filteredProjects.reduce((sum, p) => sum + p.duration, 0) / totalProjects) : 0;

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        {/* Title and Description */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Master Data Management</h1>
              <p className="text-gray-600 mt-1">Complete product lifecycle tracking from R&D to production</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="h-9">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by project code, brand, category, status, or designer..."
            className="pl-10 h-10"
          />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Projects</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalProjects}</p>
                </div>
                <ClipboardList className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Projects</p>
                  <p className="text-2xl font-semibold text-gray-900">{activeProjects}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">{completedProjects}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                  <p className="text-2xl font-semibold text-gray-900">{avgProjectDuration}d</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Comprehensive Data Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Product Lifecycle Data</CardTitle>
            <Badge variant="outline" className="text-sm">
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="min-w-[140px] font-semibold">Project Code</TableHead>
                  <TableHead className="min-w-[120px] font-semibold">Brand & Category</TableHead>
                  <TableHead className="min-w-[120px] font-semibold">Type & Color</TableHead>
                  <TableHead className="min-w-[100px] font-semibold">Designer</TableHead>
                  <TableHead className="min-w-[140px] font-semibold">Current Status</TableHead>
                  <TableHead className="min-w-[150px] font-semibold">Cost Analysis (₹)</TableHead>
                  <TableHead className="min-w-[120px] font-semibold">Timeline</TableHead>
                  <TableHead className="min-w-[120px] font-semibold">PO Information</TableHead>
                  <TableHead className="min-w-[100px] font-semibold">Location</TableHead>
                  <TableHead className="min-w-[80px] font-semibold">Priority</TableHead>
                  <TableHead className="w-[80px] font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <TableRow key={project.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div className="font-mono text-sm font-semibold text-blue-600">
                            {project.autoCode}
                          </div>
                          <div className="text-xs text-gray-500">
                            Created: {new Date(project.createdDate).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Building className="w-3 h-3 text-gray-400" />
                            <span className="text-sm font-medium">{getBrandName(project.brandId)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Tag className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600">{getCategoryName(project.categoryId)}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Package className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{getTypeName(project.typeId)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Palette className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600">{getColorName(project.colorId)}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{getDesignerName(project.designerId)}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-2">
                          {getStatusBadge(project.status)}
                          <div className="text-xs text-gray-500">
                            Next: {new Date(project.nextUpdateDate).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tentative:</span>
                            <span className="font-medium">₹{project.tentativeCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Target:</span>
                            <span className="font-medium">₹{project.targetCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Final:</span>
                            <span className="font-medium">₹{project.finalCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Diff:</span>
                            <span className={`font-medium ${project.difference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                              ₹{Math.abs(project.difference).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Start:</span>
                            <span>{new Date(project.startDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">End:</span>
                            <span>{new Date(project.endDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration:</span>
                            <span className="font-medium">{project.duration} days</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          {project.poNumber ? (
                            <>
                              <div className="font-medium text-blue-600">{project.poNumber}</div>
                              <div className="text-gray-600">Target: {new Date(project.poTarget).toLocaleDateString()}</div>
                              <div className="text-gray-600">Received: {new Date(project.poReceived).toLocaleDateString()}</div>
                              <Badge className={`text-xs px-1 py-0.5 ${project.poStatus === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {project.poStatus}
                              </Badge>
                            </>
                          ) : (
                            <span className="text-gray-400">Not issued</span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{getCountryName(project.countryId)}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={`text-xs px-2 py-1 ${
                          project.priority === 'High' ? 'bg-red-100 text-red-800' :
                          project.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.priority}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewProject(project)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Database className="w-12 h-12 text-gray-300" />
                        <div>
                          <p className="text-gray-500 font-medium">No projects found</p>
                          {searchTerm && (
                            <p className="text-sm text-gray-400 mt-1">
                              Try adjusting your search terms
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Project Details Dialog */}
      <ProjectDetailsDialog
        open={showProjectDialog}
        project={selectedProject}
        onOpenChange={(open: boolean) => {
          setShowProjectDialog(open);
          if (!open) setSelectedProject(null);
        }}
      />
    </div>
  );
}