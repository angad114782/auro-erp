import React, { useState } from "react";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  EyeOff,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { toast } from "sonner@2.0.3";

interface UserData {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  createdDate: string;
}

export function UserManagement() {
  // Dynamic roles list
  const [rolesList, setRolesList] = useState<string[]>([
    "Admin",
    "Manager",
    "Supervisor",
  ]);

  // Sample user data
  const [users, setUsers] = useState<UserData[]>([
    {
      id: "USR001",
      name: "Rajesh Kumar",
      email: "rajesh.kumar@nerowink.com",
      password: "Admin@123",
      role: "Admin",
      createdDate: "2024-01-15",
    },
    {
      id: "USR002",
      name: "Priya Sharma",
      email: "priya.sharma@nerowink.com",
      password: "Manager@456",
      role: "Manager",
      createdDate: "2024-02-10",
    },
    {
      id: "USR003",
      name: "Amit Patel",
      email: "amit.patel@nerowink.com",
      password: "Super@789",
      role: "Supervisor",
      createdDate: "2024-03-05",
    },
    {
      id: "USR004",
      name: "Sneha Desai",
      email: "sneha.desai@nerowink.com",
      password: "Manager@321",
      role: "Manager",
      createdDate: "2024-03-20",
    },
    {
      id: "USR005",
      name: "Vikram Singh",
      email: "vikram.singh@nerowink.com",
      password: "Super@654",
      role: "Supervisor",
      createdDate: "2024-04-01",
    },
    {
      id: "USR006",
      name: "Kavita Reddy",
      email: "kavita.reddy@nerowink.com",
      password: "Admin@987",
      role: "Admin",
      createdDate: "2024-04-15",
    },
    {
      id: "USR007",
      name: "Arjun Mehta",
      email: "arjun.mehta@nerowink.com",
      password: "Super@147",
      role: "Supervisor",
      createdDate: "2024-05-10",
    },
    {
      id: "USR008",
      name: "Pooja Nair",
      email: "pooja.nair@nerowink.com",
      password: "Manager@258",
      role: "Manager",
      createdDate: "2024-05-25",
    },
    {
      id: "USR009",
      name: "Rohit Gupta",
      email: "rohit.gupta@nerowink.com",
      password: "Super@369",
      role: "Supervisor",
      createdDate: "2024-06-05",
    },
    {
      id: "USR010",
      name: "Ananya Iyer",
      email: "ananya.iyer@nerowink.com",
      password: "Manager@741",
      role: "Manager",
      createdDate: "2024-06-20",
    },
    {
      id: "USR011",
      name: "Karan Joshi",
      email: "karan.joshi@nerowink.com",
      password: "Admin@852",
      role: "Admin",
      createdDate: "2024-07-01",
    },
    {
      id: "USR012",
      name: "Divya Bansal",
      email: "divya.bansal@nerowink.com",
      password: "Super@963",
      role: "Supervisor",
      createdDate: "2024-07-15",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showPasswordId, setShowPasswordId] = useState<string | null>(null);

  // Add New Role Dialog
  const [addRoleDialogOpen, setAddRoleDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  // Form fields for new/edit user
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Manager",
  });

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      Admin: "bg-purple-100 text-purple-800 border-purple-200",
      Manager: "bg-blue-100 text-blue-800 border-blue-200",
      Supervisor: "bg-green-100 text-green-800 border-green-200",
    };
    return colors[role] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Filter users based on search
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Add New Role
  const handleAddRole = () => {
    if (!newRoleName.trim()) {
      toast.error("Please enter role name");
      return;
    }

    if (rolesList.includes(newRoleName)) {
      toast.error("Role already exists");
      return;
    }

    setRolesList([...rolesList, newRoleName]);
    setFormData({ ...formData, role: newRoleName });
    setNewRoleName("");
    setAddRoleDialogOpen(false);
    toast.success("Role added successfully");
  };

  const handleCloseAddRoleDialog = () => {
    setAddRoleDialogOpen(false);
    setNewRoleName("");
  };

  // Add User
  const handleAddUser = () => {
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    const newUser: UserData = {
      id: `USR${String(users.length + 1).padStart(3, "0")}`,
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      createdDate: new Date().toISOString().split("T")[0],
    };

    setUsers([...users, newUser]);
    setAddUserDialogOpen(false);
    setFormData({ name: "", email: "", password: "", role: "Manager" });
    toast.success("User added successfully");
  };

  // Edit User
  const handleEditClick = (user: UserData) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
    });
    setEditUserDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    const updatedUsers = users.map((user) =>
      user.id === selectedUser.id ? { ...user, ...formData } : user
    );

    setUsers(updatedUsers);
    setEditUserDialogOpen(false);
    setSelectedUser(null);
    setFormData({ name: "", email: "", password: "", role: "Manager" });
    toast.success("User updated successfully");
  };

  // Delete User
  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter((user) => user.id !== userId));
      toast.success("User deleted successfully");
    }
  };

  // Reset form on dialog close
  const handleCloseAddDialog = () => {
    setAddUserDialogOpen(false);
    setFormData({ name: "", email: "", password: "", role: "Manager" });
  };

  const handleCloseEditDialog = () => {
    setEditUserDialogOpen(false);
    setSelectedUser(null);
    setFormData({ name: "", email: "", password: "", role: "Manager" });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">User Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage system users and assign roles (Admin, Manager, Supervisor)
          </p>
        </div>
        <Button
          onClick={() => setAddUserDialogOpen(true)}
          className="bg-[#0c9dcb] hover:bg-[#0a8bb5] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 bg-white border-gray-300"
          />
        </div>
        <div className="text-sm text-gray-600">
          Total Users:{" "}
          <span className="font-semibold text-[#0c9dcb]">
            {filteredUsers.length}
          </span>
        </div>
      </div>

      {/* Table Card */}
      <Card className="shadow-lg border border-gray-200 rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Password
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    {/* Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#0c9dcb] to-[#26b4e0] flex items-center justify-center text-white shrink-0">
                          <span className="text-sm">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {user.name}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{user.email}</div>
                    </td>

                    {/* Password */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 font-mono">
                          {showPasswordId === user.id
                            ? user.password
                            : "••••••••"}
                        </span>
                        <button
                          onClick={() =>
                            setShowPasswordId(
                              showPasswordId === user.id ? null : user.id
                            )
                          }
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title={
                            showPasswordId === user.id
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showPasswordId === user.id ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        className={`${getRoleColor(
                          user.role
                        )} border px-2.5 py-1 text-xs`}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role}
                      </Badge>
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {formatDate(user.createdDate)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(user)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No users found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or add a new user.
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredUsers.length)} of{" "}
                {filteredUsers.length} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        size="sm"
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                        className={
                          currentPage === page
                            ? "bg-[#0c9dcb] hover:bg-[#0a8bb5] text-white"
                            : ""
                        }
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={handleCloseAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-[#0c9dcb] to-[#26b4e0] flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              Add New User
            </DialogTitle>
            <DialogDescription>
              Create a new user account with assigned role. The user will
              receive login credentials.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            {/* Name */}
            <div>
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="bg-white border-gray-300"
              />
            </div>

            {/* Email */}
            <div>
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-white border-gray-300"
              />
            </div>

            {/* Password */}
            <div>
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="bg-white border-gray-300"
              />
            </div>

            {/* Role */}
            <div>
              <Label
                htmlFor="role"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Role <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => {
                  if (value === "__add_new__") {
                    setAddRoleDialogOpen(true);
                  } else {
                    setFormData({ ...formData, role: value });
                  }
                }}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {rolesList.map((role) => {
                    let iconColor = "text-gray-600";
                    if (role === "Admin") iconColor = "text-purple-600";
                    else if (role === "Manager") iconColor = "text-blue-600";
                    else if (role === "Supervisor")
                      iconColor = "text-green-600";

                    return (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          <Shield className={`w-4 h-4 ${iconColor}`} />
                          {role}
                        </div>
                      </SelectItem>
                    );
                  })}
                  <Separator className="my-1" />
                  <SelectItem value="__add_new__">
                    <div className="flex items-center gap-2 text-[#0c9dcb]">
                      <Plus className="w-4 h-4" />
                      Add New Role
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleCloseAddDialog}
                className="border-gray-300"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                className="bg-[#0c9dcb] hover:bg-[#0a8bb5] text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialogOpen} onOpenChange={handleCloseEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Edit className="w-5 h-5 text-white" />
              </div>
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update user information and role assignment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            {/* Name */}
            <div>
              <Label
                htmlFor="edit-name"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="bg-white border-gray-300"
              />
            </div>

            {/* Email */}
            <div>
              <Label
                htmlFor="edit-email"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-white border-gray-300"
              />
            </div>

            {/* Password */}
            <div>
              <Label
                htmlFor="edit-password"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="bg-white border-gray-300"
              />
            </div>

            {/* Role */}
            <div>
              <Label
                htmlFor="edit-role"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Role <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => {
                  if (value === "__add_new__") {
                    setAddRoleDialogOpen(true);
                  } else {
                    setFormData({ ...formData, role: value });
                  }
                }}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {rolesList.map((role) => {
                    let iconColor = "text-gray-600";
                    if (role === "Admin") iconColor = "text-purple-600";
                    else if (role === "Manager") iconColor = "text-blue-600";
                    else if (role === "Supervisor")
                      iconColor = "text-green-600";

                    return (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          <Shield className={`w-4 h-4 ${iconColor}`} />
                          {role}
                        </div>
                      </SelectItem>
                    );
                  })}
                  <Separator className="my-1" />
                  <SelectItem value="__add_new__">
                    <div className="flex items-center gap-2 text-[#0c9dcb]">
                      <Plus className="w-4 h-4" />
                      Add New Role
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleCloseEditDialog}
                className="border-gray-300"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleUpdateUser}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Update User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Role Dialog */}
      <Dialog open={addRoleDialogOpen} onOpenChange={handleCloseAddRoleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-[#0c9dcb] to-[#26b4e0] flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              Add New Role
            </DialogTitle>
            <DialogDescription>
              Create a custom role for user assignment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label
                htmlFor="new-role"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Role Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-role"
                placeholder="Enter role name (e.g., Team Lead, Developer)"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="bg-white border-gray-300"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                This role will be available for user assignment.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleCloseAddRoleDialog}
                className="border-gray-300"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleAddRole}
                className="bg-[#0c9dcb] hover:bg-[#0a8bb5] text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Add Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
