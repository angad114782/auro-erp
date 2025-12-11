import ProjectCard from "./ProjectCard";
import SkeletonLoader from "./SkeletonLoader";

export default function ProjectCardList({
  projects,
  loading,
  onProjectClick,
}: {
  projects: any[];
  loading?: boolean;
  onProjectClick: any;
}) {
  if (loading) return <SkeletonLoader rows={4} />;

  if (!projects.length)
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No projects found
        </h3>
        <p className="text-gray-600">
          Start by creating a new project or adjust your search filters.
        </p>
      </div>
    );

  return (
    <div className="space-y-4">
      {projects.map((p) => (
        <ProjectCard
          key={p._id}
          project={p}
          onClick={() => onProjectClick(p)}
        />
      ))}
    </div>
  );
}
