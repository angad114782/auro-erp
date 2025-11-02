import React, { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Lightbulb, ImageIcon, Workflow, Calculator, Clock, User, IndianRupee, Calendar, FileText, Target, LayoutDashboard, X, Building, Users, AlertCircle, CheckCircle, Activity, Pause, ShoppingCart, CircleCheckBig, CircleX, Package, ChevronLeft, ChevronRight, Upload, Download, Filter, FileSpreadsheet, FileX, FileUp } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useERPStore } from '../lib/data-store';
import { CreateProjectDialog } from './CreateProjectDialog';
import { ProjectDetailsDialog } from './ProjectDetailsDialog';
import { ImportTemplateGenerator } from './ImportTemplateGenerator';
import { toast } from 'sonner@2.0.3';
import type { RDProject } from '../lib/data-store';

export function ProjectDevelopment() {
  const { 
    rdProjects, 
    brands, 
    categories, 
    types, 
    colors, 
    countries, 
    selectRDProject,
    addRDProject 
  } = useERPStore();

  // Footwear product data from reference
  const footwearProducts = [
    { name: 'Chunky Mickey', company: 'SportTech International', brand: 'UA Sports' },
    { name: 'Hydro Dipping Film', company: 'AquaTech Industries Pvt Ltd', brand: 'AquaTech Pro' },
    { name: 'Red zip pocket', company: 'ZipStyle Footwear Co.', brand: 'ZipStyle Elite' },
    { name: 'Black Buckles', company: 'BuckleMax Corporation', brand: 'BuckleMax Premium' },
    { name: 'Cross Rope', company: 'RopeFlex Manufacturers', brand: 'RopeFlex Active' },
    { name: 'UA China EVA slide', company: 'China EVA Exports Ltd', brand: 'UA China' },
    { name: 'Lime strip', company: 'ColorStrip Designs India', brand: 'ColorStrip Fashion' },
    { name: 'Cavity V Camo', company: 'CamoTech Solutions', brand: 'CamoTech Outdoor' },
    { name: 'Black Cross tape', company: 'TapeCross Industries', brand: 'TapeCross Sport' },
    { name: 'UA "V"', company: 'Victory Footwear Ltd', brand: 'UA Victory' },
    { name: 'Halo', company: 'HaloSport Enterprises', brand: 'HaloSport Premium' },
    { name: 'UA Porous', company: 'Porous Tech India Pvt Ltd', brand: 'UA Porous' },
    { name: 'Brown slide', company: 'EarthTone Manufacturers', brand: 'EarthTone Natural' },
    { name: 'Silver Mesh', company: 'MeshTech Innovations', brand: 'MeshTech Advanced' },
    { name: 'Black Pocket', company: 'PocketStyle Fashion House', brand: 'PocketStyle Urban' },
    { name: 'Cross Tape white', company: 'TapeCross Industries', brand: 'TapeCross Classic' },
    { name: 'Removable sticker', company: 'StickerTech Solutions Ltd', brand: 'StickerTech Flex' },
    { name: 'Chunky Frozen', company: 'FrozenStyle Footwear Inc', brand: 'FrozenStyle Winter' }
  ];

  const getProductData = (index: number) => {
    const productIndex = index % footwearProducts.length;
    return footwearProducts[productIndex];
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<RDProject | null>(null);

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'Idea Submitted': 'bg-blue-100 text-blue-800',
      'Costing Pending': 'bg-yellow-100 text-yellow-800',
      'Costing Received': 'bg-orange-100 text-orange-800',
      'Prototype': 'bg-purple-100 text-purple-800',
      'Red Seal': 'bg-red-100 text-red-800',
      'Green Seal': 'bg-green-100 text-green-800',
      'Final Approved': 'bg-emerald-100 text-emerald-800',
      'PO Issued': 'bg-gray-100 text-gray-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'High': 'bg-red-500 text-white',
      'Medium': 'bg-purple-500 text-white',
      'Low': 'bg-green-600 text-white'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getProgressValue = (stage: string) => {
    const stages = ['Idea Submitted', 'Costing Pending', 'Costing Received', 'Prototype', 'Red Seal', 'Green Seal', 'Final Approved', 'PO Issued'];
    return ((stages.indexOf(stage) + 1) / stages.length) * 100;
  };

  const getDevelopmentProjects = () => {
    const searchFiltered = rdProjects.filter(project => {
      const matchesSearch = (project.autoCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                           (project.remarks?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    return searchFiltered.filter(p => p.status === 'Prototype' || p.status === 'Costing Received');
  };

  const getPaginatedProjects = (projects: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return projects.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / itemsPerPage);
  };

  const handleProjectClick = (project: RDProject) => {
    setSelectedProject(project);
    setProjectDetailsOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Calculate duration between start date and PO target date
  const calculateDuration = (startDate: string, poTargetDate?: string) => {
    if (!poTargetDate) return 'TBD';
    
    const start = new Date(startDate);
    const target = new Date(poTargetDate);
    
    // Calculate difference in days
    const diffTime = target.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    return `${diffDays} days`;
  };

  const developmentProjects = getDevelopmentProjects();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Project Development</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Manage development projects and track progress
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => toast.info('Import functionality coming soon')}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button 
                className="bg-[#0c9dcb] hover:bg-[#0c9dcb]/90"
                onClick={() => setNewProjectOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Project
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search development projects..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Projects Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image & Profile</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company & Brand</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category, Type & Gender</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Art & Colour</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline, Dates & Duration</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task-INC</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getPaginatedProjects(developmentProjects).map((project, index) => {
                  const brand = brands.find(b => b.id === project.brandId);
                  const category = categories.find(c => c.id === project.categoryId);
                  const type = types.find(t => t.id === project.typeId);
                  const color = colors.find(cl => cl.id === project.colorId);
                  const country = countries.find(co => co.id === project.countryId);
                  const productData = getProductData(index);

                  return (
                    <tr 
                      key={project.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleProjectClick(project)}
                    >
                      {/* Product Code */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                            {String(index + 1).padStart(2, '0')}
                          </div>
                          <div className="text-sm font-medium text-gray-900">{project.autoCode}</div>
                        </div>
                      </td>

                      {/* Image & Profile */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 shadow-sm flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        </div>
                      </td>

                      {/* Company & Brand */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{productData.company}</div>
                          <div className="text-sm text-gray-500">{productData.brand}</div>
                        </div>
                      </td>

                      {/* Category, Type & Gender */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{category?.categoryName}</div>
                          <div className="text-sm text-gray-500">{type?.typeName}</div>
                          <div className="text-xs text-gray-400">Men</div>
                        </div>
                      </td>

                      {/* Art & Colour */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{productData.name}</div>
                          <div className="text-sm text-gray-500">{color?.colorName}</div>
                        </div>
                      </td>

                      {/* Country */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{country?.countryName}</div>
                      </td>

                      {/* Timeline, Dates & Duration */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Clock className="w-3 h-3" />
                            <span>Start: {new Date(project.startDate).toLocaleDateString('en-GB')}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-1">
                            <Target className="w-3 h-3" />
                            <span>Target: {project.poTarget ? new Date(project.poTarget).toLocaleDateString('en-GB') : 'TBD'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className={`font-medium ${
                              project.poTarget && calculateDuration(project.startDate, project.poTarget).includes('overdue') 
                                ? 'text-red-600' 
                                : project.poTarget && calculateDuration(project.startDate, project.poTarget).includes('Due today')
                                ? 'text-orange-600'
                                : 'text-gray-700'
                            }`}>
                              Duration: {calculateDuration(project.startDate, project.poTarget)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${getStageColor(project.status)}`}>
                          {project.status}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs leading-4 font-semibold rounded ${getPriorityColor(project.priority || 'Low')}`}>
                          {project.priority || 'Low'}
                        </span>
                      </td>

                      {/* Task-INC */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{project.taskInc || 'Priyanka'}</div>
                      </td>

                      {/* Remarks */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">Next: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}</div>
                          <div className="text-sm text-gray-500">{project.clientFeedback}</div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2 justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.error('Delete functionality not implemented yet');
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {developmentProjects.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No development projects found</h3>
              <p className="text-gray-600">Start by creating a new project or adjust your search filters.</p>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Showing {getPaginatedProjects(developmentProjects).length} of {developmentProjects.length} results
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button size="sm" className="bg-blue-500 hover:bg-blue-600">1</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateProjectDialog
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
      />

      <ProjectDetailsDialog
  open={projectDetailsOpen}
  onOpenChange={setProjectDetailsOpen}
  project={selectedProject}
  brands={brands}
  categories={categories}
  types={types}
  colors={colors}
  countries={countries}
/>
    </div>
  );
}