// components/LoginPage.tsx
import React, { useState } from "react";
import { Eye, EyeOff, Lock, User, Building, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useAuth } from "../lib/AuthContext";

interface DemoAccount {
  id: string;
  password: string;
  role: string;
  access: string;
  color: string;
}

export function LoginPage(): React.JSX.Element {
  const [userId, setUserId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { login, loading, error, clearError } = useAuth();

  const demoAccounts: DemoAccount[] = [
    {
      id: "superadmin",
      password: "superadmin123",
      role: "Super Admin",
      access: "Full system access",
      color: "bg-red-100 text-red-800",
    },
    {
      id: "admin",
      password: "admin123",
      role: "Administrator",
      access: "Most modules except user management",
      color: "bg-blue-100 text-blue-800",
    },
    {
      id: "manager",
      password: "manager123",
      role: "Manager",
      access: "RD, Production, Inventory modules",
      color: "bg-green-100 text-green-800",
    },
    {
      id: "supervisor",
      password: "supervisor123",
      role: "Supervisor",
      access: "Production and Inventory modules",
      color: "bg-purple-100 text-purple-800",
    },
    {
      id: "user",
      password: "user123",
      role: "User",
      access: "Dashboard and limited views",
      color: "bg-gray-100 text-gray-800",
    },
  ];

  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    clearError();
    await login(userId, password);
  };

  const fillDemoCredentials = (
    accountId: string,
    accountPassword: string
  ): void => {
    setUserId(accountId);
    setPassword(accountPassword);
    clearError();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Login Form */}
        <Card className="w-full max-w-md mx-auto shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              ERP System Login
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="userId"
                  className="text-sm font-medium text-gray-700"
                >
                  User ID
                </Label>
                <div style={{ position: "relative" }}>
                  <User
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "16px",
                      height: "16px",
                      color: "#9CA3AF",
                    }}
                  />
                  <Input
                    id="userId"
                    type="text"
                    placeholder="Enter your user ID"
                    value={userId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setUserId(e.target.value)
                    }
                    className="h-11"
                    style={{ paddingLeft: "40px" }}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </Label>
                <div style={{ position: "relative" }}>
                  <Lock
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "16px",
                      height: "16px",
                      color: "#9CA3AF",
                      zIndex: 1,
                    }}
                  />

                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11"
                    style={{ paddingLeft: "40px", paddingRight: "48px" }}
                    required
                    disabled={loading}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: loading ? "not-allowed" : "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#9CA3AF",
                      zIndex: 1,
                    }}
                    onMouseEnter={(e) =>
                      !loading && (e.currentTarget.style.color = "#4B5563")
                    }
                    onMouseLeave={(e) =>
                      !loading && (e.currentTarget.style.color = "#9CA3AF")
                    }
                    disabled={loading}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff style={{ width: "16px", height: "16px" }} />
                    ) : (
                      <Eye style={{ width: "16px", height: "16px" }} />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts Panel */}
        <Card className="w-full max-w-md mx-auto shadow-xl border-0 bg-gradient-to-br from-gray-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Demo Accounts
            </CardTitle>
            <CardDescription className="text-gray-600">
              Click on any account to auto-fill credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoAccounts.map((account) => (
              <div
                key={account.id}
                className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer group"
                onClick={() =>
                  fillDemoCredentials(account.id, account.password)
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 capitalize">
                        {account.id}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${account.color}`}
                      >
                        {account.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">Password:</span>{" "}
                      {account.password}
                    </p>
                    <p className="text-xs text-gray-500">{account.access}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
