import React from "react";
import { Clock, Calendar, ImageIcon, Target } from "lucide-react";
import { format } from "date-fns";

export default function ProjectCard({
  project,
  onClick,
}: {
  project: any;
  onClick: any;
}) {
  return (
    <div
      className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start">
          <div className="w-10 h-10 bg-blue-50 rounded-md flex items-center justify-center mr-3">
            {project.autoCode?.slice(-2)}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {project.autoCode}
            </div>
            <div className="text-xs text-gray-500">{project.company?.name}</div>
            <div className="flex gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                {project.status}
              </span>
              <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                {project.priority || "Low"}
              </span>
            </div>
          </div>
        </div>

        <div className="w-24 h-14 rounded-md bg-gray-100 overflow-hidden">
          {project.coverImage ? (
            <img
              src={
                project.coverImage.startsWith("http")
                  ? project.coverImage
                  : `${import.meta.env.VITE_BACKEND_URL}/${project.coverImage}`
              }
              alt="cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-500">Art & Colour</div>
          <div className="text-sm font-medium truncate">
            {project.artName || "N/A"}
          </div>
          <div className="text-xs text-gray-600 truncate">
            {project.color || "N/A"}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Brand & Category</div>
          <div className="text-sm font-medium">{project.brand?.name}</div>
          <div className="text-xs text-gray-600">{project.category?.name}</div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3 mt-3">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {project.createdAt
              ? format(new Date(project.createdAt), "dd/MM/yyyy")
              : "TBD"}
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            {project.redSealTargetDate
              ? format(new Date(project.redSealTargetDate), "dd/MM/yyyy")
              : "TBD"}
          </div>
        </div>
      </div>
    </div>
  );
}
