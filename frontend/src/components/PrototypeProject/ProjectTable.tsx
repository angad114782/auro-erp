import { format } from "date-fns";
import { Calendar, Clock, ImageIcon } from "lucide-react";
import SkeletonLoader from "./SkeletonLoader";

type Project = any;

export default function ProjectTable({
  projects,
  loading,
  onProjectClick,
}: {
  projects: Project[];
  loading?: boolean;
  onProjectClick: any;
}) {
  if (loading) return <SkeletonLoader rows={6} />;

  const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Code
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Image
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Company / Brand
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Art & Colour
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Timeline
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Priority
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {projects.map((p: Project) => (
            <tr
              key={p._id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onProjectClick(p)}
            >
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {p.autoCode}
                </div>
                <div className="text-xs text-gray-500">
                  {p.assignPerson?.name}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="w-12 h-12 rounded-md bg-gray-100 border overflow-hidden">
                  {p.coverImage ? (
                    <img
                      src={
                        p.coverImage.startsWith("http")
                          ? p.coverImage
                          : `${BASE_URL}/${p.coverImage}`
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
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {p.company?.name}
                </div>
                <div className="text-sm text-gray-500">{p.brand?.name}</div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm font-medium">{p.artName || "N/A"}</div>
                <div className="text-sm text-gray-500">{p.color || "N/A"}</div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {p.createdAt
                    ? format(new Date(p.createdAt), "dd/MM/yyyy")
                    : "TBD"}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4" />
                  {p.redSealTargetDate
                    ? format(new Date(p.redSealTargetDate), "dd/MM/yyyy")
                    : "TBD"}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                  {p.status}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-gray-100">
                  {p.priority || "Low"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
