import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Search,
  Filter,
  Calendar,
  Clock,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useProjects } from "../hooks/useProjects";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";

export default function ProjectListCard() {
  const { projects, loading, loadProjects } = useProjects();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [isMobile, setIsMobile] = useState(false);

  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [openDetails, setOpenDetails] = useState(false);

  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";

  const Info = ({ label, value }: { label: string; value?: any }) => (
    <div className="flex justify-between gap-2 border-b pb-1 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value || "-"}</span>
    </div>
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (selectedStatus !== "all") {
      result = result.filter(
        (project: any) => project.status === selectedStatus
      );
    }

    if (selectedPriority !== "all") {
      result = result.filter(
        (project: any) => project.priority === selectedPriority
      );
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter((project: any) => {
        return (
          project.autoCode?.toLowerCase().includes(q) ||
          project.artName?.toLowerCase().includes(q) ||
          project?.company?.name?.toLowerCase().includes(q) ||
          project?.brand?.name?.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [projects, selectedStatus, selectedPriority, searchTerm]);

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      prototype: "bg-purple-100 text-purple-800",
      red_seal: "bg-red-100 text-red-800",
      green_seal: "bg-green-100 text-green-800",
      po_pending: "bg-orange-100 text-orange-800",
      po_approved: "bg-blue-100 text-blue-800",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Projects List</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <Select
              value={selectedPriority}
              onValueChange={setSelectedPriority}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Project</th>
                <th className="p-2 hidden sm:table-cell">Company</th>
                <th className="p-2">Status</th>
                <th className="p-2 hidden md:table-cell">Timeline</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project: any) => (
                <tr
                  key={project._id}
                  onClick={() => {
                    setSelectedProject(project);
                    setOpenDetails(true);
                  }}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                >
                  <td className="p-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-gray-100 border overflow-hidden flex items-center justify-center">
                      {project.coverImage ? (
                        <img
                          src={`${BACKEND_URL}/${project.coverImage}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{project.autoCode}</div>
                      <div className="text-xs text-gray-500">
                        {project.artName}
                      </div>
                    </div>
                  </td>

                  <td className="p-2 hidden sm:table-cell">
                    {project.company?.name}
                  </td>

                  <td className="p-2">
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </td>

                  <td className="p-2 hidden md:table-cell">
                    {formatDate(project.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {selectedProject && (
        <Dialog open={openDetails} onOpenChange={setOpenDetails}>
          <DialogContent className="!w-[98vw] !max-w-[1400px] max-h-[95vh] rounded-2xl p-0 overflow-hidden bg-white">
            {/* ================= STICKY HEADER ================= */}
            <div className="sticky top-0 z-50 bg-white border-b px-6 py-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">
                    {selectedProject.autoCode}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedProject.artName}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(selectedProject.status)}>
                    {selectedProject.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpenDetails(false)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </div>

            {/* ================= SCROLL BODY ================= */}
            <div className="overflow-y-auto max-h-[calc(95vh-84px)] px-6 py-6 space-y-8">
              {/* ================= IMAGES (NO CROP, SQUARE) ================= */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* COVER IMAGE */}
                <div>
                  <p className="font-semibold mb-2">Cover Image</p>
                  <div className="border rounded-xl p-3 bg-gray-50 flex justify-center">
                    {selectedProject.coverImage ? (
                      <img
                        src={`${BACKEND_URL}/${selectedProject.coverImage}`}
                        className="max-h-[320px] w-auto object-contain rounded-lg"
                      />
                    ) : (
                      <p className="text-sm text-gray-400">No cover image</p>
                    )}
                  </div>
                </div>

                {/* SAMPLE IMAGES */}
                <div>
                  <p className="font-semibold mb-2">Sample Images</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedProject.sampleImages?.length ? (
                      selectedProject.sampleImages.map(
                        (img: string, i: number) => (
                          <div
                            key={i}
                            className="border rounded-lg p-2 bg-gray-50 flex justify-center"
                          >
                            <img
                              src={`${BACKEND_URL}/${img}`}
                              className="max-h-[140px] w-auto object-contain"
                            />
                          </div>
                        )
                      )
                    ) : (
                      <p className="text-sm text-gray-400">No sample images</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ================= MAIN INFO GRID ================= */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* ================= PROJECT DETAILS ================= */}
                <div className="border rounded-xl p-5 space-y-3">
                  <h3 className="font-semibold text-lg mb-2">
                    Project Details
                  </h3>

                  <Info label="Company" value={selectedProject.company?.name} />
                  <Info label="Brand" value={selectedProject.brand?.name} />
                  <Info
                    label="Category"
                    value={selectedProject.category?.name}
                  />
                  <Info label="Type" value={selectedProject.type?.name} />
                  <Info
                    label="Assigned To"
                    value={selectedProject.assignPerson?.name}
                  />
                  <Info label="Country" value={selectedProject.country?.name} />

                  <Info label="Status" value={selectedProject.status} />
                  <Info label="Priority" value={selectedProject.priority} />
                  <Info label="Gender" value={selectedProject.gender} />
                  <Info label="Size" value={selectedProject.size} />
                  <Info label="Color" value={selectedProject.color} />

                  <Info
                    label="Client Approval"
                    value={selectedProject.clientApproval}
                  />
                  <Info
                    label="Client Final Cost"
                    value={`₹ ${selectedProject.clientFinalCost}`}
                  />

                  <Info
                    label="Created At"
                    value={formatDate(selectedProject.createdAt)}
                  />
                  <Info
                    label="Red Seal Target"
                    value={formatDate(selectedProject.redSealTargetDate)}
                  />

                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Product Description
                    </p>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      {selectedProject.productDesc || "-"}
                    </div>
                  </div>
                </div>

                {/* ================= PO DETAILS ================= */}
                <div className="border rounded-xl p-5 space-y-3">
                  <h3 className="font-semibold text-lg mb-2">PO Details</h3>

                  {selectedProject.po ? (
                    <>
                      <Info
                        label="PO Number"
                        value={selectedProject.po.poNumber}
                      />
                      <Info
                        label="Order Quantity"
                        value={selectedProject.po.orderQuantity}
                      />
                      <Info
                        label="Unit Price"
                        value={`₹ ${selectedProject.po.unitPrice}`}
                      />
                      <Info
                        label="Total Amount"
                        value={`₹ ${selectedProject.po.totalAmount}`}
                      />
                      <Info
                        label="Delivery Date"
                        value={formatDate(selectedProject.po.deliveryDate)}
                      />
                      <Info
                        label="Payment Terms"
                        value={selectedProject.po.paymentTerms}
                      />
                      <Info
                        label="Urgency Level"
                        value={selectedProject.po.urgencyLevel}
                      />
                      <Info
                        label="PO Status"
                        value={selectedProject.po.status}
                      />

                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Client Feedback
                        </p>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          {selectedProject.po.clientFeedback}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Quality Requirements
                        </p>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          {selectedProject.po.qualityRequirements}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Special Instructions
                        </p>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          {selectedProject.po.specialInstructions}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">No PO created yet</p>
                  )}
                </div>
              </div>

              {/* ================= FOOTER ================= */}
              <div className="flex justify-end border-t pt-5">
                <Button variant="outline" onClick={() => setOpenDetails(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
