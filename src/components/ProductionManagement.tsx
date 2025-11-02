import React, { useState } from 'react';
import { Factory, Activity, BarChart3, Calendar, Play, CheckCircle, AlertTriangle, Clock, Target, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useERPStore } from '../lib/data-store';
import { CreateProductionCardDialog } from './CreateProductionCardDialog';
import { MaterialRequisitionDialog } from './MaterialRequisitionDialog';

// Import sub-components
import { ProductionDashboard } from './ProductionDashboard';
import ProductionPlanning from './ProductionPlanning';
import { ProductionAnalytics } from './ProductionAnalytics';
import { ProductionTrackingTable } from './ProductionTrackingTable';

interface ProductionManagementProps {
  currentSubModule?: string;
}

export function ProductionManagement({ currentSubModule }: ProductionManagementProps) {
  const { productionOrders, productionCards } = useERPStore();
  const [selectedSubModule, setSelectedSubModule] = useState('');
  const [selectedTab, setSelectedTab] = useState('production-cards');
  const [showStartProductionDialog, setShowStartProductionDialog] = useState(false);
  const [showMaterialRequisitionDialog, setShowMaterialRequisitionDialog] = useState(false);
  const [selectedProductionCard, setSelectedProductionCard] = useState<any>(null);

  React.useEffect(() => {
    if (currentSubModule) {
      setSelectedSubModule(currentSubModule);
    }
  }, [currentSubModule]);

  // Handler for Start Production button
  const handleStartProduction = (card: any) => {
    console.log('handleStartProduction called with card:', card);
    setSelectedProductionCard(card);
    setShowStartProductionDialog(true);
  };

  // Handler for Material Requisition button
  const handleMaterialRequisition = (card: any) => {
    console.log('handleMaterialRequisition called with card:', card);
    setSelectedProductionCard(card);
    setShowMaterialRequisitionDialog(true);
  };

  // Route to specific components based on sub-module
  if (selectedSubModule === 'production-dashboard') {
    return <ProductionDashboard onSubModuleChange={setSelectedSubModule} currentSubModule={selectedSubModule} />;
  }
  
  if (selectedSubModule === 'production-tracking') {
    return <ProductionTrackingTable />;
  }
  
  if (selectedSubModule === 'production-planning') {
    return <ProductionPlanning />;
  }
  
  if (selectedSubModule === 'production-analytics') {
    return <ProductionAnalytics />;
  }

  // Production process stages data
  const productionStages = [
    { 
      stage: 'Cutting', 
      count: 245, 
      icon: <CheckCircle className="w-4 h-4" />, 
      status: 'completed',
      color: 'bg-green-500',
      percentage: 100 
    },
    { 
      stage: 'Printing', 
      count: 198, 
      icon: <CheckCircle className="w-4 h-4" />, 
      status: 'completed',
      color: 'bg-green-500',
      percentage: 80.8 
    },
    { 
      stage: 'Upper', 
      count: 156, 
      icon: <Play className="w-4 h-4" />, 
      status: 'in-progress',
      color: 'bg-blue-500',
      percentage: 63.7 
    },
    { 
      stage: 'Upper REJ', 
      count: 142, 
      icon: <CheckCircle className="w-4 h-4" />, 
      status: 'approved',
      color: 'bg-green-500',
      percentage: 58.0 
    },
    { 
      stage: 'Assembly', 
      count: 89, 
      icon: <Play className="w-4 h-4" />, 
      status: 'in-progress',
      color: 'bg-blue-500',
      percentage: 36.3 
    },
    { 
      stage: 'Packing', 
      count: 45, 
      icon: <AlertTriangle className="w-4 h-4" />, 
      status: 'pending',
      color: 'bg-orange-500',
      percentage: 18.4 
    },
    { 
      stage: 'RFD', 
      count: 12, 
      icon: <Clock className="w-4 h-4" />, 
      status: 'ready',
      color: 'bg-purple-500',
      percentage: 4.9 
    }
  ];

  // Tab configuration matching R&D structure
  const tabConfig = [
    {
      id: 'production-cards',
      name: 'Production Cards',
      icon: <Factory className="w-4 h-4" />,
      count: productionCards?.length || 0
    },
    {
      id: 'live-production',
      name: 'Live Production',
      icon: <Activity className="w-4 h-4" />,
      count: productionOrders?.filter(p => !['Completed', 'Dispatched'].includes(p.status))?.length || 0
    },
    {
      id: 'completed-orders', 
      name: 'Completed Orders',
      icon: <CheckCircle className="w-4 h-4" />,
      count: productionOrders?.filter(p => ['Completed', 'Dispatched'].includes(p.status))?.length || 0
    },
    {
      id: 'cutting-stage',
      name: 'Cutting Stage',
      icon: <Factory className="w-4 h-4" />,
      count: productionStages[0].count
    },
    {
      id: 'printing-stage',
      name: 'Printing Stage',
      icon: <Activity className="w-4 h-4" />,
      count: productionStages[1].count
    },
    {
      id: 'upper-stage',
      name: 'Upper Stage',
      icon: <Play className="w-4 h-4" />,
      count: productionStages[2].count
    },
    {
      id: 'assembly-stage',
      name: 'Assembly Stage',
      icon: <Target className="w-4 h-4" />,
      count: productionStages[4].count
    },
    {
      id: 'packing-stage',
      name: 'Packing Stage',
      icon: <AlertTriangle className="w-4 h-4" />,
      count: productionStages[5].count
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Content Card - Matching R&D Layout */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Production Management</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Manufacturing process tracking: Cutting → Printing → Upper → Upper REJ → Assembly → Packing → RFD
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSelectedSubModule('production-dashboard')}
                className="px-4 py-2 bg-[#0c9dcb] text-white rounded-lg hover:bg-[#0c9dcb]/90 transition-colors"
              >
                <BarChart3 className="w-4 h-4 mr-2 inline" />
                Dashboard
              </button>
              <button 
                onClick={() => setSelectedSubModule('production-planning')}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-500/90 transition-colors"
              >
                <Calendar className="w-4 h-4 mr-2 inline" />
                Planning
              </button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Production Process Flow Visualization */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Process Flow</h3>
            <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl">
              {productionStages.map((stage, index) => (
                <div key={stage.stage} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-16 h-16 ${stage.color} rounded-full flex items-center justify-center text-white shadow-lg`}>
                      <div className="text-center">
                        <div className="font-bold text-lg">{stage.count}</div>
                        <div className="text-xs opacity-90">{stage.percentage}%</div>
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      <div className="font-semibold text-gray-900 text-sm">{stage.stage}</div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        {stage.icon}
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            stage.status === 'completed' ? 'bg-green-100 text-green-700' :
                            stage.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                            stage.status === 'approved' ? 'bg-green-100 text-green-700' :
                            stage.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                            'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {stage.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {index < productionStages.length - 1 && (
                    <div className="flex-1 h-0.5 bg-gray-300 mx-4 mt-[-40px]"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tabs - Matching R&D Structure */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <div className="grid w-full grid-cols-4 lg:grid-cols-8 mb-6 bg-white rounded-xl p-1 shadow-md gap-1">
              {tabConfig.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                    selectedTab === tab.id
                      ? 'bg-[#0c9dcb] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  <span className="text-xs font-medium hidden sm:block">{tab.name}</span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      selectedTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100'
                    }`}
                  >
                    {tab.count}
                  </Badge>
                </button>
              ))}
            </div>

            {tabConfig.map((tab) => (
              <TabsContent key={tab.id} value={tab.id}>
                {/* Production Cards Tab Content */}
                {tab.id === 'production-cards' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-semibold text-gray-900">Production Cards</h3>
                        <p className="text-sm text-gray-600">Managing {productionCards.length} production cards</p>
                      </div>
                    </div>

                    {/* Production Cards List */}
                    <div className="space-y-4">
                      {productionCards.length === 0 ? (
                        <div className="text-center py-12">
                          <Factory className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Production Cards Yet</h3>
                          <p className="text-gray-600 mb-4">Production cards will appear here when created from R&D projects.</p>
                        </div>
                      ) : (
                        productionCards.map((card) => (
                          <Card key={card.id} className="border hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-4 mb-3">
                                    <h4 className="font-semibold text-lg text-gray-900">{card.cardNumber}</h4>
                                    <Badge 
                                      variant="secondary" 
                                      className={`${
                                        card.status === 'Draft' ? 'bg-gray-100 text-gray-700' :
                                        card.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                                        card.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                                        card.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                        'bg-orange-100 text-orange-700'
                                      }`}
                                    >
                                      {card.status}
                                    </Badge>
                                    <Badge 
                                      variant="outline" 
                                      className="border-blue-200 text-blue-700"
                                    >
                                      {card.materialRequestStatus}
                                    </Badge>
                                  </div>
                                  <p className="text-gray-600 mb-2">{card.productName}</p>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-500">Quantity:</span>
                                      <span className="ml-2 font-medium">{card.cardQuantity} units</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Plant:</span>
                                      <span className="ml-2 font-medium capitalize">{card.assignedPlant}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Start Date:</span>
                                      <span className="ml-2 font-medium">{new Date(card.startDate).toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Created:</span>
                                      <span className="ml-2 font-medium">{new Date(card.createdDate).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                  {card.description && (
                                    <p className="text-sm text-gray-600 mt-3 italic">{card.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                                    onClick={() => handleMaterialRequisition(card)}
                                  >
                                    <ShoppingCart className="w-4 h-4 mr-1 inline" />
                                    Materials
                                  </button>
                                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm" onClick={() => handleStartProduction(card)}>
                                    <Play className="w-4 h-4 mr-1 inline" />
                                    Start
                                  </button>
                                  <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm">
                                    <Activity className="w-4 h-4 mr-1 inline" />
                                    Track
                                  </button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Other Tab Contents */}
                {tab.id !== 'production-cards' && (
                  <div>
                    {/* Quick Action Buttons */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-semibold text-gray-900">{tab.name}</h3>
                        <p className="text-sm text-gray-600">Managing {tab.count} items in this category</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedSubModule('production-tracking')}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <Activity className="w-4 h-4 mr-2 inline" />
                          View Tracking
                        </button>
                        <button 
                          onClick={() => setSelectedSubModule('production-analytics')}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <BarChart3 className="w-4 h-4 mr-2 inline" />
                          Analytics
                        </button>
                      </div>
                    </div>

                    {/* Content Area - Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="border hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">Total Units</p>
                              <p className="text-2xl font-bold text-gray-900">{tab.count}</p>
                              <div className="flex items-center mt-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                                <span className="text-sm text-green-600">On Track</span>
                              </div>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              {tab.icon}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">Efficiency</p>
                              <p className="text-2xl font-bold text-gray-900">94.2%</p>
                              <div className="flex items-center mt-2">
                                <Target className="w-4 h-4 text-blue-500 mr-1" />
                                <span className="text-sm text-blue-600">Target: 95%</span>
                              </div>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-6 h-6 text-green-500" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">Est. Completion</p>
                              <p className="text-2xl font-bold text-gray-900">2-3 Days</p>
                              <div className="flex items-center mt-2">
                                <Clock className="w-4 h-4 text-orange-500 mr-1" />
                                <span className="text-sm text-orange-600">In Progress</span>
                              </div>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                              <Clock className="w-6 h-6 text-orange-500" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Call-to-Action Message */}
                    <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="text-center">
                        <Factory className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to dive deeper?</h3>
                        <p className="text-gray-600 mb-4">
                          Access detailed production tracking and analytics for comprehensive manufacturing insights.
                        </p>
                        <div className="flex justify-center gap-3">
                          <button 
                            onClick={() => setSelectedSubModule('production-tracking')}
                            className="px-6 py-2 bg-[#0c9dcb] text-white rounded-lg hover:bg-[#0c9dcb]/90 transition-colors"
                          >
                            <Activity className="w-4 h-4 mr-2 inline" />
                            Production Tracking
                          </button>
                          <button 
                            onClick={() => setSelectedSubModule('production-dashboard')}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            <BarChart3 className="w-4 h-4 mr-2 inline" />
                            Dashboard View
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Start Production Dialog */}
      <CreateProductionCardDialog
        open={showStartProductionDialog}
        onClose={() => {
          setShowStartProductionDialog(false);
          setSelectedProductionCard(null);
        }}
        selectedProductionCard={selectedProductionCard}
      />
      
      {/* Material Requisition Dialog */}
      <MaterialRequisitionDialog
        open={showMaterialRequisitionDialog}
        onOpenChange={setShowMaterialRequisitionDialog}
        productionCardId={selectedProductionCard?.cardNumber}
        productName={selectedProductionCard?.productName}
      />
    </div>
  );
}