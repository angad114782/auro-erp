import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  User,
  EyeOff,
  Shield,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Menu,
  Filter,
} from "lucide-react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
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
import { toast } from "sonner";
import api from "../lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { ConfirmActionDialog } from "./ConfirmActionDialog";

interface UserData {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  createdAt: string;
}

export function UserManagement() {
  // ------------------------------
  // STATE
  // ------------------------------
  const [users, setUsers] = useState<UserData[]>([]);
  const [rolesList, setRolesList] = useState<string[]>([
    "Admin",
    "Manager",
    "Supervisor",
    "Store",
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showPasswordId, setShowPasswordId] = useState<string | null>(null);

  const [addRoleDialogOpen, setAddRoleDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Manager",
  });

  const itemsPerPage = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ------------------------------
  // LOAD USERS FROM BACKEND
  // ------------------------------
  const loadUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load users");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ------------------------------
  // ROLE COLORS
  // ------------------------------
  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      Admin: "bg-purple-100 text-purple-800 border-purple-200",
      Manager: "bg-blue-100 text-blue-800 border-blue-200",
      Supervisor: "bg-green-100 text-green-800 border-green-200",
      Store: "bg-orange-100 text-orange-800 border-orange-200",
    };
    return colors[role] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ------------------------------
  // FILTERING
  // ------------------------------
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePreviousPage = () =>
    currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);

  // ------------------------------
  // BACKEND USER CREATE
  // ------------------------------
  const handleAddUser = async () => {
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const res = await api.post("/users", formData);
      setUsers([...users, res.data.data]);
      toast.success("User created successfully");

      setAddUserDialogOpen(false);
      setFormData({ name: "", email: "", password: "", role: "Manager" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create user");
    }
  };

  // ------------------------------
  // BACKEND USER UPDATE
  // ------------------------------
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const updatePayload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };

      // Only include password if entered
      if (formData.password.trim() !== "") {
        updatePayload.password = formData.password;
      }

      const res = await api.put(`/users/${selectedUser._id}`, updatePayload);

      setUsers(
        users.map((u) => (u._id === selectedUser._id ? res.data.data : u))
      );

      toast.success("User updated successfully");

      setEditUserDialogOpen(false);
      setSelectedUser(null);
      setFormData({ name: "", email: "", password: "", role: "Manager" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update user");
    }
  };

  // ------------------------------
  // BACKEND USER DELETE
  // ------------------------------
  const handleDeleteUser = async (id: string, name: string) => {
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter((u) => u._id !== id));
      toast.success(`User ${name} removed`);
    } catch (err) {
      toast.error("Failed to delete user");
    }
  };

  // ------------------------------
  // UI HANDLERS
  // ------------------------------
  const handleEditClick = (user: UserData) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // password not returned for security
      role: user.role,
    });
    setEditUserDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setAddUserDialogOpen(false);
    setFormData({ name: "", email: "", password: "", role: "Manager" });
  };

  const handleCloseEditDialog = () => {
    setEditUserDialogOpen(false);
    setSelectedUser(null);
    setFormData({ name: "", email: "", password: "", role: "Manager" });
  };

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

    toast.success("Role added");
  };

  // Responsive grid classes
  const userCardGridClass = isMobile ? "grid grid-cols-1 gap-4" : "hidden";

  // Mobile user card component
  const MobileUserCard = ({ user }: { user: UserData }) => (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#0c9dcb] to-[#26b4e0] flex items-center justify-center text-white font-semibold">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
          <Badge
            className={`${getRoleColor(user.role)} border px-2.5 py-1 text-xs`}
          >
            <Shield className="w-3 h-3 mr-1" />
            {user.role}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <span className="text-gray-500">Password:</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono">
                {showPasswordId === user._id ? "********" : "••••••••"}
              </span>
              <button
                onClick={() =>
                  setShowPasswordId(
                    showPasswordId === user._id ? null : user._id
                  )
                }
                className="text-gray-500 hover:text-gray-700"
              >
                {showPasswordId === user._id ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div>
            <span className="text-gray-500">Created:</span>
            <p className="font-medium mt-1">{formatDate(user.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditClick(user)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteUser(user._id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button> */}
          <ConfirmActionDialog
            title="Remove user"
            description={`Remove user ${user.name}`}
            onConfirm={() => handleDeleteUser(user._id, user.name)}
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-linear-to-br from-[#0c9dcb] to-[#26b4e0] flex items-center justify-center">
            <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              User Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage system users and assign roles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            onClick={() => setAddUserDialogOpen(true)}
            className="bg-[#0c9dcb] hover:bg-[#0a8bb5] text-white w-full md:w-auto"
            size={isMobile ? "sm" : "default"}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>

          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>User Management</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <Button variant="outline" className="w-full">
                    User Analytics
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
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

        {isMobile ? (
          <Button
            variant="outline"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        ) : (
          <div className="text-sm text-gray-600 whitespace-nowrap">
            Total Users:{" "}
            <span className="text-[#0c9dcb] font-semibold">
              {filteredUsers.length}
            </span>
          </div>
        )}
      </div>

      {/* Mobile Filters */}
      {isMobile && showMobileFilters && (
        <Card className="p-4">
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">
              Quick Filters
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={searchTerm === "" ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchTerm("")}
                className="text-xs"
              >
                All Users
              </Button>
              <Button
                variant={
                  searchTerm.toLowerCase().includes("admin")
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => setSearchTerm("admin")}
                className="text-xs"
              >
                Admin
              </Button>
              <Button
                variant={
                  searchTerm.toLowerCase().includes("manager")
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => setSearchTerm("manager")}
                className="text-xs"
              >
                Manager
              </Button>
              <Button
                variant={
                  searchTerm.toLowerCase().includes("supervisor")
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => setSearchTerm("supervisor")}
                className="text-xs"
              >
                Supervisor
              </Button>
              <Button
                variant={
                  searchTerm.toLowerCase().includes("store")
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => setSearchTerm("store")}
                className="text-xs"
              >
                Store
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* MOBILE CARD VIEW */}
      <div className={userCardGridClass}>
        {paginatedUsers.map((user) => (
          <MobileUserCard key={user._id} user={user} />
        ))}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <Card
        className={`shadow-lg border border-gray-200 rounded-xl overflow-hidden ${
          isMobile ? "hidden" : "block"
        }`}
      >
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold">
                    Password
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    {/* NAME */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#0c9dcb] to-[#26b4e0] flex items-center justify-center text-white">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div className="text-sm font-semibold">{user.name}</div>
                      </div>
                    </td>

                    {/* EMAIL */}
                    <td className="px-6 py-4 text-sm">{user.email}</td>

                    {/* PASSWORD TOGGLE */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {showPasswordId === user._id
                            ? "********"
                            : "••••••••"}
                        </span>

                        <button
                          onClick={() =>
                            setShowPasswordId(
                              showPasswordId === user._id ? null : user._id
                            )
                          }
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {showPasswordId === user._id ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* ROLE */}
                    <td className="px-6 py-4">
                      <Badge
                        className={`${getRoleColor(
                          user.role
                        )} border px-2.5 py-1 text-xs`}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role}
                      </Badge>
                    </td>

                    {/* CREATED */}
                    <td className="px-6 py-4 text-sm">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(user)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <ConfirmActionDialog
                          title="Remove user"
                          description={`Remove user ${user.name}`}
                          onConfirm={() =>
                            handleDeleteUser(user._id, user.name)
                          }
                        />
                        {/* <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button> */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* EMPTY STATE */}
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium">No users found</h3>
              <p className="text-gray-600">Try searching or add a new user.</p>
            </div>
          )}

          {/* PAGINATION */}
          {filteredUsers.length > 0 && (
            <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-gray-50 border-t gap-4">
              <div className="text-sm">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of{" "}
                {filteredUsers.length} users
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>

                {/* PAGE NUMBERS - Mobile friendly */}
                <div className="flex items-center gap-1">
                  {totalPages <= 5 ? (
                    // Show all pages if 5 or less
                    Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          size="sm"
                          variant={currentPage === page ? "default" : "outline"}
                          onClick={() => setCurrentPage(page)}
                          className={
                            currentPage === page
                              ? "bg-[#0c9dcb] text-white"
                              : ""
                          }
                        >
                          {page}
                        </Button>
                      )
                    )
                  ) : (
                    // Show limited pages for mobile
                    <>
                      {currentPage > 2 && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCurrentPage(1)}
                          >
                            1
                          </Button>
                          {currentPage > 3 && <span className="px-2">...</span>}
                        </>
                      )}

                      {Array.from({ length: 3 }, (_, i) => {
                        let page = currentPage - 1 + i;
                        if (page < 1) page = 1;
                        if (page > totalPages) page = totalPages;
                        return page;
                      })
                        .filter(
                          (page, index, arr) => arr.indexOf(page) === index
                        )
                        .map((page) => (
                          <Button
                            key={page}
                            size="sm"
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            onClick={() => setCurrentPage(page)}
                            className={
                              currentPage === page
                                ? "bg-[#0c9dcb] text-white"
                                : ""
                            }
                          >
                            {page}
                          </Button>
                        ))}

                      {currentPage < totalPages - 1 && (
                        <>
                          {currentPage < totalPages - 2 && (
                            <span className="px-2">...</span>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCurrentPage(totalPages)}
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MOBILE LIST VIEW */}
      {isMobile && filteredUsers.length > 0 && (
        <div className="space-y-4">
          {/* Pagination Info */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of{" "}
              {filteredUsers.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-gray-700 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------
           ADD USER DIALOG
         --------------------------------------------------- */}
      <Dialog open={addUserDialogOpen} onOpenChange={handleCloseAddDialog}>
        <DialogContent className="max-w-lg w-[95vw]  p-6 ">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-white bg-[#0c9dcb] p-2 rounded" />
              Add New User
            </DialogTitle>
            <DialogDescription>
              Create a new user with assigned role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            {/* NAME */}
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            {/* EMAIL */}
            <div>
              <Label>Email *</Label>
              <Input
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            {/* PASSWORD */}
            <div>
              <Label>Password *</Label>
              <Input
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            {/* ROLE */}
            <div>
              <Label>Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => {
                  if (v === "__add_new__") {
                    setAddRoleDialogOpen(true);
                  } else {
                    setFormData({ ...formData, role: v });
                  }
                }}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {rolesList.map((role) => (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        {role}
                      </div>
                    </SelectItem>
                  ))}
                  <Separator />
                  <SelectItem value="__add_new__">
                    <Plus className="w-4 h-4" /> Add New Role
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleCloseAddDialog}
                className="w-full sm:w-auto"
              >
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>

              <Button
                className="bg-[#0c9dcb] text-white w-full sm:w-auto"
                onClick={handleAddUser}
              >
                <Save className="w-4 h-4 mr-2" /> Add User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------
           EDIT USER DIALOG
         --------------------------------------------------- */}
      <Dialog open={editUserDialogOpen} onOpenChange={handleCloseEditDialog}>
        <DialogContent className="max-w-lg w-[95vw]  p-6 ">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-white bg-blue-600 p-2 rounded" />
              Edit User
            </DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            {/* NAME */}
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            {/* EMAIL */}
            <div>
              <Label>Email *</Label>
              <Input
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            {/* PASSWORD (optional but updating allowed) */}
            <div>
              <Label>Password (optional)</Label>
              <Input
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Leave empty to keep same password"
              />
            </div>

            {/* ROLE */}
            <div>
              <Label>Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v })}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {rolesList.map((role) => (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        {role}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleCloseEditDialog}
                className="w-full sm:w-auto"
              >
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>

              <Button
                className="bg-blue-600 text-white w-full sm:w-auto"
                onClick={handleUpdateUser}
              >
                <Save className="w-4 h-4 mr-2" /> Update User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD ROLE DIALOG */}
      <Dialog
        open={addRoleDialogOpen}
        onOpenChange={() => setAddRoleDialogOpen(false)}
      >
        <div className="p-6 sm:p-8">
          <DialogContent className="max-w-lg w-[95vw]  p-6 ">
            <DialogHeader>
              <DialogTitle>Add New Role</DialogTitle>
              <DialogDescription>Create a custom role</DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div>
                <Label>Role Name *</Label>
                <Input
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Team Lead, Developer, etc."
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddRoleDialogOpen(false);
                    setNewRoleName("");
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>

                <Button
                  className="bg-[#0c9dcb] text-white w-full sm:w-auto"
                  onClick={handleAddRole}
                >
                  <Save className="w-4 h-4 mr-2" /> Add Role
                </Button>
              </div>
            </div>
          </DialogContent>
        </div>
      </Dialog>
    </div>
  );
}
