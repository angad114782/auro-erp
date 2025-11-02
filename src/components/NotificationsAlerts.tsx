import React, { useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, X, Archive, Trash2, Filter, Search, Calendar, User, FileText, Settings, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { toast } from 'sonner@2.0.3';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: string;
  priority: 'high' | 'medium' | 'low';
  actionRequired?: boolean;
  relatedItem?: string;
  sender?: string;
}

export function NotificationsAlerts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Sample notifications data
  const notifications: Notification[] = [
    {
      id: 'NOT001',
      type: 'warning',
      title: 'Project Budget Exceeded',
      message: 'Project RND0002 has exceeded the allocated budget by ₹50,000. Immediate attention required.',
      timestamp: '2024-01-22T10:30:00Z',
      read: false,
      category: 'Budget Alert',
      priority: 'high',
      actionRequired: true,
      relatedItem: 'RND0002',
      sender: 'Finance Team'
    },
    {
      id: 'NOT002',
      type: 'success',
      title: 'Prototype Approved',
      message: 'Sneaker prototype for project RND0001 has received Green Seal approval. Ready for production planning.',
      timestamp: '2024-01-22T09:15:00Z',
      read: false,
      category: 'Project Update',
      priority: 'medium',
      relatedItem: 'RND0001',
      sender: 'Quality Team'
    },
    {
      id: 'NOT003',
      type: 'info',
      title: 'New Team Member Added',
      message: 'Designer Emily Johnson has been added to the R&D team. Please update project assignments.',
      timestamp: '2024-01-22T08:45:00Z',
      read: true,
      category: 'Team Update',
      priority: 'low',
      sender: 'HR Department'
    },
    {
      id: 'NOT004',
      type: 'error',
      title: 'Material Shortage Alert',
      message: 'Critical shortage of premium leather material. Current stock: 45 units. Minimum required: 200 units.',
      timestamp: '2024-01-22T07:20:00Z',
      read: false,
      category: 'Inventory Alert',
      priority: 'high',
      actionRequired: true,
      relatedItem: 'MAT-LEATHER-001',
      sender: 'Inventory Team'
    },
    {
      id: 'NOT005',
      type: 'info',
      title: 'Design Review Scheduled',
      message: 'Design review meeting for Summer Collection 2024 scheduled for tomorrow at 2:00 PM.',
      timestamp: '2024-01-21T16:30:00Z',
      read: true,
      category: 'Meeting',
      priority: 'medium',
      relatedItem: 'RND0003',
      sender: 'Project Manager'
    },
    {
      id: 'NOT006',
      type: 'warning',
      title: 'Deadline Approaching',
      message: 'Project RND0004 deadline is in 3 days. Current progress: 70%. Review timeline immediately.',
      timestamp: '2024-01-21T14:15:00Z',
      read: false,
      category: 'Deadline Alert',
      priority: 'high',
      actionRequired: true,
      relatedItem: 'RND0004',
      sender: 'System Alert'
    },
    {
      id: 'NOT007',
      type: 'success',
      title: 'Cost Analysis Complete',
      message: 'Costing analysis for Bacca Bucci Formal Collection has been completed. Results available in reports.',
      timestamp: '2024-01-21T11:00:00Z',
      read: true,
      category: 'Analysis Complete',
      priority: 'medium',
      relatedItem: 'RND0002',
      sender: 'Cost Analysis Team'
    },
    {
      id: 'NOT008',
      type: 'info',
      title: 'System Maintenance',
      message: 'Scheduled system maintenance on January 25th from 2:00 AM to 4:00 AM. Plan accordingly.',
      timestamp: '2024-01-21T09:30:00Z',
      read: false,
      category: 'System Update',
      priority: 'low',
      sender: 'IT Department'
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'info':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'unread' && !notification.read) ||
                         (selectedFilter === 'action-required' && notification.actionRequired) ||
                         notification.category.toLowerCase().includes(selectedFilter);
    return matchesSearch && matchesFilter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired).length;

  const handleMarkAsRead = (notificationId: string) => {
    toast.success('Notification marked as read');
  };

  const handleDelete = (notificationId: string) => {
    toast.success('Notification deleted');
  };

  const handleArchive = (notificationId: string) => {
    toast.success('Notification archived');
  };

  const NotificationDetailsDialog = () => (
    <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Notification Details</DialogTitle>
        </DialogHeader>
        {selectedNotification && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {getNotificationIcon(selectedNotification.type)}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedNotification.title}</h3>
                <p className="text-gray-600 mb-4">{selectedNotification.message}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Category:</span>
                    <Badge className={`ml-2 ${getTypeColor(selectedNotification.type)} border text-xs`}>
                      {selectedNotification.category}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Priority:</span>
                    <Badge className={`ml-2 ${getPriorityColor(selectedNotification.priority)} border text-xs`}>
                      {selectedNotification.priority.charAt(0).toUpperCase() + selectedNotification.priority.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Sender:</span>
                    <span className="ml-2 text-gray-900">{selectedNotification.sender}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Time:</span>
                    <span className="ml-2 text-gray-900">{formatTimestamp(selectedNotification.timestamp)}</span>
                  </div>
                  {selectedNotification.relatedItem && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600">Related Item:</span>
                      <Badge variant="outline" className="ml-2">
                        {selectedNotification.relatedItem}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {selectedNotification.actionRequired && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Action Required</h4>
                <p className="text-yellow-700 text-sm">This notification requires your immediate attention and action.</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => handleArchive(selectedNotification.id)}>
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </Button>
              <Button variant="outline" onClick={() => handleMarkAsRead(selectedNotification.id)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Read
              </Button>
              <Button className="bg-[#0c9dcb] hover:bg-[#0a8bb5] text-white">
                Take Action
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-[#0c9dcb] to-[#26b4e0] rounded-xl flex items-center justify-center shadow-lg">
          <Bell className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications & Alerts</h1>
          <p className="text-gray-600">Stay updated with system alerts and important updates</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Notifications</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Action Required</p>
                <p className="text-2xl font-bold text-gray-900">{actionRequiredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Resolved Today</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notifications</SelectItem>
              <SelectItem value="unread">Unread Only</SelectItem>
              <SelectItem value="action-required">Action Required</SelectItem>
              <SelectItem value="budget">Budget Alerts</SelectItem>
              <SelectItem value="project">Project Updates</SelectItem>
              <SelectItem value="inventory">Inventory Alerts</SelectItem>
              <SelectItem value="deadline">Deadline Alerts</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => toast.success('All notifications marked as read')}>
            Mark All Read
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                  notification.read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
                }`}
                onClick={() => setSelectedNotification(notification)}
              >
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className={`font-semibold ${notification.read ? 'text-gray-900' : 'text-gray-900'} mb-1`}>
                        {notification.title}
                        {!notification.read && <span className="w-2 h-2 bg-blue-500 rounded-full inline-block ml-2"></span>}
                      </h4>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{notification.message}</p>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {notification.sender}
                        </span>
                        {notification.relatedItem && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {notification.relatedItem}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={`${getTypeColor(notification.type)} border text-xs`}>
                        {notification.category}
                      </Badge>
                      <Badge className={`${getPriorityColor(notification.priority)} border text-xs`}>
                        {notification.priority}
                      </Badge>
                      {notification.actionRequired && (
                        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 border text-xs">
                          Action Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNotification(notification);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification.id);
                    }}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredNotifications.length === 0 && (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <NotificationDetailsDialog />
    </div>
  );
}