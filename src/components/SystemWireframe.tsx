import React, { useState } from 'react';
import { 
  Layout, 
  Component, 
  GitBranch, 
  Layers, 
  Navigation, 
  Database, 
  Settings, 
  Users, 
  BarChart3, 
  Package, 
  Factory, 
  Lightbulb,
  Eye,
  Code,
  Palette,
  Grid,
  Zap,
  Monitor,
  Smartphone,
  Tablet,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Play,
  Pause
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';

export function SystemWireframe() {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [wireframeView, setWireframeView] = useState('desktop');
  const [isAnimating, setIsAnimating] = useState(false);

  // System modules and their relationships
  const systemModules = [
    {
      id: 'dashboard',
      title: 'Executive Dashboard',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'bg-blue-500',
      position: { x: 50, y: 50 },
      connections: ['rd-dashboard', 'production', 'inventory'],
      description: 'Central hub for all system analytics and KPIs'
    },
    {
      id: 'rd-dashboard',
      title: 'R&D Management',
      icon: <Lightbulb className="w-6 h-6" />,
      color: 'bg-green-500',
      position: { x: 200, y: 50 },
      connections: ['production', 'master-data'],
      description: 'Research & Development project management'
    },
    {
      id: 'production',
      title: 'Production Management',
      icon: <Factory className="w-6 h-6" />,
      color: 'bg-orange-500',
      position: { x: 350, y: 50 },
      connections: ['inventory', 'quality'],
      description: 'Manufacturing and production planning'
    },
    {
      id: 'inventory',
      title: 'Inventory Management',
      icon: <Package className="w-6 h-6" />,
      color: 'bg-purple-500',
      position: { x: 200, y: 150 },
      connections: ['procurement', 'reports'],
      description: 'Stock management and supply chain'
    },
    {
      id: 'master-data',
      title: 'Master Data',
      icon: <Database className="w-6 h-6" />,
      color: 'bg-indigo-500',
      position: { x: 50, y: 150 },
      connections: ['user-management'],
      description: 'Core data management system'
    },
    {
      id: 'reports',
      title: 'Analytics & Reports',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'bg-red-500',
      position: { x: 350, y: 150 },
      connections: ['dashboard'],
      description: 'Business intelligence and reporting'
    }
  ];

  // Component library
  const componentLibrary = [
    {
      category: 'Layout',
      components: [
        { name: 'FigmaSidebar', description: 'Collapsible navigation sidebar', usage: 'Global navigation' },
        { name: 'Card', description: 'Content container with shadow', usage: 'Data presentation' },
        { name: 'Tabs', description: 'Tabbed interface component', usage: 'Content organization' },
      ]
    },
    {
      category: 'Data Display',
      components: [
        { name: 'Table', description: 'Responsive data table', usage: 'Tabular data display' },
        { name: 'Chart', description: 'Recharts integration', usage: 'Data visualization' },
        { name: 'Badge', description: 'Status indicators', usage: 'Labels and tags' },
      ]
    },
    {
      category: 'Forms & Input',
      components: [
        { name: 'Button', description: 'Interactive action buttons', usage: 'User actions' },
        { name: 'Input', description: 'Text input fields', usage: 'Data entry' },
        { name: 'Select', description: 'Dropdown selection', usage: 'Option selection' },
      ]
    },
    {
      category: 'Navigation',
      components: [
        { name: 'DropdownMenu', description: 'Context menus', usage: 'Action menus' },
        { name: 'Breadcrumb', description: 'Navigation trail', usage: 'Location indicator' },
        { name: 'Pagination', description: 'Page navigation', usage: 'Data pagination' },
      ]
    }
  ];

  // Design system tokens
  const designTokens = {
    colors: {
      primary: '#0c9dcb',
      secondary: '#26b4e0',
      accent: '#7c3aed',
      success: '#20c997',
      warning: '#ffc107',
      error: '#dc3545'
    },
    typography: {
      fontSize: '14px',
      headingWeight: '500',
      bodyWeight: '400'
    },
    spacing: {
      base: '0.5rem',
      card: '1.5rem',
      section: '2rem'
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem'
    }
  };

  // Wireframe screens
  const wireframeScreens = [
    {
      id: 'dashboard-wireframe',
      title: 'Executive Dashboard',
      components: ['Header', 'KPI Cards', 'Charts Grid', 'Activity Feed', 'Quick Actions']
    },
    {
      id: 'rd-wireframe',
      title: 'R&D Dashboard',
      components: ['Project Grid', 'Stage Pipeline', 'Cost Analysis', 'Designer Performance']
    },
    {
      id: 'production-wireframe',
      title: 'Production Planning',
      components: ['Brand Summary Table', 'Workflow Stages', 'Country Assignment', 'Status Overview']
    }
  ];

  const handleModuleClick = (moduleId: string) => {
    setSelectedComponent(moduleId);
    toast.info(`Viewing ${moduleId} module details`);
  };

  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
    if (!isAnimating) {
      toast.success('System flow animation started');
    } else {
      toast.info('Animation paused');
    }
  };

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">System Wireframe & Design Documentation</h1>
          <p className="text-gray-600">Comprehensive ERP system architecture and component library</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={toggleAnimation}
            className={`${isAnimating ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
          >
            {isAnimating ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isAnimating ? 'Pause Flow' : 'Animate Flow'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="architecture" className="space-y-6">
        <TabsList className="grid w-fit grid-cols-5 bg-white rounded-xl p-1 shadow-md">
          <TabsTrigger value="architecture" className="px-6 py-3">System Architecture</TabsTrigger>
          <TabsTrigger value="components" className="px-6 py-3">Component Library</TabsTrigger>
          <TabsTrigger value="wireframes" className="px-6 py-3">Wireframes</TabsTrigger>
          <TabsTrigger value="design-system" className="px-6 py-3">Design System</TabsTrigger>
          <TabsTrigger value="flows" className="px-6 py-3">User Flows</TabsTrigger>
        </TabsList>

        {/* System Architecture */}
        <TabsContent value="architecture" className="space-y-6">
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Layout className="w-6 h-6 text-[#0c9dcb]" />
                ERP System Architecture Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-50 rounded-xl p-8 min-h-[500px] overflow-hidden">
                {/* System modules as nodes */}
                {systemModules.map((module) => (
                  <div
                    key={module.id}
                    className={`absolute cursor-pointer transition-all duration-500 ${
                      isAnimating ? 'animate-pulse' : ''
                    }`}
                    style={{ 
                      left: `${module.position.x}px`, 
                      top: `${module.position.y}px`,
                      transform: selectedComponent === module.id ? 'scale(1.1)' : 'scale(1)'
                    }}
                    onClick={() => handleModuleClick(module.id)}
                  >
                    <div className={`${module.color} p-4 rounded-xl text-white shadow-lg hover:shadow-xl transition-shadow min-w-[140px]`}>
                      <div className="flex items-center gap-2 mb-2">
                        {module.icon}
                        <span className="font-semibold text-sm">{module.title}</span>
                      </div>
                      <p className="text-xs opacity-90">{module.description}</p>
                    </div>
                  </div>
                ))}

                {/* Connection lines */}
                <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
                  {systemModules.map((module) =>
                    module.connections.map((connectionId) => {
                      const targetModule = systemModules.find(m => m.id === connectionId);
                      if (!targetModule) return null;
                      
                      const startX = module.position.x + 70;
                      const startY = module.position.y + 40;
                      const endX = targetModule.position.x + 70;
                      const endY = targetModule.position.y + 40;
                      
                      return (
                        <line
                          key={`${module.id}-${connectionId}`}
                          x1={startX}
                          y1={startY}
                          x2={endX}
                          y2={endY}
                          stroke="#0c9dcb"
                          strokeWidth="2"
                          strokeDasharray={isAnimating ? "5,5" : "none"}
                          className={isAnimating ? "animate-pulse" : ""}
                        />
                      );
                    })
                  )}
                </svg>
              </div>

              {/* Module Details */}
              {selectedComponent && (
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    {systemModules.find(m => m.id === selectedComponent)?.title} Details
                  </h4>
                  <p className="text-blue-700 text-sm">
                    {systemModules.find(m => m.id === selectedComponent)?.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Component Library */}
        <TabsContent value="components" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {componentLibrary.map((category) => (
              <Card key={category.category} className="shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Component className="w-5 h-5 text-[#0c9dcb]" />
                    {category.category} Components
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {category.components.map((component) => (
                    <div key={component.name} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{component.name}</h4>
                        <Badge variant="outline" className="text-xs">{component.usage}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{component.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Wireframes */}
        <TabsContent value="wireframes" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Screen Wireframes</h3>
            <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-md">
              <Button
                variant={wireframeView === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setWireframeView('desktop')}
                className="px-4"
              >
                <Monitor className="w-4 h-4 mr-2" />
                Desktop
              </Button>
              <Button
                variant={wireframeView === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setWireframeView('tablet')}
                className="px-4"
              >
                <Tablet className="w-4 h-4 mr-2" />
                Tablet
              </Button>
              <Button
                variant={wireframeView === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setWireframeView('mobile')}
                className="px-4"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Mobile
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {wireframeScreens.map((screen) => (
              <Card key={screen.id} className="shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="text-lg">{screen.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`bg-gray-100 rounded-xl p-4 ${
                    wireframeView === 'desktop' ? 'aspect-video' : 
                    wireframeView === 'tablet' ? 'aspect-[4/3]' : 
                    'aspect-[9/16]'
                  }`}>
                    {/* Wireframe mockup */}
                    <div className="space-y-3 h-full">
                      {/* Header */}
                      <div className="bg-gray-300 h-8 rounded"></div>
                      {/* Content blocks */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-300 h-12 rounded"></div>
                        <div className="bg-gray-300 h-12 rounded"></div>
                      </div>
                      <div className="bg-gray-300 h-16 rounded"></div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-gray-300 h-8 rounded"></div>
                        <div className="bg-gray-300 h-8 rounded"></div>
                        <div className="bg-gray-300 h-8 rounded"></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <h5 className="font-semibold text-sm text-gray-900">Components Used:</h5>
                    <div className="flex flex-wrap gap-1">
                      {screen.components.map((comp) => (
                        <Badge key={comp} variant="secondary" className="text-xs">{comp}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Design System */}
        <TabsContent value="design-system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Color Palette */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-[#0c9dcb]" />
                  Color Palette
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(designTokens.colors).map(([name, color]) => (
                  <div key={name} className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl shadow-md"
                      style={{ backgroundColor: color }}
                    ></div>
                    <div>
                      <p className="font-semibold capitalize">{name}</p>
                      <p className="text-sm text-gray-600 font-mono">{color}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Typography */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Grid className="w-5 h-5 text-[#0c9dcb]" />
                  Typography System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h1 className="text-2xl font-medium mb-1">Heading 1</h1>
                  <p className="text-sm text-gray-600 font-mono">2xl / Medium</p>
                </div>
                <div>
                  <h2 className="text-xl font-medium mb-1">Heading 2</h2>
                  <p className="text-sm text-gray-600 font-mono">xl / Medium</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">Heading 3</h3>
                  <p className="text-sm text-gray-600 font-mono">lg / Medium</p>
                </div>
                <div>
                  <p className="text-base mb-1">Body Text</p>
                  <p className="text-sm text-gray-600 font-mono">base / Normal</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Caption Text</p>
                  <p className="text-sm text-gray-600 font-mono">sm / Normal</p>
                </div>
              </CardContent>
            </Card>

            {/* Spacing System */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-[#0c9dcb]" />
                  Spacing System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(designTokens.spacing).map(([name, value]) => (
                  <div key={name} className="flex items-center gap-4">
                    <div 
                      className="bg-blue-200 h-4"
                      style={{ width: `calc(${value} * 4)` }}
                    ></div>
                    <div>
                      <p className="font-semibold capitalize">{name}</p>
                      <p className="text-sm text-gray-600 font-mono">{value}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Border Radius */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-[#0c9dcb]" />
                  Border Radius
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(designTokens.borderRadius).map(([name, value]) => (
                  <div key={name} className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 bg-gray-300"
                      style={{ borderRadius: value }}
                    ></div>
                    <div>
                      <p className="font-semibold capitalize">{name}</p>
                      <p className="text-sm text-gray-600 font-mono">{value}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Flows */}
        <TabsContent value="flows" className="space-y-6">
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <GitBranch className="w-6 h-6 text-[#0c9dcb]" />
                Key User Flows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* R&D Project Creation Flow */}
                <div>
                  <h4 className="font-semibold text-lg mb-4">R&D Project Creation Flow</h4>
                  <div className="flex items-center gap-4 overflow-x-auto pb-4">
                    {[
                      'Login',
                      'R&D Dashboard', 
                      'Create Project',
                      'Upload Prototype',
                      'Cost Estimation',
                      'Submit for Approval',
                      'Red Seal Review',
                      'Green Seal Approval',
                      'Production Planning'
                    ].map((step, index, arr) => (
                      <div key={step} className="flex items-center gap-4 min-w-fit">
                        <div className="bg-[#0c9dcb] text-white px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap">
                          {step}
                        </div>
                        {index < arr.length - 1 && <ArrowRight className="w-4 h-4 text-gray-400" />}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Production Planning Flow */}
                <div>
                  <h4 className="font-semibold text-lg mb-4">Production Planning Flow</h4>
                  <div className="flex items-center gap-4 overflow-x-auto pb-4">
                    {[
                      'Approved Projects',
                      'Brand Selection', 
                      'Article Planning',
                      'Cost Finalization',
                      'PO Generation',
                      'Plant Assignment',
                      'Quality Control',
                      'Production Start'
                    ].map((step, index, arr) => (
                      <div key={step} className="flex items-center gap-4 min-w-fit">
                        <div className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap">
                          {step}
                        </div>
                        {index < arr.length - 1 && <ArrowRight className="w-4 h-4 text-gray-400" />}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Inventory Management Flow */}
                <div>
                  <h4 className="font-semibold text-lg mb-4">Inventory Management Flow</h4>
                  <div className="flex items-center gap-4 overflow-x-auto pb-4">
                    {[
                      'Material Request',
                      'Vendor Selection', 
                      'Purchase Order',
                      'Goods Receipt',
                      'Quality Check',
                      'Stock Update',
                      'Distribution'
                    ].map((step, index, arr) => (
                      <div key={step} className="flex items-center gap-4 min-w-fit">
                        <div className="bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap">
                          {step}
                        </div>
                        {index < arr.length - 1 && <ArrowRight className="w-4 h-4 text-gray-400" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}